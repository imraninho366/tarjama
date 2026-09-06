// Bump à chaque changement de stratégie : l'ancien cache est purgé à l'activation.
const CACHE_NAME = 'tarjama-v3'

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

/**
 * Une page HTML est-elle demandée ?
 *
 * C'est LA distinction qui compte : les fichiers JS/CSS de Next.js portent un
 * hash dans leur nom, donc un nouveau déploiement produit de nouveaux noms et
 * le cache ne peut pas les périmer. Le HTML, lui, garde la même URL — le servir
 * depuis le cache en priorité fige l'utilisateur sur l'ancienne version.
 */
function isPageRequest(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Appels API : toujours le réseau d'abord, cache en secours hors-ligne.
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  // Pages HTML : réseau d'abord.
  //
  // L'ancienne version servait le HTML depuis le cache en priorité. Résultat :
  // tout visiteur déjà venu restait bloqué sur la version vue la première fois
  // et ne recevait plus aucune mise à jour — constaté le 6 septembre 2026, où
  // Chrome affichait une landing page périmée alors que Safari, sans cache,
  // montrait bien la version en ligne.
  if (isPageRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        // Hors-ligne : on ressert la dernière version connue, sinon l'accueil.
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    )
    return
  }

  // Reste (JS, CSS, images, JSON) : cache d'abord, sans risque car ces fichiers
  // sont soit versionnés par un hash, soit des données statiques.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
