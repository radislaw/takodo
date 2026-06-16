import { describe, it, expect } from 'vitest'
import { parseDuration, loadAuthConfig } from './config.js'

describe('parseDuration', () => {
  it.each([
    ['45s', 45_000],
    ['15m', 900_000],
    ['12h', 43_200_000],
    ['30d', 2_592_000_000],
  ])('parses %s', (input, expected) => {
    expect(parseDuration(input)).toBe(expected)
  })

  it('throws on a bad format', () => {
    expect(() => parseDuration('5 weeks')).toThrow()
    expect(() => parseDuration('abc')).toThrow()
  })
})

describe('loadAuthConfig', () => {
  it('throws when a secret is missing', () => {
    expect(() => loadAuthConfig({ JWT_ACCESS_SECRET: 'x' })).toThrow(/JWT_REFRESH_SECRET/)
  })

  it('builds config with defaults', () => {
    const cfg = loadAuthConfig({ JWT_ACCESS_SECRET: 'a', JWT_REFRESH_SECRET: 'b' })
    expect(cfg.accessTtl).toBe('15m')
    expect(cfg.refreshTtlMs).toBe(2_592_000_000)
    expect(cfg.accessSecret).toBeInstanceOf(Uint8Array)
  })
})
