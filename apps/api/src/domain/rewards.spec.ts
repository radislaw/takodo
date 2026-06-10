import { describe, it, expect } from 'vitest'
import { computeRewards } from './rewards.js'

const NOW = new Date('2024-06-05T12:00:00Z') // Wednesday

function daysAgo(n: number): Date {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() - n)
  return d
}

describe('computeRewards', () => {
  it('streak = 0 with no completions', () => {
    const r = computeRewards([], NOW)
    expect(r.streak).toBe(0)
    expect(r.longestStreak).toBe(0)
  })

  it('streak counts consecutive days ending today', () => {
    const dates = [daysAgo(0), daysAgo(1), daysAgo(2)]
    const r = computeRewards(dates, NOW)
    expect(r.streak).toBe(3)
  })

  it('streak falls back to yesterday if today has no completion', () => {
    const dates = [daysAgo(1), daysAgo(2)]
    const r = computeRewards(dates, NOW)
    expect(r.streak).toBe(2)
  })

  it('streak breaks on gap', () => {
    const dates = [daysAgo(0), daysAgo(2)]
    const r = computeRewards(dates, NOW)
    expect(r.streak).toBe(1)
  })

  it('longestStreak is max of all runs', () => {
    // run of 4 in the past, current streak of 1
    const dates = [daysAgo(0), daysAgo(10), daysAgo(11), daysAgo(12), daysAgo(13)]
    const r = computeRewards(dates, NOW)
    expect(r.longestStreak).toBe(4)
    expect(r.streak).toBe(1)
  })

  it('week has 7 entries, Monday-first', () => {
    const r = computeRewards([], NOW)
    expect(r.week).toHaveLength(7)
    expect(r.week[0]!.date).toBe('2024-06-03') // Monday of the week containing 2024-06-05
    expect(r.week[6]!.date).toBe('2024-06-09') // Sunday
  })

  it('week marks active days', () => {
    const r = computeRewards([NOW], NOW)
    const today = r.week.find((d) => d.date === '2024-06-05')
    expect(today!.active).toBe(true)
    expect(r.week.filter((d) => d.active)).toHaveLength(1)
  })

  it('first_step badge earned after first completion', () => {
    const r = computeRewards([daysAgo(0)], NOW)
    expect(r.badges.find((b) => b.id === 'first_step')?.earned).toBe(true)
  })

  it('first_step badge not earned with no completions', () => {
    const r = computeRewards([], NOW)
    expect(r.badges.find((b) => b.id === 'first_step')?.earned).toBe(false)
  })

  it('streak_5 badge earned when longestStreak >= 5', () => {
    const dates = Array.from({ length: 5 }, (_, i) => daysAgo(i))
    const r = computeRewards(dates, NOW)
    expect(r.badges.find((b) => b.id === 'streak_5')?.earned).toBe(true)
  })

  it('streak_5 remaining counts down from current streak', () => {
    const dates = [daysAgo(0), daysAgo(1)] // streak = 2
    const r = computeRewards(dates, NOW)
    const badge = r.badges.find((b) => b.id === 'streak_5')
    expect(badge?.earned).toBe(false)
    expect(badge?.remaining).toBe(3)
  })

  it('deduplicates multiple completions on same day', () => {
    const sameDay = [
      new Date('2024-06-05T08:00:00Z'),
      new Date('2024-06-05T14:00:00Z'),
      new Date('2024-06-05T20:00:00Z'),
    ]
    const r = computeRewards(sameDay, NOW)
    expect(r.streak).toBe(1)
  })
})

describe('streak shields', () => {
  /** Active streak run of `len` days ending `endAgo` days ago. */
  function run(len: number, endAgo: number): Date[] {
    return Array.from({ length: len }, (_, i) => daysAgo(endAgo + i))
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
    // 5 active days, then gap yesterday... wait: days 6..2 active, day 1 gap, day 0 active
    const dates = [...run(5, 2), daysAgo(0)]
    const r = computeRewards(dates, NOW)
    expect(r.streak).toBe(6)
    expect(r.shields).toBe(0)
    expect(r.shieldUsedRecently).toBe(true)
  })

  it('2-day gap with 2 shields preserves streak', () => {
    // 10 active days → 2 shields, then 2-day gap, then today active
    const dates = [...run(10, 3), daysAgo(0)]
    const r = computeRewards(dates, NOW)
    expect(r.streak).toBe(11)
    expect(r.shields).toBe(0)
  })

  it('3-day gap breaks streak even with 2 shields', () => {
    const dates = [...run(10, 4), daysAgo(0)]
    const r = computeRewards(dates, NOW)
    expect(r.streak).toBe(1)
    expect(r.shields).toBe(0)
  })

  it('gap with no shields resets streak', () => {
    const dates = [...run(3, 2), daysAgo(0)]
    const r = computeRewards(dates, NOW)
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
    // 5 active (1 shield), gap (consume, not counted), 5 more active → 10th active day re-earns
    const dates = [...run(5, 6), ...run(5, 0)]
    const r = computeRewards(dates, NOW)
    expect(r.streak).toBe(10)
    expect(r.shields).toBe(1)
  })

  it('week marks shielded days', () => {
    // NOW = Wed 2024-06-05; Tue gap covered by shield earned in prior 5-day run
    const dates = [...run(5, 2), daysAgo(0)]
    const r = computeRewards(dates, NOW)
    const tue = r.week.find((d) => d.date === '2024-06-04')
    expect(tue?.active).toBe(false)
    expect(tue?.shielded).toBe(true)
  })

  it('shieldUsedRecently false when shield used more than 7 days ago', () => {
    // shield consumed 10 days ago, streak continues since
    const dates = [...run(5, 11), ...run(10, 0)]
    const r = computeRewards(dates, NOW)
    expect(r.streak).toBe(15)
    expect(r.shieldUsedRecently).toBe(false)
  })

  it('longestStreak counts shielded runs as continuous', () => {
    const dates = [...run(5, 2), daysAgo(0)] // 6-day shielded run
    const r = computeRewards(dates, NOW)
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
