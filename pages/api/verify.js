export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { arabic, sourate_num, verse_num, sourate_ar, sourate_fr, user_trans } = req.body
  if (!arabic || !user_trans?.trim()) return res.status(400).json({ error: 'Paramètres manquants' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  const prompt = `Tu es un expert en Coran et arabe classique. Évalue cette traduction.

Verset : ${arabic}
Sourate ${sourate_num} (${sourate_ar} — ${sourate_fr}), verset ${verse_num}
Traduction : "${user_trans}"

Réponds UNIQUEMENT avec ce JSON, sans texte avant ou après :
{"niveau":"excellent|good|partial|wrong","emoji":"excellent|correct|partiel|incorrect","titre":"4 mots max","message":"feedback bienveillant 2-3 phrases","traduction_ref":"traduction française fidèle","mots_importants":[{"ar":"mot","fr":"sens"}],"mot_manque":"concept manquant ou null"}`

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
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Groq error:', JSON.stringify(data))
      return res.status(500).json({ error: `Groq: ${data?.error?.message || response.status}` })
    }

    const text = data.choices?.[0]?.message?.content || '{}'
    const result = JSON.parse(text)
    return res.status(200).json(result)

  } catch (err) {
    console.error('Verify error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
