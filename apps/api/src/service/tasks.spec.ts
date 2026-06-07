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
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('Tasks routes', () => {
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
})
