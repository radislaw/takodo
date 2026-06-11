import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue(undefined),
    generateVAPIDKeys: vi.fn().mockReturnValue({
      publicKey: 'fake-public',
      privateKey: 'fake-private',
    }),
  },
}))

import { buildPushPayload, sendPushToSubscription, type StoredSubscription } from './push.js'

const SUB: StoredSubscription = {
  endpoint: 'https://push.example.com/sub/abc',
  p256dh: 'dGVzdC1rZXk=',
  auth: 'dGVzdC1hdXRo',
}

describe('buildPushPayload', () => {
  it('serialises title and body', () => {
    const json = buildPushPayload('Hello', 'World')
    const parsed = JSON.parse(json) as { title: string; body: string }
    expect(parsed.title).toBe('Hello')
    expect(parsed.body).toBe('World')
  })

  it('includes tag when provided', () => {
    const json = buildPushPayload('T', 'B', 'morning')
    const parsed = JSON.parse(json) as { tag?: string }
    expect(parsed.tag).toBe('morning')
  })
})

describe('sendPushToSubscription', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls webpush.sendNotification with correct keys shape', async () => {
    const webpush = (await import('web-push')).default
    await sendPushToSubscription(SUB, 'Hello', 'Body')
    expect(webpush.sendNotification).toHaveBeenCalledOnce()
    const [sub] = (webpush.sendNotification as ReturnType<typeof vi.fn>).mock.calls[0] as [
      { endpoint: string; keys: { p256dh: string; auth: string } },
    ]
    expect(sub.endpoint).toBe(SUB.endpoint)
    expect(sub.keys.p256dh).toBe(SUB.p256dh)
    expect(sub.keys.auth).toBe(SUB.auth)
  })

  it('swallows 410 Gone errors silently (stale subscription)', async () => {
    const webpush = (await import('web-push')).default
    const err = Object.assign(new Error('Gone'), { statusCode: 410 })
    ;(webpush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err)
    await expect(sendPushToSubscription(SUB, 'T', 'B')).resolves.toBe(false)
  })

  it('swallows 404 Not Found errors (subscription deleted)', async () => {
    const webpush = (await import('web-push')).default
    const err = Object.assign(new Error('Not Found'), { statusCode: 404 })
    ;(webpush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err)
    await expect(sendPushToSubscription(SUB, 'T', 'B')).resolves.toBe(false)
  })

  it('returns true on success', async () => {
    const result = await sendPushToSubscription(SUB, 'Hello', 'Body')
    expect(result).toBe(true)
  })
})
