import { describe, it, expect } from 'vitest'
import { MIT_LIMIT, canAddMIT, countMIT } from './daily.js'

const mit = (n: number) => Array.from({ length: n }, () => ({ isMIT: true }))
const open = (n: number) => Array.from({ length: n }, () => ({ isMIT: false }))

describe('canAddMIT', () => {
  it('returns true for empty list', () => {
    expect(canAddMIT([])).toBe(true)
  })

  it('returns true when fewer than MIT_LIMIT MITs', () => {
    expect(canAddMIT([...mit(2), ...open(3)])).toBe(true)
  })

  it('returns false when MIT_LIMIT reached', () => {
    expect(canAddMIT([...mit(MIT_LIMIT), ...open(1)])).toBe(false)
  })

  it('returns false when over MIT_LIMIT', () => {
    expect(canAddMIT(mit(MIT_LIMIT + 1))).toBe(false)
  })
})

describe('countMIT', () => {
  it('returns 0 for empty list', () => {
    expect(countMIT([])).toBe(0)
  })

  it('counts only isMIT=true entries', () => {
    expect(countMIT([...mit(2), ...open(3)])).toBe(2)
  })
})
