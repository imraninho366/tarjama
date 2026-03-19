const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions'
const COLLECTIONS = {
  bukhari: { name: 'Sahih al-Bukhari', nameAr: 'صحيح البخاري', author: 'Imam al-Bukhari' },
  muslim:  { name: 'Sahih Muslim',     nameAr: 'صحيح مسلم',     author: 'Imam Muslim' },
}

// French translations for Bukhari chapter names
const BUKHARI_SECTIONS_FR = {
  1: 'La Revelation', 2: 'La Foi', 3: 'La Science', 4: 'Les Ablutions (Woudou)',
  5: 'Le Bain rituel (Ghousl)', 6: 'Les Menstrues', 7: 'Le Tayammoum',
  8: 'La Priere (Salat)', 9: 'Les Horaires de priere', 10: "L'Appel a la priere (Adhan)",
  11: 'La Priere du vendredi', 12: 'La Priere de la peur', 13: 'Les Deux fetes (Aids)',
  14: 'La Priere du Witr', 15: "L'Invocation pour la pluie (Istisqa)", 16: 'Les Eclipses',
  17: 'La Prosternation lors de la recitation', 18: "L'Abregement de la priere",
  19: 'La Priere de nuit (Tahajjoud)', 20: 'Merites de la priere a La Mecque et Medine',
  21: 'Les Actes durant la priere', 22: "L'Oubli dans la priere",
  23: 'Les Funerailles (Janaza)', 24: "L'Aumone obligatoire (Zakat)",
  25: 'Le Pelerinage (Hajj)', 26: "La Omra", 27: "L'Empeche du pelerinage",
  28: 'Sanction de la chasse en etat de sacralisation', 29: 'Les Merites de Medine',
  30: 'Le Jeune', 31: 'La Priere de nuit du Ramadan (Tarawih)',
  32: 'Les Merites de la nuit du Destin', 33: "La Retraite spirituelle (I'tikaf)",
  34: 'Les Ventes et le commerce', 35: 'La Vente a terme (Salam)', 36: 'La Preemption (Chouf a)',
  37: 'La Location', 38: 'Le Transfert de dette (Hawala)', 39: 'La Garantie (Kafala)',
  40: 'La Procuration', 41: "L'Agriculture", 42: "La Distribution de l'eau",
  43: 'Les Prets et saisies', 44: 'Les Litiges', 45: 'Les Objets trouves',
  46: "L'Injustice", 47: "L'Association", 48: "L'Hypotheque",
  49: "L'Affranchissement des esclaves", 50: 'Le Contrat d affranchissement',
  51: 'Les Dons', 52: 'Les Temoignages', 53: 'La Reconciliation', 54: 'Les Conditions',
  55: 'Les Testaments', 56: 'Le Combat pour la cause d Allah (Jihad)',
  57: 'Le Cinquieme du butin (Khoumouss)', 58: "L'Impot de capitation (Jizya)",
  59: 'Le Debut de la creation', 60: 'Les Prophetes',
  61: 'Les Merites du Prophete et de ses Compagnons', 62: 'Les Compagnons du Prophete',
  63: 'Les Merites des Auxiliaires de Medine (Ansar)',
  64: 'Les Expeditions militaires du Prophete', 65: "L'Exegese du Coran (Tafsir)",
  66: 'Les Merites du Coran', 67: 'Le Mariage (Nikah)', 68: 'Le Divorce',
  69: "L'Entretien de la famille", 70: 'La Nourriture et les repas',
  71: "Le Sacrifice de naissance (Aqiqa)", 72: 'La Chasse et l abattage',
  73: "Le Sacrifice de l'Aid (Oudhiya)", 74: 'Les Boissons',
  75: 'Les Malades', 76: 'La Medecine', 77: "L'Habillement",
  78: 'Les Bonnes manieres (Adab)', 79: 'La Demande de permission',
  80: 'Les Invocations', 81: "L'Attendrissement du coeur (Riqaq)",
  82: 'Le Destin divin (Qadar)', 83: 'Les Serments et les voeux',
  84: "L'Expiation des serments non tenus", 85: "Les Lois d'heritage (Fara'id)",
  86: 'Les Limites et chatiments divins (Houdoud)', 87: 'Le Prix du sang (Diyat)',
  88: "Les Apostats", 89: 'Les Declarations sous contrainte', 90: 'Les Ruses',
  91: "L'Interpretation des reves", 92: 'Les Epreuves et la fin des temps',
  93: 'Les Jugements (Ahkam)', 94: 'Les Souhaits',
  95: "L'Acceptation d'informations d'une personne veridique",
  96: "L'Attachement au Coran et a la Sunna", 97: "L'Unicite d'Allah (Tawhid)",
}

