import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAIJSON } from '../../lib/ai'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 5, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const { count = 5, seed } = req.body


  // Le cache n'est alimente que pour les requetes avec seed (voir plus bas),
  // donc inutile de le consulter sans seed.
  const cacheKey = `quiz-islam:${seed}`
  if (seed) {
    const cached = cacheGet(cacheKey)
    if (cached) return res.json(cached)
  }

  const prompt = `Génère ${count} questions à choix multiples sur l'Islam, variées en difficulté.
Sujets possibles : piliers de l'Islam, piliers de la foi, prophètes, sourates, hadiths, histoire islamique, vocabulaire arabe, pratique religieuse.

IMPORTANT : les questions doivent être FACTUELLES et vérifiables, pas d'opinions.

Réponds UNIQUEMENT en JSON valide :
{"questions":[{"question":"La question ?","choices":["Choix A","Choix B","Choix C","Choix D"],"correct":0,"explanation":"Explication courte de la bonne réponse avec source si possible"}]}`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0.5, route: 'quiz-islam'
  })
  if (!aiOk) return res.status(status).json({ error })

  // duel.js appelle cette route avec un seed deterministe par verset : une
  // reponse corrompue mise en cache rejouerait un quiz casse a chaque duel.
  if (!Array.isArray(result?.questions) || result.questions.length === 0) {
    console.error('[quiz-islam] format inattendu:', JSON.stringify(result).slice(0, 200))
    return res.status(502).json({ error: 'Réponse IA inattendue' })
  }

  if (seed) cacheSet(cacheKey, result)
  return res.json(result)
}
