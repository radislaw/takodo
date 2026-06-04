import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'

export function buildApp(opts: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? false })

  app.get('/health', async () => {
    return { status: 'ok' }
  })

  app.get('/api/hello', async () => {
    return { message: 'Hello World from tootoo API' }
  })

  return app
}
