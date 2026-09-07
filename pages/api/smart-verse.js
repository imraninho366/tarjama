import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAIJSON } from '../../lib/ai'
import { cacheGet, cacheSet } from '../../lib/cache'
import { versetAuthentique } from '../../lib/quranSource'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 5, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const { weakWords } = req.body
  if (!weakWords?.length) return res.status(400).json({ error: 'Mots manquants' })


  const wordsStr = weakWords.slice(0, 5).join(', ')
  const cacheKey = `smart:${wordsStr}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  /*
   * Comme pour /api/humeur : l'IA désigne, elle n'écrit pas. Cette route
   * demandait elle aussi « arabe: texte arabe », donc elle portait le même
   * risque de verset fabriqué — simplement, elle n'est appelée par aucune page
   * aujourd'hui, alors personne ne l'avait vu.
   */
  const prompt = `Tu es un expert du Coran. Trouve UN verset coranique court (max 15 mots en arabe) qui contient le plus possible de ces mots arabes : ${wordsStr}

N'ÉCRIS PAS le texte arabe ni la traduction : donne uniquement la RÉFÉRENCE
(numéro de sourate et numéro de verset). Le texte exact sera récupéré ailleurs.
Vérifie que le numéro de verset existe bien dans cette sourate.

Réponds UNIQUEMENT en JSON :
{"sourate_num":103,"verset_num":3,"mots_presents":["mot1","mot2"],"conseil":"pourquoi ce verset est bon pour réviser ces mots (1 phrase)"}`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0.3, route: 'smart-verse'
  })
  if (!aiOk) return res.status(status).json({ error })

  // Référence confrontée à la source authentique. Pas de verset vérifiable,
  // pas de verset affiché.
  const authentique = await versetAuthentique(result?.sourate_num, result?.verset_num)
  if (!authentique) {
    console.error('[smart-verse] référence invalide:', JSON.stringify(result).slice(0, 150))
    return res.status(502).json({ error: 'Aucun verset vérifiable. Réessaie.' })
  }

  const verifie = {
    ...authentique,
    mots_presents: Array.isArray(result.mots_presents) ? result.mots_presents : [],
    conseil: result.conseil || '',
  }
  cacheSet(cacheKey, verifie)
  return res.status(200).json(verifie)
}
