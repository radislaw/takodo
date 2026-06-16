import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    /** Authenticated user id, set by the BearerAuth security handler. */
    userId: string
  }
}
