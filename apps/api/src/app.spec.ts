import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app.js'

describe('GET /health', () => {
  let app: FastifyInstance

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

describe('GET /api/hello', () => {
  let app: FastifyInstance

  beforeEach(() => {
    app = buildApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns 200 with hello message', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/hello' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ message: 'Hello World from tootoo API' })
  })
})
