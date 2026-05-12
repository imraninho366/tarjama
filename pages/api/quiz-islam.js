import { rateLimit } from '../../lib/rateLimit'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 5, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const { count = 5, seed } = req.body

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  const cacheKey = `quiz-islam:${seed || 'random'}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.json(cached)

  const prompt = `Génère ${count} questions à choix multiples sur l'Islam, variées en difficulté.
Sujets possibles : piliers de l'Islam, piliers de la foi, prophètes, sourates, hadiths, histoire islamique, vocabulaire arabe, pratique religieuse.

IMPORTANT : les questions doivent être FACTUELLES et vérifiables, pas d'opinions.

Réponds UNIQUEMENT en JSON valide :
{"questions":[{"question":"La question ?","choices":["Choix A","Choix B","Choix C","Choix D"],"correct":0,"explanation":"Explication courte de la bonne réponse avec source si possible"}]}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        response_format: { type: 'json_object' },
        seed: seed || undefined
      })
    })
    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: 'Erreur IA' })
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{"questions":[]}')
    if (seed) cacheSet(cacheKey, result)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
