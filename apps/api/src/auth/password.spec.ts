import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('password', () => {
  it('hashes to an argon2id string distinct from the input', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).toMatch(/^\$argon2id\$/)
    expect(hash).not.toContain('correct horse')
  })

  it('verifies a correct password', async () => {
    const hash = await hashPassword('s3cret-password')
    expect(await verifyPassword(hash, 's3cret-password')).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('s3cret-password')
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false)
  })

  it('returns false (never throws) on a malformed hash', async () => {
    expect(await verifyPassword('not-a-hash', 'whatever')).toBe(false)
  })

  it('produces a different salt each call', async () => {
    const a = await hashPassword('same')
    const b = await hashPassword('same')
    expect(a).not.toBe(b)
  })
})
