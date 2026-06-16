import { buildApp } from './app.js'
import { prisma } from './db/client.js'
import { buildScheduler } from './service/push-scheduler.js'
import { loadAuthConfig } from './auth/config.js'
import { createTokenService } from './auth/tokens.js'
import { getUserIdFromRequest, makeBearerGuard } from './auth/guard.js'

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '127.0.0.1'

const tokens = createTokenService(loadAuthConfig(), prisma)

const scheduler = buildScheduler(prisma)
const app = buildApp({
  logger: true,
  prisma,
  getUserId: getUserIdFromRequest,
  bearerGuard: makeBearerGuard(tokens),
  tokens,
})

async function shutdown(): Promise<void> {
  scheduler.stop()
  await app.close()
  process.exit(0)
}
process.once('SIGINT', () => void shutdown())
process.once('SIGTERM', () => void shutdown())

try {
  const address = await app.listen({ port: PORT, host: HOST })
  app.log.info(`TakoDo API listening at ${address}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
