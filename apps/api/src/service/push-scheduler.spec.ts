import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { PrismaClient, User, PushSubscription } from '@prisma/client'

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('node-schedule', () => ({
  default: {
    scheduleJob: vi.fn((_, fn: () => void) => {
      return { cancel: vi.fn(), fn }
    }),
  },
}))

import { buildScheduler } from './push-scheduler.js'

const prisma = mockDeep<PrismaClient>()

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Аня',
    theme: 'light',
    gentleMoves: 0,
    notifMorning: true,
    notifEvening: true,
    createdAt: new Date(),
    gender: null,
    birthYear: null,
    city: null,
    adhdStatus: null,
    ...overrides,
  }
}

function makeSub(): PushSubscription {
  return {
    id: 'sub-1',
    userId: 'user-1',
    endpoint: 'https://push.example.com/sub/abc',
    p256dh: 'key',
    auth: 'auth',
    createdAt: new Date(),
  }
}

describe('buildScheduler', () => {
  beforeEach(() => {
    mockReset(prisma)
    vi.clearAllMocks()
    process.env.VAPID_PUBLIC_KEY = 'BFake'
    process.env.VAPID_PRIVATE_KEY = 'fake-private'
    // default: no subscriptions
    prisma.pushSubscription.findMany.mockResolvedValue([])
  })

  it('registers two jobs (morning and evening)', async () => {
    const schedule = (await import('node-schedule')).default
    buildScheduler(prisma)
    expect(schedule.scheduleJob).toHaveBeenCalledTimes(2)
  })

  it('returns a handle whose stop() cancels both jobs', async () => {
    const schedule = (await import('node-schedule')).default
    const handle = buildScheduler(prisma)
    handle.stop()
    const jobs = (schedule.scheduleJob as ReturnType<typeof vi.fn>).mock.results.map(
      (r) => r.value as { cancel: ReturnType<typeof vi.fn> },
    )
    expect(jobs).toHaveLength(2)
    for (const job of jobs) {
      expect(job.cancel).toHaveBeenCalled()
    }
  })

  it('sends morning push to users with notifMorning=true', async () => {
    const schedule = (await import('node-schedule')).default
    const webpush = (await import('web-push')).default

    prisma.user.findMany.mockResolvedValue([makeUser()])
    prisma.pushSubscription.findMany.mockResolvedValue([makeSub()])

    buildScheduler(prisma)

    const calls = (schedule.scheduleJob as ReturnType<typeof vi.fn>).mock.calls as Array<
      [string, () => Promise<void>]
    >
    await calls[0]![1]()

    expect(webpush.sendNotification).toHaveBeenCalledOnce()
  })

  it('sends no notifications when no users opted in', async () => {
    const schedule = (await import('node-schedule')).default
    const webpush = (await import('web-push')).default

    // DB returns empty (all users have notifMorning=false → filtered out by query)
    prisma.user.findMany.mockResolvedValue([])

    buildScheduler(prisma)

    const calls = (schedule.scheduleJob as ReturnType<typeof vi.fn>).mock.calls as Array<
      [string, () => Promise<void>]
    >
    await calls[0]![1]()

    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })

  it('survives a hard send failure and continues with the next user', async () => {
    const schedule = (await import('node-schedule')).default
    const webpush = (await import('web-push')).default
    const send = webpush.sendNotification as ReturnType<typeof vi.fn>
    const hardError = Object.assign(new Error('push service down'), { statusCode: 500 })
    send.mockRejectedValueOnce(hardError).mockRejectedValueOnce(hardError)

    prisma.user.findMany.mockResolvedValue([makeUser(), makeUser({ id: 'user-2' })])
    prisma.pushSubscription.findMany.mockResolvedValue([makeSub()])

    buildScheduler(prisma)

    const calls = (schedule.scheduleJob as ReturnType<typeof vi.fn>).mock.calls as Array<
      [string, () => Promise<void>]
    >
    // The job must not reject — an unhandled rejection here would crash the process.
    await expect(calls[0]![1]()).resolves.toBeUndefined()
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('does nothing when push is not configured', async () => {
    delete process.env.VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    const webpush = (await import('web-push')).default

    const schedule = (await import('node-schedule')).default
    buildScheduler(prisma)
    const calls = (schedule.scheduleJob as ReturnType<typeof vi.fn>).mock.calls as Array<
      [string, () => Promise<void>]
    >
    await calls[0]![1]()

    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })
})
