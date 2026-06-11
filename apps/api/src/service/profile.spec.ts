import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, User } from '@prisma/client'
import { buildApp } from '../app.js'

const prisma = mockDeep<PrismaClient>()
const getUserId = vi.fn().mockResolvedValue('user-1')

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Аня',
    theme: 'light',
    gentleMoves: 0,
    notifMorning: true,
    notifEvening: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

/** Mock the aggregate-based level sources (no row scans). */
function mockLevelSources({ completedCount = 0, pomodoroSum = 0, mitCount = 0, questXp = 0 } = {}) {
  prisma.task.aggregate.mockResolvedValue({
    _count: { _all: completedCount },
    _sum: { pomodoros: pomodoroSum },
  } as never)
  prisma.dailyEntry.count.mockResolvedValue(mitCount)
  prisma.questClaim.aggregate.mockResolvedValue({ _sum: { xp: questXp } } as never)
}

describe('Profile routes', () => {
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

  describe('GET /me', () => {
    it('returns name and theme', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser())
      const res = await app.inject({ method: 'GET', url: '/me' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as {
        name: string
        theme: string
        notifMorning: boolean
        notifEvening: boolean
      }
      expect(body.name).toBe('Аня')
      expect(body.theme).toBe('light')
      expect(body.notifMorning).toBe(true)
      expect(body.notifEvening).toBe(true)
    })

    it('returns defaults when user has empty name', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser({ name: '', theme: 'light' }))
      const res = await app.inject({ method: 'GET', url: '/me' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { name: string; theme: string }
      expect(body.name).toBe('')
      expect(body.theme).toBe('light')
    })
  })

  describe('PATCH /me', () => {
    it('updates theme', async () => {
      // amoled unlocks at level 5 → 1600 xp → 160 completed tasks
      mockLevelSources({ completedCount: 160 })
      prisma.user.update.mockResolvedValue(makeUser({ theme: 'amoled' }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { theme: 'amoled' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { theme: string }
      expect(body.theme).toBe('amoled')
    })

    it('updates name', async () => {
      prisma.user.update.mockResolvedValue(makeUser({ name: 'Саша' }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { name: 'Саша' },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { name: string }
      expect(body.name).toBe('Саша')
    })
  })

  describe('PATCH /me theme unlocks', () => {
    it('rejects locked theme with 403 theme_locked', async () => {
      mockLevelSources({ completedCount: 0 }) // level 1
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { theme: 'cyberpunk' },
      })
      expect(res.statusCode).toBe(403)
      const body = res.json() as { code: string }
      expect(body.code).toBe('theme_locked')
      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('accepts theme when level is high enough', async () => {
      mockLevelSources({ completedCount: 10 }) // 100 xp → level 2
      prisma.user.update.mockResolvedValue(makeUser({ theme: 'lavender' }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { theme: 'lavender' },
      })
      expect(res.statusCode).toBe(200)
      expect((res.json() as { theme: string }).theme).toBe('lavender')
    })

    it('counts quest XP toward the unlock level (parity with rewards)', async () => {
      mockLevelSources({ completedCount: 0, questXp: 100 }) // 100 xp → level 2
      prisma.user.update.mockResolvedValue(makeUser({ theme: 'lavender' }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { theme: 'lavender' },
      })
      expect(res.statusCode).toBe(200)
    })

    it('computes level via aggregates, not row scans', async () => {
      mockLevelSources({ completedCount: 10 })
      prisma.user.update.mockResolvedValue(makeUser({ theme: 'lavender' }))
      await app.inject({ method: 'PATCH', url: '/me', payload: { theme: 'lavender' } })
      expect(prisma.task.aggregate).toHaveBeenCalledOnce()
      expect(prisma.task.findMany).not.toHaveBeenCalled()
    })

    it('accepts base theme without level queries', async () => {
      prisma.user.update.mockResolvedValue(makeUser({ theme: 'dark' }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { theme: 'dark' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.task.aggregate).not.toHaveBeenCalled()
      expect(prisma.dailyEntry.count).not.toHaveBeenCalled()
    })

    it('skips level check when only name is updated', async () => {
      prisma.user.update.mockResolvedValue(makeUser({ name: 'Лёша' }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { name: 'Лёша' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.task.aggregate).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /me notification prefs', () => {
    it('updates notifMorning to false', async () => {
      prisma.user.update.mockResolvedValue(makeUser({ notifMorning: false }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { notifMorning: false },
      })
      expect(res.statusCode).toBe(200)
      expect((res.json() as { notifMorning: boolean }).notifMorning).toBe(false)
    })

    it('updates notifEvening to false', async () => {
      prisma.user.update.mockResolvedValue(makeUser({ notifEvening: false }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { notifEvening: false },
      })
      expect(res.statusCode).toBe(200)
      expect((res.json() as { notifEvening: boolean }).notifEvening).toBe(false)
    })
  })
})
