export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { arabic, sourate_num, verse_num, sourate_ar, sourate_fr } = req.body
  if (!arabic) return res.status(400).json({ error: 'Verset manquant' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

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

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600
      })
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: data?.error?.message || 'Erreur' })

    const tafsir = data.choices?.[0]?.message?.content || 'Non disponible.'
    return res.status(200).json({ tafsir })

  } catch (err) {
    console.error('Tafsir error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