// French translations for Muslim chapter names
const MUSLIM_SECTIONS_FR = {
  1: 'Le Livre de la foi', 2: 'Le Livre de la purification', 3: 'Le Livre des menstrues',
  4: 'Le Livre de la priere', 5: 'Le Livre des mosquees et lieux de priere',
  6: 'La Priere du voyageur', 7: 'La Priere du vendredi',
  8: 'La Priere des deux fetes', 9: 'La Priere pour la pluie',
  10: 'La Priere des eclipses', 11: 'Les Funerailles', 12: 'Le Livre de la Zakat',
  13: 'Le Livre du jeune', 14: "Le Livre de l'I'tikaf", 15: 'Le Livre du pelerinage',
  16: 'Le Livre du mariage', 17: "Le Livre de l'allaitement", 18: 'Le Livre du divorce',
  19: 'Le Livre de l anatheme', 20: "Le Livre de l'affranchissement",
  21: 'Le Livre des transactions', 22: 'Le Livre du metayage',
  23: "Le Livre des regles d'heritage", 24: 'Le Livre des dons',
  25: 'Le Livre des testaments', 26: 'Le Livre des voeux', 27: 'Le Livre des serments',
  28: 'Serments, represailles et prix du sang', 29: 'Les Chatiments legaux',
  30: 'Les Decisions judiciaires', 31: 'Les Objets trouves',
  32: 'Le Jihad et les expeditions', 33: "Le Livre du gouvernement",
  34: 'La Chasse, l abattage et les aliments permis', 35: 'Le Livre des sacrifices',
  36: 'Le Livre des boissons', 37: "L'Habillement et la parure",
  38: 'Les Bonnes manieres et l etiquette', 39: 'Les Salutations',
  40: "L'Usage des mots corrects", 41: 'Le Livre de la poesie',
  42: 'Le Livre des reves', 43: 'Les Vertus',
  44: 'Les Merites des Compagnons', 45: 'La Vertu et les liens de parente',
  46: 'Le Destin', 47: 'Le Livre de la science',
  48: 'Le Rappel d Allah, les invocations et le repentir',
  49: 'Les Recits qui attendrissent le coeur', 50: 'Le Livre du repentir',
  51: 'Les Hypocrites et leurs caracteres', 52: 'Le Jour du Jugement, le Paradis et l Enfer',
  53: 'Le Paradis, sa description et ses habitants',
  54: 'Les Epreuves et signes de la fin des temps',
  55: 'Le Renoncement et l attendrissement du coeur',
  56: "Le Commentaire du Coran",
}

function translateSection(collection, num, originalName) {
  if (collection === 'bukhari' && BUKHARI_SECTIONS_FR[num]) return BUKHARI_SECTIONS_FR[num]
  if (collection === 'muslim' && MUSLIM_SECTIONS_FR[num]) return MUSLIM_SECTIONS_FR[num]
  return originalName // fallback
}

// Simple in-memory cache (persists across requests in same serverless instance)
const cache = new Map()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

