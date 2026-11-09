import { describe, it, expect } from 'vitest'
import {
  TIMEZONE_IDS,
  detectTimezone,
  timezoneOffset,
  timezoneCity,
  formatTimezoneLabel,
} from './timezones'

describe('timezones', () => {
  it('exposes a non-empty curated id list including Moscow and UTC', () => {
    expect(TIMEZONE_IDS).toContain('Europe/Moscow')
    expect(TIMEZONE_IDS).toContain('UTC')
    expect(TIMEZONE_IDS.length).toBeGreaterThan(10)
  })

  it('detects a timezone string in the test environment', () => {
    const tz = detectTimezone()
    expect(typeof tz === 'string' || tz === undefined).toBe(true)
  })

  it('formats a UTC offset prefixed with UTC', () => {
    const off = timezoneOffset('Europe/Moscow')
    expect(off).toMatch(/^UTC([+-]\d{1,2}(:\d{2})?)?$/)
  })

  it('derives a readable city from an IANA id', () => {
    expect(timezoneCity('America/New_York')).toBe('New York')
    expect(timezoneCity('Europe/Moscow')).toBe('Moscow')
  })

  it('builds a friendly label with city and offset', () => {
    const label = formatTimezoneLabel('Europe/Moscow')
    expect(label).toContain('Moscow')
    expect(label).toContain('·')
    expect(label).toContain('UTC')
  })

  it('keeps UTC bare (no city/offset decoration)', () => {
    expect(formatTimezoneLabel('UTC')).toBe('UTC')
  })
})
