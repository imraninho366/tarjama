import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAI } from '../../lib/ai'
import { cacheGet, cacheSet } from '../../lib/cache'
import { motDuDictionnaire } from '../../lib/dictionnaireServeur'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 10, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  // Le sens et la translitteration viennent du dictionnaire verifie, pas de la
  // requete : la reponse est mise en cache sous le mot et servie a tous.
  const mot = motDuDictionnaire(req.body?.ar)
  if (!mot) return res.status(400).json({ error: 'Mot introuvable dans le dictionnaire' })
  const { ar, translit, sens } = mot


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

  const { ok: aiOk, content: mnemo, error, status } = await callAI({
    prompt, temperature: 0.7, maxTokens: 500, fast: true, route: 'mnemo'
  })
  if (!aiOk) return res.status(status).json({ error })

  cacheSet(cacheKey, mnemo)
  return res.status(200).json({ mnemo })
}
