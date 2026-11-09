import type { FastifyReply } from 'fastify'
import { OpError } from '../ops/errors.js'

/**
 * Map an op-layer failure to an HTTP reply. `OpError` → its status + code/message
 * envelope (matching the contract's `ApiError`); anything else re-throws so
 * Fastify's error handler turns it into a 500.
 */
export function sendOpError(reply: FastifyReply, e: unknown): FastifyReply {
  if (e instanceof OpError) {
    return reply.status(e.status).send({ code: e.code, message: e.message })
  }
  throw e
}
