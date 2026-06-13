import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, Feedback } from '@prisma/client'
import { buildApp } from '../app.js'

const prisma = mockDeep<PrismaClient>()
const getUserId = vi.fn().mockResolvedValue('user-1')

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb-1',
    userId: 'user-1',
    kind: 'review',
    message: 'Отличное приложение',
    rating: 5,
    status: 'new',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('Feedback routes', () => {
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

  describe('POST /feedback', () => {
    it('persists feedback for the current user', async () => {
      prisma.feedback.create.mockResolvedValue(makeFeedback())
      const res = await app.inject({
        method: 'POST',
        url: '/feedback',
        payload: { kind: 'review', message: 'Отличное приложение', rating: 5 },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { id: string; kind: string; status: string; rating: number }
      expect(body.kind).toBe('review')
      expect(body.status).toBe('new')
      expect(body.rating).toBe(5)
      expect(prisma.feedback.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
      )
    })

    it('accepts a wish without rating', async () => {
      prisma.feedback.create.mockResolvedValue(
        makeFeedback({ kind: 'wish', message: 'Хочу тёмную тему', rating: null }),
      )
      const res = await app.inject({
        method: 'POST',
        url: '/feedback',
        payload: { kind: 'wish', message: 'Хочу тёмную тему' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as Record<string, unknown>
      expect(body.kind).toBe('wish')
      expect(body).not.toHaveProperty('rating')
    })

    it('rejects an unknown kind', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/feedback',
        payload: { kind: 'spam', message: 'привет' },
      })
      expect(res.statusCode).toBe(400)
      expect(prisma.feedback.create).not.toHaveBeenCalled()
    })

    it('rejects a message longer than 5000 chars (ajv)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/feedback',
        payload: { kind: 'support', message: 'a'.repeat(5001) },
      })
      expect(res.statusCode).toBe(400)
      expect(prisma.feedback.create).not.toHaveBeenCalled()
    })
  })
})
