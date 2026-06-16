import { randomBytes, createHash } from 'node:crypto'

export interface OAuthStateEntry {
  provider: string
  codeVerifier: string
  redirectUri: string
  expiresAt: number
}

/** A PKCE verifier/challenge pair (S256). */
export interface Pkce {
  verifier: string
  challenge: string
}

export function generatePkce(): Pkce {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function generateState(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * In-memory single-use OAuth state store (MVP). Maps an opaque `state` to its
 * PKCE verifier + provider; entries are consumed once and expire after `ttlMs`.
 * Durable across restarts is deferred (would move to an OAuthState table).
 */
export function createOAuthStateStore(ttlMs = 10 * 60_000, now: () => number = Date.now) {
  const entries = new Map<string, OAuthStateEntry>()

  function put(state: string, data: Omit<OAuthStateEntry, 'expiresAt'>): void {
    entries.set(state, { ...data, expiresAt: now() + ttlMs })
  }

  /** Consume a state once. Returns null if unknown, expired, or already used. */
  function consume(state: string): OAuthStateEntry | null {
    const entry = entries.get(state)
    if (!entry) return null
    entries.delete(state)
    if (entry.expiresAt <= now()) return null
    return entry
  }

  return { put, consume }
}

export type OAuthStateStore = ReturnType<typeof createOAuthStateStore>
