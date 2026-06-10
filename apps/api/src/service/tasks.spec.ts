import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, Task } from '@prisma/client'
import { buildApp } from '../app.js'

const prisma = mockDeep<PrismaClient>()
const getUserId = vi.fn().mockResolvedValue('user-1')

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

describe('Tasks routes', () => {
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

  describe('GET /tasks', () => {
    it('returns task list', async () => {
      prisma.task.findMany.mockResolvedValue([makeTask()])
      const res = await app.inject({ method: 'GET', url: '/tasks' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as unknown[]
      expect(body).toHaveLength(1)
    })

    it('does not expose userId in response', async () => {
      prisma.task.findMany.mockResolvedValue([makeTask()])
      const res = await app.inject({ method: 'GET', url: '/tasks' })
      const [task] = res.json() as Record<string, unknown>[]
      expect(task).not.toHaveProperty('userId')
    })
  })

  describe('POST /tasks', () => {
    it('missing title → 400', async () => {
      const res = await app.inject({ method: 'POST', url: '/tasks', payload: {} })
      expect(res.statusCode).toBe(400)
    })

    it('creates task with normalizedTitle', async () => {
      const created = makeTask({ title: '  Buy  MILK  ', normalizedTitle: 'buy milk' })
      prisma.task.create.mockResolvedValue(created)
      const res = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: '  Buy  MILK  ' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ normalizedTitle: 'buy milk' }),
        }),
      )
    })

    it('returns created task without userId', async () => {
      prisma.task.create.mockResolvedValue(makeTask())
      const res = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Buy milk' },
      })
      expect(res.json() as Record<string, unknown>).not.toHaveProperty('userId')
    })

    it('reopens done parent when subtask created', async () => {
      const parent = makeTask({ id: 'parent-1', status: 'done', completedAt: new Date() })
      const newChild = makeTask({ id: 'child-1', parentId: 'parent-1' })
      prisma.task.findUnique.mockResolvedValue(parent)
      prisma.task.create.mockResolvedValue(newChild)
      prisma.task.findMany.mockResolvedValue([parent, newChild])
      prisma.task.updateMany.mockResolvedValue({ count: 1 })

      const res = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Sub task', parentId: 'parent-1' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.task.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['parent-1'] } },
          data: { status: 'open', completedAt: null },
        }),
      )
    })

    it('does not call updateMany when parent is already open', async () => {
      const parent = makeTask({ id: 'parent-1', status: 'open' })
      const newChild = makeTask({ id: 'child-1', parentId: 'parent-1' })
      prisma.task.findUnique.mockResolvedValue(parent)
      prisma.task.create.mockResolvedValue(newChild)
      prisma.task.findMany.mockResolvedValue([parent, newChild])

      const res = await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: 'Sub task', parentId: 'parent-1' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.task.updateMany).not.toHaveBeenCalled()
    })
  })

  describe('GET /tasks/:id', () => {
    it('returns task by id', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      const res = await app.inject({ method: 'GET', url: '/tasks/task-1' })
      expect(res.statusCode).toBe(200)
    })

    it('returns 404 when not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null)
      const res = await app.inject({ method: 'GET', url: '/tasks/missing' })
      expect(res.statusCode).toBe(404)
    })

    it('returns 404 when task belongs to different user', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask({ userId: 'other-user' }))
      const res = await app.inject({ method: 'GET', url: '/tasks/task-1' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('PATCH /tasks/:id', () => {
    it('updates normalizedTitle when title changes', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.task.update.mockResolvedValue(
        makeTask({ title: 'Buy oat milk', normalizedTitle: 'buy oat milk' }),
      )
      const res = await app.inject({
        method: 'PATCH',
        url: '/tasks/task-1',
        payload: { title: 'Buy oat milk' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ normalizedTitle: 'buy oat milk' }),
        }),
      )
    })

    it('returns 404 when not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null)
      const res = await app.inject({
        method: 'PATCH',
        url: '/tasks/missing',
        payload: { title: 'x' },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /tasks/:id', () => {
    it('returns 204 on success', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.task.delete.mockResolvedValue(makeTask())
      const res = await app.inject({ method: 'DELETE', url: '/tasks/task-1' })
      expect(res.statusCode).toBe(204)
    })

    it('returns 404 when not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null)
      const res = await app.inject({ method: 'DELETE', url: '/tasks/missing' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /tasks/:id/complete', () => {
    it('marks task done and returns it', async () => {
      const t = makeTask()
      prisma.task.findMany.mockResolvedValue([t])
      prisma.task.update.mockResolvedValue({ ...t, status: 'done', completedAt: new Date() })
      prisma.task.findUnique.mockResolvedValue({ ...t, status: 'done', completedAt: new Date() })
      const res = await app.inject({ method: 'POST', url: '/tasks/task-1/complete' })
      expect(res.statusCode).toBe(200)
      expect((res.json() as Record<string, unknown>).status).toBe('done')
    })

    it('returns 404 when not found', async () => {
      prisma.task.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'POST', url: '/tasks/missing/complete' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /tasks/:id/reopen', () => {
    it('reopens a done task', async () => {
      const t = makeTask({ status: 'done', completedAt: new Date() })
      prisma.task.findMany.mockResolvedValue([t])
      prisma.task.findUnique.mockResolvedValue({ ...t, status: 'open', completedAt: null })
      const res = await app.inject({ method: 'POST', url: '/tasks/task-1/reopen' })
      expect(res.statusCode).toBe(200)
    })

    it('returns 404 when not found', async () => {
      prisma.task.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'POST', url: '/tasks/missing/reopen' })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /tasks/:id/resolve-resistance', () => {
    it('sets resistanceResolved=true', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.task.update.mockResolvedValue(makeTask({ resistanceResolved: true }))
      const res = await app.inject({ method: 'POST', url: '/tasks/task-1/resolve-resistance' })
      expect(res.statusCode).toBe(200)
      expect((res.json() as Record<string, unknown>).resistanceResolved).toBe(true)
    })
  })

  describe('POST /tasks/:id/focus', () => {
    it('increments focusSeconds and returns updated task', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.task.update.mockResolvedValue(makeTask({ focusSeconds: 300 }))
      const res = await app.inject({
        method: 'POST',
        url: '/tasks/task-1/focus',
        payload: { seconds: 300 },
      })
      expect(res.statusCode).toBe(200)
      expect((res.json() as Record<string, unknown>).focusSeconds).toBe(300)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ focusSeconds: { increment: 300 } }),
        }),
      )
    })

    it('increments pomodoros when pomodoro=true', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.task.update.mockResolvedValue(makeTask({ focusSeconds: 1500, pomodoros: 1 }))
      const res = await app.inject({
        method: 'POST',
        url: '/tasks/task-1/focus',
        payload: { seconds: 1500, pomodoro: true },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            focusSeconds: { increment: 1500 },
            pomodoros: { increment: 1 },
          }),
        }),
      )
    })

    it('does not increment pomodoros when pomodoro is absent', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.task.update.mockResolvedValue(makeTask({ focusSeconds: 60 }))
      await app.inject({
        method: 'POST',
        url: '/tasks/task-1/focus',
        payload: { seconds: 60 },
      })
      const call = prisma.task.update.mock.calls[0]?.[0]
      expect(call?.data).not.toHaveProperty('pomodoros')
    })

    it('returns 404 when task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null)
      const res = await app.inject({
        method: 'POST',
        url: '/tasks/missing/focus',
        payload: { seconds: 60 },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 404 when task belongs to different user', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask({ userId: 'other' }))
      const res = await app.inject({
        method: 'POST',
        url: '/tasks/task-1/focus',
        payload: { seconds: 60 },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 when seconds is 0', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tasks/task-1/focus',
        payload: { seconds: 0 },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when seconds exceeds 7200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tasks/task-1/focus',
        payload: { seconds: 7201 },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when seconds is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/tasks/task-1/focus',
        payload: {},
      })
      expect(res.statusCode).toBe(400)
    })

    it('does not expose userId in response', async () => {
      prisma.task.findUnique.mockResolvedValue(makeTask())
      prisma.task.update.mockResolvedValue(makeTask({ focusSeconds: 60 }))
      const res = await app.inject({
        method: 'POST',
        url: '/tasks/task-1/focus',
        payload: { seconds: 60 },
      })
      expect(res.json() as Record<string, unknown>).not.toHaveProperty('userId')
    })
  })
})
