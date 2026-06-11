import { describe, it, expect } from 'vitest'
import { computeRewards, computeXP, computeLevel, type CompletedTaskInfo } from './rewards.js'

const NOW = new Date('2024-06-05T12:00:00Z') // Wednesday

function daysAgo(n: number): Date {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() - n)
  return d
}

function td(date: Date, pomodoros = 0): CompletedTaskInfo {
  return { completedAt: date, pomodoros }
}

describe('computeRewards', () => {
  it('streak = 0 with no completions', () => {
    const r = computeRewards([], NOW)
    expect(r.streak).toBe(0)
    expect(r.longestStreak).toBe(0)
  })

  it('streak counts consecutive days ending today', () => {
    const tasks = [td(daysAgo(0)), td(daysAgo(1)), td(daysAgo(2))]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(3)
  })

  it('streak falls back to yesterday if today has no completion', () => {
    const tasks = [td(daysAgo(1)), td(daysAgo(2))]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(2)
  })

  it('streak breaks on gap', () => {
    const tasks = [td(daysAgo(0)), td(daysAgo(2))]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(1)
  })

  it('longestStreak is max of all runs', () => {
    const tasks = [
      td(daysAgo(0)),
      td(daysAgo(10)),
      td(daysAgo(11)),
      td(daysAgo(12)),
      td(daysAgo(13)),
    ]
    const r = computeRewards(tasks, NOW)
    expect(r.longestStreak).toBe(4)
    expect(r.streak).toBe(1)
  })

  it('week has 7 entries, Monday-first', () => {
    const r = computeRewards([], NOW)
    expect(r.week).toHaveLength(7)
    expect(r.week[0]!.date).toBe('2024-06-03')
    expect(r.week[6]!.date).toBe('2024-06-09')
  })

  it('week marks active days', () => {
    const r = computeRewards([td(NOW)], NOW)
    const today = r.week.find((d) => d.date === '2024-06-05')
    expect(today!.active).toBe(true)
    expect(r.week.filter((d) => d.active)).toHaveLength(1)
  })

  it('first_step badge earned after first completion', () => {
    const r = computeRewards([td(daysAgo(0))], NOW)
    expect(r.badges.find((b) => b.id === 'first_step')?.earned).toBe(true)
  })

  it('first_step badge not earned with no completions', () => {
    const r = computeRewards([], NOW)
    expect(r.badges.find((b) => b.id === 'first_step')?.earned).toBe(false)
  })

  it('streak_5 badge earned when longestStreak >= 5', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => td(daysAgo(i)))
    const r = computeRewards(tasks, NOW)
    expect(r.badges.find((b) => b.id === 'streak_5')?.earned).toBe(true)
  })

  it('streak_5 remaining counts down from current streak', () => {
    const tasks = [td(daysAgo(0)), td(daysAgo(1))]
    const r = computeRewards(tasks, NOW)
    const badge = r.badges.find((b) => b.id === 'streak_5')
    expect(badge?.earned).toBe(false)
    expect(badge?.remaining).toBe(3)
  })

  it('deduplicates multiple completions on same day', () => {
    const tasks = [
      td(new Date('2024-06-05T08:00:00Z')),
      td(new Date('2024-06-05T14:00:00Z')),
      td(new Date('2024-06-05T20:00:00Z')),
    ]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(1)
  })
})

