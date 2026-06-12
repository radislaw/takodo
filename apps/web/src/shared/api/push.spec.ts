import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

const api = vi.hoisted(() => ({
  GET: vi.fn(),
  POST: vi.fn(),
  DELETE: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  apiClient: { GET: api.GET, POST: api.POST, DELETE: api.DELETE },
}))

interface FakeSubscription {
  endpoint: string
  toJSON: () => PushSubscriptionJSON
  unsubscribe: ReturnType<typeof vi.fn>
}

function makeFakeSub(): FakeSubscription {
  return {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    toJSON: () => ({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: 'p', auth: 'a' },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  }
}

const pushManager = {
  getSubscription: vi.fn(),
  subscribe: vi.fn(),
}
const registration = { pushManager }

type Notifications = typeof import('./push') extends {
  useNotifications: () => infer T
}
  ? T
  : never

async function setup(): Promise<{ notif: Notifications; toastKey: () => string | null }> {
  vi.resetModules()
  const { useNotifications } = await import('./push')
  const { useErrorToast } = await import('@/shared/lib/useErrorToast')
  let notif!: Notifications
  let toast!: ReturnType<typeof useErrorToast>
  const app = createApp(
    defineComponent({
      setup() {
        toast = useErrorToast()
        toast.hideError()
        notif = useNotifications()
        return () => h('div')
      },
    }),
  )
  app.use(createPinia())
  app.use(PiniaColada, {})
  app.mount(document.createElement('div'))
  return { notif, toastKey: () => toast.key.value }
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    writable: true,
    value: {
      permission: 'granted',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    },
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: vi.fn().mockResolvedValue(registration),
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
    },
  })
  pushManager.getSubscription.mockResolvedValue(null)
  pushManager.subscribe.mockResolvedValue(makeFakeSub())
  api.GET.mockResolvedValue({ data: { publicKey: 'AAAA' } })
  api.POST.mockResolvedValue({ response: { status: 200 } })
  api.DELETE.mockResolvedValue({ response: { status: 200 } })
})

describe('useNotifications', () => {
  it('subscribes and reports isSubscribed on success', async () => {
    const { notif } = await setup()
    await notif.requestAndSubscribe()
    expect(api.POST).toHaveBeenCalledWith(
      '/push/subscribe',
      expect.objectContaining({
        body: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'p', auth: 'a' },
      }),
    )
    expect(notif.isSubscribed.value).toBe(true)
  })

  it('does not report subscribed when the server rejects the subscription', async () => {
    api.POST.mockResolvedValue({
      error: { code: 'endpoint_conflict', message: 'conflict' },
      response: { status: 409 },
    })
    const { notif, toastKey } = await setup()
    await notif.requestAndSubscribe()
    expect(notif.isSubscribed.value).toBe(false)
    expect(toastKey()).toBe('errors.saveFailed')
  })

  it('surfaces a toast instead of an unhandled rejection when browser subscribe fails', async () => {
    pushManager.subscribe.mockRejectedValue(new Error('boom'))
    const { notif, toastKey } = await setup()
    await expect(notif.requestAndSubscribe()).resolves.toBeUndefined()
    expect(notif.isSubscribed.value).toBe(false)
    expect(toastKey()).toBe('errors.saveFailed')
    expect(notif.isRequesting.value).toBe(false)
  })

  it('unsubscribes the browser and the server', async () => {
    const sub = makeFakeSub()
    pushManager.getSubscription.mockResolvedValue(sub)
    const { notif } = await setup()
    await notif.unsubscribe()
    expect(sub.unsubscribe).toHaveBeenCalled()
    expect(api.DELETE).toHaveBeenCalledWith(
      '/push/subscribe',
      expect.objectContaining({ body: { endpoint: sub.endpoint } }),
    )
    expect(notif.isSubscribed.value).toBe(false)
  })

  it('keeps isSubscribed and shows a toast when browser unsubscribe fails', async () => {
    const sub = makeFakeSub()
    sub.unsubscribe.mockRejectedValue(new Error('boom'))
    pushManager.getSubscription.mockResolvedValue(sub)
    const { notif, toastKey } = await setup()
    await notif.unsubscribe()
    expect(toastKey()).toBe('errors.saveFailed')
    expect(api.DELETE).not.toHaveBeenCalled()
  })
})
