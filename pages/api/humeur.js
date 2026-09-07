import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAIJSON } from '../../lib/ai'
import { cacheGet, cacheSet } from '../../lib/cache'
import { versetAuthentique } from '../../lib/quranSource'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 8, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const { mood } = req.body
  if (!mood) return res.status(400).json({ error: 'Humeur manquante' })


  const cacheKey = `mood:${mood.toLowerCase().trim()}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  /*
   * L'IA CHOISIT LA RÉFÉRENCE, ELLE N'ÉCRIT PAS LE VERSET.
   *
   * Le prompt demandait auparavant « arabe: texte arabe du verset ». Le modèle
   * l'écrivait de mémoire, et il a fini par afficher, sous la référence
   * At-Talaq 65:2, un collage d'Ash-Sharh 94:7 et d'Al-Kawthar 108:2 — un
   * verset qui n'existe pas.
   *
   * Il ne lui reste que ce qu'il sait faire honnêtement : désigner un passage
   * et expliquer pourquoi il est pertinent. Le texte sacré vient de
   * lib/quranSource.js, jamais du modèle.
   */
  const prompt = `Tu es un guide spirituel islamique bienveillant. L'utilisateur ressent : "${mood}".

Suggère 3 versets coraniques pertinents pour cette émotion/situation.

N'ÉCRIS PAS le texte arabe ni la traduction : donne uniquement la RÉFÉRENCE
(numéro de sourate et numéro de verset). Le texte exact sera récupéré ailleurs.
Vérifie que le numéro de verset existe bien dans cette sourate.

Réponds UNIQUEMENT en JSON valide :
{"versets":[{"sourate_num":13,"verset_num":28,"explication":"pourquoi ce verset est pertinent (2 phrases max)","conseil":"un conseil pratique bienveillant (1 phrase)"}]}`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0.4, route: 'humeur'
  })
  if (!aiOk) return res.status(status).json({ error })

  // Sans ce controle, une reponse JSON valide mais vide ({} ou versets: [])
  // reste servie pendant 1 h a tous ceux qui saisissent la meme humeur.
  if (!Array.isArray(result?.versets) || result.versets.length === 0) {
    console.error('[humeur] format inattendu:', JSON.stringify(result).slice(0, 200))
    return res.status(502).json({ error: 'Réponse IA inattendue' })
  }

  /*
   * Chaque référence proposée est confrontée à la source authentique. Celles
   * qui ne correspondent à rien sont ÉCARTÉES, jamais rattrapées : mieux vaut
   * proposer deux versets que trois dont un inventé.
   */
  const versets = result.versets.slice(0, 5).map((v) => {
    const authentique = versetAuthentique(v.sourate_num, v.verset_num)
    if (!authentique) return null
    return { ...authentique, explication: v.explication || '', conseil: v.conseil || '' }
  }).filter(Boolean)

  if (versets.length === 0) {
    console.error('[humeur] aucune référence valide parmi:', JSON.stringify(result.versets).slice(0, 200))
    return res.status(502).json({ error: 'Aucun verset vérifiable pour cette humeur. Réessaie.' })
  }

  const verifie = { versets }
  cacheSet(cacheKey, verifie)
  return res.status(200).json(verifie)
}
