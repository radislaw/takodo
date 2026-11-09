import { describe, it, expect } from 'vitest'
import {
  THEME_UNLOCK_LEVELS,
  GIFT_LEVELS,
  themeUnlockLevel,
  isThemeUnlocked,
  isBaseTheme,
  isFirstTaskTheme,
  nextGiftLevel,
} from './unlocks'

const unlocked = (level: number, firstTaskDone = true) => ({ level, firstTaskDone })

describe('THEME_UNLOCK_LEVELS', () => {
  it('covers the 12 level-gated themes (base + first-task live elsewhere)', () => {
    expect(Object.keys(THEME_UNLOCK_LEVELS)).toHaveLength(12)
  })

  it('does not contain cloud (removed)', () => {
    expect(THEME_UNLOCK_LEVELS).not.toHaveProperty('cloud')
  })

  it('gates the new dark/light variants by level', () => {
    expect(THEME_UNLOCK_LEVELS['ocean-dark']).toBe(4)
    expect(THEME_UNLOCK_LEVELS['silent-dark']).toBe(5)
    expect(THEME_UNLOCK_LEVELS['amber']).toBe(8)
    expect(THEME_UNLOCK_LEVELS['amber-dark']).toBe(8)
  })

  it('puts cyberpunk at the endgame and amoled before it', () => {
    expect(THEME_UNLOCK_LEVELS['cyberpunk']).toBe(50)
    expect(THEME_UNLOCK_LEVELS['amoled']).toBe(15)
  })
})

describe('isBaseTheme / isFirstTaskTheme', () => {
  it('marks light + high-contrast as base', () => {
    expect(isBaseTheme('light')).toBe(true)
    expect(isBaseTheme('high-contrast')).toBe(true)
    expect(isBaseTheme('dark')).toBe(false)
  })

  it('marks dark + high-contrast-dark as first-task gifts', () => {
    expect(isFirstTaskTheme('dark')).toBe(true)
    expect(isFirstTaskTheme('high-contrast-dark')).toBe(true)
    expect(isFirstTaskTheme('light')).toBe(false)
  })
})

describe('themeUnlockLevel', () => {
  it('returns 1 for base + first-task themes', () => {
    expect(themeUnlockLevel('light')).toBe(1)
    expect(themeUnlockLevel('high-contrast')).toBe(1)
    expect(themeUnlockLevel('dark')).toBe(1)
    expect(themeUnlockLevel('high-contrast-dark')).toBe(1)
  })

  it('returns the gated level for premium themes', () => {
    expect(themeUnlockLevel('lavender')).toBe(2)
    expect(themeUnlockLevel('cyberpunk')).toBe(50)
  })

  it('treats unknown theme as locked', () => {
    expect(themeUnlockLevel('nonexistent')).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('isThemeUnlocked', () => {
  it('always unlocks base themes', () => {
    expect(isThemeUnlocked('light', unlocked(1, false))).toBe(true)
    expect(isThemeUnlocked('high-contrast', unlocked(1, false))).toBe(true)
  })

  it('gates first-task themes on firstTaskDone, not level', () => {
    expect(isThemeUnlocked('dark', unlocked(99, false))).toBe(false)
    expect(isThemeUnlocked('dark', unlocked(1, true))).toBe(true)
    expect(isThemeUnlocked('high-contrast-dark', unlocked(1, true))).toBe(true)
  })

  it('locks premium themes below their level', () => {
    expect(isThemeUnlocked('lavender', unlocked(1))).toBe(false)
    expect(isThemeUnlocked('lavender', unlocked(2))).toBe(true)
    expect(isThemeUnlocked('cyberpunk', unlocked(49))).toBe(false)
    expect(isThemeUnlocked('cyberpunk', unlocked(50))).toBe(true)
  })

  it('unlocks every level-gated theme at level 50', () => {
    for (const theme of Object.keys(THEME_UNLOCK_LEVELS)) {
      expect(isThemeUnlocked(theme, unlocked(50))).toBe(true)
    }
  })

  it('never unlocks unknown theme', () => {
    expect(isThemeUnlocked('nonexistent', unlocked(99))).toBe(false)
  })
})

describe('nextGiftLevel', () => {
  it('points to the next gift level', () => {
    expect(nextGiftLevel(1)).toBe(2)
    expect(nextGiftLevel(2)).toBe(3)
    expect(nextGiftLevel(5)).toBe(8)
    expect(nextGiftLevel(8)).toBe(15)
    expect(nextGiftLevel(15)).toBe(50)
  })

  it('returns null once all gifts are unlocked', () => {
    expect(nextGiftLevel(50)).toBe(null)
    expect(nextGiftLevel(99)).toBe(null)
  })

  it('only references real gift levels', () => {
    expect(GIFT_LEVELS).toEqual([2, 3, 4, 5, 8, 15, 50])
  })
})
