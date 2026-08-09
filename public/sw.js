const CACHE = 'wander-eire-shell-v3'
const ASSET_CACHE = 'wander-eire-assets-v1'
const RUNTIME_CACHE_LIMIT = 50
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

const trimCache = async (cache, limit) => {
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((request) => cache.delete(request)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== ASSET_CACHE).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  const isHashedAsset = new URL(event.request.url).pathname.startsWith('/assets/')
  if (isHashedAsset) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) => cache.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response.ok) event.waitUntil(cache.put(event.request, response.clone()))
        return response
      })))
    )
    return
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) event.waitUntil(caches.open(CACHE).then(async (cache) => {
          await cache.put(event.request, response.clone())
          await trimCache(cache, RUNTIME_CACHE_LIMIT)
        }))
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => {
        if (cached) return cached
        if (event.request.mode === 'navigate') return caches.match('/')
        return Response.error()
      }))
  )
})
