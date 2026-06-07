import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { buildApp } from '../app.js'

const prisma = mockDeep<PrismaClient>()
const getUserId = vi.fn().mockResolvedValue('user-1')

describe('Rewards routes', () => {
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

  describe('GET /rewards', () => {
    it('returns rewards summary shape', async () => {
      prisma.task.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        streak: number
        longestStreak: number
        week: unknown[]
        badges: unknown[]
      }
      expect(typeof body.streak).toBe('number')
      expect(typeof body.longestStreak).toBe('number')
      expect(body.week).toHaveLength(7)
      expect(Array.isArray(body.badges)).toBe(true)
    })

    it('streak = 0 with no completions', async () => {
      prisma.task.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      const body = res.json() as { streak: number }
      expect(body.streak).toBe(0)
    })

    it('all badges present', async () => {
      prisma.task.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      const body = res.json() as { badges: { id: string }[] }
      const ids = body.badges.map((b) => b.id)
      expect(ids).toContain('first_step')
      expect(ids).toContain('streak_5')
      expect(ids).toContain('streak_7')
      expect(ids).toContain('gentle_mode')
    })
  })
})