async function fetchCached(url) {
  const now = Date.now()
  if (cache.has(url) && now - cache.get(url).ts < CACHE_TTL) {
    return cache.get(url).data
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CDN error ${res.status}`)
  const data = await res.json()
  cache.set(url, { data, ts: now })
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { collection = 'bukhari', section, number, search, page = '1', limit = '20' } = req.query
  if (!COLLECTIONS[collection]) return res.status(400).json({ error: 'Collection invalide (bukhari ou muslim)' })

  const info = COLLECTIONS[collection]

  try {
    // Single hadith by number
    if (number) {
      const [frData, arData] = await Promise.all([
        fetchCached(`${CDN}/fra-${collection}/${number}.json`),
        fetchCached(`${CDN}/ara-${collection}/${number}.json`)
      ])
      const frH = frData.hadiths?.[0] || frData
      const arH = arData.hadiths?.[0] || arData
      return res.status(200).json({
        hadith: {
          number: frH.hadithnumber || Number(number),
          textFr: frH.text || '',
          textAr: arH.text || '',
          grades: frH.grades || [],
          reference: frH.reference || {}
        },
        collection: info
      })
    }

    // Fetch full collection data
    const [frCol, arCol] = await Promise.all([
      fetchCached(`${CDN}/fra-${collection}.json`),
      fetchCached(`${CDN}/ara-${collection}.json`)
    ])

    const sections = frCol.metadata?.sections || {}
    const frHadiths = frCol.hadiths || []
    const arHadiths = arCol.hadiths || []

    // Build ar lookup by hadith number for merging
    const arMap = new Map()
    for (const h of arHadiths) {
      arMap.set(h.hadithnumber, h.text)
    }

    // List sections (chapters)
    if (!section && !search) {
      // Count hadiths per section
      const sectionCounts = {}
      for (const h of frHadiths) {
        const sec = String(h.reference?.book || h.bookNumber || 1)
        sectionCounts[sec] = (sectionCounts[sec] || 0) + 1
      }

      const sectionList = Object.entries(sections).map(([num, name]) => ({
        num: Number(num),
        name: translateSection(collection, Number(num), name || `Chapitre ${num}`),
        count: sectionCounts[num] || 0
      })).filter(s => s.num > 0 && s.count > 0)

      return res.status(200).json({
        collection: info,
        totalHadiths: frHadiths.length,
        sections: sectionList
      })
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      const pageNum = Math.max(1, parseInt(page))
      const lim = Math.min(50, Math.max(1, parseInt(limit)))

      const results = []
      for (const h of frHadiths) {
        if (results.length >= 100) break // Cap search at 100
        if ((h.text || '').toLowerCase().includes(q)) {
          results.push({
            number: h.hadithnumber,
            textFr: h.text,
            textAr: arMap.get(h.hadithnumber) || '',
            section: h.reference?.book || h.bookNumber || 0,
            grades: h.grades || []
          })
        }
      }

      const start = (pageNum - 1) * lim
      return res.status(200).json({
        collection: info,
        total: results.length,
        page: pageNum,
        hadiths: results.slice(start, start + lim)
      })
    }

    // Hadiths by section
    const secNum = String(section)
    const pageNum = Math.max(1, parseInt(page))
    const lim = Math.min(50, Math.max(1, parseInt(limit)))

    const secHadiths = frHadiths.filter(h =>
      String(h.reference?.book || h.bookNumber || 1) === secNum
    ).map(h => ({
      number: h.hadithnumber,
      textFr: h.text || '',
      textAr: arMap.get(h.hadithnumber) || '',
      grades: h.grades || []
    }))

    const start = (pageNum - 1) * lim
    return res.status(200).json({
      collection: info,
      sectionName: translateSection(collection, Number(secNum), sections[secNum] || `Chapitre ${secNum}`),
      sectionNum: Number(secNum),
      total: secHadiths.length,
      page: pageNum,
      hadiths: secHadiths.slice(start, start + lim)
    })

  } catch (err) {
    console.error('Hadith API error:', err.message)
    return res.status(500).json({ error: 'Impossible de charger les hadiths' })
  }
}
