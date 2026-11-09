import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from './app.js'

describe('GET /health', () => {
  let app: ReturnType<typeof buildApp>

  beforeEach(() => {
    app = buildApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })
})

// Spike: verify fastify-openapi-glue + ajv validation wired correctly
describe('glue validation spike', () => {
  let app: ReturnType<typeof buildApp>

  beforeEach(async () => {
    app = buildApp()
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('POST /tasks with missing required title → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /tasks with valid body → 501 (stub, validation passed)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Buy milk' },
    })
    expect(res.statusCode).toBe(501)
  })

  it('POST /daily with invalid date format → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/daily',
      payload: { date: 'not-a-date' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /daily with valid date → 501 (stub)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/daily',
      payload: { date: '2024-01-15' },
    })
    expect(res.statusCode).toBe(501)
  })
})

// Regression: a failed bearer auth must serialize as the contract error shape
// `{ code, message }` and NOT blow up serialization into an opaque 500.
describe('error normalization', () => {
  it('failed bearer auth → clean 401 { code, message }', async () => {
    const app = buildApp({
      bearerGuard: async () => {
        throw Object.assign(new Error('token expired'), { statusCode: 401 })
      },
    })
    await app.ready()
    const res = await app.inject({ method: 'GET', url: '/ai/conversations' })
    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ code: 'unauthorized' })
    expect(typeof res.json().message).toBe('string')
    await app.close()
  })
})

// The agent message endpoint hits an external LLM and burns free-tier quota;
// a client must not be able to spam it. Reads stay unthrottled.
describe('AI rate limiting', () => {
  const prevMax = process.env.AI_RATE_MAX

  beforeEach(() => {
    process.env.AI_RATE_MAX = '1'
  })

  afterEach(() => {
    if (prevMax === undefined) delete process.env.AI_RATE_MAX
    else process.env.AI_RATE_MAX = prevMax
  })

  it('second POST /ai/conversations/{id}/messages within the window → 429 { code: rate_limited }', async () => {
    const app = buildApp({ bearerGuard: async () => {} })
    await app.ready()
    const send = () =>
      app.inject({
        method: 'POST',
        url: '/ai/conversations/c1/messages',
        payload: { content: 'привет' },
      })

    const first = await send()
    expect(first.statusCode).not.toBe(429)
    const second = await send()
    expect(second.statusCode).toBe(429)
    expect(second.json()).toMatchObject({ code: 'rate_limited' })
    expect(typeof second.json().message).toBe('string')
    await app.close()
  })

  it('reads (GET /ai/conversations) are NOT throttled', async () => {
    const app = buildApp({ bearerGuard: async () => {} })
    await app.ready()
    const get = () => app.inject({ method: 'GET', url: '/ai/conversations' })
    const a = await get()
    const b = await get()
    expect(a.statusCode).not.toBe(429)
    expect(b.statusCode).not.toBe(429)
    await app.close()
  })
})
