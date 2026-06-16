import { describe, it, expect } from 'vitest'
import { planCelebrations, themesAtLevel } from './useProgressCelebration'

describe('themesAtLevel', () => {
  it('returns the themes that unlock at a given level', () => {
    expect(themesAtLevel(2).sort()).toEqual(['lavender', 'lavender-dark'])
    expect(themesAtLevel(4).sort()).toEqual(['ocean', 'ocean-dark'])
    expect(themesAtLevel(50)).toEqual(['cyberpunk'])
  })

  it('returns empty for non-gift levels', () => {
    expect(themesAtLevel(6)).toEqual([])
    expect(themesAtLevel(7)).toEqual([])
  })
})

describe('planCelebrations', () => {
  it('is silent without a baseline (first observation)', () => {
    expect(planCelebrations(null, { level: 5, firstTaskDone: true })).toEqual([])
  })

  it('celebrates the first completed task', () => {
    const events = planCelebrations(
      { level: 1, firstTaskDone: false },
      { level: 1, firstTaskDone: true },
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      kind: 'first-task',
      themes: ['dark', 'high-contrast-dark'],
      nextGift: 2,
    })
  })

  it('does not re-celebrate the first task once recorded', () => {
    expect(
      planCelebrations({ level: 1, firstTaskDone: true }, { level: 1, firstTaskDone: true }),
    ).toEqual([])
  })

  it('celebrates a gift level-up and names the unlocked theme', () => {
    const events = planCelebrations(
      { level: 1, firstTaskDone: true },
      { level: 2, firstTaskDone: true },
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      kind: 'level-up',
      level: 2,
      themes: ['lavender', 'lavender-dark'],
      nextGift: 3,
    })
  })

  it('does not open the modal for a non-gift level-up (burst only)', () => {
    const events = planCelebrations(
      { level: 6, firstTaskDone: true },
      { level: 7, firstTaskDone: true },
    )
    expect(events).toEqual([])
  })

  it('emits one event per gift level when several are crossed at once', () => {
    const events = planCelebrations(
      { level: 1, firstTaskDone: true },
      { level: 5, firstTaskDone: true },
    )
    expect(events.map((e) => e.level)).toEqual([2, 3, 4, 5])
    expect(events.every((e) => e.kind === 'level-up')).toBe(true)
  })

  it('reports no next gift after the final gift level', () => {
    const events = planCelebrations(
      { level: 49, firstTaskDone: true },
      { level: 50, firstTaskDone: true },
    )
    expect(events[0]).toMatchObject({ level: 50, themes: ['cyberpunk'], nextGift: null })
  })

  it('combines first-task and level-up when both happen at once', () => {
    const events = planCelebrations(
      { level: 1, firstTaskDone: false },
      { level: 2, firstTaskDone: true },
    )
    expect(events.map((e) => e.kind)).toEqual(['first-task', 'level-up'])
  })
})
