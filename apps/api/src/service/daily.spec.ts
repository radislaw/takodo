import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, DailyList, DailyEntry, Task } from '@prisma/client'
import { buildApp } from '../app.js'

const prisma = mockDeep<PrismaClient>()
const getUserId = vi.fn().mockResolvedValue('user-1')

function makeList(overrides: Partial<DailyList> = {}): DailyList {
  return {
    id: 'list-1',
    userId: 'user-1',
    date: new Date('2024-01-15T00:00:00.000Z'),
    note: null,
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
    ...overrides,
  }
}

function makeEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: 'entry-1',
    dailyListId: 'list-1',
    taskId: 'task-1',
    isMIT: false,
    order: 0,
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-1',
    parentId: null,
    title: 'Buy milk',
    note: null,
    resistanceResolved: false,
    estimateMinutes: null,
    status: 'open',
    category: null,
    completedAt: null,
    normalizedTitle: 'buy milk',
    focusSeconds: 0,
    pomodoros: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('Daily routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    mockReset(prisma)
    getUserId.mockResolvedValue('user-1')
    prisma.$transaction.mockImplementation(async (fn) => fn(prisma))
    app = buildApp({ prisma, getUserId })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /daily', () => {
    it('missing date → 400', async () => {
      const res = await app.inject({ method: 'POST', url: '/daily', payload: {} })
      expect(res.statusCode).toBe(400)
    })

    it('invalid date format → 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/daily',
        payload: { date: 'not-a-date' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('creates new daily list', async () => {
      prisma.dailyList.findUnique.mockResolvedValue(null)
      prisma.dailyList.create.mockResolvedValue(makeList())
      const res = await app.inject({
        method: 'POST',
        url: '/daily',
        payload: { date: '2024-01-15' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.dailyList.create).toHaveBeenCalled()
    })

    it('returns existing list if already created', async () => {
      prisma.dailyList.findUnique.mockResolvedValue(makeList())
      const res = await app.inject({
        method: 'POST',
        url: '/daily',
        payload: { date: '2024-01-15' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.dailyList.create).not.toHaveBeenCalled()
    })
  })

  describe('GET /daily/:date', () => {
    it('returns list with entries', async () => {
      const list = { ...makeList(), entries: [makeEntry()] }
      prisma.dailyList.findUnique.mockResolvedValue(
        list as Parameters<typeof prisma.dailyList.findUnique.mockResolvedValue>[0],
      )
      const res = await app.inject({ method: 'GET', url: '/daily/2024-01-15' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as Record<string, unknown>
      expect(Array.isArray(body.entries)).toBe(true)
    })

    it('returns 404 when not found', async () => {
      prisma.dailyList.findUnique.mockResolvedValue(null)
      const res = await app.inject({ method: 'GET', url: '/daily/2024-01-15' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /daily/:date/entries', () => {
    it('adds entry to existing list', async () => {
      const list = { ...makeList(), entries: [] }
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.dailyList.findUnique.mockResolvedValue(
        list as Parameters<typeof prisma.dailyList.findUnique.mockResolvedValue>[0],
      )
      prisma.dailyEntry.create.mockResolvedValue(makeEntry())
      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries',
        payload: { taskId: 'task-1' },
      })
      expect(res.statusCode).toBe(200)
    })

    it('always creates entry with isMIT=false regardless of current MIT count', async () => {
      const list = { ...makeList(), entries: [] }
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.dailyList.findUnique.mockResolvedValue(
        list as Parameters<typeof prisma.dailyList.findUnique.mockResolvedValue>[0],
      )
      prisma.dailyEntry.create.mockResolvedValue(makeEntry({ isMIT: false }))
      await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries',
        payload: { taskId: 'task-1' },
      })
      expect(prisma.dailyEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isMIT: false }) }),
      )
    })

    it('returns 404 when task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null)
      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries',
        payload: { taskId: 'missing' },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 404 when list not found', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.dailyList.findUnique.mockResolvedValue(null)
      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries',
        payload: { taskId: 'task-1' },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /daily/:date/entries/:entryId', () => {
    it('returns 204 on success', async () => {
      const list = { ...makeList(), entries: [makeEntry()] }
      prisma.dailyList.findUnique.mockResolvedValue(
        list as Parameters<typeof prisma.dailyList.findUnique.mockResolvedValue>[0],
      )
      prisma.dailyEntry.delete.mockResolvedValue(makeEntry())
      const res = await app.inject({ method: 'DELETE', url: '/daily/2024-01-15/entries/entry-1' })
      expect(res.statusCode).toBe(204)
    })

    it('returns 404 when entry not found', async () => {
      const list = { ...makeList(), entries: [] }
      prisma.dailyList.findUnique.mockResolvedValue(
        list as Parameters<typeof prisma.dailyList.findUnique.mockResolvedValue>[0],
      )
      const res = await app.inject({ method: 'DELETE', url: '/daily/2024-01-15/entries/missing' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /daily/:date/entries/:entryId/move-to-tomorrow', () => {
    it('returns 404 when entry not found', async () => {
      prisma.dailyList.findUnique.mockResolvedValue({ ...makeList(), entries: [] } as Parameters<
        typeof prisma.dailyList.findUnique.mockResolvedValue
      >[0])
      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries/entry-1/move-to-tomorrow',
      })
      expect(res.statusCode).toBe(404)
    })

    it('checks entry ownership inside the transaction (no TOCTOU window)', async () => {
      prisma.dailyList.findUnique.mockResolvedValue({ ...makeList(), entries: [] } as Parameters<
        typeof prisma.dailyList.findUnique.mockResolvedValue
      >[0])
      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries/entry-1/move-to-tomorrow',
      })
      expect(res.statusCode).toBe(404)
      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('moves entry atomically and returns new entry', async () => {
      prisma.dailyList.findUnique.mockResolvedValue({
        ...makeList(),
        entries: [makeEntry()],
      } as Parameters<typeof prisma.dailyList.findUnique.mockResolvedValue>[0])
      const tomorrowList = makeList({ id: 'list-2', date: new Date('2024-01-16T00:00:00.000Z') })
      prisma.dailyList.upsert.mockResolvedValue(tomorrowList)
      prisma.dailyEntry.findFirst.mockResolvedValue(null)
      const newEntry = makeEntry({ id: 'entry-2', dailyListId: 'list-2', order: 0 })
      prisma.dailyEntry.create.mockResolvedValue(newEntry)
      prisma.dailyEntry.delete.mockResolvedValue(makeEntry())
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'u@u.com',
        name: '',
        theme: 'light',
        createdAt: new Date(),
        gentleMoves: 1,
        notifMorning: true,
        notifEvening: true,
        passwordHash: null,
        emailVerified: null,
        gender: null,
        birthDate: null,
        timezone: null,
        adhdStatus: null,
        language: null,
      })

      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries/entry-1/move-to-tomorrow',
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { id: string; taskId: string; isMIT: boolean; order: number }
      expect(body.id).toBe('entry-2')
      expect(body.isMIT).toBe(false)
    })

    it('uses $transaction', async () => {
      prisma.dailyList.findUnique.mockResolvedValue({
        ...makeList(),
        entries: [makeEntry()],
      } as Parameters<typeof prisma.dailyList.findUnique.mockResolvedValue>[0])
      prisma.dailyList.upsert.mockResolvedValue(makeList({ id: 'list-2' }))
      prisma.dailyEntry.findFirst.mockResolvedValue(null)
      prisma.dailyEntry.create.mockResolvedValue(makeEntry({ id: 'entry-2' }))
      prisma.dailyEntry.delete.mockResolvedValue(makeEntry())
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'u@u.com',
        name: '',
        theme: 'light',
        createdAt: new Date(),
        gentleMoves: 1,
        notifMorning: true,
        notifEvening: true,
        passwordHash: null,
        emailVerified: null,
        gender: null,
        birthDate: null,
        timezone: null,
        adhdStatus: null,
        language: null,
      })

      await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries/entry-1/move-to-tomorrow',
      })
      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('increments gentleMoves on success', async () => {
      prisma.dailyList.findUnique.mockResolvedValue({
        ...makeList(),
        entries: [makeEntry()],
      } as Parameters<typeof prisma.dailyList.findUnique.mockResolvedValue>[0])
      prisma.dailyList.upsert.mockResolvedValue(makeList({ id: 'list-2' }))
      prisma.dailyEntry.findFirst.mockResolvedValue(null)
      prisma.dailyEntry.create.mockResolvedValue(makeEntry({ id: 'entry-2' }))
      prisma.dailyEntry.delete.mockResolvedValue(makeEntry())
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'u@u.com',
        name: '',
        theme: 'light',
        createdAt: new Date(),
        gentleMoves: 1,
        notifMorning: true,
        notifEvening: true,
        passwordHash: null,
        emailVerified: null,
        gender: null,
        birthDate: null,
        timezone: null,
        adhdStatus: null,
        language: null,
      })

      await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/entries/entry-1/move-to-tomorrow',
      })
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ gentleMoves: { increment: 1 } }),
        }),
      )
    })
  })

  describe('PUT /daily/:date/note', () => {
    it('upserts the day and stores the note', async () => {
      const updated = { ...makeList({ note: 'Good day' }), entries: [] }
      prisma.dailyList.upsert.mockResolvedValue(
        updated as Parameters<typeof prisma.dailyList.upsert.mockResolvedValue>[0],
      )
      const res = await app.inject({
        method: 'PUT',
        url: '/daily/2024-01-15/note',
        payload: { note: 'Good day' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { note: string; entries: unknown[] }
      expect(body.note).toBe('Good day')
      expect(prisma.dailyList.upsert).toHaveBeenCalled()
    })

    it('rejects a note over 5000 chars (contract maxLength)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/daily/2024-01-15/note',
        payload: { note: 'x'.repeat(5001) },
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /daily/:date/done', () => {
    it('creates a done task + entry on the day', async () => {
      prisma.dailyList.upsert.mockResolvedValue(makeList())
      prisma.dailyEntry.findFirst.mockResolvedValue(null)
      const doneTask = makeTask({ id: 'task-9', status: 'done', completedAt: new Date() })
      prisma.task.create.mockResolvedValue(doneTask)
      prisma.dailyEntry.create.mockResolvedValue(makeEntry({ id: 'entry-9', taskId: 'task-9' }))

      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/done',
        payload: { title: 'Washed the dishes' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { id: string; taskId: string }
      expect(body.taskId).toBe('task-9')
      // task persisted as already-done so it counts toward heatmap/XP
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'done', completedAt: expect.any(Date) }),
        }),
      )
    })

    it('uses $transaction', async () => {
      prisma.dailyList.upsert.mockResolvedValue(makeList())
      prisma.dailyEntry.findFirst.mockResolvedValue(null)
      prisma.task.create.mockResolvedValue(
        makeTask({ id: 'task-9', status: 'done', completedAt: new Date() }),
      )
      prisma.dailyEntry.create.mockResolvedValue(makeEntry({ id: 'entry-9', taskId: 'task-9' }))
      await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/done',
        payload: { title: 'Washed the dishes' },
      })
      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('rejects a title over 500 chars (contract maxLength)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/done',
        payload: { title: 'x'.repeat(501) },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejects an empty title', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/daily/2024-01-15/done',
        payload: {},
      })
      expect(res.statusCode).toBe(400)
    })
  })
})
