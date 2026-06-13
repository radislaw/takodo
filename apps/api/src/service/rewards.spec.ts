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
        notifMorning: true,
        notifEvening: true,
        gender: null,
        birthYear: null,
        city: null,
        adhdStatus: null,
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

    it('reports comebackDays after a 2+ day gap', async () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      prisma.task.findMany.mockResolvedValue([{ completedAt: fourDaysAgo, pomodoros: 0 } as never])
      prisma.dailyEntry.count.mockResolvedValue(0)
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      const body = res.json() as { comebackDays?: number }
      expect(body.comebackDays).toBe(3)
    })

    it('omits comebackDays when active yesterday', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      prisma.task.findMany.mockResolvedValue([{ completedAt: yesterday, pomodoros: 0 } as never])
      prisma.dailyEntry.count.mockResolvedValue(0)
      const res = await app.inject({ method: 'GET', url: '/rewards' })
      const body = res.json() as { comebackDays?: number }
      expect(body.comebackDays).toBeUndefined()
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

  describe('GET /rewards/heatmap', () => {
    it('returns weeks*7 cells and max (default 12 weeks)', async () => {
      prisma.task.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'GET', url: '/rewards/heatmap' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { days: unknown[]; max: number }
      expect(body.days).toHaveLength(84)
      expect(body.max).toBe(0)
    })

    it('respects the weeks query param', async () => {
      prisma.task.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'GET', url: '/rewards/heatmap?weeks=2' })
      const body = res.json() as { days: unknown[] }
      expect(body.days).toHaveLength(14)
    })

    it('counts tasks completed per day and reports max', async () => {
      const today = new Date()
      prisma.task.findMany.mockResolvedValue([
        { completedAt: today, pomodoros: 0 } as never,
        { completedAt: today, pomodoros: 0 } as never,
      ])
      const res = await app.inject({ method: 'GET', url: '/rewards/heatmap?weeks=2' })
      const body = res.json() as { days: { date: string; count: number }[]; max: number }
      const todayStr = today.toISOString().slice(0, 10)
      expect(body.days.find((d) => d.date === todayStr)?.count).toBe(2)
      expect(body.max).toBe(2)
    })

    it('rejects a date outside the ±1 day window', async () => {
      const res = await app.inject({ method: 'GET', url: '/rewards/heatmap?date=2020-01-01' })
      expect(res.statusCode).toBe(400)
    })

    it('clamps weeks to the allowed range', async () => {
      prisma.task.findMany.mockResolvedValue([])
      const res = await app.inject({ method: 'GET', url: '/rewards/heatmap?weeks=999' })
      const body = res.json() as { days: unknown[] }
      expect(body.days.length).toBeLessThanOrEqual(53 * 7)
    })
  })
})
