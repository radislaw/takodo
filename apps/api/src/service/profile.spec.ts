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
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
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
      const body = res.json() as { name: string; theme: string }
      expect(body.name).toBe('Аня')
      expect(body.theme).toBe('light')
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
      prisma.task.findMany.mockResolvedValue(
        Array.from({ length: 160 }, () => ({
          completedAt: new Date('2026-06-01T10:00:00Z'),
          pomodoros: 0,
        })) as never,
      )
      prisma.dailyEntry.count.mockResolvedValue(0)
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
    function mockLevel(completedCount: number) {
      // level = floor(sqrt(xp/100)) + 1, xp = completedCount * 10
      prisma.task.findMany.mockResolvedValue(
        Array.from({ length: completedCount }, (_, i) => ({
          completedAt: new Date(`2026-06-0${(i % 9) + 1}T10:00:00Z`),
          pomodoros: 0,
        })) as never,
      )
      prisma.dailyEntry.count.mockResolvedValue(0)
    }

    it('rejects locked theme with 403 theme_locked', async () => {
      mockLevel(0) // level 1
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
      mockLevel(10) // 100 xp → level 2
      prisma.user.update.mockResolvedValue(makeUser({ theme: 'lavender' }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { theme: 'lavender' },
      })
      expect(res.statusCode).toBe(200)
      expect((res.json() as { theme: string }).theme).toBe('lavender')
    })

    it('accepts base theme without level queries', async () => {
      prisma.user.update.mockResolvedValue(makeUser({ theme: 'dark' }))
      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        payload: { theme: 'dark' },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.task.findMany).not.toHaveBeenCalled()
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
      expect(prisma.task.findMany).not.toHaveBeenCalled()
    })
  })
})
