import { buildApp } from './app.js'

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'

const app = buildApp({ logger: true })

try {
  const address = await app.listen({ port: PORT, host: HOST })
  app.log.info(`tootoo API listening at ${address}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
