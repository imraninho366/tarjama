import { rateLimit } from '../../lib/rateLimit'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 8, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const { mood } = req.body
  if (!mood) return res.status(400).json({ error: 'Humeur manquante' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  const cacheKey = `mood:${mood.toLowerCase().trim()}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const prompt = `Tu es un guide spirituel islamique bienveillant. L'utilisateur ressent : "${mood}".

Suggère 3 versets coraniques pertinents pour cette émotion/situation. Pour chaque verset :

Réponds UNIQUEMENT en JSON valide :
{"versets":[{"sourate_num":1,"sourate_fr":"L'Ouverture","sourate_ar":"الفاتحة","verset_num":1,"arabe":"texte arabe du verset","traduction":"traduction française","explication":"pourquoi ce verset est pertinent (2 phrases max)","conseil":"un conseil pratique bienveillant (1 phrase)"}]}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })
    })
    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: 'Erreur IA' })
    const content = data.choices?.[0]?.message?.content
    const result = JSON.parse(content)
    cacheSet(cacheKey, result)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
