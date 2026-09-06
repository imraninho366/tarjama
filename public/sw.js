// Bump à chaque changement de stratégie : l'ancien cache est purgé à l'activation.
const CACHE_NAME = 'tarjama-v5'

/**
 * Coquille minimale, préchargée à l'installation.
 *
 * La version précédente préchargeait 22 pages HTML et 1,5 Mo de JSON — dont
 * quran_vocab.json à lui seul 1,2 Mo. Tout cela partait DÈS LA PREMIÈRE VISITE,
 * en concurrence avec le chargement de la page que le visiteur attendait, et
 * sur son forfait mobile. Quelqu'un qui ne faisait que lire la page d'accueil
 * téléchargeait le dictionnaire complet sans jamais l'ouvrir.
 *
 * Rien n'est perdu : le gestionnaire fetch met déjà en cache tout ce qui passe.
 * Les données sont donc mises en cache À LA PREMIÈRE UTILISATION RÉELLE, et
 * chaque page visitée devient consultable hors-ligne dès sa première visite.
 *
 * Contrepartie assumée : une page jamais visitée n'est pas consultable
 * hors-ligne. C'est le bon échange — personne ne consulte hors-ligne une page
 * qu'il n'a jamais ouverte.
 */
const STATIC_ASSETS = [
  '/',
  '/404',
  '/icon.svg',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // cache.addAll est ATOMIQUE : une seule des 26 ressources en échec, et
      // l'installation entière échouait — le service worker ne s'activait
      // jamais, donc aucun mode hors-ligne, et sans le moindre message.
      // Ici chaque ressource est indépendante : ce qui passe est gardé.
      Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn('[sw] préchargement ignoré pour', url, err.message)
          )
        )
      )
    )
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

/**
 * La requête rapporte-t-elle des DONNÉES, par opposition à un fichier ?
 *
 * La distinction qui compte pour le cache n'est pas « interne ou externe »
 * mais « immuable ou vivant ». Un fichier .js de Next.js porte un hash dans
 * son nom : son contenu ne changera jamais, le cache est sans risque. La
 * progression d'un utilisateur change à chaque verset traduit.
 *
 * Écrit en liste blanche plutôt qu'en liste noire : tout ce qui n'est pas
 * reconnu comme un fichier statique de notre propre domaine est traité comme
 * une donnée vivante. Une liste noire aurait laissé passer le prochain
 * service tiers, exactement comme celle-ci a laissé passer Supabase.
 */
function isDataRequest(request) {
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return true          // tout tiers
  if (url.pathname.startsWith('/api/')) return true             // nos routes
  if (url.pathname.startsWith('/_next/static/')) return false   // fichiers hashés
  // Fichiers du dossier public : reconnus a leur extension.
  return !/\.(js|css|json|png|jpe?g|svg|webp|ico|woff2?|ttf|mp3|webmanifest)$/i.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

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

  // Données vivantes (API interne, Supabase, tout tiers) : réseau d'abord.
  // Placé APRÈS le test des pages, qui a son propre repli hors-ligne.
  // Données vivantes : toujours le réseau d'abord, cache en secours hors-ligne.
  //
  // Le test ne portait que sur « /api/ », donc uniquement les routes internes.
  // Or Supabase répond sur xxx.supabase.co/rest/v1/… — aucun « /api/ » dans le
  // chemin. La progression, le profil et les suggestions de chaque utilisateur
  // tombaient donc dans la branche « cache d'abord » du bas, prévue pour les
  // fichiers JavaScript et les images, et y restaient FIGÉS indéfiniment.
  //
  // Constaté le 6 septembre 2026 : 8 réponses Supabase en cache, dont
  // /rest/v1/progress. Le profil affichait 7 versets là où la base en avait 8,
  // et le verset traduit le jour même n'apparaissait nulle part.
  //
  // C'est la même panne que celle corrigée le matin pour le HTML. La règle
  // sûre : ne servir depuis le cache en priorité QUE ce qui est immuable.
  if (isDataRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // On garde une copie pour le mode hors-ligne, mais elle ne sert
          // qu'en dernier recours, jamais tant que le réseau répond.
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Fichiers statiques de notre domaine UNIQUEMENT (voir isDataRequest) :
  // cache d'abord, sans risque car ils sont versionnés par un hash ou
  // immuables. Rien de vivant n'atteint cette branche.
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
