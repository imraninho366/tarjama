import { rateLimit } from '../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 15, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une minute.' })

  const { arabic, sourate_num, verse_num, sourate_ar, sourate_fr, user_trans } = req.body
  if (!arabic || !user_trans?.trim()) return res.status(400).json({ error: 'Paramètres manquants' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

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

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Groq error:', JSON.stringify(data))
      return res.status(500).json({ error: `Groq: ${data?.error?.message || response.status}` })
    }

    const text = data.choices?.[0]?.message?.content || '{}'
    const result = JSON.parse(text)
    return res.status(200).json(result)

  } catch (err) {
    console.error('Verify error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
