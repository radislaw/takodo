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
import { buildRewardsHandlers } from './service/rewards.js'
import { buildQuestsHandlers } from './service/quests.js'
import { buildPushHandlers } from './service/push.js'

const SPEC_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../packages/contract/openapi/openapi.yaml',
)

export interface AppOptions {
  logger?: boolean
  prisma?: PrismaClient
  getUserId?: () => Promise<string>
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

  app.get('/health', async () => ({ status: 'ok' }))

  const service =
    opts.prisma && opts.getUserId
      ? {
          ...buildTasksHandlers(opts.prisma, opts.getUserId),
          ...buildDailyHandlers(opts.prisma, opts.getUserId),
          ...buildFrequentHandlers(opts.prisma, opts.getUserId),
          ...buildProfileHandlers(opts.prisma, opts.getUserId),
          ...buildRewardsHandlers(opts.prisma, opts.getUserId),
          ...buildQuestsHandlers(opts.prisma, opts.getUserId),
          ...buildPushHandlers(opts.prisma, opts.getUserId),
        }
      : stubService

  void app.register(openapiGlue, {
    specification: SPEC_PATH,
    serviceHandlers: service,
  })

  return app
}
