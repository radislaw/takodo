import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, User } from '@prisma/client'
import { buildApp } from '../app.js'
import { createOAuthStateStore } from './oauth-state.js'
import { AuthError } from './errors.js'
import type { TokenService } from './tokens.js'
import type { OAuthProvider, OAuthUserInfo } from './providers/types.js'

const PAIR = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 }

const prisma = mockDeep<PrismaClient>()
const tokens = {
  issuePair: vi.fn().mockResolvedValue(PAIR),
  rotateRefresh: vi.fn(),
  revoke: vi.fn(),
  issueAccess: vi.fn(),
  verifyAccess: vi.fn(),
  issueRefresh: vi.fn(),
} as unknown as TokenService

const exchangeCode = vi.fn<(args: unknown) => Promise<OAuthUserInfo>>()
const fakeProvider: OAuthProvider = {
  name: 'google',
  buildAuthorizeUrl: ({ state, codeChallenge, redirectUri }) =>
    `https://provider/auth?state=${state}&cc=${codeChallenge}&redirect=${encodeURIComponent(redirectUri)}`,
  exchangeCode,
}

const stateStore = createOAuthStateStore()
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
  prisma.$transaction.mockImplementation(async (fn) => fn(prisma))
  app = buildApp({
    prisma,
    getUserId: () => 'user-1',
    tokens,
    oauth: {
      registry: new Map([['google', fakeProvider]]),
      stateStore,
      redirectUri: 'https://app.local/auth/callback',
    },
  })
})

describe('GET /auth/{provider}/start', () => {
  it('returns an authorize URL + state for a known provider', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/google/start' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { authorizeUrl: string; state: string }
    expect(body.state).toBeTypeOf('string')
    expect(body.authorizeUrl).toContain(`state=${body.state}`)
  })

  it('rejects an unknown provider with 400 provider_unsupported', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/myspace/start' })
    expect(res.statusCode).toBe(400)
    expect(res.json().code).toBe('provider_unsupported')
  })
})

describe('POST /auth/{provider}/callback', () => {
  async function startAndGetState(): Promise<string> {
    const res = await app.inject({ method: 'GET', url: '/auth/google/start' })
    return (res.json() as { state: string }).state
  }

  it('rejects an unknown/expired state with 401 oauth_state_mismatch', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/google/callback',
      payload: { code: 'abc', state: 'never-issued' },
    })
    expect(res.statusCode).toBe(401)
    expect(res.json().code).toBe('oauth_state_mismatch')
  })

  it('links to an existing user on a verified email and returns tokens', async () => {
    const state = await startAndGetState()
    exchangeCode.mockResolvedValue({
      providerAccountId: 'g-1',
      email: 'a@b.com',
      emailVerified: true,
      name: 'A',
    })
    prisma.authIdentity.findUnique.mockResolvedValue(null)
    prisma.user.findUnique.mockResolvedValue(makeUser({ id: 'existing-7' }))

    const res = await app.inject({
      method: 'POST',
      url: '/auth/google/callback',
      payload: { code: 'good', state },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(PAIR)
    expect(prisma.authIdentity.create).toHaveBeenCalledWith({
      data: {
        userId: 'existing-7',
        provider: 'google',
        providerAccountId: 'g-1',
        email: 'a@b.com',
      },
    })
    expect(tokens.issuePair).toHaveBeenCalledWith('existing-7')
  })

  it('creates a new user when no identity and no email match', async () => {
    const state = await startAndGetState()
    exchangeCode.mockResolvedValue({
      providerAccountId: 'g-2',
      email: 'new@b.com',
      emailVerified: true,
    })
    prisma.authIdentity.findUnique.mockResolvedValue(null)
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue(makeUser({ id: 'created-9', email: 'new@b.com' }))

    const res = await app.inject({
      method: 'POST',
      url: '/auth/google/callback',
      payload: { code: 'good', state },
    })
    expect(res.statusCode).toBe(200)
    expect(prisma.user.create).toHaveBeenCalledOnce()
    expect(tokens.issuePair).toHaveBeenCalledWith('created-9')
  })

  it('reuses an existing linked identity without creating a user', async () => {
    const state = await startAndGetState()
    exchangeCode.mockResolvedValue({ providerAccountId: 'g-3', email: null, emailVerified: false })
    prisma.authIdentity.findUnique.mockResolvedValue({
      id: 'ai-1',
      userId: 'linked-3',
      provider: 'google',
      providerAccountId: 'g-3',
      email: null,
      createdAt: new Date(),
    })

    const res = await app.inject({
      method: 'POST',
      url: '/auth/google/callback',
      payload: { code: 'good', state },
    })
    expect(res.statusCode).toBe(200)
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(tokens.issuePair).toHaveBeenCalledWith('linked-3')
  })

  it('maps an exchange failure to its AuthError code', async () => {
    const state = await startAndGetState()
    exchangeCode.mockRejectedValue(new AuthError('oauth_exchange_failed', 400))
    prisma.authIdentity.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/auth/google/callback',
      payload: { code: 'bad', state },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().code).toBe('oauth_exchange_failed')
  })
})
