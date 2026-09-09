import { cacheGet, cacheSet } from '../../lib/cache'
import { rateLimit } from '../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  /*
   * Cette route relaie une API tierce (Aladhan) avec des coordonnees fournies
   * par l'appelant. Elle etait la SEULE route externe sans limite de debit,
   * alors que la convention du projet est de toutes les limiter.
   *
   * Le cache ne protegeait rien ici : sa cle contient les coordonnees, donc il
   * suffisait de les faire varier d'un millieme de degre pour le contourner a
   * chaque appel et faire porter le trafic — et la facture — par ce projet.
   *
   * La limite est plus large que celle des routes IA : une vraie page charge
   * ses horaires une fois, mais un foyer ou un reseau mobile partage une seule
   * adresse IP entre plusieurs personnes.
   */
  const { ok } = rateLimit(req, { limit: 30, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const { lat, lng, method = '2' } = req.query
  if (!lat || !lng) return res.status(400).json({ error: 'Coordonnées manquantes' })

  // Des coordonnees non numeriques partaient telles quelles dans l'URL de
  // l'API tierce.
  const latN = Number(lat), lngN = Number(lng)
  if (!Number.isFinite(latN) || Math.abs(latN) > 90 || !Number.isFinite(lngN) || Math.abs(lngN) > 180) {
    return res.status(400).json({ error: 'Coordonnées invalides' })
  }

  const today = new Date()
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
  // La cle utilise les coordonnees VALIDEES : « 48.85 » et « 48.850 » designent
  // le meme endroit et doivent partager la meme entree.
  //
  // Elles ne sont volontairement PAS arrondies. Arrondir au centieme de degre
  // (~1,1 km) multiplierait les reprises de cache, mais decalerait les horaires
  // de quelques secondes — assez, parfois, pour changer la minute affichee.
  // Sur des heures de priere, on ne troque pas de l'exactitude contre de la
  // bande passante.
  const cacheKey = `prayer:${latN}:${lngN}:${dateStr}`
  const cached = cacheGet(cacheKey)
  if (cached) return res.json(cached)

  try {
    const r = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latN}&longitude=${lngN}&method=${encodeURIComponent(method)}`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
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
    // Le message brut d'une exception ne dit rien a l'utilisateur et decrit
    // l'infrastructure a qui la lit.
    console.error('[prieres] Aladhan:', err.message)
    return res.status(502).json({ error: 'Les horaires sont momentanément indisponibles.' })
  }
}
