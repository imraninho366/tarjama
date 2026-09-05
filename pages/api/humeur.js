import { rateLimit } from '../../lib/rateLimit'
import { callAIJSON } from '../../lib/ai'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 8, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const { mood } = req.body
  if (!mood) return res.status(400).json({ error: 'Humeur manquante' })


  const cacheKey = `mood:${mood.toLowerCase().trim()}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const prompt = `Tu es un guide spirituel islamique bienveillant. L'utilisateur ressent : "${mood}".

Suggère 3 versets coraniques pertinents pour cette émotion/situation. Pour chaque verset :

Réponds UNIQUEMENT en JSON valide :
{"versets":[{"sourate_num":1,"sourate_fr":"L'Ouverture","sourate_ar":"الفاتحة","verset_num":1,"arabe":"texte arabe du verset","traduction":"traduction française","explication":"pourquoi ce verset est pertinent (2 phrases max)","conseil":"un conseil pratique bienveillant (1 phrase)"}]}`

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

  cacheSet(cacheKey, result)
  return res.status(200).json(result)
}
