import { supabase } from './supabase'

/**
 * Appel des routes API internes, avec le jeton de session attaché.
 *
 * Le pendant navigateur de lib/apiAuth.js : les routes IA exigent désormais un
 * en-tête « Authorization: Bearer <jeton> », et ce jeton doit venir de la
 * session Supabase en cours.
 *
 * POURQUOI UN HELPER PLUTÔT QUE DE LE FAIRE SUR PLACE
 * Il y a 18 sites d'appel répartis sur 8 pages. En recopier la logique 18 fois
 * garantit qu'un futur appel l'oubliera — et l'oubli ne se verrait qu'en
 * production, sous la forme d'un 401 sur une fonctionnalité qui marchait la
 * veille. Ici, l'oubli est impossible : on appelle apiFetch, le jeton suit.
 *
 * Le jeton est relu à CHAQUE appel, jamais mis en cache : supabase-js le
 * renouvelle en arrière-plan, et une copie gardée de côté serait périmée au
 * bout d'une heure — précisément pendant les longues sessions de révision, les
 * plus importantes à ne pas casser.
 */
export async function apiFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token

  const headers = { ...(options.headers || {}) }
  // Si la session a expiré, on part sans jeton et le serveur répond 401. C'est
  // volontaire : masquer l'expiration derrière un échec silencieux rendrait le
  // problème indéchiffrable pour l'utilisateur comme pour les logs.
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(url, { ...options, headers })
}

/**
 * Variante JSON : pose l'en-tête Content-Type et sérialise le corps.
 *
 * Les appels POST existants répétaient tous les deux mêmes lignes
 * (`headers: { 'Content-Type': 'application/json' }` et `JSON.stringify`).
 */
export async function apiPost(url, body, options = {}) {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(body),
  })
}
