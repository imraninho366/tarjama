export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  
  const { num } = req.query
  if (!num || isNaN(num) || num < 1 || num > 114) {
    return res.status(400).json({ error: 'Numéro de sourate invalide (1-114)' })
  }

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${num}/ar.asem`)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const data = await response.json()
    if (data.code !== 200) throw new Error('Sourate non trouvée')
    
    const sourate = data.data
    return res.status(200).json({
      num: sourate.number,
      name_ar: sourate.name,
      name_fr: sourate.englishName, // on va surcharger avec nos noms FR
      verses: sourate.ayahs.map(a => ({ n: a.numberInSurah, ar: a.text }))
    })
  } catch (err) {
    console.error('Sourate fetch error:', err.message)
    return res.status(500).json({ error: 'Impossible de charger la sourate' })
  }
}
