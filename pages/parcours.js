import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useVocab } from '../lib/useVocab'
import Button from '../components/common/Button'

const PARCOURS = [
  { id: 'top100', title: 'Les 100 mots essentiels', desc: 'Les mots les plus fréquents du Coran', days: 30, wordsPerDay: 4, filter: (v) => v.sort((a, b) => (b.freq || 0) - (a.freq || 0)).slice(0, 100) },
  { id: 'noms50', title: '50 noms à connaître', desc: 'Les noms les plus importants', days: 15, wordsPerDay: 4, filter: (v) => v.filter(w => w.type === 'nom').sort((a, b) => (b.freq || 0) - (a.freq || 0)).slice(0, 50) },
  { id: 'verbes50', title: '50 verbes à maîtriser', desc: 'Les verbes essentiels du Coran', days: 15, wordsPerDay: 4, filter: (v) => v.filter(w => w.type === 'verbe').sort((a, b) => (b.freq || 0) - (a.freq || 0)).slice(0, 50) },
  { id: 'racines30', title: '30 racines fondamentales', desc: 'Comprendre les familles de mots', days: 30, wordsPerDay: 1, filter: (v) => {
    const roots = {}
    v.forEach(w => { if (w.racine && !roots[w.racine]) roots[w.racine] = w })
    return Object.values(roots).sort((a, b) => (b.freq || 0) - (a.freq || 0)).slice(0, 30)
  }},
]

export default function ParcoursPage({ user }) {
  const router = useRouter()
  const { vocab, loading: vocabLoading } = useVocab()
  const [activeParcours, setActiveParcours] = useState(null)
  const [currentDay, setCurrentDay] = useState(0)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    const saved = localStorage.getItem('tarjama_parcours')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setActiveParcours(data.id)
        const startDate = new Date(data.startDate)
        const today = new Date()
        const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
        setCurrentDay(Math.min(diff, data.days - 1))
      } catch {}
    }
  }, [user])

  if (!user) return null

  const startParcours = (p) => {
    localStorage.setItem('tarjama_parcours', JSON.stringify({ id: p.id, startDate: new Date().toISOString(), days: p.days }))
    setActiveParcours(p.id)
    setCurrentDay(0)
  }

  const parcours = activeParcours ? PARCOURS.find(p => p.id === activeParcours) : null
  const words = parcours && vocab.length > 0 ? parcours.filter([...vocab]) : []
  const todayWords = words.slice(currentDay * (parcours?.wordsPerDay || 4), (currentDay + 1) * (parcours?.wordsPerDay || 4))

  return (
    <>
      <Head><title>Parcours — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>المسار</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Parcours d'apprentissage guidé</div>
        </div>

        {/* Choix du parcours */}
        {!activeParcours && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PARCOURS.map(p => (
              <div key={p.id} style={{
                padding: '16px', borderRadius: 12,
                background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.12)',
                cursor: 'pointer', transition: 'all .15s'
              }} onClick={() => startParcours(p)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>{p.title}</div>
                  <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{p.days} jours</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.desc}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>{p.wordsPerDay} mots par jour</div>
              </div>
            ))}
          </div>
        )}

        {/* Parcours actif */}
        {parcours && (
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', marginBottom: 16,
              background: 'rgba(201,168,76,.06)', borderRadius: 10, border: '1px solid rgba(201,168,76,.12)'
            }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{parcours.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jour {currentDay + 1} / {parcours.days}</div>
              </div>
              <button onClick={() => { setActiveParcours(null); localStorage.removeItem('tarjama_parcours') }}
                style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Changer
              </button>
            </div>

            {/* Barre de progression */}
            <div style={{ height: 6, background: 'rgba(201,168,76,.08)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width .5s ease',
                width: `${Math.round(((currentDay + 1) / parcours.days) * 100)}%`,
                background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))'
              }} />
            </div>

            {/* Mots du jour */}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              Mots du jour {currentDay + 1}
            </div>
            {todayWords.map((w, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                marginBottom: 8, borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,.1)'
              }}>
                <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 24, color: 'var(--gold-light)', direction: 'rtl', minWidth: 70, textAlign: 'right' }}>
                  {w.ar}
                </div>
                <div style={{ flex: 1 }}>
                  {w.translit && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.translit}</div>}
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    {Array.isArray(w.sens) ? w.sens.slice(0, 2).join(' / ') : w.sens}
                  </div>
                  {w.racine && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Racine : {w.racine}</div>}
                </div>
                {w.freq > 0 && <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{w.freq}×</div>}
              </div>
            ))}

            {/* Navigation jours */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              {currentDay > 0 && <Button variant="secondary" onClick={() => setCurrentDay(d => d - 1)}>← Jour {currentDay}</Button>}
              {currentDay < parcours.days - 1 && currentDay < Math.floor(words.length / parcours.wordsPerDay) - 1 && (
                <Button onClick={() => setCurrentDay(d => d + 1)}>Jour {currentDay + 2} →</Button>
              )}
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
