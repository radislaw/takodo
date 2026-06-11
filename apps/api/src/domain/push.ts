import webpush from 'web-push'

export interface StoredSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export function initVapid(subject: string): void {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return
  webpush.setVapidDetails(subject, pub, priv)
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null
}

export function buildPushPayload(title: string, body: string, tag?: string): string {
  return JSON.stringify({ title, body, ...(tag ? { tag } : {}) })
}

/** Returns true on success, false when subscription is stale (410/404 → caller should delete). */
export async function sendPushToSubscription(
  sub: StoredSubscription,
  title: string,
  body: string,
  tag?: string,
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      buildPushPayload(title, body, tag),
    )
    return true
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 410 || code === 404) return false
    throw err
  }
}
