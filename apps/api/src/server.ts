import { buildApp } from './app.js'
import { prisma } from './db/client.js'
import { buildScheduler } from './service/push-scheduler.js'
import { loadAuthConfig } from './auth/config.js'
import { createTokenService } from './auth/tokens.js'
import { getUserIdFromRequest, makeBearerGuard } from './auth/guard.js'
import { buildProviderRegistry } from './auth/providers/index.js'
import { createOAuthStateStore } from './auth/oauth-state.js'
import { createAgentRunner } from './ai/runner.js'

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '127.0.0.1'
const OAUTH_REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE ?? 'http://localhost:5173'

const tokens = createTokenService(loadAuthConfig(), prisma)

const scheduler = buildScheduler(prisma)
const agentRunner = createAgentRunner(prisma)
const app = buildApp({
  logger: true,
  prisma,
  getUserId: getUserIdFromRequest,
  bearerGuard: makeBearerGuard(tokens),
  tokens,
  oauth: {
    registry: buildProviderRegistry(),
    stateStore: createOAuthStateStore(),
    redirectUri: `${OAUTH_REDIRECT_BASE}/auth/callback`,
  },
  agentRunner,
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
