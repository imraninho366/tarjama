export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { arabic, sourate_num, verse_num, sourate_ar, sourate_fr } = req.body
  if (!arabic) return res.status(400).json({ error: 'Verset manquant' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

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
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: data?.error?.message })

    const text = data.choices?.[0]?.message?.content || '{}'
    const result = JSON.parse(text)
    return res.status(200).json(result)
  } catch (err) {
    console.error('Vocab error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
