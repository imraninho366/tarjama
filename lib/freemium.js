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

const ADMIN_ID = 'cc0683b4-fdb3-4ddb-b157-f2669b99dee4'

export function isAdmin(userId) {
  return userId === ADMIN_ID
}

export async function checkPremiumServer(userId) {
  if (userId === ADMIN_ID) return true
  const { data, error } = await supabase.from('premium_users').select('id').eq('id', userId).single()
  if (error && error.code !== 'PGRST116') {
    console.error('checkPremiumServer error:', error.message)
    return false
  }
  return !!data
}

export async function grantPremium(userId, grantedBy) {
  if (grantedBy !== ADMIN_ID) return { error: 'Non autorisé' }
  const { error } = await supabase.from('premium_users').upsert(
    { id: userId, granted_by: grantedBy },
    { onConflict: 'id' }
  )
  return { error: error?.message || null }
}

export async function revokePremium(userId, revokedBy) {
  if (revokedBy !== ADMIN_ID) return { error: 'Non autorisé' }
  const { error } = await supabase.from('premium_users').delete().eq('id', userId)
  return { error: error?.message || null }
}
