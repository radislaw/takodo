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
