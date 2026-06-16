import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyRequest } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { buildApp } from '../app.js'
import { makeBearerGuard, getUserIdFromRequest } from './guard.js'
import { AuthError } from './errors.js'

describe('makeBearerGuard (unit)', () => {
  it('throws unauthenticated when the Authorization header is missing', async () => {
    const guard = makeBearerGuard({ verifyAccess: vi.fn() })
    const req = { headers: {} } as FastifyRequest
    await expect(guard(req)).rejects.toMatchObject({ code: 'unauthenticated', statusCode: 401 })
  })

  it('throws unauthenticated for a non-bearer scheme', async () => {
    const guard = makeBearerGuard({ verifyAccess: vi.fn() })
    const req = { headers: { authorization: 'Basic abc' } } as FastifyRequest
    await expect(guard(req)).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('sets req.userId from a valid token', async () => {
    const guard = makeBearerGuard({ verifyAccess: vi.fn().mockResolvedValue({ sub: 'user-9' }) })
    const req = { headers: { authorization: 'Bearer good.jwt' } } as FastifyRequest
    await guard(req)
    expect(req.userId).toBe('user-9')
  })

  it('propagates an AuthError from token verification', async () => {
    const guard = makeBearerGuard({
      verifyAccess: vi.fn().mockRejectedValue(new AuthError('token_expired', 401)),
    })
    const req = { headers: { authorization: 'Bearer stale' } } as FastifyRequest
    await expect(guard(req)).rejects.toMatchObject({ code: 'token_expired' })
  })
})

describe('BearerAuth guard (integration via glue)', () => {
  const prisma = mockDeep<PrismaClient>()
  const verifyAccess = vi.fn()

  function makeApp() {
    return buildApp({
      prisma,
      getUserId: getUserIdFromRequest,
      bearerGuard: makeBearerGuard({ verifyAccess }),
    })
  }

  beforeEach(() => {
    mockReset(prisma)
    verifyAccess.mockReset()
  })

  it('rejects a protected route with no bearer token (401)', async () => {
    const app = makeApp()
    const res = await app.inject({ method: 'GET', url: '/tasks' })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('allows a protected route with a valid bearer token', async () => {
    verifyAccess.mockResolvedValue({ sub: 'user-1' })
    prisma.task.findMany.mockResolvedValue([])
    const app = makeApp()
    const res = await app.inject({
      method: 'GET',
      url: '/tasks',
      headers: { authorization: 'Bearer valid' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([])
    await app.close()
  })

  it('lets public /auth routes through without a token (no 401)', async () => {
    const app = makeApp()
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'a@b.com', password: 'password123' },
    })
    expect(res.statusCode).not.toBe(401)
    await app.close()
  })
})
