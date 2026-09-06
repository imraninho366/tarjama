import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAIJSON } from '../../lib/ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 15, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une minute.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const { arabic, sourate_num, verse_num, sourate_ar, sourate_fr, user_trans } = req.body
  if (!arabic || !user_trans?.trim()) return res.status(400).json({ error: 'Paramètres manquants' })


  const prompt = `Tu es un professeur de Coran bienveillant et encourageant. Évalue cette traduction avec INDULGENCE.

Verset : ${arabic}
Sourate ${sourate_num} (${sourate_ar} — ${sourate_fr}), verset ${verse_num}
Traduction de l'élève : "${user_trans}"

RÈGLES D'ÉVALUATION (sois GÉNÉREUX) :
- "excellent" : le sens général est compris, même si les mots exacts diffèrent
- "good" : l'idée principale est là, même avec des approximations
- "partial" : au moins une partie du sens est correcte
- "wrong" : SEULEMENT si la traduction n'a aucun rapport avec le verset

IMPORTANT : un synonyme ou une reformulation est TOUJOURS accepté. Ne pénalise JAMAIS pour le style ou le choix des mots si le sens est correct. L'élève apprend, encourage-le !

Réponds UNIQUEMENT avec ce JSON :
{"niveau":"excellent|good|partial|wrong","emoji":"✅|👍|🔄|💪","titre":"4 mots max encourageants","message":"feedback BIENVEILLANT et encourageant, 2-3 phrases. Félicite d'abord ce qui est bien, puis suggère doucement ce qui peut être amélioré","traduction_ref":"traduction française fidèle","mots_importants":[{"ar":"mot","fr":"sens"}],"mot_manque":"concept manquant ou null"}`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0.2, route: 'verify'
  })
  if (!aiOk) return res.status(status).json({ error })

  return res.status(200).json(result)
}
