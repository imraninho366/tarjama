import { supabase } from './supabase'

/**
 * Droits d'accès.
 *
 * Tarjama est GRATUITE ET ILLIMITÉE pour tout le monde. Aucun quota, aucune
 * fonctionnalité payante, aucun appel au don — le bandeau « Soutenir Tarjama »
 * et les limites journalières (quiz 10/jour, indices 3/jour, tafsir 2/jour)
 * ont été retirés le 6 septembre 2026.
 *
 * Ne réintroduis pas de compteur d'usage ici : si une protection devient
 * nécessaire, elle doit vivre côté serveur (lib/rateLimit.js protège déjà les
 * routes API contre les abus), pas dans un localStorage que l'utilisateur peut
 * vider d'un clic.
 *
 * Ce qui reste ne sert qu'à la page /admin : la table `premium_users` permet
 * de marquer des comptes, sans aucun effet sur l'accès aux fonctionnalités.
 */

/**
 * Comptes administrateurs d'Imran.
 *
 * Il y en a deux parce qu'un même humain arrive par deux chemins : Supabase
 * crée un identifiant distinct pour la connexion email et pour la connexion
 * Google. Sans les deux, se connecter avec Google renvoie vers l'accueil.
 *
 * Ces identifiants figurent AUSSI dans les politiques RLS de la table
 * `suggestions`. Si tu en ajoutes un ici, ajoute-le également côté Supabase :
 * sinon l'admin verra la page mais aucune donnée.
 */
const ADMIN_IDS = [
  'cc0683b4-fdb3-4ddb-b157-f2669b99dee4', // compte email
  'efcffbac-7cc5-4b56-b46a-118e4e9e845f', // compte Google
]

export function isAdmin(userId) {
  return ADMIN_IDS.includes(userId)
}

export async function checkPremiumServer(userId) {
  if (isAdmin(userId)) return true
  const { data, error } = await supabase.from('premium_users').select('id').eq('id', userId).single()
  if (error && error.code !== 'PGRST116') {
    console.error('checkPremiumServer error:', error.message)
    return false
  }
  return !!data
}

export async function grantPremium(userId, grantedBy) {
  if (!isAdmin(grantedBy)) return { error: 'Non autorisé' }
  const { error } = await supabase.from('premium_users').upsert(
    { id: userId, granted_by: grantedBy },
    { onConflict: 'id' }
  )
  return { error: error?.message || null }
}

export async function revokePremium(userId, revokedBy) {
  if (!isAdmin(revokedBy)) return { error: 'Non autorisé' }
  const { error } = await supabase.from('premium_users').delete().eq('id', userId)
  return { error: error?.message || null }
}
