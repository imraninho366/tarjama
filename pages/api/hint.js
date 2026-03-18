export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { arabic, sourate_num, verse_num, mode } = req.body
  if (!arabic) return res.status(400).json({ error: 'Verset manquant' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  // Mode translittération
  if (mode === 'translit') {
    const prompt = `Translittère ce verset coranique en alphabet latin français (phonétique française).
Verset : ${arabic}
Donne UNIQUEMENT la translittération phonétique, mot par mot, sans aucun autre texte.
Exemple : "Bismi llāhi r-raḥmāni r-raḥīm"
Utilise les diacritiques : ā, ī, ū, ḥ, ḫ, ẓ, ṭ, ṣ, ḍ, ġ`

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, max_tokens: 200
        })
      })
      const data = await response.json()
      const translit = data.choices?.[0]?.message?.content || ''
      return res.status(200).json({ translit })
    } catch (err) {
      return res.status(500).json({ translit: 'Non disponible.' })
    }
  }

  // Mode indice (défaut)
  const prompt = `Verset coranique : "${arabic}" (Sourate ${sourate_num}, verset ${verse_num})

Donne un indice court pour traduire ce verset en français :
- 2-3 mots-clés arabes avec leur sens
- Le thème sans révéler la traduction complète
Format : " Mots-clés : [...] | Thème : [...]"`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4
      })
    })
    const data = await response.json()
    if (!response.ok) return res.status(500).json({ hint: 'Indice temporairement indisponible.' })
    const hint = data.choices?.[0]?.message?.content || 'Indice non disponible.'
    return res.status(200).json({ hint })
  } catch (err) {
    return res.status(500).json({ hint: 'Indice temporairement indisponible.' })
  }
}
