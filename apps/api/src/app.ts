import Fastify from 'fastify'
import cors from '@fastify/cors'
import openapiGlue from 'fastify-openapi-glue'
import addFormats from 'ajv-formats'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import type { PrismaClient } from '@prisma/client'
import { stubService } from './service/stub.js'
import { buildTasksHandlers } from './service/tasks.js'
import { buildDailyHandlers } from './service/daily.js'
import { buildFrequentHandlers } from './service/frequent.js'
import { buildProfileHandlers } from './service/profile.js'
import { buildFeedbackHandlers } from './service/feedback.js'
import { buildRewardsHandlers } from './service/rewards.js'
import { buildQuestsHandlers } from './service/quests.js'
import { buildPushHandlers } from './service/push.js'
import { buildAuthHandlers } from './auth/handlers.js'
import type { GetUserId } from './auth/guard.js'

/** BearerAuth security handler: succeeds (optionally setting `req.userId`) or throws to reject. */
type BearerGuard = (req: import('fastify').FastifyRequest) => Promise<void>

const SPEC_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../packages/contract/openapi/openapi.yaml',
)

export interface AppOptions {
  logger?: boolean
  prisma?: PrismaClient
  getUserId?: GetUserId
  /** Real BearerAuth guard (Phase 4+). When absent, a `getUserId` pass-through is used. */
  bearerGuard?: BearerGuard
}

export function buildApp(opts: AppOptions = {}) {
  const app = Fastify({
    logger: opts.logger ?? false,
    ajv: {
      customOptions: { strict: false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plugins: [addFormats as any],
    },
  })

  void app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  app.decorateRequest('userId', '')

  app.get('/health', async () => ({ status: 'ok' }))

  const service =
    opts.prisma && opts.getUserId
      ? {
          ...buildTasksHandlers(opts.prisma, opts.getUserId),
          ...buildDailyHandlers(opts.prisma, opts.getUserId),
          ...buildFrequentHandlers(opts.prisma, opts.getUserId),
          ...buildProfileHandlers(opts.prisma, opts.getUserId),
          ...buildFeedbackHandlers(opts.prisma, opts.getUserId),
          ...buildRewardsHandlers(opts.prisma, opts.getUserId),
          ...buildQuestsHandlers(opts.prisma, opts.getUserId),
          ...buildPushHandlers(opts.prisma, opts.getUserId),
          ...buildAuthHandlers(opts.prisma),
        }
      : stubService

  // Pick the BearerAuth guard: real token verification (Phase 4+) if supplied,
  // otherwise a test/dev pass-through that injects the seed user id.
  const getUserId = opts.getUserId
  const bearerGuard: BearerGuard | undefined =
    opts.bearerGuard ??
    (getUserId
      ? async (req) => {
          req.userId = await getUserId(req)
        }
      : undefined)

  void app.register(openapiGlue, {
    specification: SPEC_PATH,
    serviceHandlers: service,
    ...(bearerGuard ? { securityHandlers: { BearerAuth: bearerGuard } } : {}),
  })

  return app
}
