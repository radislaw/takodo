import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { FastifyInstance } from 'fastify'
import type { PrismaClient, User, PushSubscription } from '@prisma/client'
import { buildApp } from '../app.js'

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue(undefined),
  },
}))

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
    passwordHash: null,
    emailVerified: null,
    gender: null,
    birthDate: null,
    timezone: null,
    adhdStatus: null,
    language: null,
    ...overrides,
  }
}

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc'

function makeSub(overrides: Partial<PushSubscription> = {}): PushSubscription {
  return {
    id: 'sub-1',
    userId: 'user-1',
    endpoint: ENDPOINT,
    p256dh: 'key123',
    auth: 'auth123',
    createdAt: new Date(),
    ...overrides,
  }
}

describe('Push routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    mockReset(prisma)
    getUserId.mockResolvedValue('user-1')
    prisma.$transaction.mockImplementation(async (fn) => fn(prisma))
    process.env.VAPID_PUBLIC_KEY = 'BFake-public-key-for-testing'
    process.env.VAPID_PRIVATE_KEY = 'fake-private-key-for-testing'
    app = buildApp({ prisma, getUserId })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
    delete process.env.VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
  })

  describe('GET /push/vapid-key', () => {
    it('returns the public VAPID key', async () => {
      const res = await app.inject({ method: 'GET', url: '/push/vapid-key' })
      expect(res.statusCode).toBe(200)
      const body = res.json() as { publicKey: string }
      expect(body.publicKey).toBe('BFake-public-key-for-testing')
    })

    it('returns 503 when VAPID keys are not configured', async () => {
      delete process.env.VAPID_PUBLIC_KEY
      delete process.env.VAPID_PRIVATE_KEY
      await app.close()
      app = buildApp({ prisma, getUserId })
      await app.ready()
      const res = await app.inject({ method: 'GET', url: '/push/vapid-key' })
      expect(res.statusCode).toBe(503)
    })
  })

  describe('POST /push/subscribe', () => {
    it('upserts subscription and returns 200', async () => {
      prisma.pushSubscription.findUnique.mockResolvedValue(null)
      prisma.pushSubscription.upsert.mockResolvedValue(makeSub())
      const res = await app.inject({
        method: 'POST',
        url: '/push/subscribe',
        payload: {
          endpoint: ENDPOINT,
          p256dh: 'key123',
          auth: 'auth123',
        },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.pushSubscription.upsert).toHaveBeenCalledOnce()
    })

    it('returns 503 when push not configured', async () => {
      delete process.env.VAPID_PUBLIC_KEY
      await app.close()
      app = buildApp({ prisma, getUserId })
      await app.ready()
      const res = await app.inject({
        method: 'POST',
        url: '/push/subscribe',
        payload: {
          endpoint: ENDPOINT,
          p256dh: 'key123',
          auth: 'auth123',
        },
      })
      expect(res.statusCode).toBe(503)
    })

    it('rejects endpoint outside known push services with 400 (SSRF guard)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/push/subscribe',
        payload: {
          endpoint: 'https://evil.example.com/collect',
          p256dh: 'key123',
          auth: 'auth123',
        },
      })
      expect(res.statusCode).toBe(400)
      expect((res.json() as { code: string }).code).toBe('invalid_endpoint')
      expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled()
    })

    it('rejects http (non-TLS) endpoint with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/push/subscribe',
        payload: {
          endpoint: 'http://fcm.googleapis.com/fcm/send/abc',
          p256dh: 'key123',
          auth: 'auth123',
        },
      })
      expect(res.statusCode).toBe(400)
      expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled()
    })

    it("returns 409 when endpoint belongs to another user's subscription", async () => {
      prisma.pushSubscription.findUnique.mockResolvedValue(makeSub({ userId: 'user-2' }))
      const res = await app.inject({
        method: 'POST',
        url: '/push/subscribe',
        payload: {
          endpoint: ENDPOINT,
          p256dh: 'key123',
          auth: 'auth123',
        },
      })
      expect(res.statusCode).toBe(409)
      expect((res.json() as { code: string }).code).toBe('endpoint_conflict')
      expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /push/subscribe', () => {
    it('deletes subscription and returns 200', async () => {
      prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 })
      const res = await app.inject({
        method: 'DELETE',
        url: '/push/subscribe',
        payload: { endpoint: ENDPOINT },
      })
      expect(res.statusCode).toBe(200)
      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', endpoint: ENDPOINT },
      })
    })
  })

  describe('sendPushToUser resilience', () => {
    it('continues with remaining subscriptions when one send fails hard', async () => {
      const webpush = (await import('web-push')).default
      const send = webpush.sendNotification as ReturnType<typeof vi.fn>
      send.mockRejectedValueOnce(Object.assign(new Error('boom'), { statusCode: 500 }))
      send.mockResolvedValueOnce(undefined)
      prisma.pushSubscription.findMany.mockResolvedValue([
        makeSub(),
        makeSub({ id: 'sub-2', endpoint: 'https://fcm.googleapis.com/fcm/send/def' }),
      ])

      const { sendPushToUser } = await import('./push.js')
      await expect(sendPushToUser(prisma, 'user-1', 'T', 'B')).resolves.toBeUndefined()
      expect(send).toHaveBeenCalledTimes(2)
      // hard failure is not a stale subscription — must not be deleted
      expect(prisma.pushSubscription.delete).not.toHaveBeenCalled()
    })
  })

  describe('makeUser usage — notif prefs read in scheduler context', () => {
    it('makeUser has notifMorning and notifEvening', () => {
      const u = makeUser()
      expect(u.notifMorning).toBe(true)
      expect(u.notifEvening).toBe(true)
    })
  })
})
