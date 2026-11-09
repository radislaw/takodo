import Fastify, { type FastifyError, type FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
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
import { buildAIHandlers } from './service/ai.js'
import { buildAuthHandlers, stubAuthHandlers, type OAuthDeps } from './auth/handlers.js'
import type { GetUserId } from './auth/guard.js'
import type { TokenService } from './auth/tokens.js'
import type { AgentRunner } from './ai/runner.js'

/** BearerAuth security handler: succeeds (optionally setting `req.userId`) or throws to reject. */
type BearerGuard = (req: import('fastify').FastifyRequest) => Promise<void>

const SPEC_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../packages/contract/openapi/openapi.yaml',
)

// Per-user throttle on the agent message endpoint: each turn hits an external LLM
// and burns free-tier quota, so an abusive client must not be able to spam it.
// Only the expensive POST /ai/.../messages route is limited — cheap reads are not.
// Key by userId (set by the bearer guard); fall back to IP when unauthenticated.
const isAgentMessageRoute = (method: string | string[], url: string): boolean => {
  const methods = Array.isArray(method) ? method : [method]
  return methods.includes('POST') && url.startsWith('/ai/') && url.endsWith('/messages')
}

export interface AppOptions {
  logger?: boolean
  prisma?: PrismaClient
  getUserId?: GetUserId
  /** Real BearerAuth guard (Phase 4+). When absent, a `getUserId` pass-through is used. */
  bearerGuard?: BearerGuard
  /** Token service powering /auth handlers. When absent, auth routes are stubbed (501). */
  tokens?: TokenService
  /** OAuth provider registry + state store. When absent, /auth/{provider}/* are stubbed. */
  oauth?: OAuthDeps
  /** Autonomous AI agent runner. When absent/null, /ai/* messages reply 503. */
  agentRunner?: AgentRunner | null
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
          ...buildAIHandlers(opts.prisma, opts.getUserId, opts.agentRunner ?? null),
          ...(opts.tokens
            ? buildAuthHandlers(opts.prisma, opts.tokens, opts.oauth)
            : stubAuthHandlers),
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

  // Rate limiter, opt-in per route (global: false). The onRoute hook below tags
  // only the agent message endpoint, so reads and the rest of the API stay
  // unthrottled. Registered before the glue so its internal onRoute sees the
  // generated routes; the limit config is read at request time.
  void app.register(rateLimit, {
    global: false,
    keyGenerator: (req: FastifyRequest) => req.userId || req.ip,
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      code: 'rate_limited',
      message: `Too many requests. Try again in ${Math.ceil(ctx.ttl / 1000)}s.`,
    }),
  })

  const aiRateMax = Number(process.env.AI_RATE_MAX ?? 20)
  const aiRateWindow = process.env.AI_RATE_WINDOW ?? '5 minutes'
  app.addHook('onRoute', (routeOptions) => {
    if (!isAgentMessageRoute(routeOptions.method, routeOptions.url)) return
    routeOptions.config = {
      ...routeOptions.config,
      rateLimit: { max: aiRateMax, timeWindow: aiRateWindow },
    }
  })

  void app.register(openapiGlue, {
    specification: SPEC_PATH,
    serviceHandlers: service,
    ...(bearerGuard ? { securityHandlers: { BearerAuth: bearerGuard } } : {}),
  })

  // Normalize every error into the contract error shape `{ code, message }`.
  // Without this, errors lacking a `code` (e.g. the openapi-glue SecurityError on
  // a failed bearer auth, or ajv validation errors) fail response serialization
  // against the error schema and surface as an opaque 500.
  app.setErrorHandler((error: FastifyError, req, reply) => {
    // Prefer the error's own status; fall back to a status already set on the
    // reply (e.g. @fastify/rate-limit sets 429 before throwing) before 500.
    const statusCode =
      typeof error.statusCode === 'number'
        ? error.statusCode
        : reply.statusCode >= 400
          ? reply.statusCode
          : 500
    const raw: unknown = error.code
    const code =
      typeof raw === 'string' && !raw.startsWith('FST_')
        ? raw
        : statusCode === 401
          ? 'unauthorized'
          : statusCode === 403
            ? 'forbidden'
            : statusCode === 404
              ? 'not_found'
              : statusCode === 400
                ? 'bad_request'
                : 'internal_error'
    if (statusCode >= 500) req.log.error({ err: error }, 'request failed')
    void reply.code(statusCode).send({ code, message: error.message })
  })

  return app
}
