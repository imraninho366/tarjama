const CACHE_NAME = 'tarjama-v2'
const STATIC_ASSETS = [
  '/',
  '/quiz',
  '/dictionnaire',
  '/alphabet',
  '/duas',
  '/piliers',
  '/prophetes',
  '/hadith',
  '/profil',
  '/prieres',
  
  '/dhikr',
  '/savant',
  '/humeur',
  '/duel',
  '/connexions',
  '/revelation',
  '/racines',
  '/parcours',
  '/calligraphie',
  '/tajweed',
  '/mentions-legales',
  '/404',
  '/quran_vocab.json',
  '/duas.json',
  '/piliers.json',
  '/prophetes.json',
  '/icon.svg',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // API calls: network-first
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => {
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/')
        }
      })
    })
  )
})
