import { describe, it, expect } from 'vitest'
import { aggregateFrequent } from './frequent.js'
import type { DomainTask, DomainDailyEntry } from './types.js'

const base: Omit<
  DomainTask,
  'id' | 'parentId' | 'title' | 'normalizedTitle' | 'status' | 'completedAt'
> = {
  resistanceResolved: false,
  createdAt: new Date('2024-01-01'),
}

function task(id: string, normalizedTitle: string, status: 'open' | 'done' = 'open'): DomainTask {
  return {
    ...base,
    id,
    parentId: null,
    title: normalizedTitle,
    normalizedTitle,
    status,
    completedAt: null,
  }
}

function entry(taskId: string, dailyListId: string): DomainDailyEntry {
  return { taskId, dailyListId }
}

describe('aggregateFrequent', () => {
  it('returns empty for no entries', () => {
    expect(aggregateFrequent([], [], 1)).toEqual([])
  })

  it('returns empty when all matching tasks are done', () => {
    const tasks = [task('t1', 'buy milk', 'done')]
    const entries = [entry('t1', 'day1')]
    expect(aggregateFrequent(entries, tasks, 1)).toEqual([])
  })

  it('counts distinct daily lists where task was open', () => {
    const tasks = [task('t1', 'buy milk')]
    const entries = [entry('t1', 'day1'), entry('t1', 'day2'), entry('t1', 'day3')]
    const result = aggregateFrequent(entries, tasks, 1)
    expect(result).toHaveLength(1)
    expect(result[0]!.undoneDays).toBe(3)
  })

  it('matches tasks by normalizedTitle across different task IDs', () => {
    // Two different task instances with same normalizedTitle (split/recreated)
    const tasks = [task('t1', 'buy milk', 'done'), task('t2', 'buy milk', 'open')]
    const entries = [entry('t1', 'day1'), entry('t2', 'day2')]
    const result = aggregateFrequent(entries, tasks, 1)
    // day1: t1 done (not counted), day2: t2 open (counted)
    expect(result[0]!.undoneDays).toBe(1)
  })

  it('does not double-count same daily list', () => {
    const tasks = [task('t1', 'buy milk')]
    // two entries in the same dailyListId
    const entries = [entry('t1', 'day1'), entry('t1', 'day1')]
    const result = aggregateFrequent(entries, tasks, 1)
    expect(result[0]!.undoneDays).toBe(1)
  })

  it('filters by minDays', () => {
    const tasks = [task('t1', 'buy milk'), task('t2', 'wash car')]
    const milkEntries = [entry('t1', 'd1'), entry('t1', 'd2'), entry('t1', 'd3')]
    const carEntries = [entry('t2', 'd1')]
    const result = aggregateFrequent([...milkEntries, ...carEntries], tasks, 2)
    expect(result).toHaveLength(1)
    expect(result[0]!.normalizedTitle).toBe('buy milk')
  })

  it('returns correct shape', () => {
    const tasks = [task('t1', 'buy milk')]
    const entries = [entry('t1', 'day1')]
    const result = aggregateFrequent(entries, tasks, 1)
    expect(result[0]).toMatchObject({
      normalizedTitle: 'buy milk',
      title: 'buy milk',
      undoneDays: 1,
    })
  })
})
