import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Button from '../components/common/Button'

const ADHKAR = [
  { id: 'subhanallah', ar: 'سُبْحَانَ اللَّهِ', fr: 'Gloire à Allah', translit: 'SubhanAllah', target: 33 },
  { id: 'alhamdulillah', ar: 'الْحَمْدُ لِلَّهِ', fr: 'Louange à Allah', translit: 'Alhamdulillah', target: 33 },
  { id: 'allahuakbar', ar: 'اللَّهُ أَكْبَرُ', fr: 'Allah est le plus Grand', translit: 'Allahu Akbar', target: 34 },
  { id: 'lailaha', ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ', fr: 'Pas de divinité sauf Allah', translit: 'Lā ilāha illā Allāh', target: 100 },
  { id: 'astaghfirullah', ar: 'أَسْتَغْفِرُ اللَّهَ', fr: 'Je demande pardon à Allah', translit: 'Astaghfirullāh', target: 100 },
  { id: 'hawqala', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', fr: 'Pas de force ni de puissance sauf en Allah', translit: 'Lā hawla wa lā quwwata illā billāh', target: 33 },
  { id: 'salawat', ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', fr: 'Ô Allah prie sur Muhammad', translit: 'Allāhumma ṣalli ʿalā Muḥammad', target: 10 },
  { id: 'libre', ar: null, fr: 'Dhikr libre', translit: 'Compteur libre', target: 0 },
]

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
}

function loadDayStats() {
  try {
    const raw = localStorage.getItem('tarjama_dhikr')
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (data.day !== getTodayKey()) return {}
    return data.counts || {}
  } catch { return {} }
}

function saveDayStats(counts) {
  localStorage.setItem('tarjama_dhikr', JSON.stringify({ day: getTodayKey(), counts }))
}

export default function DhikrPage() {
  const [selected, setSelected] = useState(null)
  const [count, setCount] = useState(0)
  const [dayCounts, setDayCounts] = useState({})
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    setDayCounts(loadDayStats())
  }, [])

  const dhikr = selected !== null ? ADHKAR[selected] : null

  const increment = useCallback(() => {
    if (!dhikr) return
    const next = count + 1
    setCount(next)

    if (navigator.vibrate) navigator.vibrate(15)

    if (dhikr.target > 0 && next >= dhikr.target && !completed) {
      setCompleted(true)
      if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50])
      const updated = { ...dayCounts, [dhikr.id]: (dayCounts[dhikr.id] || 0) + dhikr.target }
      setDayCounts(updated)
      saveDayStats(updated)
    }
  }, [count, dhikr, completed, dayCounts])

  const reset = () => { setCount(0); setCompleted(false) }

  const selectDhikr = (idx) => { setSelected(idx); setCount(0); setCompleted(false) }

  const totalToday = Object.values(dayCounts).reduce((a, b) => a + b, 0)
  const pct = dhikr?.target > 0 ? Math.min(100, Math.round(count / dhikr.target * 100)) : 0

  return (
    <>
      <Head><title>Dhikr — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>الأذكار</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Tasbeeh digital — Compteur de dhikr</div>
          {totalToday > 0 && (
            <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 6 }}>
              {totalToday} dhikr aujourd'hui
            </div>
          )}
        </div>

        {/* Sélection du dhikr */}
        {selected === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ADHKAR.map((d, i) => (
              <button key={d.id} onClick={() => selectDhikr(i)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)',
                transition: 'all .15s'
              }}>
                {d.ar ? (
                  <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 18, color: 'var(--gold-light)', direction: 'rtl', flex: 1 }}>
                    {d.ar}
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: 'var(--text)', flex: 1 }}>{d.fr}</div>
                )}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{d.translit}</div>
                  {d.target > 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>×{d.target}</div>}
                  {dayCounts[d.id] > 0 && <div style={{ fontSize: 10, color: 'var(--green)' }}>✓ {dayCounts[d.id]}</div>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Compteur actif */}
        {dhikr && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => { setSelected(null); reset() }}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
              ← Changer de dhikr
            </button>

            {/* Texte arabe */}
            {dhikr.ar && (
              <div style={{
                fontFamily: 'var(--font-arabic)', fontSize: 32, color: 'var(--gold-light)',
                direction: 'rtl', lineHeight: 1.8, marginBottom: 8
              }}>
                {dhikr.ar}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>{dhikr.translit}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>{dhikr.fr}</div>

            {/* Cercle compteur */}
            <div
              onClick={increment}
              style={{
                width: 200, height: 200, borderRadius: '50%', margin: '0 auto 20px',
                background: completed ? 'rgba(var(--tarjama-color-success-rgb, 45, 122, 79),.08)' : 'rgba(var(--tarjama-color-primary-rgb),.06)',
                border: `3px solid ${completed ? 'var(--green)' : 'rgba(var(--tarjama-color-primary-rgb),.2)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
                transition: 'all .15s', position: 'relative'
              }}
            >
              {/* Barre de progression circulaire */}
              {dhikr.target > 0 && (
                <svg width="200" height="200" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                  <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(var(--tarjama-color-primary-rgb),.08)" strokeWidth="3" />
                  <circle cx="100" cy="100" r="95" fill="none"
                    stroke={completed ? 'var(--green)' : 'var(--gold)'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 95}`}
                    strokeDashoffset={`${2 * Math.PI * 95 * (1 - pct / 100)}`}
                    style={{ transition: 'stroke-dashoffset .3s ease' }}
                  />
                </svg>
              )}

              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 700,
                color: completed ? 'var(--green)' : 'var(--gold)', lineHeight: 1
              }}>
                {count}
              </div>
              {dhikr.target > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  / {dhikr.target}
                </div>
              )}
            </div>

            {completed && (
              <div style={{
                fontSize: 14, color: 'var(--green)', fontWeight: 600, marginBottom: 16,
                animation: 'fadeInUp .3s ease'
              }}>
                ما شاء الله — Série complète !
              </div>
            )}

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
              Appuie sur le cercle pour compter
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button variant="ghost" onClick={reset}>Réinitialiser</Button>
              {completed && <Button onClick={() => { reset() }}>Encore une série</Button>}
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
