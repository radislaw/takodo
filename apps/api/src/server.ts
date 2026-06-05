import { buildApp } from './app.js'
import { prisma } from './db/client.js'

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'
const SEED_EMAIL = process.env.SEED_USER_EMAIL ?? 'dev@tootoo.local'

let cachedUserId: string | null = null

async function getUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId
  const user = await prisma.user.findUnique({ where: { email: SEED_EMAIL } })
  if (!user) {
    throw new Error(
      `Seed user "${SEED_EMAIL}" not found — run \`pnpm --filter @tootoo/api db:seed\``,
    )
  }
  cachedUserId = user.id
  return cachedUserId
}

const app = buildApp({ logger: true, prisma, getUserId })

try {
  const address = await app.listen({ port: PORT, host: HOST })
  app.log.info(`tootoo API listening at ${address}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
