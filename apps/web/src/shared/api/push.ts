import { ref, computed } from 'vue'
import { useMutation } from '@pinia/colada'
import { apiClient } from '@/api/client'
import { useErrorToast } from '@/shared/lib/useErrorToast'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

const permissionState = ref<PermissionState>(
  'Notification' in window ? (Notification.permission as PermissionState) : 'unsupported',
)
const isSubscribed = ref(false)

// Sync subscription state from browser on first load.
if ('serviceWorker' in navigator && permissionState.value === 'granted') {
  navigator.serviceWorker
    .getRegistration('/')
    .then((reg) => reg?.pushManager.getSubscription())
    .then((sub) => {
      isSubscribed.value = !!sub
    })
    .catch(() => undefined)
}

async function getVapidPublicKey(): Promise<string | null> {
  const { data, error } = await apiClient.GET('/push/vapid-key')
  if (error) return null
  return data.publicKey
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const output = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return buffer
}

export function useNotifications() {
  const isSupported = computed(() => permissionState.value !== 'unsupported')
  const isBlocked = computed(() => permissionState.value === 'denied')
  const isRequesting = ref(false)
  const { showError } = useErrorToast()

  // openapi-fetch never throws on 4xx/5xx — the {error} field must be checked,
  // otherwise a rejected subscription would still look "subscribed" in the UI.
  const { mutateAsync: mutateSubscribe } = useMutation({
    mutation: async (sub: PushSubscriptionJSON) => {
      if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys.auth) throw new Error('invalid sub')
      const { error } = await apiClient.POST('/push/subscribe', {
        body: {
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      })
      if (error) throw new Error(error.message)
    },
  })

  const { mutateAsync: mutateUnsubscribe } = useMutation({
    mutation: async (endpoint: string) => {
      const { error } = await apiClient.DELETE('/push/subscribe', { body: { endpoint } })
      if (error) throw new Error(error.message)
    },
  })

  async function requestAndSubscribe(): Promise<void> {
    if (!isSupported.value || isBlocked.value) return
    isRequesting.value = true
    try {
      const permission = await Notification.requestPermission()
      permissionState.value = permission as PermissionState
      if (permission !== 'granted') return

      const publicKey = await getVapidPublicKey()
      if (!publicKey) {
        showError('errors.saveFailed')
        return
      }

      let registration = await navigator.serviceWorker.getRegistration('/')
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      await mutateSubscribe(subscription.toJSON())
      isSubscribed.value = true
    } catch {
      showError('errors.saveFailed')
    } finally {
      isRequesting.value = false
    }
  }

  async function unsubscribe(): Promise<void> {
    const registration = await navigator.serviceWorker.getRegistration('/')
    if (!registration) return
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      isSubscribed.value = false
      return
    }
    const endpoint = subscription.endpoint
    try {
      await subscription.unsubscribe()
    } catch {
      // Browser still holds the subscription — state unchanged.
      showError('errors.saveFailed')
      return
    }
    isSubscribed.value = false
    // Server cleanup is best-effort: a missed delete self-heals when the
    // push service answers 410 and the server drops the stale row.
    await mutateUnsubscribe(endpoint).catch(() => undefined)
  }

  return {
    permissionState,
    isSupported,
    isBlocked,
    isSubscribed,
    isRequesting,
    requestAndSubscribe,
    unsubscribe,
  }
}
