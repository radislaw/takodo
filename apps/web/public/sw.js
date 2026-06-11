const CACHE = 'tootoo-shell-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.add('/')))
})

self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
)

self.addEventListener('fetch', (e) => {
  // Skip cross-origin — API server lives on a different origin in production.
  if (!e.request.url.startsWith(self.location.origin)) return

  if (e.request.mode === 'navigate') {
    // SPA navigation: network first, fall back to cached shell.
    e.respondWith(fetch(e.request).catch(() => caches.match('/')))
    return
  }

  // Static assets: cache first, populate on miss. Never cache error responses —
  // a cached 404/500 would poison the asset until the cache version changes.
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, clone))
          }
          return res
        }),
    ),
  )
})

self.addEventListener('push', (e) => {
  if (!e.data) return
  let data
  try {
    data = e.data.json()
  } catch {
    data = { body: e.data.text() }
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'tootoo', {
      body: data.body || '',
      tag: data.tag,
      icon: '/logo.svg',
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => (list[0] ? list[0].focus() : self.clients.openWindow('/'))),
  )
})
