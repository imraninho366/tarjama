import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAIJSON } from '../../lib/ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 15, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une minute.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const { arabic, sourate_num, verse_num, sourate_ar, sourate_fr } = req.body
  if (!arabic) return res.status(400).json({ error: 'Verset manquant' })


  const prompt = `Tu es un expert en langue arabe coranique. Analyse tous les mots importants de ce verset.

Verset : ${arabic}
Sourate ${sourate_num} (${sourate_ar} — ${sourate_fr}), verset ${verse_num}

Pour chaque mot significatif du verset (ignore les particules très courantes comme و، في، من sauf si elles ont un sens important ici), donne :

Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "mots": [
    {
      "ar": "mot arabe avec voyelles",
      "translit": "translittération latine",
      "racine": "racine triconsonantique ex: ر-ح-م",
      "sens": ["traduction principale", "sens secondaire si existe", "sens contextuel si différent"],
      "freq": 79,
      "freq_label": "très fréquent|fréquent|courant|rare",
      "type": "nom|verbe|adjectif|particule|pronom",
      "exemple_autre": "un autre verset court connu qui utilise ce mot (en arabe)",
      "exemple_ref": "référence ex: S.1:1"
    }
  ]
}`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0.2, maxTokens: 1500, route: 'vocab'
  })
  if (!aiOk) return res.status(status).json({ error })

  if (!Array.isArray(result?.mots) || result.mots.length === 0) {
    console.error('[vocab] format inattendu:', JSON.stringify(result).slice(0, 200))
    return res.status(502).json({ error: 'Réponse IA inattendue' })
  }

  return res.status(200).json(result)
}
