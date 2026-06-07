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
    themeId: null,
    defaultTheme: 'default',
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
})
