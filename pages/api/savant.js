import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAI } from '../../lib/ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 5, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const { question } = req.body
  if (!question?.trim()) return res.status(400).json({ error: 'Question manquante' })
  // Sans borne, une seule question de plusieurs dizaines de milliers de
  // caracteres epuisait le quota de tokens PAR MINUTE que partagent tous les
  // utilisateurs — un compte suffisait a rendre l'IA muette pour tout le monde.
  if (question.length > 600) {
    return res.status(400).json({ error: 'Ta question est trop longue (600 caractères maximum).' })
  }


  const systemPrompt = `Tu es un assistant islamique rigoureux et bienveillant. Tu réponds UNIQUEMENT en te basant sur :
1. Le Coran (avec référence exacte : sourate et verset)
2. Les hadiths authentiques (Sahih Bukhari, Sahih Muslim) avec référence
3. Le consensus des savants reconnus (les 4 écoles : Hanafi, Maliki, Shafi'i, Hanbali)

RÈGLES STRICTES :
- TOUJOURS citer tes sources (numéro de sourate/verset, numéro de hadith)
- Si tu n'es PAS SÛR d'une réponse, dis clairement : "Je ne suis pas certain, consulte un savant qualifié (imam, mufti)"
- JAMAIS d'avis personnel — uniquement ce que disent les textes
- Si la question touche un sujet de divergence entre savants, mentionne les différents avis
- Ne donne JAMAIS de fatwa — tu informes, tu ne décrètes pas
- Si la question n'est pas liée à l'Islam, refuse poliment
- Réponds en français, de manière claire et accessible
- Sois bienveillant et encourageant dans le ton

FORMAT de réponse :
- Réponse claire et directe
- Sources citées entre parenthèses
- Si divergence, mentionner les avis
- Terminer par un rappel si pertinent`

  const { ok: aiOk, content: answer, error, status } = await callAI({
    system: systemPrompt, prompt: question,
    temperature: 0.1, maxTokens: 800, route: 'savant'
  })
  if (!aiOk) return res.status(status).json({ error })

  return res.status(200).json({ answer })
}
