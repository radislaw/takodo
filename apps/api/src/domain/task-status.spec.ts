import { describe, it, expect } from 'vitest'
import { bubbleUp, reopenTask } from './task-status.js'
import type { DomainTask } from './types.js'

const base: Omit<
  DomainTask,
  'id' | 'parentId' | 'title' | 'normalizedTitle' | 'status' | 'completedAt'
> = {
  resistanceResolved: false,
  createdAt: new Date('2024-01-01'),
}

function task(id: string, parentId: string | null, status: 'open' | 'done' = 'open'): DomainTask {
  return {
    ...base,
    id,
    parentId,
    title: id,
    normalizedTitle: id,
    status,
    completedAt: status === 'done' ? new Date() : null,
  }
}

describe('bubbleUp', () => {
  it('no-op when no parent', () => {
    const tasks = [task('a', null, 'done')]
    const result = bubbleUp(tasks, 'a')
    expect(result.find((t) => t.id === 'a')!.status).toBe('done')
    expect(result).toHaveLength(1)
  })

  it('parent stays open when sibling still open', () => {
    const tasks = [task('root', null), task('a', 'root', 'done'), task('b', 'root', 'open')]
    const result = bubbleUp(tasks, 'a')
    expect(result.find((t) => t.id === 'root')!.status).toBe('open')
  })

  it('parent becomes done when all children done', () => {
    const tasks = [task('root', null), task('a', 'root', 'done'), task('b', 'root', 'done')]
    const result = bubbleUp(tasks, 'a')
    expect(result.find((t) => t.id === 'root')!.status).toBe('done')
  })

  it('bubbles up recursively through multiple levels', () => {
    const tasks = [
      task('gp', null),
      task('parent', 'gp'),
      task('a', 'parent', 'done'),
      task('b', 'parent', 'done'),
    ]
    // after marking a done, all parent's children done → parent done → gp's only child done → gp done
    const result = bubbleUp(tasks, 'a')
    expect(result.find((t) => t.id === 'parent')!.status).toBe('done')
    expect(result.find((t) => t.id === 'gp')!.status).toBe('done')
  })

  it('returns new array (immutable)', () => {
    const tasks = [task('a', null, 'done')]
    const result = bubbleUp(tasks, 'a')
    expect(result).not.toBe(tasks)
  })
})

describe('reopenTask', () => {
  it('marks task as open', () => {
    const tasks = [task('a', null, 'done')]
    const result = reopenTask(tasks, 'a')
    expect(result.find((t) => t.id === 'a')!.status).toBe('open')
    expect(result.find((t) => t.id === 'a')!.completedAt).toBeNull()
  })

  it('recursively reopens all children', () => {
    const tasks = [task('a', null, 'done'), task('b', 'a', 'done'), task('c', 'b', 'done')]
    const result = reopenTask(tasks, 'a')
    expect(result.every((t) => t.status === 'open')).toBe(true)
  })

  it('only reopens subtree, not siblings', () => {
    const tasks = [task('root', null, 'done'), task('a', 'root', 'done'), task('b', 'root', 'done')]
    const result = reopenTask(tasks, 'a')
    expect(result.find((t) => t.id === 'a')!.status).toBe('open')
    expect(result.find((t) => t.id === 'b')!.status).toBe('done')
  })

  it('returns new array (immutable)', () => {
    const tasks = [task('a', null, 'done')]
    const result = reopenTask(tasks, 'a')
    expect(result).not.toBe(tasks)
  })
})