describe('streak shields', () => {
  function run(len: number, endAgo: number): CompletedTaskInfo[] {
    return Array.from({ length: len }, (_, i) => td(daysAgo(endAgo + i)))
  }

  it('no shields below 5 streak days', () => {
    const r = computeRewards(run(4, 0), NOW)
    expect(r.shields).toBe(0)
  })

  it('earns a shield on the 5th streak day', () => {
    const r = computeRewards(run(5, 0), NOW)
    expect(r.shields).toBe(1)
  })

  it('earns second shield on the 10th streak day, capped at 2', () => {
    expect(computeRewards(run(10, 0), NOW).shields).toBe(2)
    expect(computeRewards(run(20, 0), NOW).shields).toBe(2)
  })

  it('1-day gap consumes a shield and preserves streak', () => {
    const tasks = [...run(5, 2), td(daysAgo(0))]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(6)
    expect(r.shields).toBe(0)
    expect(r.shieldUsedRecently).toBe(true)
  })

  it('2-day gap with 2 shields preserves streak', () => {
    const tasks = [...run(10, 3), td(daysAgo(0))]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(11)
    expect(r.shields).toBe(0)
  })

  it('3-day gap breaks streak even with 2 shields', () => {
    const tasks = [...run(10, 4), td(daysAgo(0))]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(1)
    expect(r.shields).toBe(0)
  })

  it('gap with no shields resets streak', () => {
    const tasks = [...run(3, 2), td(daysAgo(0))]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(1)
    expect(r.shieldUsedRecently).toBe(false)
  })

  it('today inactive is grace, not a shield consumption', () => {
    const r = computeRewards(run(5, 1), NOW)
    expect(r.streak).toBe(5)
    expect(r.shields).toBe(1)
    expect(r.shieldUsedRecently).toBe(false)
  })

  it('streak continues earning shields after a shielded gap', () => {
    const tasks = [...run(5, 6), ...run(5, 0)]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(10)
    expect(r.shields).toBe(1)
  })

  it('week marks shielded days', () => {
    const tasks = [...run(5, 2), td(daysAgo(0))]
    const r = computeRewards(tasks, NOW)
    const tue = r.week.find((d) => d.date === '2024-06-04')
    expect(tue?.active).toBe(false)
    expect(tue?.shielded).toBe(true)
  })

  it('shieldUsedRecently false when shield used more than 7 days ago', () => {
    const tasks = [...run(5, 11), ...run(10, 0)]
    const r = computeRewards(tasks, NOW)
    expect(r.streak).toBe(15)
    expect(r.shieldUsedRecently).toBe(false)
  })

  it('longestStreak counts shielded runs as continuous', () => {
    const tasks = [...run(5, 2), td(daysAgo(0))]
    const r = computeRewards(tasks, NOW)
    expect(r.longestStreak).toBe(6)
  })

  it('streak_21 badge earned at longestStreak >= 21', () => {
    const r = computeRewards(run(21, 0), NOW)
    expect(r.badges.find((b) => b.id === 'streak_21')?.earned).toBe(true)
  })

  it('streak_21 badge counts down remaining', () => {
    const r = computeRewards(run(10, 0), NOW)
    const badge = r.badges.find((b) => b.id === 'streak_21')
    expect(badge?.earned).toBe(false)
    expect(badge?.remaining).toBe(11)
  })

  describe('gentle_mode badge', () => {
    it('not earned at 0 gentleMoves', () => {
      const r = computeRewards([], NOW, 0)
      const badge = r.badges.find((b) => b.id === 'gentle_mode')
      expect(badge?.earned).toBe(false)
    })

    it('not earned at 2 gentleMoves, remaining = 1', () => {
      const r = computeRewards([], NOW, 2)
      const badge = r.badges.find((b) => b.id === 'gentle_mode')
      expect(badge?.earned).toBe(false)
      expect(badge?.remaining).toBe(1)
    })

    it('earned at 3 gentleMoves', () => {
      const r = computeRewards([], NOW, 3)
      const badge = r.badges.find((b) => b.id === 'gentle_mode')
      expect(badge?.earned).toBe(true)
    })

    it('earned at 10 gentleMoves', () => {
      const r = computeRewards([], NOW, 10)
      const badge = r.badges.find((b) => b.id === 'gentle_mode')
      expect(badge?.earned).toBe(true)
    })
  })
})

