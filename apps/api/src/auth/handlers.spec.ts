import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, User } from '@prisma/client'
import { buildApp } from '../app.js'
import { hashPassword } from './password.js'
import { AuthError } from './errors.js'
import type { TokenService } from './tokens.js'

const PAIR = { accessToken: 'access.jwt', refreshToken: 'refresh.opaque', expiresIn: 900 }

const prisma = mockDeep<PrismaClient>()
const tokens = {
  issueAccess: vi.fn(),
  verifyAccess: vi.fn(),
  issueRefresh: vi.fn(),
  issuePair: vi.fn().mockResolvedValue(PAIR),
  rotateRefresh: vi.fn().mockResolvedValue(PAIR),
  revoke: vi.fn().mockResolvedValue(undefined),
} as unknown as TokenService

let app: FastifyInstance

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'a@b.com',
    name: 'A',
    passwordHash: null,
    emailVerified: null,
    theme: 'light',
    gentleMoves: 0,
    notifMorning: true,
    notifEvening: true,
    createdAt: new Date(),
    gender: null,
    birthDate: null,
    timezone: null,
    adhdStatus: null,
    language: null,
    ...overrides,
  }
}

beforeEach(() => {
  mockReset(prisma)
  vi.clearAllMocks()
  ;(tokens.issuePair as ReturnType<typeof vi.fn>).mockResolvedValue(PAIR)
  ;(tokens.rotateRefresh as ReturnType<typeof vi.fn>).mockResolvedValue(PAIR)
  app = buildApp({ prisma, getUserId: () => 'user-1', tokens })
})

describe('POST /auth/signup', () => {
  it('creates a user and returns a token pair', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue(makeUser({ id: 'new-1' }))
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { email: 'New@B.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(PAIR)
    expect(prisma.user.create).toHaveBeenCalledOnce()
    // Email is normalized to lowercase before persisting.
    expect(prisma.user.create.mock.calls[0]![0].data.email).toBe('new@b.com')
  })

  it('rejects a duplicate email with 409 email_taken', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser())
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { email: 'a@b.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('email_taken')
    expect(prisma.user.create).not.toHaveBeenCalled()
  })
})

describe('POST /auth/login', () => {
  it('returns a token pair for valid credentials', async () => {
    const passwordHash = await hashPassword('password123')
    prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash }))
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'a@b.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(PAIR)
  })

  it('rejects a wrong password with 401 invalid_credentials', async () => {
    const passwordHash = await hashPassword('password123')
    prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash }))
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'a@b.com', password: 'wrong-password' },
    })
    expect(res.statusCode).toBe(401)
    expect(res.json().code).toBe('invalid_credentials')
  })

  it('rejects an unknown email with 401', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'ghost@b.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('rejects an oauth-only account (no passwordHash) with 401', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser({ passwordHash: null }))
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'a@b.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /auth/refresh', () => {
  it('rotates and returns a new pair', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken: 'old.refresh' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(PAIR)
    expect(tokens.rotateRefresh).toHaveBeenCalledWith('old.refresh')
  })

  it('maps a reuse AuthError to its status + code', async () => {
    ;(tokens.rotateRefresh as ReturnType<typeof vi.fn>).mockRejectedValue(
      new AuthError('refresh_reuse_detected', 401),
    )
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refreshToken: 'replayed' },
    })
    expect(res.statusCode).toBe(401)
    expect(res.json().code).toBe('refresh_reuse_detected')
  })
})

describe('POST /auth/logout', () => {
  it('revokes the token and returns 204', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      payload: { refreshToken: 'bye.refresh' },
    })
    expect(res.statusCode).toBe(204)
    expect(tokens.revoke).toHaveBeenCalledWith('bye.refresh')
  })
})
