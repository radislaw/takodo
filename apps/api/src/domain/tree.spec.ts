import { describe, it, expect } from 'vitest'
import { assembleTree } from './tree.js'
import type { DomainTask } from './types.js'

const base: Omit<DomainTask, 'id' | 'parentId' | 'title' | 'normalizedTitle'> = {
  resistanceResolved: false,
  status: 'open',
  completedAt: null,
  createdAt: new Date('2024-01-01'),
}

function task(id: string, parentId: string | null, title = id): DomainTask {
  return { ...base, id, parentId, title, normalizedTitle: title.toLowerCase() }
}

describe('assembleTree', () => {
  it('returns empty array for empty input', () => {
    expect(assembleTree([])).toEqual([])
  })

  it('single root task has no children', () => {
    const result = assembleTree([task('a', null)])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('a')
    expect(result[0]!.children).toEqual([])
  })

  it('attaches child to parent', () => {
    const result = assembleTree([task('a', null), task('b', 'a')])
    expect(result).toHaveLength(1)
    expect(result[0]!.children).toHaveLength(1)
    expect(result[0]!.children[0]!.id).toBe('b')
  })

  it('handles multiple roots', () => {
    const result = assembleTree([task('a', null), task('b', null)])
    expect(result).toHaveLength(2)
  })

  it('handles deep tree (3 levels)', () => {
    const tasks = [task('a', null), task('b', 'a'), task('c', 'b')]
    const result = assembleTree(tasks)
    expect(result[0]!.children[0]!.children[0]!.id).toBe('c')
  })

  it('handles multiple children under one parent', () => {
    const tasks = [task('a', null), task('b', 'a'), task('c', 'a')]
    const result = assembleTree(tasks)
    expect(result[0]!.children).toHaveLength(2)
  })
})
