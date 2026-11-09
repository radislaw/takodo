import { describe, it, expect } from 'vitest'
import { createOAuthStateStore, generatePkce, generateState } from './oauth-state.js'

describe('generatePkce', () => {
  it('produces a verifier and an S256 challenge', () => {
    const { verifier, challenge } = generatePkce()
    expect(verifier).toBeTypeOf('string')
    expect(challenge).toBeTypeOf('string')
    expect(challenge).not.toBe(verifier)
    expect(generatePkce().verifier).not.toBe(verifier)
  })
})

describe('generateState', () => {
  it('produces distinct opaque values', () => {
    expect(generateState()).not.toBe(generateState())
  })
})

describe('createOAuthStateStore', () => {
  const entry = { provider: 'google', codeVerifier: 'v', redirectUri: 'https://app/cb' }

  it('stores and consumes a state once', () => {
    const store = createOAuthStateStore()
    store.put('s1', entry)
    expect(store.consume('s1')).toMatchObject(entry)
    // Single-use: a second consume fails.
    expect(store.consume('s1')).toBeNull()
  })

  it('returns null for an unknown state', () => {
    expect(createOAuthStateStore().consume('nope')).toBeNull()
  })

  it('returns null for an expired state', () => {
    let t = 1000
    const store = createOAuthStateStore(500, () => t)
    store.put('s2', entry)
    t = 2000 // advance past ttl
    expect(store.consume('s2')).toBeNull()
  })
})
