// Fires a local OS notification when the focus timer finishes. Uses the
// service worker registration when present (survives a backgrounded tab and is
// the only path that works on iOS), falling back to a page-context Notification.
// No-op when notifications are unsupported or permission was not granted —
// requesting permission stays the responsibility of the settings flow.
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
