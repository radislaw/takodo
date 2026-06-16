export interface AuthConfig {
  /** HMAC key for signing/verifying access JWTs. */
  accessSecret: Uint8Array
  /** Pepper for the HMAC-SHA256 of opaque refresh tokens (stored as tokenHash). */
  refreshPepper: Uint8Array
  /** Access-token lifetime as a jose duration string, e.g. "15m". */
  accessTtl: string
  /** Refresh-token lifetime in milliseconds. */
  refreshTtlMs: number
}

const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
}

/** Parse a short duration like "15m", "30d", "12h", "45s" into milliseconds. */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim())
  if (!match) throw new Error(`Invalid duration: "${value}" (expected e.g. "15m", "30d")`)
  return Number(match[1]) * UNIT_MS[match[2]!]!
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const v = env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

/** Build the auth config from environment, throwing if secrets are absent. */
export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const encoder = new TextEncoder()
  return {
    accessSecret: encoder.encode(required(env, 'JWT_ACCESS_SECRET')),
    refreshPepper: encoder.encode(required(env, 'JWT_REFRESH_SECRET')),
    accessTtl: env.ACCESS_TTL ?? '15m',
    refreshTtlMs: parseDuration(env.REFRESH_TTL ?? '30d'),
  }
}
