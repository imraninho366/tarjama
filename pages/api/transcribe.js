export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  try {
    const { audio, mimeType } = req.body
    if (!audio) return res.status(400).json({ error: 'Audio manquant' })

    // Determine file extension from mimeType
    const ext = (mimeType || 'audio/webm').includes('mp4') ? 'mp4'
      : (mimeType || '').includes('ogg') ? 'ogg'
      : (mimeType || '').includes('wav') ? 'wav'
      : 'webm'

    // Convert base64 to buffer
    const buffer = Buffer.from(audio, 'base64')

    // Build multipart form data manually for reliable Vercel compatibility
    const boundary = '----FormBoundary' + Date.now().toString(36)
    const filename = `recitation.${ext}`

    const parts = []

    // File part
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType || 'audio/webm'}\r\n\r\n`
    )
    parts.push(buffer)
    parts.push('\r\n')

    // Model part
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-large-v3\r\n`
    )

    // Language part
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="language"\r\n\r\n` +
      `ar\r\n`
    )

    // Response format part
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
      `json\r\n`
    )

    // End boundary
    parts.push(`--${boundary}--\r\n`)

    // Concatenate all parts into a single buffer
    const bodyParts = parts.map(p => typeof p === 'string' ? Buffer.from(p) : p)
    const body = Buffer.concat(bodyParts)

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body
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
