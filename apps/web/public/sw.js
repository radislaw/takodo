const CACHE = 'tootoo-shell-v1'
// The app may live under a subpath (GitHub Pages), so derive URLs from the SW scope.
const SCOPE = self.registration.scope
// The cache name never rotates between deploys, so hashed assets from old
// builds would accumulate forever — cap the cache and evict oldest-first.
const MAX_ASSET_ENTRIES = 60

async function putBounded(request, response) {
  const c = await caches.open(CACHE)
  await c.put(request, response)
  const keys = await c.keys()
  for (let i = 0; i < keys.length - MAX_ASSET_ENTRIES; i++) {
    await c.delete(keys[i])
  }
}

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SCOPE)))
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
    e.respondWith(fetch(e.request).catch(() => caches.match(SCOPE)))
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
            e.waitUntil(putBounded(e.request, clone))
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
      icon: SCOPE + 'logo.svg',
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => (list[0] ? list[0].focus() : self.clients.openWindow(SCOPE))),
  )
})
