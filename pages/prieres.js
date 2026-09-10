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

  const [coords, setCoords] = useState(null)
  const [now, setNow] = useState(new Date())
  // Cap du telephone en degres, dans le sens des aiguilles d'une montre depuis
  // le nord, deja corrige de l'orientation de l'ecran. null = inconnu.
  const [heading, setHeading] = useState(null)
  const [showQibla, setShowQibla] = useState(false)
  // 'attente' | 'ok' | 'refusee' | 'indisponible'
  const [capteur, setCapteur] = useState('attente')
  // Precision annoncee par iOS (webkitCompassAccuracy), en degres.
  const [precision, setPrecision] = useState(null)
  const dernierCapRef = useRef(null)
  const rotationAiguilleRef = useRef(null)
  const rotationCadranRef = useRef(null)
  const alignementSignaleRef = useRef(false)
  const [cityInput, setCityInput] = useState('')
  const [cityName, setCityName] = useState('')

  /*
   * L'horloge, dans son propre effet.
   *
   * Elle vivait a la fin de l'effet de demarrage, APRES un `return` qui
   * s'executait des qu'une position etait enregistree. Autrement dit elle ne
   * demarrait que la toute premiere fois : pour tous ceux qui revenaient — donc
   * pour tout le monde — le compte a rebours restait fige sur l'heure du
   * chargement et n'avancait plus. C'est la seule chose que cette page a a
   * faire, et elle ne la faisait pas.
   */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

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
      } catch {
        // Position enregistree illisible : on repart de la geolocalisation
        // plutot que de rester bloque sur un ecran vide.
        console.warn('[prieres] position enregistree illisible, ignoree')
      }
    }
    getLocation()
  }, [])

  const saveLocation = (lat, lng, city) => {
    localStorage.setItem('tarjama_location', JSON.stringify({ lat, lng, city }))
  }

  /*
   * L'echec de geolocalisation etait range dans un etat `geoFailed` que RIEN
   * n'affichait : l'utilisateur voyait le formulaire de ville apparaitre sans
   * savoir pourquoi, et sans savoir si reessayer servirait a quelque chose.
   * Or les trois causes n'appellent pas la meme reaction — un refus se leve
   * dans les reglages, une panne de signal se retente, un navigateur sans GPS
   * ne se repare pas.
   */
  const getLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Ton navigateur ne sait pas te localiser. Entre ta ville ci-dessous.')
      setLoading(false)
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lng: longitude })
        saveLocation(latitude, longitude, '')
        loadTimes(latitude, longitude)
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'La localisation est bloquée. Autorise-la dans les réglages de ton navigateur, ou entre ta ville ci-dessous.'
            : err.code === err.TIMEOUT
              ? 'La localisation a mis trop de temps. Réessaie, ou entre ta ville ci-dessous.'
              : 'Ta position n’a pas pu être déterminée. Entre ta ville ci-dessous.'
        )
        setLoading(false)
      },
      // Sans delai maximum, certains navigateurs ne rappellent jamais : le
      // « Chargement... » restait alors affiche indefiniment.
      { timeout: 10000, maximumAge: 300000 }
    )
  }

  const searchCity = async () => {
    if (!cityInput.trim()) return
    setLoading(true); setError('')
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
    } catch (err) {
      console.error('[prieres] horaires:', err.message)
      // Sans cette remise a zero, les horaires du chargement precedent
      // restaient affiches sous le message d'erreur — donc presentes comme
      // valables alors qu'ils pouvaient dater d'un autre jour ou d'une autre
      // ville.
      setTimes(null)
      setError('Les horaires n’ont pas pu être récupérés. Vérifie ta connexion et réessaie.')
    }
    setLoading(false)
  }

  /*
   * Ouverture de la boussole — la demande d'autorisation se fait ICI, dans le
   * clic, et nulle part ailleurs.
   *
   * iOS n'accorde l'acces a l'orientation que si requestPermission() est
   * appele DIRECTEMENT par un geste de l'utilisateur. L'ancienne version
   * l'appelait depuis un useEffect, apres le clic : iOS refusait, le refus
   * etait avale par un `.catch(() => {})`, et sur iPhone la boussole n'a donc
   * jamais fonctionne — tout en affichant « ouvre sur mobile »… sur un mobile.
   */
  const basculerQibla = async () => {
    if (showQibla) { setShowQibla(false); return }
    setHeading(null); setPrecision(null)
    dernierCapRef.current = null
    alignementSignaleRef.current = false

    const DOE = typeof window !== 'undefined' ? window.DeviceOrientationEvent : undefined
    if (!DOE) { setCapteur('indisponible'); setShowQibla(true); return }

    if (typeof DOE.requestPermission === 'function') {
      try {
        const reponse = await DOE.requestPermission()
        if (reponse !== 'granted') { setCapteur('refusee'); setShowQibla(true); return }
      } catch (err) {
        console.warn('[qibla] autorisation refusee:', err?.message)
        setCapteur('refusee'); setShowQibla(true); return
      }
    }
    setCapteur('attente')
    setShowQibla(true)
  }

  /*
   * Lecture du cap.
   *
   * `e.alpha`, utilise jusqu'ici, n'est PAS un cap boussole :
   *   - sur iPhone, c'est un angle relatif a la position du telephone au
   *     moment ou la page a commence a ecouter — le vrai cap est dans
   *     `webkitCompassHeading` ;
   *   - sur Android, l'evenement `deviceorientation` n'est pas rapporte au
   *     nord ; seul `deviceorientationabsolute` l'est, et son alpha tourne
   *     dans le sens INVERSE des aiguilles d'une montre.
   * L'aiguille tournait donc a l'envers, par rapport a un nord arbitraire.
   *
   * Un angle seulement relatif est ignore plutot qu'affiche : sur une
   * direction de priere, une aiguille fausse est pire qu'une aiguille absente.
   */
  useEffect(() => {
    if (!showQibla || capteur === 'refusee' || capteur === 'indisponible') return

    const evenement = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation'
    const angleEcran = () => (window.screen?.orientation?.angle ?? window.orientation ?? 0)

    const handler = (e) => {
      let cap = null
      if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
        cap = e.webkitCompassHeading                        // iOS : deja horaire, depuis le nord
      } else if ((e.absolute || e.type === 'deviceorientationabsolute') && typeof e.alpha === 'number') {
        cap = 360 - e.alpha                                 // Android : alpha est anti-horaire
      }
      if (cap === null) return

      cap = (((cap + angleEcran()) % 360) + 360) % 360       // telephone tenu en paysage
      // Le capteur emet des dizaines de fois par seconde : on ne redessine
      // qu'au-dela d'un degre, sinon la page se re-rend en continu.
      const ecart = dernierCapRef.current === null ? 360 : Math.abs(((cap - dernierCapRef.current + 540) % 360) - 180)
      if (ecart >= 1) { dernierCapRef.current = cap; setHeading(cap) }
      if (typeof e.webkitCompassAccuracy === 'number') setPrecision(e.webkitCompassAccuracy)
      setCapteur('ok')
    }

    window.addEventListener(evenement, handler)
    // Un ordinateur ou un telephone sans magnetometre n'emet jamais de cap
    // absolu. Sans ce delai, l'ecran attendait indefiniment sans le dire.
    const delai = setTimeout(() => setCapteur(c => (c === 'attente' ? 'indisponible' : c)), 3000)
    return () => { window.removeEventListener(evenement, handler); clearTimeout(delai) }
  }, [showQibla, capteur === 'refusee' || capteur === 'indisponible'])

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

  /*
   * Rotation « deroulee » : on ajoute toujours le plus petit ecart a l'angle
   * precedent au lieu de sauter a la nouvelle valeur. Sans cela, passer de 359°
   * a 1° faisait tourner l'animation CSS de 358° dans le mauvais sens.
   */
  const derouler = (ref, cible) => {
    if (ref.current === null) { ref.current = cible; return cible }
    const ecart = ((cible - ref.current) % 360 + 540) % 360 - 180
    ref.current += ecart
    return ref.current
  }
  const compassRotation = derouler(rotationAiguilleRef, heading !== null ? qiblaAngle - heading : qiblaAngle)
  // Le cadran (N, E, S, O) tourne avec le monde, pas avec l'ecran.
  const rotationCadran = derouler(rotationCadranRef, heading !== null ? -heading : 0)
  // Ecart entre le haut du telephone et la Qibla, dans [-180, 180].
  const ecartQibla = heading !== null ? ((qiblaAngle - heading) % 360 + 540) % 360 - 180 : null
  const aligne = ecartQibla !== null && Math.abs(ecartQibla) <= 5
  const precisionDouteuse = precision !== null && (precision < 0 || precision > 20)

  // Une vibration quand on arrive face a la Qibla, une seule fois : elle se
  // rearme quand on s'en eloigne nettement, pas a chaque degre de tremblement.
  useEffect(() => {
    if (ecartQibla === null) return
    if (aligne && !alignementSignaleRef.current) {
      alignementSignaleRef.current = true
      if (navigator.vibrate) navigator.vibrate(60)
    } else if (Math.abs(ecartQibla) > 15) {
      alignementSignaleRef.current = false
    }
  }, [aligne, ecartQibla])

  return (
    <>
      <Head><title>Horaires de prière — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <h1 style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)', margin: 0, fontWeight: 400 }} lang="ar" dir="rtl">أوقات الصلاة</h1>
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
                  background: 'var(--bg-elevated)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.15)',
                  color: 'var(--text)'
                }}
              />
              <Button onClick={searchCity} disabled={!cityInput.trim() || loading}>
                Chercher
              </Button>
            </div>
            <button onClick={getLocation}
              style={{ width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)' }}>
              Utiliser ma position GPS
            </button>
            {error && <div style={{ color: 'var(--red)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{error}</div>}
          </div>
        )}

        {/* Prochaine prière — hero */}
        {times && nextPrayer && (
          <div style={{
            textAlign: 'center', padding: '24px 16px', marginBottom: 16, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(var(--tarjama-color-primary-rgb),.08), rgba(var(--tarjama-color-primary-rgb),.03))',
            border: '1px solid rgba(var(--tarjama-color-primary-rgb),.2)'
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>
              Prochaine prière
            </div>
            <div style={{ fontSize: 36, marginBottom: 4 }}>{PRAYER_NAMES[nextPrayer].icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--gold)', letterSpacing: 2 }}>
              {PRAYER_NAMES[nextPrayer].fr}
            </div>
            <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 20, color: 'var(--gold-light)', marginTop: 2 }} lang="ar" dir="rtl">
              {PRAYER_NAMES[nextPrayer].ar}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 8 }}>
              à <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gold)' }}>{times[nextPrayer]}</strong>
            </div>
            <div style={{
              display: 'inline-block', marginTop: 8, padding: '6px 16px', borderRadius: 20,
              background: 'rgba(var(--tarjama-color-primary-rgb),.1)', fontSize: 13, color: 'var(--gold)', fontWeight: 600
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
                  borderBottom: '1px solid rgba(var(--tarjama-color-primary-rgb),.06)',
                  opacity: isPast && !isNext ? 0.4 : 1,
                  background: isNext ? 'rgba(var(--tarjama-color-primary-rgb),.06)' : 'transparent',
                  borderRadius: isNext ? 8 : 0
                }}>
                  <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: isNext ? 'var(--gold)' : 'var(--text)', fontWeight: isNext ? 700 : 400 }}>
                      {p.fr}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-arabic)', color: 'var(--text-muted)' }} lang="ar" dir="rtl">{p.ar}</div>
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
            <button onClick={basculerQibla} style={{
              width: '100%', padding: '14px', borderRadius: 10, cursor: 'pointer',
              background: showQibla ? 'rgba(var(--tarjama-color-primary-rgb),.1)' : 'rgba(var(--tarjama-color-primary-rgb),.04)',
              border: `1px solid ${showQibla ? 'rgba(var(--tarjama-color-primary-rgb),.25)' : 'rgba(var(--tarjama-color-primary-rgb),.1)'}`,
              fontSize: 14, color: 'var(--text)', fontWeight: 600, textAlign: 'center'
            }}>
              {showQibla ? 'Masquer' : 'Boussole Qibla'} 🕋
            </button>

            {showQibla && (
              <div style={{
                textAlign: 'center', padding: '24px 16px', marginTop: 12, borderRadius: 12,
                background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)'
              }}>
                {/* Boussole */}
                <div style={{
                  width: 200, height: 200, margin: '0 auto 16px', position: 'relative',
                  borderRadius: '50%', border: '2px solid rgba(var(--tarjama-color-primary-rgb),.2)',
                  background: 'rgba(var(--tarjama-color-primary-rgb),.03)'
                }}>
                  {/* Directions : elles restaient fixes a l'ecran, si bien que le
                      « N » designait le haut du telephone et non le nord. Le
                      cadran tourne desormais a l'oppose du cap. */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    transform: `rotate(${rotationCadran}deg)`, transition: 'transform 0.3s ease-out'
                  }}>
                    {['N', 'E', 'S', 'O'].map((d, i) => (
                      <div key={d} style={{
                        position: 'absolute', fontSize: 11, fontWeight: 700,
                        color: d === 'N' ? 'var(--red)' : 'var(--text-muted)',
                        ...(i === 0 ? { top: 8, left: '50%', transform: 'translateX(-50%)' } :
                          i === 1 ? { right: 8, top: '50%', transform: 'translateY(-50%)' } :
                          i === 2 ? { bottom: 8, left: '50%', transform: 'translateX(-50%)' } :
                          { left: 8, top: '50%', transform: 'translateY(-50%)' })
                      }}>{d}</div>
                    ))}
                  </div>

                  {/* Repere fixe : le haut du telephone. Aligner l'aiguille
                      dessus, c'est etre face a la Qibla. */}
                  {heading !== null && (
                    <div style={{
                      position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                      width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                      borderTop: `10px solid ${aligne ? 'var(--green)' : 'var(--text-muted)'}`
                    }} />
                  )}

                  {/* Aiguille Qibla */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', width: 4, height: 80,
                    background: 'linear-gradient(to top, transparent, var(--gold))',
                    borderRadius: 2, transformOrigin: 'bottom center',
                    transform: `translate(-50%, -100%) rotate(${compassRotation}deg)`,
                    transition: 'transform 0.3s ease-out'
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
                    fontSize: 20, transition: 'transform 0.3s ease-out'
                  }}>🕋</div>
                </div>

                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
                  Direction de la Qibla : {Math.round(qiblaAngle)}°
                </div>
                <div role="status" aria-live="polite" style={{ fontSize: 12, lineHeight: 1.6, color: aligne ? 'var(--green)' : 'var(--text-muted)', fontWeight: aligne ? 700 : 400 }}>
                  {capteur === 'ok' && heading !== null && (aligne
                    ? 'Tu es face à la Qibla ✓'
                    : `Tourne-toi vers la ${ecartQibla > 0 ? 'droite' : 'gauche'} de ${Math.round(Math.abs(ecartQibla))}°, jusqu’à aligner la Kaaba avec le repère en haut.`)}
                  {capteur === 'attente' && 'Recherche de la boussole…'}
                  {/* « Refuse » ne veut pas forcement dire que l'utilisateur a
                      refuse : Chrome repond aussi `denied` sur un ordinateur
                      sans boussole, sans rien demander. Les deux cas sont
                      indiscernables, le message couvre donc les deux. */}
                  {capteur === 'refusee' && 'Ton navigateur ne donne pas accès à l’orientation. Si une demande s’est affichée et que tu l’as refusée, recharge la page et accepte-la. Sur un ordinateur, il n’y a pas de boussole : le cadran est orienté nord en haut, tourne-le face au nord pour lire la direction.'}
                  {capteur === 'indisponible' && 'Cet appareil ne fournit pas de boussole (ordinateur, ou téléphone sans magnétomètre). Le cadran est orienté nord en haut : tourne-le face au nord pour lire la direction.'}
                </div>
                {precisionDouteuse && (
                  <div style={{ fontSize: 11, color: 'var(--orange)', marginTop: 6, lineHeight: 1.5 }}>
                    Boussole imprécise : décris un 8 dans l’air avec ton téléphone pour la calibrer.
                  </div>
                )}
                {capteur === 'ok' && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                    Écart possible de quelques degrés : la boussole du téléphone suit le nord magnétique et réagit au métal proche.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
