import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Button from '../components/common/Button'

const MOODS = [
  { id: 'stress', label: 'Stressé(e)', icon: '😰', ar: 'قلق' },
  { id: 'triste', label: 'Triste', icon: '😢', ar: 'حزين' },
  { id: 'colere', label: 'En colère', icon: '😤', ar: 'غضبان' },
  { id: 'peur', label: 'Effrayé(e)', icon: '😨', ar: 'خائف' },
  { id: 'seul', label: 'Seul(e)', icon: '🥺', ar: 'وحيد' },
  { id: 'reconnaissant', label: 'Reconnaissant(e)', icon: '🤲', ar: 'شاكر' },
  { id: 'heureux', label: 'Heureux(se)', icon: '😊', ar: 'سعيد' },
  { id: 'perdu', label: 'Perdu(e)', icon: '🤔', ar: 'حائر' },
  { id: 'motive', label: 'Motivé(e)', icon: '💪', ar: 'متحمس' },
  { id: 'malade', label: 'Malade', icon: '🤒', ar: 'مريض' },
  { id: 'deuil', label: 'En deuil', icon: '🕊', ar: 'حداد' },
  { id: 'espoir', label: 'Plein d\'espoir', icon: '🌅', ar: 'أمل' },
]

export default function HumeurPage({ user }) {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [custom, setCustom] = useState('')
  const [versets, setVersets] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!user) { if (typeof window !== 'undefined') router.push('/'); return null }

  const search = async (mood) => {
    setLoading(true)
    setVersets(null)
    try {
      const r = await fetch('/api/humeur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mood }) })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setVersets(data.versets || [])
    } catch (err) {
      setVersets('error')
    }
    setLoading(false)
  }

  return (
    <>
      <Head><title>Coran & Humeur — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>القرآن والمشاعر</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.7 }}>
            Comment te sens-tu ? Le Coran a un message pour toi.
          </div>
        </div>

        {/* Mood grid */}
        {!versets && !loading && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {MOODS.map(m => (
                <button key={m.id} onClick={() => { setSelected(m.id); search(m.label) }} style={{
                  padding: '16px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  background: selected === m.id ? 'rgba(var(--tarjama-color-primary-rgb),.12)' : 'rgba(var(--tarjama-color-primary-rgb),.04)',
                  border: `1px solid ${selected === m.id ? 'rgba(var(--tarjama-color-primary-rgb),.3)' : 'rgba(var(--tarjama-color-primary-rgb),.08)'}`,
                  transition: 'all .15s'
                }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-arabic)', marginTop: 2 }}>{m.ar}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input value={custom} onChange={e => setCustom(e.target.value)}
                placeholder="Ou décris ce que tu ressens..."
                onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) search(custom.trim()) }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 8, fontSize: 13,
                  background: 'var(--bg-elevated)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.12)',
                  color: 'var(--text)'
                }}
              />
              <Button onClick={() => custom.trim() && search(custom.trim())} disabled={!custom.trim()}>→</Button>
            </div>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 18, color: 'var(--gold)', marginBottom: 8 }}>
              جاري البحث...
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>L'IA cherche les versets les plus pertinents...</div>
          </div>
        )}

        {/* Results */}
        {versets && versets !== 'error' && versets.length > 0 && (
          <div>
            <button onClick={() => { setVersets(null); setSelected(null) }}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
              ← Changer d'humeur
            </button>

            {versets.map((v, i) => (
              <div key={i} style={{
                marginBottom: 16, padding: 16, borderRadius: 12,
                background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)',
                animation: `fadeInUp 0.4s ease ${i * 0.15}s both`
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                  S.{v.sourate_num} — V.{v.verset_num} · {v.sourate_ar} ({v.sourate_fr})
                </div>
                <div style={{
                  fontFamily: 'var(--font-arabic)', fontSize: 22, color: 'var(--gold-light)',
                  direction: 'rtl', textAlign: 'right', lineHeight: 2, marginBottom: 12,
                  padding: '8px 0', borderBottom: '1px solid rgba(var(--tarjama-color-primary-rgb),.06)'
                }}>
                  {v.arabe}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', lineHeight: 1.8, marginBottom: 10 }}>
                  « {v.traduction} »
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 8 }}>
                  {v.explication}
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--green)', padding: '8px 12px',
                  background: 'rgba(var(--tarjama-color-success-rgb, 45, 122, 79),.06)', borderRadius: 6, borderLeft: '3px solid var(--green)'
                }}>
                  {v.conseil}
                </div>
              </div>
            ))}
          </div>
        )}

        {versets === 'error' && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--red)' }}>
            Erreur de connexion. Vérifie ton internet et réessaie.
            <br/><button onClick={() => { setVersets(null); setSelected(null) }} style={{ marginTop: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Réessayer</button>
          </div>
        )}

        {versets && versets !== 'error' && versets.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            Aucun verset trouvé. Réessaie avec une autre humeur.
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
