import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { lat, lng, method = '2' } = req.query
  if (!lat || !lng) return res.status(400).json({ error: 'Coordonnées manquantes' })

  const today = new Date()
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
  const cacheKey = `prayer:${lat}:${lng}:${dateStr}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.json(cached)

  try {
    const r = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}`)
    const data = await r.json()
    if (data.code !== 200) throw new Error('API error')

    const timings = data.data.timings
    const result = {
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      date: data.data.date.readable,
      hijri: `${data.data.date.hijri.day} ${data.data.date.hijri.month.ar} ${data.data.date.hijri.year}`,
      hijriFr: `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`,
    }
    cacheSet(cacheKey, result)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
