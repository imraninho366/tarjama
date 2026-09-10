import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 5, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé Groq non configurée' })

  try {
    const { audio } = req.body
    if (typeof audio !== 'string' || !audio) return res.status(400).json({ error: 'Audio manquant' })

    /*
     * Le type MIME envoye par le navigateur etait recopie TEL QUEL dans
     * l'en-tete de la partie « file » du corps multipart construit a la main
     * ci-dessous. Une valeur contenant « \r\n » y fermait l'en-tete et ouvrait
     * de nouvelles parties : l'appelant pouvait ajouter ou remplacer des champs
     * de la requete envoyee a Groq avec la cle du projet.
     *
     * On ne retient desormais que le type de base, confronte a une liste
     * fermee ; tout le reste retombe sur webm.
     */
    const TYPES = { 'audio/webm': 'webm', 'audio/mp4': 'mp4', 'audio/ogg': 'ogg', 'audio/wav': 'wav' }
    const base = String(req.body.mimeType || '').split(';')[0].trim().toLowerCase()
    const mimeType = TYPES[base] ? base : 'audio/webm'
    const ext = TYPES[mimeType]

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
      // Le message de Groq decrit son infrastructure et parfois la cle
      // utilisee ; il reste dans les journaux, pas dans la reponse.
      return res.status(502).json({ error: 'La transcription a échoué. Réessaie.' })
    }

    return res.status(200).json({ text: data.text || '' })
  } catch (err) {
    console.error('Transcribe error:', err.message)
    return res.status(500).json({ error: 'La transcription a échoué. Réessaie.' })
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
}
