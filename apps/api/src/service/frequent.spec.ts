import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, Task, DailyList, DailyEntry } from '@prisma/client'
import { buildApp } from '../app.js'

const prisma = mockDeep<PrismaClient>()
const getUserId = vi.fn().mockResolvedValue('user-1')

function makeTask(id: string, normalizedTitle: string, status: 'open' | 'done' = 'open'): Task {
  return {
    id,
    userId: 'user-1',
    parentId: null,
    title: normalizedTitle,
    note: null,
    resistanceResolved: false,
    estimateMinutes: null,
    status,
    category: null,
    completedAt: null,
    normalizedTitle,
    focusSeconds: 0,
    pomodoros: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  }
}

function makeList(id: string, entries: DailyEntry[]): DailyList & { entries: DailyEntry[] } {
  return {
    id,
    userId: 'user-1',
    date: new Date(`2024-01-0${id.slice(-1)}T00:00:00Z`),
    note: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    entries,
  }
}

function makeEntry(taskId: string, dailyListId: string): DailyEntry {
  return { id: `e-${taskId}-${dailyListId}`, dailyListId, taskId, isMIT: false, order: 0 }
}

describe('GET /frequent', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    mockReset(prisma)
    getUserId.mockResolvedValue('user-1')
    app = buildApp({ prisma, getUserId })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns empty array when no data', async () => {
    prisma.task.findMany.mockResolvedValue([])
    prisma.dailyList.findMany.mockResolvedValue([])
    const res = await app.inject({ method: 'GET', url: '/frequent' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([])
  })

  it('returns frequent tasks matching minDays', async () => {
    const task = makeTask('t1', 'buy milk')
    prisma.task.findMany.mockResolvedValue([task])
    prisma.dailyList.findMany.mockResolvedValue([
      makeList('list1', [makeEntry('t1', 'list1')]),
      makeList('list2', [makeEntry('t1', 'list2')]),
    ] as Parameters<typeof prisma.dailyList.findMany.mockResolvedValue>[0])
    const res = await app.inject({ method: 'GET', url: '/frequent?minDays=2' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as Array<{ normalizedTitle: string; undoneDays: number }>
    expect(body).toHaveLength(1)
    expect(body[0]!.undoneDays).toBe(2)
  })

  it('filters out tasks below minDays', async () => {
    const task = makeTask('t1', 'buy milk')
    prisma.task.findMany.mockResolvedValue([task])
    prisma.dailyList.findMany.mockResolvedValue([
      makeList('list1', [makeEntry('t1', 'list1')]),
    ] as Parameters<typeof prisma.dailyList.findMany.mockResolvedValue>[0])
    const res = await app.inject({ method: 'GET', url: '/frequent?minDays=2' })
    expect(res.json()).toEqual([])
  })
})
