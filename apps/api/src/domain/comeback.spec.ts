import { describe, it, expect } from 'vitest'
import { gapDays, isComeback, COMEBACK_MIN_GAP_DAYS } from './comeback.js'

describe('gapDays', () => {
  it('returns 0 when there is no prior activity', () => {
    expect(gapDays(null, '2026-06-11')).toBe(0)
  })

  it('returns 0 when last active day is yesterday', () => {
    expect(gapDays('2026-06-10', '2026-06-11')).toBe(0)
  })

  it('returns 0 when last active day is today', () => {
    expect(gapDays('2026-06-11', '2026-06-11')).toBe(0)
  })

  it('counts one full missed day', () => {
    expect(gapDays('2026-06-09', '2026-06-11')).toBe(1)
  })

  it('counts several full missed days', () => {
    expect(gapDays('2026-06-05', '2026-06-11')).toBe(5)
  })

  it('handles month boundaries', () => {
    expect(gapDays('2026-05-30', '2026-06-02')).toBe(2)
  })
})

describe('isComeback', () => {
  it('is false below the minimum gap', () => {
    expect(isComeback(0)).toBe(false)
    expect(isComeback(COMEBACK_MIN_GAP_DAYS - 1)).toBe(false)
  })

  it('is true at the minimum gap and above', () => {
    expect(isComeback(COMEBACK_MIN_GAP_DAYS)).toBe(true)
    expect(isComeback(30)).toBe(true)
  })
})
