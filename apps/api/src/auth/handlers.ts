import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PrismaClient } from '@prisma/client'

const notImplemented = async (_req: FastifyRequest, reply: FastifyReply) =>
  reply.status(501).send({ code: 'not_implemented', message: 'Not yet implemented' })

/**
 * Auth route handlers. Stubbed in Phase 1; email/password lands in Phase 5,
 * OAuth providers in Phase 6. Takes `prisma` so the signature is stable.
 */
export function buildAuthHandlers(_prisma: PrismaClient) {
  return {
    Auth_signup: notImplemented,
    Auth_login: notImplemented,
    Auth_refresh: notImplemented,
    Auth_logout: notImplemented,
    Auth_oauthStart: notImplemented,
    Auth_oauthCallback: notImplemented,
  }
}
