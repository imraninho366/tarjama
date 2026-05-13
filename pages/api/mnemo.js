import { rateLimit } from '../../lib/rateLimit'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 10, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const { ar, translit, sens } = req.body
  if (!ar) return res.status(400).json({ error: 'Mot manquant' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  const cacheKey = `mnemo:${ar}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json({ mnemo: cached })

  const prompt = `Tu es un expert en mnémotechniques et en arabe. Crée un moyen mnémotechnique CRÉATIF et AMUSANT en français pour retenir ce mot arabe :

Mot : ${ar}
Translittération : ${translit || ''}
Sens : ${Array.isArray(sens) ? sens.join(', ') : sens}

Règles :
- Utilise des associations phonétiques entre la translittération et des mots français
- Sois créatif, drôle et mémorable
- Maximum 2 phrases
- Inclus une petite image mentale ou scénario

Réponds UNIQUEMENT avec le mnémonique, sans introduction ni explication.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 150 })
    })
    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: data?.error?.message || 'Erreur IA' })
    const mnemo = data.choices?.[0]?.message?.content || ''
    if (mnemo) cacheSet(cacheKey, mnemo)
    return res.status(200).json({ mnemo })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
