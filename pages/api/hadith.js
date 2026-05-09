const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions'
const COLLECTIONS = {
  bukhari: { name: 'Sahih al-Bukhari', nameAr: 'صحيح البخاري', author: 'Imam al-Bukhari' },
  muslim:  { name: 'Sahih Muslim',     nameAr: 'صحيح مسلم',     author: 'Imam Muslim' },
}

// French translations for Bukhari chapter names
const BUKHARI_SECTIONS_FR = {
  1: 'La Révélation', 2: 'La Foi', 3: 'La Science', 4: 'Les Ablutions (Woudou)',
  5: 'Le Bain rituel (Ghousl)', 6: 'Les Menstrues', 7: 'Le Tayammoum',
  8: 'La Prière (Salat)', 9: 'Les Horaires de prière', 10: "L'Appel à la prière (Adhan)",
  11: 'La Prière du vendredi', 12: 'La Prière de la peur', 13: 'Les Deux fêtes (Aids)',
  14: 'La Prière du Witr', 15: "L'Invocation pour la pluie (Istisqa)", 16: 'Les Éclipses',
  17: 'La Prosternation lors de la récitation', 18: "L'Abrègement de la prière",
  19: 'La Prière de nuit (Tahajjoud)', 20: 'Merites de la prière a La Mecque et Medine',
  21: 'Les Actes durant la prière', 22: "L'Oubli dans la prière",
  23: 'Les Funérailles (Janaza)', 24: "L'Aumône obligatoire (Zakat)",
  25: 'Le Pèlerinage (Hajj)', 26: "La Omra", 27: "L'Empêchement du pèlerinage",
  28: 'Sanction de la chasse en état de sacralisation', 29: 'Les Mérites de Médine',
  30: 'Le Jeûne', 31: 'La Prière de nuit du Ramadan (Tarawih)',
  32: 'Les Mérites de la nuit du Destin', 33: "La Retraite spirituelle (I'tikaf)",
  34: 'Les Ventes et le commerce', 35: 'La Vente à terme (Salam)', 36: 'La Préemption (Chouf a)',
  37: 'La Location', 38: 'Le Transfert de dette (Hawala)', 39: 'La Garantie (Kafala)',
  40: 'La Procuration', 41: "L'Agriculture", 42: "La Distribution de l'eau",
  43: 'Les Prêts et saisies', 44: 'Les Litiges', 45: 'Les Objets trouvés',
  46: "L'Injustice", 47: "L'Association", 48: "L'Hypothèque",
  49: "L'Affranchissement des esclaves", 50: "Le Contrat d'affranchissement",
  51: 'Les Dons', 52: 'Les Témoignages', 53: 'La Réconciliation', 54: 'Les Conditions',
  55: 'Les Testaments', 56: "Le Combat pour la cause d'Allah (Jihad)",
  57: 'Le Cinquième du butin (Khoumouss)', 58: "L'Impôt de capitation (Jizya)",
  59: 'Le Début de la création', 60: 'Les Prophètes',
  61: 'Les Mérites du Prophète et de ses Compagnons', 62: 'Les Compagnons du Prophète',
  63: 'Les Mérites des Auxiliaires de Médine (Ansar)',
  64: 'Les Expéditions militaires du Prophète', 65: "L'Exégèse du Coran (Tafsir)",
  66: 'Les Mérites du Coran', 67: 'Le Mariage (Nikah)', 68: 'Le Divorce',
  69: "L'Entretien de la famille", 70: 'La Nourriture et les repas',
  71: "Le Sacrifice de naissance (Aqiqa)", 72: "La Chasse et l'abattage",
  73: "Le Sacrifice de l'Aid (Oudhiya)", 74: 'Les Boissons',
  75: 'Les Malades', 76: 'La Médecine', 77: "L'Habillement",
  78: 'Les Bonnes manières (Adab)', 79: 'La Demande de permission',
  80: 'Les Invocations', 81: "L'Attendrissement du cœur (Riqaq)",
  82: 'Le Destin divin (Qadar)', 83: 'Les Serments et les voeux',
  84: "L'Expiation des serments non tenus", 85: "Les Lois d'héritage (Fara'id)",
  86: 'Les Limites et châtiments divins (Houdoud)', 87: 'Le Prix du sang (Diyat)',
  88: "Les Apostats", 89: 'Les Déclarations sous contrainte', 90: 'Les Ruses',
  91: "L'Interprétation des rêves", 92: 'Les Épreuves et la fin des temps',
  93: 'Les Jugements (Ahkam)', 94: 'Les Souhaits',
  95: "L'Acceptation d'informations d'une personne véridique",
  96: "L'Attachement au Coran et à la Sunna", 97: "L'Unicité d'Allah (Tawhid)",
}

// French translations for Muslim chapter names
const MUSLIM_SECTIONS_FR = {
  1: 'Le Livre de la foi', 2: 'Le Livre de la purification', 3: 'Le Livre des menstrues',
  4: 'Le Livre de la prière', 5: 'Le Livre des mosquees et lieux de prière',
  6: 'La Prière du voyageur', 7: 'La Prière du vendredi',
  8: 'La Prière des deux fetes', 9: 'La Prière pour la pluie',
  10: 'La Prière des eclipses', 11: 'Les Funérailles', 12: 'Le Livre de la Zakat',
  13: 'Le Livre du jeûne', 14: "Le Livre de l'I'tikaf", 15: 'Le Livre du pèlerinage',
  16: 'Le Livre du mariage', 17: "Le Livre de l'allaitement", 18: 'Le Livre du divorce',
  19: "Le Livre de l'anathème", 20: "Le Livre de l'affranchissement",
  21: 'Le Livre des transactions', 22: 'Le Livre du métayage',
  23: "Le Livre des regles d'heritage", 24: 'Le Livre des dons',
  25: 'Le Livre des testaments', 26: 'Le Livre des voeux', 27: 'Le Livre des serments',
  28: 'Serments, représailles et prix du sang', 29: 'Les Châtiments légaux',
  30: 'Les Décisions judiciaires', 31: 'Les Objets trouvés',
  32: 'Le Jihad et les expéditions', 33: "Le Livre du gouvernement",
  34: "La Chasse, l'abattage et les aliments permis", 35: 'Le Livre des sacrifices',
  36: 'Le Livre des boissons', 37: "L'Habillement et la parure",
  38: 'Les Bonnes manières et l etiquette', 39: 'Les Salutations',
  40: "L'Usage des mots corrects", 41: 'Le Livre de la poésie',
  42: 'Le Livre des rêves', 43: 'Les Vertus',
  44: 'Les Mérites des Compagnons', 45: 'La Vertu et les liens de parenté',
  46: 'Le Destin', 47: 'Le Livre de la science',
  48: "Le Rappel d'Allah, les invocations et le repentir",
  49: 'Les Récits qui attendrissent le cœur', 50: 'Le Livre du repentir',
  51: 'Les Hypocrites et leurs caractères', 52: "Le Jour du Jugement, le Paradis et l'Enfer",
  53: 'Le Paradis, sa description et ses habitants',
  54: 'Les Épreuves et signes de la fin des temps',
  55: "Le Renoncement et l'attendrissement du cœur",
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
