import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword } from './password.js'
import { AuthError } from './errors.js'
import type { TokenService } from './tokens.js'
import { generatePkce, generateState, type OAuthStateStore } from './oauth-state.js'
import type { ProviderRegistry } from './providers/index.js'
import type { OAuthUserInfo } from './providers/types.js'

/** OAuth wiring for the auth handlers. Absent → /auth/{provider}/* stay stubbed (501). */
export interface OAuthDeps {
  registry: ProviderRegistry
  stateStore: OAuthStateStore
  /** Single web-hosted callback URL used for all providers. */
  redirectUri: string
}

const notImplemented = async (_req: FastifyRequest, reply: FastifyReply) =>
  reply.status(501).send({ code: 'not_implemented', message: 'Not yet implemented' })

/** Auth handlers that are inert until a token service is wired (no-prisma / test paths). */
export const stubAuthHandlers = {
  Auth_signup: notImplemented,
  Auth_login: notImplemented,
  Auth_refresh: notImplemented,
  Auth_logout: notImplemented,
  Auth_oauthStart: notImplemented,
  Auth_oauthCallback: notImplemented,
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function sendAuthError(reply: FastifyReply, err: unknown): FastifyReply {
  if (err instanceof AuthError) {
    return reply.status(err.statusCode).send({ code: err.code, message: err.message })
  }
  throw err
}

/**
 * Map a provider identity to a user id: reuse a linked identity, else link to an
 * existing account only on a provider-verified email, else create a new user.
 */
async function resolveOAuthUser(
  prisma: PrismaClient,
  provider: string,
  info: OAuthUserInfo,
): Promise<string> {
  const identity = await prisma.authIdentity.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: info.providerAccountId } },
  })
  if (identity) return identity.userId

  const email = info.email ? normalizeEmail(info.email) : null

  if (email && info.emailVerified) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return prisma.$transaction(async (tx) => {
        await tx.authIdentity.create({
          data: { userId: existing.id, provider, providerAccountId: info.providerAccountId, email },
        })
        if (!existing.emailVerified) {
          await tx.user.update({ where: { id: existing.id }, data: { emailVerified: new Date() } })
        }
        return existing.id
      })
    }
  }

  // No safe match → new account. Synthesize a unique placeholder email when the
  // provider gave none (or an unverified one we refuse to link by).
  const userEmail = email ?? `${provider}_${info.providerAccountId}@users.takodo.local`
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: userEmail,
        name: info.name?.trim() || userEmail.split('@')[0]!,
        emailVerified: email && info.emailVerified ? new Date() : null,
      },
    })
    await tx.authIdentity.create({
      data: { userId: created.id, provider, providerAccountId: info.providerAccountId, email },
    })
    return created
  })
  return user.id
}

/** Email + password and OAuth route handlers. */
export function buildAuthHandlers(prisma: PrismaClient, tokens: TokenService, oauth?: OAuthDeps) {
  return {
    async Auth_signup(req: FastifyRequest, reply: FastifyReply) {
      const body = req.body as { email: string; password: string; name?: string }
      const email = normalizeEmail(body.email)

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return reply.status(409).send({ code: 'email_taken', message: 'Email already registered' })
      }

      const passwordHash = await hashPassword(body.password)
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: body.name?.trim() || email.split('@')[0]!,
        },
      })

      return reply.status(200).send(await tokens.issuePair(user.id))
    },

    async Auth_login(req: FastifyRequest, reply: FastifyReply) {
      const body = req.body as { email: string; password: string }
      const email = normalizeEmail(body.email)

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, body.password))) {
        return reply
          .status(401)
          .send({ code: 'invalid_credentials', message: 'Wrong email or password' })
      }

      return reply.status(200).send(await tokens.issuePair(user.id))
    },

    async Auth_refresh(req: FastifyRequest, reply: FastifyReply) {
      const body = req.body as { refreshToken: string }
      try {
        return reply.status(200).send(await tokens.rotateRefresh(body.refreshToken))
      } catch (err) {
        return sendAuthError(reply, err)
      }
    },

    async Auth_logout(req: FastifyRequest, reply: FastifyReply) {
      const body = req.body as { refreshToken: string }
      await tokens.revoke(body.refreshToken)
      return reply.status(204).send()
    },

    async Auth_oauthStart(req: FastifyRequest, reply: FastifyReply) {
      if (!oauth) return notImplemented(req, reply)
      const { provider: name } = req.params as { provider: string }
      const provider = oauth.registry.get(name)
      if (!provider) {
        return reply
          .status(400)
          .send({ code: 'provider_unsupported', message: `Unknown provider "${name}"` })
      }

      const state = generateState()
      const { verifier, challenge } = generatePkce()
      oauth.stateStore.put(state, {
        provider: name,
        codeVerifier: verifier,
        redirectUri: oauth.redirectUri,
      })

      const authorizeUrl = provider.buildAuthorizeUrl({
        state,
        codeChallenge: challenge,
        redirectUri: oauth.redirectUri,
      })
      return reply.status(200).send({ authorizeUrl, state })
    },

    async Auth_oauthCallback(req: FastifyRequest, reply: FastifyReply) {
      if (!oauth) return notImplemented(req, reply)
      const { provider: name } = req.params as { provider: string }
      const { code, state } = req.body as { code: string; state: string }

      const entry = oauth.stateStore.consume(state)
      if (!entry || entry.provider !== name) {
        return reply
          .status(401)
          .send({ code: 'oauth_state_mismatch', message: 'Invalid or expired OAuth state' })
      }

      const provider = oauth.registry.get(name)
      if (!provider) {
        return reply
          .status(400)
          .send({ code: 'provider_unsupported', message: `Unknown provider "${name}"` })
      }

      let info: OAuthUserInfo
      try {
        info = await provider.exchangeCode({
          code,
          codeVerifier: entry.codeVerifier,
          redirectUri: entry.redirectUri,
        })
      } catch (err) {
        return sendAuthError(reply, err)
      }

      const userId = await resolveOAuthUser(prisma, name, info)
      return reply.status(200).send(await tokens.issuePair(userId))
    },
  }
}
