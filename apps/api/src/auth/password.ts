import argon2 from 'argon2'

/**
 * argon2id with explicit OWASP-recommended parameters
 * (~19 MiB memory, 2 iterations, 1 lane). Pinned here so every hash is
 * comparable and upgrades are deliberate.
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456, // KiB ≈ 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS)
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    // Malformed hash or mismatch → treat as non-match, never throw to the caller.
    return false
  }
}
