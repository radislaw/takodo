import Fastify from 'fastify'

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'

const app = Fastify({ logger: true })

app.get('/health', async () => {
  return { status: 'ok' }
})

app.get('/api/hello', async () => {
  return { message: 'Hello World from tootoo API' }
})

try {
  const address = await app.listen({ port: PORT, host: HOST })
  app.log.info(`tootoo API listening at ${address}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
