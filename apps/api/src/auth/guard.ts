import type { FastifyRequest } from 'fastify'
import { AuthError } from './errors.js'
import type { TokenService } from './tokens.js'

/**
 * Resolves the authenticated user id for a request. In production this reads
 * `req.userId` (set by the bearer guard); tests inject a fixed-id stub.
 */
export type GetUserId = (req: FastifyRequest) => Promise<string> | string

/** Production GetUserId: the bearer guard has already populated `req.userId`. */
export const getUserIdFromRequest: GetUserId = (req) => req.userId

/**
 * BearerAuth security handler: validates the `Authorization: Bearer <jwt>`
 * header, sets `req.userId`, or throws an AuthError (→ 401).
 */
export function makeBearerGuard(tokens: Pick<TokenService, 'verifyAccess'>) {
  return async (req: FastifyRequest): Promise<void> => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new AuthError('unauthenticated', 401, 'Missing bearer token')
    }
    const { sub } = await tokens.verifyAccess(header.slice('Bearer '.length).trim())
    req.userId = sub
  }
}
