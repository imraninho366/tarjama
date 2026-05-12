import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useVocab } from '../lib/useVocab'

export default function RacinesPage({ user }) {
  const router = useRouter()
  const { vocab, loading } = useVocab()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  if (!user) { if (typeof window !== 'undefined') router.push('/'); return null }

  const roots = useMemo(() => {
    const map = {}
    vocab.forEach(w => {
      if (!w.racine) return
      // Filter out inconsistent roots: root letters must be Arabic only
      if (/[a-z]/i.test(w.racine)) return
      const rootLetters = w.racine.split('-').map(l => l.trim())
      if (rootLetters.length !== 3) return
      // Check at least 1 root letter appears in the word (filter column-shifted)
      const clean = (w.ar || '').replace(/[ً-ٰٟٱ]/g, '')
      const found = rootLetters.filter(r => clean.includes(r)).length
      if (found === 0) return
      if (!map[w.racine]) map[w.racine] = { racine: w.racine, mots: [], totalFreq: 0 }
      map[w.racine].mots.push(w)
      map[w.racine].totalFreq += w.freq || 0
    })
    return Object.values(map).sort((a, b) => b.totalFreq - a.totalFreq)
  }, [vocab])

  const filtered = search.trim()
    ? roots.filter(r => r.racine.includes(search) || r.mots.some(m => m.ar?.includes(search) || m.sens?.some(s => s.toLowerCase().includes(search.toLowerCase()))))
    : roots

  const selectedRoot = roots.find(r => r.racine === selected)

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement...</div>

  return (
    <>
      <Head><title>Racines — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>الجذور</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {roots.length} racines triconsonantiques du Coran
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          background: 'var(--bg-elevated)', border: '1px solid rgba(201,168,76,.15)',
          borderRadius: 6, padding: '9px 12px'
        }}>
          <span style={{ color: 'var(--gold)', fontSize: 14 }}>◇</span>
          <input type="search" autoComplete="off"
            value={search} onChange={e => { setSearch(e.target.value); setSelected(null) }}
            placeholder="Chercher une racine, un mot ou un sens..."
            style={{ width: '100%', fontSize: 13, background: 'transparent', border: 'none', color: 'var(--text)' }}
          />
          {search && <span onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</span>}
        </div>

        {/* Racine détail */}
        {selectedRoot && (
          <div style={{
            marginBottom: 16, padding: 16, borderRadius: 12,
            background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 32, color: 'var(--gold)', direction: 'rtl' }}>
                {selectedRoot.racine}
              </div>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              {selectedRoot.mots.length} mots dérivés · {selectedRoot.totalFreq} occurrences totales
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedRoot.mots.sort((a, b) => (b.freq || 0) - (a.freq || 0)).map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  background: 'var(--bg-card)', borderRadius: 6, border: '1px solid rgba(201,168,76,.08)'
                }}>
                  <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 20, color: 'var(--gold-light)', direction: 'rtl', minWidth: 60, textAlign: 'right' }}>
                    {m.ar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {m.translit && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.translit}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {Array.isArray(m.sens) ? m.sens.slice(0, 2).join(' / ') : m.sens}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {m.type && <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.type}</div>}
                    {m.freq > 0 && <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{m.freq}×</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des racines */}
        {!selectedRoot && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {filtered.slice(0, 120).map(r => {
              const size = r.totalFreq > 500 ? 18 : r.totalFreq > 100 ? 15 : r.totalFreq > 20 ? 13 : 11
              const opacity = r.totalFreq > 500 ? 1 : r.totalFreq > 100 ? 0.85 : r.totalFreq > 20 ? 0.65 : 0.45
              return (
                <button key={r.racine} onClick={() => setSelected(r.racine)} style={{
                  fontFamily: 'var(--font-arabic)', fontSize: size, direction: 'rtl',
                  color: 'var(--gold-light)', opacity, padding: '6px 10px', borderRadius: 6,
                  background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.1)',
                  cursor: 'pointer', transition: 'all .15s'
                }}>
                  {r.racine}
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginRight: 4 }}>{r.mots.length}</span>
                </button>
              )
            })}
          </div>
        )}

        {filtered.length > 120 && !selectedRoot && (
          <div style={{ textAlign: 'center', padding: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            {filtered.length - 120} racines supplémentaires — affine ta recherche
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
