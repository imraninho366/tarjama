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
    // Filtrer la Basmala (verset 1) pour toutes les sourates sauf Al-Fatiha (1)
    // At-Tawba (9) n'a pas de Basmala donc pas besoin de cas spécial
    const ayahs = sourate.number === 1
      ? sourate.ayahs
      : sourate.ayahs.filter(a => !(a.numberInSurah === 1 && a.text.includes('بسم الله')))
    // Renuméroter les versets après filtrage
    const verses = ayahs.map((a, i) => ({ n: i + 1, ar: a.text }))
    return res.status(200).json({
      num: sourate.number,
      name_ar: sourate.name,
      name_fr: sourate.englishName,
      verses
    })
  } catch (err) {
    console.error('Sourate fetch error:', err.message)
    return res.status(500).json({ error: 'Impossible de charger la sourate' })
  }
}
