import { SignJWT, jwtVerify, errors as joseErrors } from 'jose'
import { randomBytes, createHmac } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { AuthError } from './errors.js'
import { parseDuration, type AuthConfig } from './config.js'

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type TokenService = ReturnType<typeof createTokenService>

const ACCESS_ALG = 'HS256'

/**
 * Token service: short-lived access JWTs (HS256, `typ:"access"`) + opaque
 * rotating refresh tokens stored HMAC-hashed. Reusing a rotated refresh token
 * revokes its whole family (reuse detection).
 */
export function createTokenService(config: AuthConfig, prisma: PrismaClient) {
  const accessTtlSeconds = Math.floor(parseDuration(config.accessTtl) / 1000)

  function hashToken(plain: string): string {
    return createHmac('sha256', config.refreshPepper).update(plain).digest('hex')
  }

  function refreshExpiry(): Date {
    return new Date(Date.now() + config.refreshTtlMs)
  }

  async function issueAccess(userId: string): Promise<string> {
    return new SignJWT({ typ: 'access' })
      .setProtectedHeader({ alg: ACCESS_ALG })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(config.accessTtl)
      .sign(config.accessSecret)
  }

  async function verifyAccess(token: string): Promise<{ sub: string }> {
    let payload
    try {
      ;({ payload } = await jwtVerify(token, config.accessSecret, { algorithms: [ACCESS_ALG] }))
    } catch (err) {
      if (err instanceof joseErrors.JWTExpired) {
        throw new AuthError('token_expired', 401, 'Access token expired')
      }
      throw new AuthError('token_invalid', 401, 'Invalid access token')
    }
    if (payload.typ !== 'access' || typeof payload.sub !== 'string') {
      throw new AuthError('token_invalid', 401, 'Wrong token type')
    }
    return { sub: payload.sub }
  }

  /** Mint a fresh refresh token (new family unless `familyId` continues one). */
  async function issueRefresh(userId: string, familyId?: string): Promise<string> {
    const plain = randomBytes(32).toString('base64url')
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(plain),
        familyId: familyId ?? randomBytes(16).toString('hex'),
        expiresAt: refreshExpiry(),
      },
    })
    return plain
  }

  async function issuePair(userId: string): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      issueAccess(userId),
      issueRefresh(userId),
    ])
    return { accessToken, refreshToken, expiresIn: accessTtlSeconds }
  }

  /** Rotate a refresh token → new pair. Reuse of a revoked token kills the family. */
  async function rotateRefresh(plain: string): Promise<TokenPair> {
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(plain) } })
    if (!row) throw new AuthError('token_invalid', 401, 'Unknown refresh token')

    if (row.revokedAt) {
      // Someone replayed a rotated token → revoke the entire lineage.
      await prisma.refreshToken.updateMany({
        where: { familyId: row.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      throw new AuthError('refresh_reuse_detected', 401, 'Refresh token reuse detected')
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      throw new AuthError('token_expired', 401, 'Refresh token expired')
    }

    const newPlain = await prisma.$transaction(async (tx) => {
      const plainNew = randomBytes(32).toString('base64url')
      const created = await tx.refreshToken.create({
        data: {
          userId: row.userId,
          tokenHash: hashToken(plainNew),
          familyId: row.familyId,
          expiresAt: refreshExpiry(),
        },
      })
      await tx.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date(), replacedBy: created.id },
      })
      return plainNew
    })

    const accessToken = await issueAccess(row.userId)
    return { accessToken, refreshToken: newPlain, expiresIn: accessTtlSeconds }
  }

  /** Revoke a single refresh token (logout). No-op if unknown/already revoked. */
  async function revoke(plain: string): Promise<void> {
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(plain) } })
    if (row && !row.revokedAt) {
      await prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } })
    }
  }

  return { issueAccess, verifyAccess, issueRefresh, issuePair, rotateRefresh, revoke }
}
