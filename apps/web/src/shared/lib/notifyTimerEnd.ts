// Requests notification permission if it has not been decided yet ('default').
// Called once when the user first starts the focus timer. Returns silently if
// notifications are unsupported or the user already made a decision.
export async function requestNotificationPermission(): Promise<void> {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'default') return
  try {
    await Notification.requestPermission()
  } catch {
    // Some older browsers use a callback API and may throw — ignore.
  }
}

// Fires a local OS notification when the focus timer finishes. Uses the
// service worker registration when present (survives a backgrounded tab and is
// the only path that works on iOS), falling back to a page-context Notification.
// No-op when notifications are unsupported or permission was not granted.
export async function notifyTimerEnd(title: string, body: string): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

  const options: NotificationOptions = { body, icon: '/logo.svg', tag: 'timer-end' }

  try {
    const registration = await navigator.serviceWorker?.getRegistration('/')
    if (registration) {
      await registration.showNotification(title, options)
      return
    }
    new Notification(title, options)
  } catch {
    // A backgrounded tab or a flaky push service must never surface an error —
    // the on-screen chime and ripple already confirm the timer ended.
  }
}
