import { supabase } from './supabase'
import { isAdmin } from './freemium'

/**
 * Authentification des routes API.
 *
 * POURQUOI CE FICHIER EXISTE
 * Les 11 routes IA de Tarjama étaient ouvertes à tout le monde. N'importe qui
 * connaissant l'URL pouvait boucler sur /api/savant et vider le quota IA de la
 * journée en quelques minutes — sans compte, sans laisser de trace, et sans
 * que personne s'en aperçoive avant que l'app tombe pour les vrais
 * utilisateurs.
 *
 * lib/rateLimit.js ne protégeait pas de ça : son compteur vit dans la mémoire
 * d'une instance serverless, et Vercel en crée autant qu'il en faut. Changer
 * d'instance remet le compteur à zéro. C'est un garde-fou contre le clic
 * frénétique, pas contre l'abus.
 *
 * PRINCIPE
 * Le navigateur est déjà connecté à Supabase : il possède un jeton d'accès
 * (JWT) à durée de vie courte. On le fait suivre dans l'en-tête Authorization,
 * et le serveur le fait valider PAR Supabase. Aucune nouvelle variable
 * d'environnement, aucun secret supplémentaire à gérer.
 *
 * On délègue la vérification à Supabase plutôt que de vérifier la signature
 * nous-mêmes : c'est un aller-retour réseau de plus (~100 ms), mais un jeton
 * révoqué — déconnexion, mot de passe changé, compte supprimé — est refusé
 * immédiatement, alors qu'une vérification locale l'accepterait jusqu'à son
 * expiration.
 */

function extractToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token || null
}

/**
 * Exige un utilisateur connecté.
 *
 * Répond 401 et renvoie null si le jeton est absent ou invalide : l'appelant
 * doit donc TOUJOURS tester le retour et s'arrêter là.
 *
 *   const user = await requireUser(req, res)
 *   if (!user) return
 *
 * @returns {Promise<object|null>} l'utilisateur Supabase, ou null
 */
export async function requireUser(req, res) {
  const token = extractToken(req)

  if (!token) {
    res.status(401).json({ error: 'Connecte-toi pour utiliser cette fonctionnalité.' })
    return null
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    // Le message reste volontairement proche de celui du jeton absent :
    // distinguer finement « pas de jeton » de « jeton invalide » n'aide que
    // celui qui cherche à en fabriquer un.
    console.warn('[auth] jeton refusé:', error?.message || 'utilisateur introuvable')
    res.status(401).json({ error: 'Session expirée. Reconnecte-toi.' })
    return null
  }

  return data.user
}

/**
 * Exige un administrateur.
 *
 * Pour les routes qui coûtent cher ou exposent l'infrastructure :
 * /api/gen-vocab (3000 tokens par appel) et /api/ai-status (qui sollicite TOUS
 * les fournisseurs à chaque appel, y compris ceux dont le quota est précieux).
 *
 * @returns {Promise<object|null>} l'utilisateur admin, ou null
 */
export async function requireAdmin(req, res) {
  const user = await requireUser(req, res)
  if (!user) return null

  if (!isAdmin(user.id)) {
    // 404 et non 403 : inutile de confirmer à un curieux que la route existe.
    res.status(404).json({ error: 'Introuvable.' })
    return null
  }

  return user
}
