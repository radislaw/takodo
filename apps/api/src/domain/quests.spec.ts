import { describe, it, expect } from 'vitest'
import {
  QUEST_POOL,
  selectDailyQuests,
  questProgress,
  rollTier,
  TIER_XP,
  type DayStats,
} from './quests.js'

function stats(overrides: Partial<DayStats> = {}): DayStats {
  return {
    completedToday: 0,
    mitCompletedToday: 0,
    entriesToday: 0,
    completedBeforeNoon: 0,
    ...overrides,
  }
}

describe('QUEST_POOL', () => {
  it('has at least 6 quests', () => {
    expect(QUEST_POOL.length).toBeGreaterThanOrEqual(6)
  })

  it('has unique ids', () => {
    const ids = QUEST_POOL.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has positive targets', () => {
    for (const q of QUEST_POOL) expect(q.target).toBeGreaterThan(0)
  })
})

describe('selectDailyQuests', () => {
  it('returns exactly 3 quests', () => {
    expect(selectDailyQuests('user-1', '2026-06-11')).toHaveLength(3)
  })

  it('returns quests from the pool without duplicates', () => {
    const quests = selectDailyQuests('user-1', '2026-06-11')
    const ids = quests.map((q) => q.id)
    expect(new Set(ids).size).toBe(3)
    for (const q of quests) expect(QUEST_POOL).toContainEqual(q)
  })

  it('is deterministic for the same user and date', () => {
    const a = selectDailyQuests('user-1', '2026-06-11')
    const b = selectDailyQuests('user-1', '2026-06-11')
    expect(a).toEqual(b)
  })

  it('varies by date', () => {
    const days = Array.from({ length: 30 }, (_, i) =>
      selectDailyQuests('user-1', `2026-07-${String(i + 1).padStart(2, '0')}`)
        .map((q) => q.id)
        .join(','),
    )
    expect(new Set(days).size).toBeGreaterThan(1)
  })

  it('varies by user', () => {
    const sets = Array.from({ length: 20 }, (_, i) =>
      selectDailyQuests(`user-${i}`, '2026-06-11')
        .map((q) => q.id)
        .join(','),
    )
    expect(new Set(sets).size).toBeGreaterThan(1)
  })
})

describe('selectDailyQuests with ensureEasy', () => {
  it('always includes the easy quest', () => {
    for (let i = 0; i < 30; i++) {
      const quests = selectDailyQuests(`user-${i}`, '2026-06-11', true)
      expect(quests.some((q) => q.id === 'complete_1')).toBe(true)
    }
  })

  it('still returns exactly 3 unique quests', () => {
    for (let i = 0; i < 30; i++) {
      const quests = selectDailyQuests(`user-${i}`, '2026-06-11', true)
      expect(quests).toHaveLength(3)
      expect(new Set(quests.map((q) => q.id)).size).toBe(3)
    }
  })

  it('is deterministic', () => {
    const a = selectDailyQuests('user-1', '2026-06-11', true)
    const b = selectDailyQuests('user-1', '2026-06-11', true)
    expect(a).toEqual(b)
  })

  it('keeps the natural set when it already contains the easy quest', () => {
    const date = Array.from({ length: 60 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 6, 1 + i))
      return d.toISOString().slice(0, 10)
    }).find((d) => selectDailyQuests('user-1', d).some((q) => q.id === 'complete_1'))!
    expect(selectDailyQuests('user-1', date, true)).toEqual(selectDailyQuests('user-1', date))
  })
})

describe('questProgress', () => {
  it('counts completed tasks for complete kind', () => {
    const quest = QUEST_POOL.find((q) => q.id === 'complete_3')!
    expect(questProgress(quest, stats({ completedToday: 2 }))).toBe(2)
  })

  it('counts MIT completions for complete_mit', () => {
    const quest = QUEST_POOL.find((q) => q.id === 'complete_mit')!
    expect(questProgress(quest, stats({ mitCompletedToday: 1 }))).toBe(1)
  })

  it('counts entries for add_3', () => {
    const quest = QUEST_POOL.find((q) => q.id === 'add_3')!
    expect(questProgress(quest, stats({ entriesToday: 3 }))).toBe(3)
  })

  it('counts before-noon completions for before_noon', () => {
    const quest = QUEST_POOL.find((q) => q.id === 'before_noon')!
    expect(questProgress(quest, stats({ completedBeforeNoon: 1 }))).toBe(1)
  })

  it('caps progress at target', () => {
    const quest = QUEST_POOL.find((q) => q.id === 'complete_1')!
    expect(questProgress(quest, stats({ completedToday: 5 }))).toBe(1)
  })
})

describe('rollTier', () => {
  it('returns common below 0.70', () => {
    expect(rollTier(0)).toBe('common')
    expect(rollTier(0.5)).toBe('common')
    expect(rollTier(0.699)).toBe('common')
  })

  it('returns rare between 0.70 and 0.95', () => {
    expect(rollTier(0.7)).toBe('rare')
    expect(rollTier(0.9)).toBe('rare')
    expect(rollTier(0.949)).toBe('rare')
  })

  it('returns epic at 0.95 and above', () => {
    expect(rollTier(0.95)).toBe('epic')
    expect(rollTier(0.999)).toBe('epic')
  })
})

describe('TIER_XP', () => {
  it('rewards higher tiers with more xp', () => {
    expect(TIER_XP.common).toBeLessThan(TIER_XP.rare)
    expect(TIER_XP.rare).toBeLessThan(TIER_XP.epic)
  })
})
