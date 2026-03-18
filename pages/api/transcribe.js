export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  try {
    // Get base64 audio from request
    const { audio, mimeType } = req.body
    if (!audio) return res.status(400).json({ error: 'Audio manquant' })

    // Convert base64 to buffer
    const buffer = Buffer.from(audio, 'base64')

    // Create FormData for Groq Whisper
    const { FormData, Blob } = await import('node:buffer').catch(() => ({
      FormData: global.FormData,
      Blob: global.Blob
    }))

    // Use native fetch with FormData
    const formData = new global.FormData()
    const blob = new global.Blob([buffer], { type: mimeType || 'audio/webm' })
    formData.append('file', blob, 'recitation.webm')
    formData.append('model', 'whisper-large-v3')
    formData.append('language', 'ar')
    formData.append('response_format', 'json')

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Groq transcribe error:', JSON.stringify(data))
      return res.status(500).json({ error: data?.error?.message || 'Erreur transcription' })
    }

    return res.status(200).json({ text: data.text || '' })
  } catch (err) {
    console.error('Transcribe error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
}
