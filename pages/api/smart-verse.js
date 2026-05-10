import { rateLimit } from '../../lib/rateLimit'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 5, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const { weakWords } = req.body
  if (!weakWords?.length) return res.status(400).json({ error: 'Mots manquants' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  const wordsStr = weakWords.slice(0, 5).join(', ')
  const cacheKey = `smart:${wordsStr}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const prompt = `Tu es un expert du Coran. Trouve UN verset coranique court (max 15 mots en arabe) qui contient le plus possible de ces mots arabes : ${wordsStr}

Réponds UNIQUEMENT en JSON :
{"sourate_num":1,"sourate_fr":"nom","sourate_ar":"اسم","verset_num":1,"arabe":"texte arabe","traduction":"traduction française","mots_presents":["mot1","mot2"],"conseil":"pourquoi ce verset est bon pour réviser ces mots (1 phrase)"}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.3, response_format: { type: 'json_object' } })
    })
    const data = await response.json()
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{}')
    cacheSet(cacheKey, result)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
