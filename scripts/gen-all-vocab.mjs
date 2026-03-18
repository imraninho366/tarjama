#!/usr/bin/env node
/**
 * Generate French translations for all pending Quran words using Groq API
 * Runs locally, no need for the web interface
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VOCAB_PATH = path.join(__dirname, '..', 'public', 'quran_vocab.json')
const PENDING_PATH = path.join(__dirname, '..', 'public', 'pending_lemmas.json')

const GROQ_KEY = process.env.GROQ_API_KEY
if (!GROQ_KEY) {
  // Try loading from .env.local
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    const match = envFile.match(/GROQ_API_KEY=(.+)/)
    if (match) process.env.GROQ_API_KEY = match[1].trim()
  } catch {}
}

const API_KEY = process.env.GROQ_API_KEY
if (!API_KEY) {
  console.error('GROQ_API_KEY not found. Set it in .env.local or environment.')
  process.exit(1)
}

const BATCH_SIZE = 40
const DELAY = 2500 // ms between batches (Groq free tier: 30 req/min)

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function translateBatch(batch) {
  const lines = batch.map(w => `- ${w.l}${w.r ? ` (racine: ${w.r})` : ''}`).join('\n')

  const prompt = `Tu es un expert en arabe coranique. Génère une fiche dictionnaire française pour chaque mot.

Mots arabes:
${lines}

Réponds UNIQUEMENT en JSON valide:
{"mots":[{"ar":"mot arabe tel que fourni","translit":"phonétique française","racine":"ر-ح-م","sens":["sens principal"],"freq_label":"très fréquent|fréquent|courant|rare","type":"nom|verbe|adjectif|particule|pronom|préposition|conjonction","note":"info courte max 80 chars"}]}

- Exactement ${batch.length} entrées dans l'ordre
- freq_label: très fréquent(>200x), fréquent(50-200x), courant(10-50x), rare(<10x)
- 1-2 sens français max
- translit en phonétique française simple`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`)

  const text = data.choices?.[0]?.message?.content || '{}'
  const result = JSON.parse(text)
  const freqMap = { 'très fréquent': 500, 'fréquent': 150, 'courant': 40, 'rare': 5 }
  return (result.mots || []).map(m => ({
    ...m,
    freq: freqMap[m.freq_label] || m.freq || 5
  }))
}

async function main() {
  console.log('=== Génération du dictionnaire complet via Groq ===\n')

  // Load existing vocab
  const vocab = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'))
  const existingAr = new Set(vocab.mots.map(m => m.ar))
  console.log(`Dictionnaire existant: ${vocab.mots.length} mots`)

  // Load pending
  const pending = JSON.parse(fs.readFileSync(PENDING_PATH, 'utf8'))
  const todo = pending.filter(w => !existingAr.has(w.l))
  console.log(`Mots à générer: ${todo.length}`)

  if (todo.length === 0) {
    console.log('Rien à faire !')
    return
  }

  // Split into batches
  const batches = []
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    batches.push(todo.slice(i, i + BATCH_SIZE))
  }
  console.log(`Lots: ${batches.length} (${BATCH_SIZE} mots/lot)\n`)

  let totalAdded = 0
  let errors = 0

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    process.stdout.write(`Lot ${i + 1}/${batches.length} (${batch.length} mots)... `)

    try {
      const results = await translateBatch(batch)
      let added = 0

      for (const mot of results) {
        if (!mot.ar || existingAr.has(mot.ar)) continue
        if (!mot.sens || mot.sens.length === 0) continue
        vocab.mots.push(mot)
        existingAr.add(mot.ar)
        added++
      }

      totalAdded += added
      console.log(`+${added} mots (total: ${vocab.mots.length})`)
    } catch (err) {
      errors++
      console.log(`ERREUR: ${err.message}`)

      // If rate limited, wait longer
      if (err.message.includes('rate') || err.message.includes('429')) {
        console.log('  Rate limited, attente 30s...')
        await sleep(30000)
        i-- // Retry this batch
        continue
      }
    }

    // Wait between batches
    if (i < batches.length - 1) await sleep(DELAY)
  }

  // Sort by frequency
  vocab.mots.sort((a, b) => (b.freq || 0) - (a.freq || 0))
  vocab.total = vocab.mots.length
  vocab.version = '4.0'
  vocab.generated = new Date().toISOString().split('T')[0]

  // Save
  fs.writeFileSync(VOCAB_PATH, JSON.stringify(vocab, null, 2), 'utf8')
  const size = (fs.statSync(VOCAB_PATH).size / 1024).toFixed(0)

  console.log(`\n=== Terminé ===`)
  console.log(`Ajoutés: ${totalAdded} mots`)
  console.log(`Erreurs: ${errors}`)
  console.log(`Total dictionnaire: ${vocab.mots.length} mots`)
  console.log(`Taille fichier: ${size} KB`)
}

main().catch(err => { console.error(err); process.exit(1) })
