import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { SOURATES_LIST } from '../lib/sourates'

const REVELATION_ORDER = [96,68,73,74,1,111,81,87,92,89,93,94,103,100,108,102,107,109,105,113,114,112,53,80,97,91,85,95,106,101,75,104,77,50,90,86,54,38,7,72,36,25,35,19,20,56,26,27,28,17,10,11,12,15,6,37,31,34,39,40,41,42,43,44,45,46,51,88,18,16,71,14,21,23,32,52,67,69,70,78,79,82,84,30,29,83,2,8,3,33,60,4,99,57,47,13,55,76,65,98,59,24,22,63,58,49,66,64,61,62,48,5,9,110]

export default function RevelationPage({ user }) {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  if (!user) { if (typeof window !== 'undefined') router.push('/'); return null }

  const sourates = REVELATION_ORDER.map((num, idx) => {
    const info = SOURATES_LIST.find(s => s.n === num) || {}
    const period = idx < 86 ? 'mecquoise' : 'medinoise'
    return { ...info, n: num, revelationOrder: idx + 1, period }
  })

  const filtered = filter === 'all' ? sourates : sourates.filter(s => s.period === filter)
  const sel = selected ? sourates.find(s => s.n === selected) : null

  return (
    <>
      <Head><title>Ordre de révélation — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>ترتيب النزول</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Les 114 sourates dans l'ordre chronologique de leur révélation
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
          {[['all', 'Toutes'], ['mecquoise', 'Mecquoises (86)'], ['medinoise', 'Médinoises (28)']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              padding: '8px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: filter === id ? 'rgba(var(--tarjama-color-primary-rgb),.12)' : 'transparent',
              color: filter === id ? 'var(--gold)' : 'var(--text-muted)',
              border: `1px solid ${filter === id ? 'rgba(var(--tarjama-color-primary-rgb),.25)' : 'rgba(var(--tarjama-color-primary-rgb),.08)'}`,
              cursor: 'pointer'
            }}>{label}</button>
          ))}
        </div>

        {/* Détail */}
        {sel && (
          <div style={{
            marginBottom: 16, padding: 16, borderRadius: 12,
            background: 'rgba(var(--tarjama-color-primary-rgb),.06)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 24, color: 'var(--gold-light)', direction: 'rtl' }}>{sel.ar}</div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{sel.fr}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
              <span>Révélation : <strong style={{ color: 'var(--gold)' }}>#{sel.revelationOrder}</strong></span>
              <span>Mushaf : <strong>#{sel.n}</strong></span>
              <span>Versets : <strong>{sel.v}</strong></span>
              <span style={{
                padding: '2px 8px', borderRadius: 4,
                background: sel.period === 'mecquoise' ? 'rgba(var(--tarjama-color-warning-rgb, 192, 112, 48),.1)' : 'rgba(var(--tarjama-color-info-rgb, 30, 58, 95),.1)',
                color: sel.period === 'mecquoise' ? 'var(--orange)' : 'var(--blue)'
              }}>
                {sel.period === 'mecquoise' ? 'Mecquoise' : 'Médinoise'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.7 }}>
              {sel.period === 'mecquoise'
                ? 'Révélée à La Mecque — thèmes : foi, unicité divine, Jour dernier, histoires des prophètes.'
                : 'Révélée à Médine — thèmes : législation, vie en société, relations inter-communautaires.'}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, rgba(var(--tarjama-color-warning-rgb, 192, 112, 48),.3), rgba(var(--tarjama-color-info-rgb, 30, 58, 95),.3))' }} />

          {filtered.map((s, i) => (
            <div key={s.n} onClick={() => setSelected(s.n)} style={{
              position: 'relative', marginBottom: 6, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
              background: selected === s.n ? 'rgba(var(--tarjama-color-primary-rgb),.08)' : 'transparent',
              border: `1px solid ${selected === s.n ? 'rgba(var(--tarjama-color-primary-rgb),.2)' : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s',
              animation: `fadeInUp 0.3s ease ${Math.min(i * 0.02, 0.5)}s both`
            }}>
              <div style={{
                position: 'absolute', left: -20, width: 8, height: 8, borderRadius: '50%',
                background: s.period === 'mecquoise' ? 'var(--orange)' : 'var(--blue)',
                border: '2px solid var(--bg-deep)'
              }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 20, fontWeight: 700 }}>{s.revelationOrder}</span>
              <span style={{ fontFamily: 'var(--font-arabic)', fontSize: 16, color: 'var(--gold-light)', direction: 'rtl' }}>{s.ar}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', flex: 1 }}>{s.fr}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>#{s.n}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
