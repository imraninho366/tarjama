const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions'
const COLLECTIONS = {
  bukhari: { name: 'Sahih al-Bukhari', nameAr: 'صحيح البخاري', author: 'Imam al-Bukhari' },
  muslim:  { name: 'Sahih Muslim',     nameAr: 'صحيح مسلم',     author: 'Imam Muslim' },
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
        name: name || `Chapitre ${num}`,
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
      sectionName: sections[secNum] || `Chapitre ${secNum}`,
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
