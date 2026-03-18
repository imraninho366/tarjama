// API Vercel — génère les traductions françaises via Groq
// Appelée par la page /gen-dico en lots de 40 mots

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
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

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    })
    const data = await r.json()
    if (!r.ok) return res.status(500).json({ error: data?.error?.message })
    const result = JSON.parse(data.choices[0].message.content)
    const freqMap = { 'très fréquent': 500, 'fréquent': 150, 'courant': 40, 'rare': 5 }
    const mots = (result.mots || []).map(m => ({ ...m, freq: freqMap[m.freq_label] || 5 }))
    return res.status(200).json({ mots })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
