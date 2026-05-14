import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { SOURATES_LIST } from '../lib/sourates'
import { G, AVATAR_COLORS } from '../lib/theme'
import { isAdmin } from '../lib/freemium'
import Link from 'next/link'
import Button from '../components/common/Button'

export default function ProfilPage({ user, profile, onLogout }) {
  const router = useRouter()
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    if (!user) { router.push('/'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    const { data, error } = await supabase.from('progress').select('*').eq('user_id', user.id)
    if (error) { console.error('profil loadData:', error.message); setLoading(false); return }
    const map = {}
    data?.forEach(r => {
      map[`${r.sourate_num}:${r.verse_num}`] = { niveau: r.niveau, ts: r.updated_at }
    })
    setProgress(map)
    setLoading(false)
  }

  if (!user || !profile) return null

  const entries = Object.values(progress)
  const total = entries.length
  const excellent = entries.filter(p => p.niveau === 'excellent' || p.niveau === 'good').length
  const partial = entries.filter(p => p.niveau === 'partial').length
  const wrong = entries.filter(p => p.niveau === 'wrong').length

  // Total versets dans le Coran
  const TOTAL_QURAN_VERSES = 6236

  const sourates = SOURATES_LIST.map(s => {
    const done = Object.keys(progress).filter(k => k.startsWith(`${s.n}:`)).length
    const ok = Object.keys(progress).filter(k => {
      if (!k.startsWith(`${s.n}:`)) return false
      const p = progress[k]
      return p.niveau === 'excellent' || p.niveau === 'good'
    }).length
    return { ...s, done, ok, pct: s.v > 0 ? Math.round(done / s.v * 100) : 0 }
  }).filter(s => s.done > 0).sort((a, b) => b.pct - a.pct)


  const days = new Set()
  entries.forEach(p => {
    if (p.ts) { const d = new Date(p.ts); days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) }
  })

  // Mots connus (quiz)
  const quizHistory = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tarjama_quiz_history') || '[]') : []
  const knownWords = [...new Set(quizHistory.filter(h => h.ok).map(h => h.ar))]
  const TOTAL_QURAN_WORDS = 6344
  const pctMotsConnus = TOTAL_QURAN_WORDS > 0 ? Math.round(knownWords.length / TOTAL_QURAN_WORDS * 100) : 0

  // % mémorisation du Coran (versets excellents / total versets)
  const pctMemorisation = TOTAL_QURAN_VERSES > 0 ? Math.round(excellent / TOTAL_QURAN_VERSES * 100) : 0

  const tabStyle = (t) => ({
    padding: '8px 16px', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase',
    background: tab === t ? 'rgba(var(--tarjama-color-primary-rgb),.12)' : 'transparent',
    color: tab === t ? 'var(--gold)' : 'var(--text-muted)',
    border: 'none', borderBottom: tab === t ? `2px solid ${'var(--gold)'}` : '2px solid transparent',
    cursor: 'pointer', fontWeight: 600
  })

  return (
    <>
      <Head><title>Profil — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        {/* Header profil */}
        <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
            background: profile.color || 'var(--gold)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, color: 'var(--bg-card)', fontWeight: 700,
            border: `3px solid ${'var(--gold)'}40`
          }}>
            {profile.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--text)', fontWeight: 600 }}>
            {profile.username}
          </div>
        </div>

        {/* Stats principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            [total, 'Versets traduits', 'var(--gold)'],
            [excellent, 'Excellents', 'var(--green)'],
            [knownWords.length, 'Mots connus', 'var(--blue)'],
          ].map(([num, lbl, clr]) => (
            <div key={lbl} style={{
              textAlign: 'center', padding: '12px 4px',
              background: 'rgba(var(--tarjama-color-primary-rgb),.04)', borderRadius: 8,
              border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)'
            }}>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: clr, fontWeight: 700 }}>{num}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Barres de progression Coran */}
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text)' }}>Vocabulaire du Coran</span>
            <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--blue)', fontWeight: 700 }}>{pctMotsConnus}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(var(--tarjama-color-primary-rgb),.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${pctMotsConnus}%`, background: 'var(--blue)', transition: 'width .5s ease' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{knownWords.length} / {TOTAL_QURAN_WORDS} mots uniques</div>

          <div style={{ borderTop: '1px solid rgba(var(--tarjama-color-primary-rgb),.06)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text)' }}>Mémorisation du Coran</span>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--green)', fontWeight: 700 }}>{pctMemorisation}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(var(--tarjama-color-primary-rgb),.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${pctMemorisation}%`, background: 'var(--green)', transition: 'width .5s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{excellent} / {TOTAL_QURAN_VERSES} versets maîtrisés</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)', marginBottom: 16 }}>
          <button onClick={() => setTab('stats')} style={tabStyle('stats')}>Progression</button>
        </div>

        {/* Progression par sourate */}
        {tab === 'stats' && (
          <div>
            {sourates.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                Aucune sourate commencée. Traduis ton premier verset !
              </div>
            )}
            {sourates.map(s => (
              <div key={s.n} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderBottom: '1px solid rgba(var(--tarjama-color-primary-rgb),.05)'
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{s.n}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{s.ar} — {s.fr}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.done}/{s.v}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(var(--tarjama-color-primary-rgb),.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${s.pct}%`,
                      background: s.pct >= 80 ? 'var(--green)' : s.pct >= 40 ? 'var(--gold)' : 'var(--orange)',
                      transition: 'width .5s ease'
                    }} />
                  </div>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'right',
                  color: s.pct >= 80 ? 'var(--green)' : s.pct >= 40 ? 'var(--gold)' : 'var(--orange)'
                }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 24, paddingBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isAdmin(user.id) && (
            <Link href="/admin" style={{
              display: 'block', textAlign: 'center', padding: '12px', borderRadius: 8,
              background: 'rgba(var(--tarjama-color-primary-rgb),.08)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.15)',
              color: 'var(--gold)', fontSize: 14, fontWeight: 600, textDecoration: 'none'
            }}>
              Administration
            </Link>
          )}
          <Button variant="ghost" full onClick={onLogout} style={{ color: 'var(--red)', borderColor: 'rgba(var(--tarjama-color-error-rgb, 184, 74, 74),.2)' }}>
            Déconnexion
          </Button>
        </div>
      </div>
    </>
  )
}
