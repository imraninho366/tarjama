import { rateLimit } from '../../lib/rateLimit'
import { callAIJSON } from '../../lib/ai'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 5, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const { weakWords } = req.body
  if (!weakWords?.length) return res.status(400).json({ error: 'Mots manquants' })


  const wordsStr = weakWords.slice(0, 5).join(', ')
  const cacheKey = `smart:${wordsStr}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const prompt = `Tu es un expert du Coran. Trouve UN verset coranique court (max 15 mots en arabe) qui contient le plus possible de ces mots arabes : ${wordsStr}

Réponds UNIQUEMENT en JSON :
{"sourate_num":1,"sourate_fr":"nom","sourate_ar":"اسم","verset_num":1,"arabe":"texte arabe","traduction":"traduction française","mots_presents":["mot1","mot2"],"conseil":"pourquoi ce verset est bon pour réviser ces mots (1 phrase)"}`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0.3, route: 'smart-verse'
  })
  if (!aiOk) return res.status(status).json({ error })

  if (result.arabe) cacheSet(cacheKey, result)
  return res.status(200).json(result)
}
