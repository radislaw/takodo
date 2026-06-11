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

  // Static assets: cache first, populate on miss.
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
          return res
        }),
    ),
  )
})
