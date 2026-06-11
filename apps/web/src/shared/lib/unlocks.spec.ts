import { describe, it, expect } from 'vitest'
import { THEME_UNLOCK_LEVELS, themeUnlockLevel, isThemeUnlocked } from './unlocks'

describe('THEME_UNLOCK_LEVELS', () => {
  it('covers all 12 themes', () => {
    expect(Object.keys(THEME_UNLOCK_LEVELS)).toHaveLength(12)
  })

  it('keeps accessibility theme at level 1', () => {
    expect(THEME_UNLOCK_LEVELS['high-contrast']).toBe(1)
  })
})

describe('themeUnlockLevel', () => {
  it('returns 1 for base themes', () => {
    expect(themeUnlockLevel('light')).toBe(1)
    expect(themeUnlockLevel('dark')).toBe(1)
    expect(themeUnlockLevel('silent')).toBe(1)
    expect(themeUnlockLevel('high-contrast')).toBe(1)
  })

  it('returns 2 for lavender and cloud', () => {
    expect(themeUnlockLevel('lavender')).toBe(2)
    expect(themeUnlockLevel('cloud')).toBe(2)
  })

  it('returns 3 for eco and ocean', () => {
    expect(themeUnlockLevel('eco')).toBe(3)
    expect(themeUnlockLevel('ocean')).toBe(3)
  })

  it('returns 4 for lavender-dark and amber', () => {
    expect(themeUnlockLevel('lavender-dark')).toBe(4)
    expect(themeUnlockLevel('amber')).toBe(4)
  })

  it('returns 5 for cyberpunk and amoled', () => {
    expect(themeUnlockLevel('cyberpunk')).toBe(5)
    expect(themeUnlockLevel('amoled')).toBe(5)
  })

  it('treats unknown theme as locked', () => {
    expect(themeUnlockLevel('nonexistent')).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('isThemeUnlocked', () => {
  it('unlocks base themes at level 1', () => {
    expect(isThemeUnlocked('light', 1)).toBe(true)
  })

  it('locks lavender at level 1', () => {
    expect(isThemeUnlocked('lavender', 1)).toBe(false)
  })

  it('unlocks everything at level 5', () => {
    for (const theme of Object.keys(THEME_UNLOCK_LEVELS)) {
      expect(isThemeUnlocked(theme, 5)).toBe(true)
    }
  })

  it('never unlocks unknown theme', () => {
    expect(isThemeUnlocked('nonexistent', 99)).toBe(false)
  })
})
