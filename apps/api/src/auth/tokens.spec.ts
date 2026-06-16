import { describe, it, expect, beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import { SignJWT } from 'jose'
import type { PrismaClient, RefreshToken } from '@prisma/client'
import { createTokenService } from './tokens.js'
import type { AuthConfig } from './config.js'

const config: AuthConfig = {
  accessSecret: new TextEncoder().encode('test-access-secret-0123456789abcdef'),
  refreshPepper: new TextEncoder().encode('test-refresh-pepper-0123456789abcd'),
  accessTtl: '15m',
  refreshTtlMs: 30 * 86_400_000,
}

const prisma = mockDeep<PrismaClient>()
const tokens = createTokenService(config, prisma)

function makeRefreshRow(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 'rt-1',
    userId: 'user-1',
    tokenHash: 'hash',
    familyId: 'fam-1',
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
    replacedBy: null,
    createdAt: new Date(),
    ...overrides,
  }
}

beforeEach(() => {
  mockReset(prisma)
  prisma.$transaction.mockImplementation(async (fn) => fn(prisma))
})

describe('access tokens', () => {
  it('issues and verifies, returning the subject', async () => {
    const token = await tokens.issueAccess('user-42')
    expect(await tokens.verifyAccess(token)).toEqual({ sub: 'user-42' })
  })

  it('rejects an expired token with token_expired', async () => {
    const expired = await new SignJWT({ typ: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(config.accessSecret)
    await expect(tokens.verifyAccess(expired)).rejects.toMatchObject({ code: 'token_expired' })
  })

  it('rejects a wrong-secret token with token_invalid', async () => {
    const foreign = await new SignJWT({ typ: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode('a-totally-different-secret-value!!'))
    await expect(tokens.verifyAccess(foreign)).rejects.toMatchObject({ code: 'token_invalid' })
  })

  it('rejects a non-access token type with token_invalid', async () => {
    const refreshTyped = await new SignJWT({ typ: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-1')
      .setExpirationTime('15m')
      .sign(config.accessSecret)
    await expect(tokens.verifyAccess(refreshTyped)).rejects.toMatchObject({ code: 'token_invalid' })
  })
})

describe('issuePair', () => {
  it('returns access + refresh and persists a refresh row', async () => {
    prisma.refreshToken.create.mockResolvedValue(makeRefreshRow())
    const pair = await tokens.issuePair('user-1')
    expect(pair.accessToken).toBeTypeOf('string')
    expect(pair.refreshToken).toBeTypeOf('string')
    expect(pair.expiresIn).toBe(900)
    expect(prisma.refreshToken.create).toHaveBeenCalledOnce()
  })
})

describe('rotateRefresh', () => {
  it('throws token_invalid for an unknown token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null)
    await expect(tokens.rotateRefresh('nope')).rejects.toMatchObject({ code: 'token_invalid' })
  })

  it('detects reuse: revokes the family and throws refresh_reuse_detected', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(makeRefreshRow({ revokedAt: new Date() }))
    await expect(tokens.rotateRefresh('replayed')).rejects.toMatchObject({
      code: 'refresh_reuse_detected',
    })
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'fam-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('throws token_expired for an expired token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(
      makeRefreshRow({ expiresAt: new Date(Date.now() - 1000) }),
    )
    await expect(tokens.rotateRefresh('old')).rejects.toMatchObject({ code: 'token_expired' })
  })

  it('rotates: mints a successor, revokes the old in the same family, returns a pair', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(makeRefreshRow())
    prisma.refreshToken.create.mockResolvedValue(makeRefreshRow({ id: 'rt-2' }))
    const pair = await tokens.rotateRefresh('valid')
    expect(pair.accessToken).toBeTypeOf('string')
    expect(pair.refreshToken).toBeTypeOf('string')
    expect(prisma.refreshToken.create).toHaveBeenCalledOnce()
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revokedAt: expect.any(Date), replacedBy: 'rt-2' },
    })
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })
})

describe('revoke', () => {
  it('revokes a live token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(makeRefreshRow())
    await tokens.revoke('live')
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revokedAt: expect.any(Date) },
    })
  })

  it('is a no-op for an unknown token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null)
    await tokens.revoke('ghost')
    expect(prisma.refreshToken.update).not.toHaveBeenCalled()
  })
})
