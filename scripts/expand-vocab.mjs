#!/usr/bin/env node
/**
 * Step 1: Fetch all unique Quran words from API
 * Step 2: Filter out words already in vocab
 * Step 3: Translate via Groq in batches
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VOCAB_PATH = path.join(__dirname, '..', 'public', 'quran_vocab.json')

// Load API key
try {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  const match = envFile.match(/GROQ_API_KEY=(.+)/)
  if (match) process.env.GROQ_API_KEY = match[1].trim()
} catch {}
const API_KEY = process.env.GROQ_API_KEY
if (!API_KEY) { console.error('GROQ_API_KEY missing'); process.exit(1) }

const sleep = ms => new Promise(r => setTimeout(r, ms))

function stripTashkeel(ar) {
  return (ar || '').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/g, '').replace(/\s+/g, ' ').trim()
}

// ─── Step 1: Fetch all Quran words ───
async function fetchAllWords() {
  const API = 'https://api.quran.com/api/v4'
  const wordMap = new Map() // stripped_ar -> { ar, freq }

  for (let s = 1; s <= 114; s++) {
    process.stdout.write(`\rFetching sourate ${s}/114...`)
    try {
      let page = 1
      let hasMore = true
      while (hasMore) {
        const url = `${API}/verses/by_chapter/${s}?words=true&word_fields=text_uthmani&per_page=300&page=${page}`
        const res = await fetch(url)
        if (!res.ok) break
        const data = await res.json()

        for (const verse of (data.verses || [])) {
          for (const word of (verse.words || [])) {
            if (word.char_type_name === 'end') continue
            const ar = (word.text_uthmani || word.text || '').replace(/ـ/g, '').trim()
            if (!ar || ar.length < 2) continue

            const key = stripTashkeel(ar)
            if (wordMap.has(key)) {
              wordMap.get(key).freq++
            } else {
              wordMap.set(key, { ar, freq: 1 })
            }
          }
        }

        hasMore = data.pagination && page < data.pagination.total_pages
        page++
        if (hasMore) await sleep(300)
      }
    } catch (err) {
      console.error(`\nError surah ${s}: ${err.message}`)
    }
    await sleep(250)
  }
  console.log(`\nTotal unique words from Quran: ${wordMap.size}`)
  return wordMap
}

// ─── Step 2: Translate via Groq ───
async function translateBatch(batch) {
  const lines = batch.map(w => `- ${w.ar}`).join('\n')
  const prompt = `Tu es un expert en arabe coranique. Génère une fiche dictionnaire française pour chaque mot arabe coranique.

Mots arabes:
${lines}

Réponds UNIQUEMENT en JSON valide:
{"mots":[{"ar":"mot arabe","translit":"phonétique","racine":"ر-ح-م","sens":["sens principal","sens secondaire"],"freq_label":"très fréquent|fréquent|courant|rare","type":"nom|verbe|adjectif|particule|pronom|préposition|conjonction","note":"contexte coranique bref"}]}

- Exactement ${batch.length} entrées dans l'ordre
- 1-3 sens français
- translit en phonétique française simple
- racine triconsonantique si applicable`

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

  if (res.status === 429) {
    const retry = parseFloat(res.headers.get('retry-after') || '3')
    throw new Error(`rate:${Math.ceil(retry * 1000 + 500)}`)
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`)

  const text = data.choices?.[0]?.message?.content || '{}'
  const result = JSON.parse(text)
  const freqMap = { 'très fréquent': 500, 'fréquent': 150, 'courant': 40, 'rare': 5 }
  return (result.mots || []).map(m => ({ ...m, freq: freqMap[m.freq_label] || 5 }))
}

async function main() {
  const TARGET = 10000
  console.log('=== Expansion du dictionnaire coranique ===\n')

  // Load existing
  const vocab = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'))
  const existingStripped = new Set(vocab.mots.map(m => stripTashkeel(m.ar)))
  const existingAr = new Set(vocab.mots.map(m => m.ar))
  console.log(`Existant: ${vocab.mots.length} mots`)
  console.log(`Objectif: ${TARGET} mots\n`)

  // Step 1: Fetch all Quran words
  console.log('--- Étape 1: Récupération de tous les mots du Coran ---')
  const allWords = await fetchAllWords()

  // Filter new words (not in existing vocab)
  const newWords = []
  for (const [key, data] of allWords) {
    if (!existingStripped.has(key) && !existingAr.has(data.ar)) {
      newWords.push(data)
    }
  }

  // Sort by frequency (most common first)
  newWords.sort((a, b) => b.freq - a.freq)

  const needed = Math.min(TARGET - vocab.mots.length, newWords.length)
  const toProcess = newWords.slice(0, needed)
  console.log(`\nNouveaux mots disponibles: ${newWords.length}`)
  console.log(`À traduire: ${needed}\n`)

  if (needed <= 0) {
    console.log('Objectif déjà atteint !')
    return
  }

  // Step 2: Translate in batches
  console.log('--- Étape 2: Traduction via Groq ---')
  const BATCH = 40
  const batches = []
  for (let i = 0; i < toProcess.length; i += BATCH) {
    batches.push(toProcess.slice(i, i + BATCH))
  }
  console.log(`Lots: ${batches.length}\n`)

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
        if (!mot.sens?.length) continue
        // Use freq from Quran data
        const qData = batch.find(b => stripTashkeel(b.ar) === stripTashkeel(mot.ar))
        if (qData) mot.freq = Math.max(mot.freq || 0, qData.freq || 0)
        vocab.mots.push(mot)
        existingAr.add(mot.ar)
        existingStripped.add(stripTashkeel(mot.ar))
        added++
      }
      totalAdded += added
      console.log(`+${added} (total: ${vocab.mots.length})`)
    } catch (err) {
      if (err.message.startsWith('rate:')) {
        const wait = parseInt(err.message.split(':')[1])
        console.log(`Rate limited, attente ${(wait/1000).toFixed(1)}s...`)
        await sleep(wait)
        i-- // Retry
        continue
      }
      errors++
      console.log(`ERREUR: ${err.message}`)
    }

    // Delay between batches
    if (i < batches.length - 1) await sleep(2500)

    // Save progress every 20 batches
    if ((i + 1) % 20 === 0) {
      vocab.total = vocab.mots.length
      fs.writeFileSync(VOCAB_PATH, JSON.stringify(vocab), 'utf8')
      console.log(`  [sauvegarde intermédiaire: ${vocab.mots.length} mots]`)
    }
  }

  // Final save
  vocab.mots.sort((a, b) => (b.freq || 0) - (a.freq || 0))
  vocab.total = vocab.mots.length
  vocab.version = '5.0'
  vocab.generated = new Date().toISOString().split('T')[0]
  fs.writeFileSync(VOCAB_PATH, JSON.stringify(vocab), 'utf8')

  const size = (fs.statSync(VOCAB_PATH).size / 1024).toFixed(0)
  console.log(`\n=== Terminé ===`)
  console.log(`Ajoutés: ${totalAdded}`)
  console.log(`Erreurs: ${errors}`)
  console.log(`Total: ${vocab.mots.length} mots (${size} KB)`)
}

main().catch(err => { console.error(err); process.exit(1) })
