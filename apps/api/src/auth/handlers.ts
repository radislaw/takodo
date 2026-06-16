import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword } from './password.js'
import { AuthError } from './errors.js'
import type { TokenService } from './tokens.js'

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

/** Email + password and (Phase 6) OAuth route handlers. */
export function buildAuthHandlers(prisma: PrismaClient, tokens: TokenService) {
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

    Auth_oauthStart: notImplemented,
    Auth_oauthCallback: notImplemented,
  }
}
