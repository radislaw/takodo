import { describe, it, expect } from 'vitest'
import { normalizeTitle } from './normalize.js'

describe('normalizeTitle', () => {
  it('lowercases', () => expect(normalizeTitle('Buy Milk')).toBe('buy milk'))
  it('trims leading/trailing whitespace', () => expect(normalizeTitle('  hello  ')).toBe('hello'))
  it('collapses internal whitespace', () =>
    expect(normalizeTitle('buy  lots   of milk')).toBe('buy lots of milk'))
  it('handles empty string', () => expect(normalizeTitle('')).toBe(''))
  it('handles already normalized', () => expect(normalizeTitle('buy milk')).toBe('buy milk'))
  it('trims + collapses + lowercases together', () =>
    expect(normalizeTitle('  Buy  MILK  ')).toBe('buy milk'))
})
