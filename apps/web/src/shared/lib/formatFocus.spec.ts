import { describe, it, expect } from 'vitest'
import { formatFocusDuration } from './formatFocus'

const t = (key: string, params?: Record<string, unknown>): string => {
  if (key === 'time.min') return `${params?.n} мин`
  if (key === 'time.hour') return `${params?.n} ч`
  if (key === 'time.hourMin') return `${params?.h} ч ${params?.m} мин`
  return key
}

describe('formatFocusDuration', () => {
  it('formats under 60 minutes as "N мин"', () => {
    expect(formatFocusDuration(0, t as never)).toBe('0 мин')
    expect(formatFocusDuration(60, t as never)).toBe('1 мин')
    expect(formatFocusDuration(1500, t as never)).toBe('25 мин')
    expect(formatFocusDuration(3540, t as never)).toBe('59 мин')
  })

  it('formats exactly 1 hour as "1 ч"', () => {
    expect(formatFocusDuration(3600, t as never)).toBe('1 ч')
  })

  it('formats hours and minutes as "N ч M мин"', () => {
    expect(formatFocusDuration(3900, t as never)).toBe('1 ч 5 мин')
    expect(formatFocusDuration(7500, t as never)).toBe('2 ч 5 мин')
  })
})
