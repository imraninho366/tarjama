import { rateLimit } from '../../lib/rateLimit'
import { callAI } from '../../lib/ai'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 20, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une minute.' })

  const { arabic, sourate_num, verse_num, mode } = req.body
  if (!arabic) return res.status(400).json({ error: 'Verset manquant' })


  const cacheKey = `hint:${mode||'default'}:${sourate_num}:${verse_num}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.status(200).json(mode === 'translit' ? { translit: cached } : { hint: cached })

  // Mode translittération
  if (mode === 'translit') {
    const prompt = `Translittère ce verset coranique en alphabet latin français (phonétique française).
Verset : ${arabic}
Donne UNIQUEMENT la translittération phonétique, mot par mot, sans aucun autre texte.
Exemple : "Bismi llāhi r-raḥmāni r-raḥīm"
Utilise les diacritiques : ā, ī, ū, ḥ, ḫ, ẓ, ṭ, ṣ, ḍ, ġ`

    const { ok: aiOk, content: translit, error, status } = await callAI({
      prompt, temperature: 0.1, maxTokens: 400, route: 'hint:translit'
    })
    if (!aiOk) return res.status(status).json({ error })

    cacheSet(cacheKey, translit)
    return res.status(200).json({ translit })
  }

  // Mode indice (défaut)
  const prompt = `Verset coranique : "${arabic}" (Sourate ${sourate_num}, verset ${verse_num})

Donne un indice court pour traduire ce verset en français :
- 2-3 mots-clés arabes avec leur sens
- Le thème sans révéler la traduction complète
Format : " Mots-clés : [...] | Thème : [...]"`

  const { ok: aiOk2, content: hint, error: err2, status: st2 } = await callAI({
    prompt, temperature: 0.4, route: 'hint'
  })
  if (!aiOk2) return res.status(st2).json({ error: err2 })

  cacheSet(cacheKey, hint)
  return res.status(200).json({ hint })
}
