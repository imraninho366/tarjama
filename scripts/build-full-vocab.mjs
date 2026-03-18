#!/usr/bin/env node
/**
 * Récupère TOUS les mots du Coran via l'API Quran.com (word-by-word)
 * et fusionne avec le dictionnaire existant quran_vocab.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VOCAB_PATH = path.join(__dirname, '..', 'public', 'quran_vocab.json')

const TOTAL_SURAHS = 114
const API_BASE = 'https://api.quran.com/api/v4'
const DELAY = 350 // ms between requests to avoid rate limiting

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchSurahWords(surahNum) {
  // Fetch verses with word-by-word data
  // language=fr for French word translations
  const url = `${API_BASE}/verses/by_chapter/${surahNum}?language=fr&words=true&word_fields=text_uthmani,text&per_page=300&page=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status} for surah ${surahNum}`)
  const data = await res.json()

  let allVerses = data.verses || []

  // Handle pagination if more than 300 verses
  if (data.pagination && data.pagination.total_pages > 1) {
    for (let p = 2; p <= data.pagination.total_pages; p++) {
      await sleep(DELAY)
      const url2 = `${API_BASE}/verses/by_chapter/${surahNum}?language=fr&words=true&word_fields=text_uthmani,text&per_page=300&page=${p}`
      const res2 = await fetch(url2)
      if (res2.ok) {
        const data2 = await res2.json()
        allVerses = allVerses.concat(data2.verses || [])
      }
    }
  }

  return allVerses
}

function cleanArabic(text) {
  // Remove tatweel and normalize
  return (text || '').replace(/ـ/g, '').trim()
}

async function main() {
  console.log('=== Construction du dictionnaire complet du Coran ===\n')

  // Load existing vocab
  let existing = []
  try {
    const raw = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'))
    existing = raw.mots || []
    console.log(`Dictionnaire existant: ${existing.length} mots\n`)
  } catch {
    console.log('Pas de dictionnaire existant, on part de zéro\n')
  }

  // Build set of existing Arabic words for dedup
  const existingSet = new Set(existing.map(m => cleanArabic(m.ar)))

  // Collect all words from all surahs
  const wordMap = new Map() // ar -> { ar, sens, freq, type }

  for (let s = 1; s <= TOTAL_SURAHS; s++) {
    process.stdout.write(`\rSourate ${s}/${TOTAL_SURAHS}...`)
    try {
      const verses = await fetchSurahWords(s)

      for (const verse of verses) {
        for (const word of (verse.words || [])) {
          // Skip end-of-ayah markers
          if (word.char_type_name === 'end') continue

          const ar = cleanArabic(word.text_uthmani || word.text || '')
          if (!ar || ar.length < 2) continue

          const translation = word.translation?.text || ''
          if (!translation) continue

          const key = ar

          if (wordMap.has(key)) {
            const w = wordMap.get(key)
            w.freq++
            // Add new translation if different
            const cleanTrans = translation.toLowerCase().trim()
            if (cleanTrans && !w.sens.some(s => s.toLowerCase() === cleanTrans)) {
              if (w.sens.length < 4) w.sens.push(cleanTrans)
            }
          } else {
            wordMap.set(key, {
              ar,
              sens: [translation.toLowerCase().trim()],
              freq: 1
            })
          }
        }
      }
    } catch (err) {
      console.error(`\nErreur sourate ${s}: ${err.message}`)
    }
    await sleep(DELAY)
  }

  console.log(`\n\nMots uniques trouvés: ${wordMap.size}`)

  // Build new entries (words not in existing vocab)
  const newWords = []
  for (const [ar, data] of wordMap) {
    if (existingSet.has(cleanArabic(ar))) continue

    const freqLabel = data.freq > 200 ? 'très fréquent'
      : data.freq > 50 ? 'fréquent'
      : data.freq > 10 ? 'courant'
      : 'rare'

    newWords.push({
      ar: data.ar,
      translit: '',
      racine: '',
      sens: data.sens.filter(Boolean),
      freq: data.freq,
      freq_label: freqLabel,
      type: '',
      note: ''
    })
  }

  // Also update frequencies for existing words
  for (const mot of existing) {
    const key = cleanArabic(mot.ar)
    if (wordMap.has(key)) {
      const apiData = wordMap.get(key)
      // Keep the higher frequency
      if (apiData.freq > (mot.freq || 0)) {
        mot.freq = apiData.freq
      }
    }
  }

  console.log(`Nouveaux mots à ajouter: ${newWords.length}`)

  // Merge: existing first (richer data), then new words
  const allWords = [...existing, ...newWords]

  // Sort by frequency descending
  allWords.sort((a, b) => (b.freq || 0) - (a.freq || 0))

  // Save
  const output = {
    version: '2.0',
    total: allWords.length,
    generated: new Date().toISOString().split('T')[0],
    mots: allWords
  }

  fs.writeFileSync(VOCAB_PATH, JSON.stringify(output, null, 2), 'utf8')
  console.log(`\nDictionnaire sauvegardé: ${allWords.length} mots total`)
  console.log(`Fichier: ${VOCAB_PATH}`)
  console.log(`Taille: ${(fs.statSync(VOCAB_PATH).size / 1024 / 1024).toFixed(2)} MB`)
}

main().catch(err => { console.error(err); process.exit(1) })
