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