describe('computeXP', () => {
  it('0 tasks → 0 XP', () => {
    expect(computeXP([], 0)).toBe(0)
  })

  it('1 done task (no pomodoros, no MIT) → 10 XP', () => {
    expect(computeXP([{ completedAt: NOW, pomodoros: 0 }], 0)).toBe(10)
  })

  it('MIT completion adds 5 XP per MIT', () => {
    expect(computeXP([{ completedAt: NOW, pomodoros: 0 }], 2)).toBe(20)
  })

  it('each pomodoro adds 5 XP', () => {
    expect(computeXP([{ completedAt: NOW, pomodoros: 3 }], 0)).toBe(25)
  })

  it('combined: 2 tasks, 1 MIT, 2 pomodoros total', () => {
    const tasks: CompletedTaskInfo[] = [
      { completedAt: NOW, pomodoros: 2 },
      { completedAt: NOW, pomodoros: 0 },
    ]
    // done(2)*10 + mit(1)*5 + pomodoros(2)*5 = 20 + 5 + 10 = 35
    expect(computeXP(tasks, 1)).toBe(35)
  })
})

describe('computeLevel', () => {
  it('level 1 at 0 XP', () => {
    expect(computeLevel(0)).toBe(1)
  })

  it('level 1 just below 100 XP', () => {
    expect(computeLevel(99)).toBe(1)
  })

  it('level 2 at 100 XP', () => {
    expect(computeLevel(100)).toBe(2)
  })

  it('level 3 at 400 XP', () => {
    expect(computeLevel(400)).toBe(3)
  })

  it('level 4 at 900 XP', () => {
    expect(computeLevel(900)).toBe(4)
  })

  it('level 10 at 8100 XP', () => {
    expect(computeLevel(8100)).toBe(10)
  })
})

describe('computeRewards xp + level fields', () => {
  it('xp = 0 and level = 1 with no completions', () => {
    const r = computeRewards([], NOW)
    expect(r.xp).toBe(0)
    expect(r.level).toBe(1)
  })

  it('xp counts done tasks', () => {
    const tasks = [td(daysAgo(0)), td(daysAgo(1))]
    const r = computeRewards(tasks, NOW)
    expect(r.xp).toBe(20)
  })

  it('xp includes pomodoros', () => {
    const tasks = [{ completedAt: daysAgo(0), pomodoros: 2 }]
    const r = computeRewards(tasks, NOW)
    // 10 + 2*5 = 20
    expect(r.xp).toBe(20)
  })

  it('xp includes MIT completions', () => {
    const tasks = [td(daysAgo(0))]
    const r = computeRewards(tasks, NOW, 0, 1)
    // 10 + 1*5 = 15
    expect(r.xp).toBe(15)
  })

  it('level advances when xp crosses threshold', () => {
    // Need 10 tasks to get 100 XP → level 2
    const tasks = Array.from({ length: 10 }, (_, i) => td(daysAgo(i)))
    const r = computeRewards(tasks, NOW)
    expect(r.xp).toBe(100)
    expect(r.level).toBe(2)
  })

  it('xp includes quest bonus', () => {
    const tasks = [td(daysAgo(0))]
    const r = computeRewards(tasks, NOW, 0, 0, 35)
    // 10 + 35 quest xp
    expect(r.xp).toBe(45)
  })

  it('quest bonus counts toward level', () => {
    // 5 tasks (50 xp) + 50 quest xp = 100 → level 2
    const tasks = Array.from({ length: 5 }, (_, i) => td(daysAgo(i)))
    const r = computeRewards(tasks, NOW, 0, 0, 50)
    expect(r.xp).toBe(100)
    expect(r.level).toBe(2)
  })
})

describe('computeRewards comebackDays', () => {
  it('is absent with no completions', () => {
    expect(computeRewards([], NOW).comebackDays).toBeUndefined()
  })

  it('is absent when last active yesterday', () => {
    expect(computeRewards([td(daysAgo(1))], NOW).comebackDays).toBeUndefined()
  })

  it('is absent after a single missed day', () => {
    expect(computeRewards([td(daysAgo(2))], NOW).comebackDays).toBeUndefined()
  })

  it('reports the gap when 2+ full days were missed', () => {
    expect(computeRewards([td(daysAgo(3))], NOW).comebackDays).toBe(2)
    expect(computeRewards([td(daysAgo(6))], NOW).comebackDays).toBe(5)
  })

  it('stays present on the return day after completing a task today', () => {
    const r = computeRewards([td(daysAgo(0)), td(daysAgo(4))], NOW)
    expect(r.comebackDays).toBe(3)
  })
})
