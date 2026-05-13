import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Button from '../components/common/Button'

const PRAYER_NAMES = {
  fajr: { fr: 'Fajr', ar: 'الفجر', icon: '🌅' },
  sunrise: { fr: 'Lever du soleil', ar: 'الشروق', icon: '☀' },
  dhuhr: { fr: 'Dhuhr', ar: 'الظهر', icon: '🌤' },
  asr: { fr: 'Asr', ar: 'العصر', icon: '⛅' },
  maghrib: { fr: 'Maghrib', ar: 'المغرب', icon: '🌅' },
  isha: { fr: 'Isha', ar: 'العشاء', icon: '🌙' },
}

const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function formatCountdown(minutes) {
  if (minutes <= 0) return 'Maintenant'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

function calculateQibla(lat, lng) {
  const meccaLat = 21.4225 * Math.PI / 180
  const meccaLng = 39.8262 * Math.PI / 180
  const userLat = lat * Math.PI / 180
  const userLng = lng * Math.PI / 180
  const dLng = meccaLng - userLng
  const x = Math.sin(dLng)
  const y = Math.cos(userLat) * Math.tan(meccaLat) - Math.sin(userLat) * Math.cos(dLng)
  let qibla = Math.atan2(x, y) * 180 / Math.PI
  return (qibla + 360) % 360
}

export default function PrieresPage() {
  const [times, setTimes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [geoFailed, setGeoFailed] = useState(false)
  const [coords, setCoords] = useState(null)
  const [now, setNow] = useState(new Date())
  const [heading, setHeading] = useState(null)
  const [showQibla, setShowQibla] = useState(false)
  const [cityInput, setCityInput] = useState('')
  const [cityName, setCityName] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('tarjama_location')
    if (saved) {
      try {
        const { lat, lng, city } = JSON.parse(saved)
        setCoords({ lat, lng })
        setCityName(city || '')
        setLoading(true)
        loadTimes(lat, lng)
        return
      } catch {}
    }
    getLocation()
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const saveLocation = (lat, lng, city) => {
    localStorage.setItem('tarjama_location', JSON.stringify({ lat, lng, city }))
  }

  const getLocation = () => {
    if (!navigator.geolocation) { setGeoFailed(true); setLoading(false); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lng: longitude })
        saveLocation(latitude, longitude, '')
        loadTimes(latitude, longitude)
      },
      () => { setGeoFailed(true); setLoading(false) }
    )
  }

  const searchCity = async () => {
    if (!cityInput.trim()) return
    setLoading(true); setError(''); setGeoFailed(false)
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput.trim())}&format=json&limit=1`)
      const data = await r.json()
      if (!data.length) { setError(`Ville "${cityInput}" introuvable`); setLoading(false); return }
      const { lat, lon, display_name } = data[0]
      const latF = parseFloat(lat), lngF = parseFloat(lon)
      setCoords({ lat: latF, lng: lngF })
      setCityName(display_name.split(',')[0])
      saveLocation(latF, lngF, display_name.split(',')[0])
      loadTimes(latF, lngF)
    } catch { setError('Erreur de recherche'); setLoading(false) }
  }

  const loadTimes = async (lat, lng) => {
    try {
      const r = await fetch(`/api/prieres?lat=${lat}&lng=${lng}`)
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setTimes(data)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  useEffect(() => {
    if (!showQibla) return
    const handler = (e) => setHeading(e.alpha)
    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(r => {
          if (r === 'granted') window.addEventListener('deviceorientation', handler)
        }).catch(() => {})
      } else {
        window.addEventListener('deviceorientation', handler)
      }
    }
    return () => window.removeEventListener('deviceorientation', handler)
  }, [showQibla])

  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  let nextPrayer = null
  let nextPrayerMinutes = null
  if (times) {
    for (const key of PRAYER_ORDER) {
      if (key === 'sunrise') continue
      const pMinutes = timeToMinutes(times[key])
      if (pMinutes > nowMinutes) {
        nextPrayer = key
        nextPrayerMinutes = pMinutes - nowMinutes
        break
      }
    }
    if (!nextPrayer) {
      nextPrayer = 'fajr'
      nextPrayerMinutes = (24 * 60 - nowMinutes) + timeToMinutes(times.fajr)
    }
  }

  const qiblaAngle = coords ? calculateQibla(coords.lat, coords.lng) : 0
  const compassRotation = heading !== null ? qiblaAngle - heading : qiblaAngle

  return (
    <>
      <Head><title>Horaires de prière — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>أوقات الصلاة</div>
          {times && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {times.hijri} · {times.date}
            </div>
          )}
        </div>

        {/* Ville actuelle + changer */}
        {cityName && times && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{cityName}</span>
            <button onClick={() => { setTimes(null); setCityInput('') }}
              style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, textDecoration: 'underline' }}>
              Changer
            </button>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement...</div>}

        {/* Formulaire de ville — toujours visible si pas d'horaires */}
        {!times && !loading && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 12, lineHeight: 1.7 }}>
              Entre ta ville pour afficher les horaires de prière
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input autoComplete="off" value={cityInput} onChange={e => setCityInput(e.target.value)}
                placeholder="Ex: Paris, Lyon, Casablanca..."
                onKeyDown={e => { if (e.key === 'Enter') searchCity() }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 8, fontSize: 14,
                  background: 'var(--bg-elevated)', border: '1px solid rgba(201,168,76,.15)',
                  color: 'var(--text)'
                }}
              />
              <Button onClick={searchCity} disabled={!cityInput.trim() || loading}>
                Chercher
              </Button>
            </div>
            <button onClick={getLocation}
              style={{ width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.08)' }}>
              Utiliser ma position GPS
            </button>
            {error && <div style={{ color: 'var(--red)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{error}</div>}
          </div>
        )}

        {/* Prochaine prière — hero */}
        {times && nextPrayer && (
          <div style={{
            textAlign: 'center', padding: '24px 16px', marginBottom: 16, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(201,168,76,.08), rgba(201,168,76,.03))',
            border: '1px solid rgba(201,168,76,.2)'
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>
              Prochaine prière
            </div>
            <div style={{ fontSize: 36, marginBottom: 4 }}>{PRAYER_NAMES[nextPrayer].icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--gold)', letterSpacing: 2 }}>
              {PRAYER_NAMES[nextPrayer].fr}
            </div>
            <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 20, color: 'var(--gold-light)', marginTop: 2 }}>
              {PRAYER_NAMES[nextPrayer].ar}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 8 }}>
              à <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gold)' }}>{times[nextPrayer]}</strong>
            </div>
            <div style={{
              display: 'inline-block', marginTop: 8, padding: '6px 16px', borderRadius: 20,
              background: 'rgba(201,168,76,.1)', fontSize: 13, color: 'var(--gold)', fontWeight: 600
            }}>
              dans {formatCountdown(nextPrayerMinutes)}
            </div>
          </div>
        )}

        {/* Toutes les prières */}
        {times && (
          <div style={{ marginBottom: 20 }}>
            {PRAYER_ORDER.map(key => {
              const p = PRAYER_NAMES[key]
              const time = times[key]
              const pMinutes = timeToMinutes(time)
              const isPast = pMinutes <= nowMinutes
              const isNext = key === nextPrayer
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px',
                  borderBottom: '1px solid rgba(201,168,76,.06)',
                  opacity: isPast && !isNext ? 0.4 : 1,
                  background: isNext ? 'rgba(201,168,76,.06)' : 'transparent',
                  borderRadius: isNext ? 8 : 0
                }}>
                  <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: isNext ? 'var(--gold)' : 'var(--text)', fontWeight: isNext ? 700 : 400 }}>
                      {p.fr}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-arabic)', color: 'var(--text-muted)' }}>{p.ar}</div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: isNext ? 20 : 16,
                    color: isNext ? 'var(--gold)' : 'var(--text-dim)', fontWeight: 600
                  }}>
                    {time}
                  </div>
                  {isPast && key !== 'sunrise' && !isNext && <span style={{ fontSize: 10, color: 'var(--green)' }}>✓</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Qibla */}
        {coords && (
          <div style={{ marginBottom: 24 }}>
            <button onClick={() => setShowQibla(!showQibla)} style={{
              width: '100%', padding: '14px', borderRadius: 10, cursor: 'pointer',
              background: showQibla ? 'rgba(201,168,76,.1)' : 'rgba(201,168,76,.04)',
              border: `1px solid ${showQibla ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.1)'}`,
              fontSize: 14, color: 'var(--text)', fontWeight: 600, textAlign: 'center'
            }}>
              {showQibla ? 'Masquer' : 'Boussole Qibla'} 🕋
            </button>

            {showQibla && (
              <div style={{
                textAlign: 'center', padding: '24px 16px', marginTop: 12, borderRadius: 12,
                background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.1)'
              }}>
                {/* Boussole */}
                <div style={{
                  width: 200, height: 200, margin: '0 auto 16px', position: 'relative',
                  borderRadius: '50%', border: '2px solid rgba(201,168,76,.2)',
                  background: 'rgba(201,168,76,.03)'
                }}>
                  {/* Directions */}
                  {['N', 'E', 'S', 'O'].map((d, i) => (
                    <div key={d} style={{
                      position: 'absolute', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700,
                      ...(i === 0 ? { top: 8, left: '50%', transform: 'translateX(-50%)' } :
                        i === 1 ? { right: 8, top: '50%', transform: 'translateY(-50%)' } :
                        i === 2 ? { bottom: 8, left: '50%', transform: 'translateX(-50%)' } :
                        { left: 8, top: '50%', transform: 'translateY(-50%)' })
                    }}>{d}</div>
                  ))}

                  {/* Aiguille Qibla */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', width: 4, height: 80,
                    background: 'linear-gradient(to top, transparent, var(--gold))',
                    borderRadius: 2, transformOrigin: 'bottom center',
                    transform: `translate(-50%, -100%) rotate(${compassRotation}deg)`,
                    transition: 'transform 0.5s ease'
                  }} />

                  {/* Centre */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 12, height: 12, borderRadius: '50%', background: 'var(--gold)'
                  }} />

                  {/* Kaaba icon */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: `translate(-50%, -50%) rotate(${compassRotation}deg) translateY(-70px)`,
                    fontSize: 20, transition: 'transform 0.5s ease'
                  }}>🕋</div>
                </div>

                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
                  Direction de la Qibla : {Math.round(qiblaAngle)}°
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {heading !== null ? 'Tourne ton téléphone vers la Kaaba 🕋' : 'Ouvre sur mobile pour la boussole en temps réel'}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
