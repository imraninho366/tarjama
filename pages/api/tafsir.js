import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAI } from '../../lib/ai'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 10, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une minute.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const { arabic, sourate_num, verse_num, sourate_ar, sourate_fr } = req.body
  if (!arabic) return res.status(400).json({ error: 'Verset manquant' })

  const cacheKey = `tafsir:${sourate_num}:${verse_num}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json({ tafsir: cached })


  const prompt = `Tu es un spécialiste du Coran, de la langue arabe classique et du tafsir. Analyse ce verset coranique en français.

Verset : ${arabic}
Sourate ${sourate_num} (${sourate_ar} — ${sourate_fr}), verset ${verse_num}

Réponds en français avec ces sections EXACTEMENT dans cet ordre, séparées par une ligne vide :

 SENS GLOBAL
[Explique le sens profond et le message du verset en 2-3 phrases simples]

 ANALYSE GRAMMATICALE
[Explique 3-4 mots clés importants avec leur racine arabe, leur forme grammaticale et leur sens précis]

 POINT SPIRITUEL
[Un enseignement ou une sagesse tirée de ce verset en 1-2 phrases]

Sois précis, pédagogique et accessible pour un apprenant débutant en arabe.`

  const { ok: aiOk, content: tafsir, error, status } = await callAI({
    prompt, temperature: 0.3, maxTokens: 600, route: 'tafsir'
  })
  if (!aiOk) return res.status(status).json({ error })

  cacheSet(cacheKey, tafsir)
  return res.status(200).json({ tafsir })
}
