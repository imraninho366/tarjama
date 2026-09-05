import { rateLimit } from '../../lib/rateLimit'
import { probeProviders } from '../../lib/ai'

/**
 * Diagnostic : quel fournisseur IA répond réellement ?
 *
 * callAI s'arrête au premier fournisseur qui marche, donc rien dans une
 * réponse normale n'indique lequel a servi. Après avoir ajouté une clé, la
 * seule façon de savoir si elle fonctionne était de fouiller les logs Vercel.
 * Cette route teste chaque fournisseur séparément et le dit.
 *
 * Ne renvoie JAMAIS les clés — uniquement le nom, l'état et l'erreur.
 * Limitée à 2 appels/minute : chaque appel consomme un jeton chez chaque
 * fournisseur configuré.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { ok } = rateLimit(req, { limit: 2, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const providers = await probeProviders()
  const active = providers.find(p => p.ok) || null

  return res.status(200).json({
    // Le fournisseur qui sert réellement le trafic : le premier de la chaîne
    // qui répond.
    servingRequests: active?.name || null,
    healthy: providers.filter(p => p.ok).length,
    providers,
  })
}
