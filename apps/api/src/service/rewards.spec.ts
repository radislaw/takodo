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
    prisma.questClaim.aggregate.mockResolvedValue({ _sum: { xp: null } } as never)
    app = buildApp({ prisma, getUserId })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /rewards', () => {
    it('returns rewards summary shape', async () => {
      prisma.task.findMany.mockResolvedValue([])
      prisma.dailyEntry.count.mockResolvedValue(0)
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        streak: number
        longestStreak: number
        week: unknown[]
        badges: unknown[]
        xp: number
        level: number
      }
      expect(typeof body.streak).toBe('number')
      expect(typeof body.longestStreak).toBe('number')
      expect(body.week).toHaveLength(7)
      expect(Array.isArray(body.badges)).toBe(true)
      expect(typeof body.xp).toBe('number')
      expect(typeof body.level).toBe('number')
    })

    it('streak = 0 with no completions', async () => {
      prisma.task.findMany.mockResolvedValue([])
      prisma.dailyEntry.count.mockResolvedValue(0)
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      const body = res.json() as { streak: number }
      expect(body.streak).toBe(0)
    })

    it('all badges present', async () => {
      prisma.task.findMany.mockResolvedValue([])
      prisma.dailyEntry.count.mockResolvedValue(0)
      prisma.user.findUnique.mockResolvedValue(null)
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      const body = res.json() as { badges: { id: string }[] }
      const ids = body.badges.map((b) => b.id)
      expect(ids).toContain('first_step')
      expect(ids).toContain('streak_5')
      expect(ids).toContain('streak_7')
      expect(ids).toContain('gentle_mode')
    })

    it('gentle_mode badge earned when user has >= 3 gentleMoves', async () => {
      prisma.task.findMany.mockResolvedValue([])
      prisma.dailyEntry.count.mockResolvedValue(0)
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'u@u.com',
        name: '',
        theme: 'light',
        createdAt: new Date(),
        gentleMoves: 3,
      })
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      const body = res.json() as { badges: { id: string; earned: boolean }[] }
      expect(body.badges.find((b) => b.id === 'gentle_mode')?.earned).toBe(true)
    })

    it('xp = 0 and level = 1 with no completions', async () => {
      prisma.task.findMany.mockResolvedValue([])
      prisma.dailyEntry.count.mockResolvedValue(0)
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      const body = res.json() as { xp: number; level: number }
      expect(body.xp).toBe(0)
      expect(body.level).toBe(1)
    })

    it('xp counts completed tasks and pomodoros', async () => {
      prisma.task.findMany.mockResolvedValue([
        { completedAt: new Date(), pomodoros: 2 } as never,
        { completedAt: new Date(), pomodoros: 0 } as never,
      ])
      prisma.dailyEntry.count.mockResolvedValue(1)
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      // 2 done * 10 + 1 MIT * 5 + 2 pomodoros * 5 = 35
      const body = res.json() as { xp: number }
      expect(body.xp).toBe(35)
    })

    it('xp includes claimed quest bonus', async () => {
      prisma.task.findMany.mockResolvedValue([{ completedAt: new Date(), pomodoros: 0 } as never])
      prisma.dailyEntry.count.mockResolvedValue(0)
      prisma.questClaim.aggregate.mockResolvedValue({ _sum: { xp: 45 } } as never)
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      // 1 done * 10 + 45 quest xp = 55
      const body = res.json() as { xp: number }
      expect(body.xp).toBe(55)
    })
  })
})
