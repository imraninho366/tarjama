// API Vercel — génère les traductions françaises via Groq
import { callAIJSON } from '../../lib/ai'
// Appelée par la page /gen-dico en lots de 40 mots

import { rateLimit } from '../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 3, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })


  const { batch } = req.body  // [{l: lemma, r: root, c: count}]
  if (!batch?.length) return res.status(400).json({ error: 'batch manquant' })

  const lines = batch.map(w => `- ${w.l}${w.r ? ` (racine: ${w.r})` : ''}`).join('\n')

  const prompt = `Tu es un expert en arabe coranique. Génère une fiche dictionnaire française pour chaque mot.

Mots arabes:
${lines}

Réponds UNIQUEMENT en JSON valide:
{"mots":[{"ar":"mot arabe tel que fourni","translit":"phonétique française","racine":"ر-ح-م","sens":["sens principal"],"freq_label":"très fréquent|fréquent|courant|rare","type":"nom|verbe|adjectif|particule|pronom|préposition|conjonction","note":"info courte max 80 chars"}]}

- Exactement ${batch.length} entrées dans l'ordre
- freq_label: très fréquent(>200x), fréquent(50-200x), courant(10-50x), rare(<10x)
- 1-2 sens français max`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0.1, maxTokens: 3000, route: 'gen-vocab'
  })
  if (!aiOk) return res.status(status).json({ error })

  // Sans ce controle, un JSON valide mais mal forme renvoyait {"mots": []}
  // avec un 200 — indistinguable d'un lot vide cote /gen-dico.
  if (!Array.isArray(result?.mots) || result.mots.length === 0) {
    console.error('[gen-vocab] format inattendu:', JSON.stringify(result).slice(0, 200))
    return res.status(502).json({ error: 'Réponse IA inattendue' })
  }

  const freqMap = { 'très fréquent': 500, 'fréquent': 150, 'courant': 40, 'rare': 5 }
  const mots = result.mots.map(m => ({ ...m, freq: freqMap[m.freq_label] || 5 }))
  return res.status(200).json({ mots })
}
