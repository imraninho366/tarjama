import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { rateLimit } from '../lib/rateLimit'
import Button from '../components/common/Button'

const THEMES = [
  { id: 'patience', label: 'Patience', ar: 'الصبر', icon: '🌿' },
  { id: 'gratitude', label: 'Gratitude', ar: 'الشكر', icon: '🤲' },
  { id: 'misericorde', label: 'Miséricorde', ar: 'الرحمة', icon: '💚' },
  { id: 'justice', label: 'Justice', ar: 'العدل', icon: '⚖' },
  { id: 'repentir', label: 'Repentir', ar: 'التوبة', icon: '🕊' },
  { id: 'science', label: 'Science', ar: 'العلم', icon: '📖' },
  { id: 'paradis', label: 'Paradis', ar: 'الجنة', icon: '🌴' },
  { id: 'mort', label: 'Mort & Au-delà', ar: 'الموت', icon: '⏳' },
  { id: 'famille', label: 'Famille', ar: 'الأسرة', icon: '👨‍👩‍👧' },
  { id: 'richesse', label: 'Richesse', ar: 'المال', icon: '💰' },
  { id: 'creation', label: 'Création', ar: 'الخلق', icon: '🌍' },
  { id: 'amour', label: 'Amour divin', ar: 'الحب', icon: '❤' },
]

export default function ConnexionsPage({ user }) {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [versets, setVersets] = useState(null)
  const [loading, setLoading] = useState(false)
  const [custom, setCustom] = useState('')

  if (!user) { if (typeof window !== 'undefined') router.push('/'); return null }

  const search = async (theme) => {
    setLoading(true); setVersets(null)
    try {
      const r = await fetch('/api/humeur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mood: `versets sur le thème : ${theme}` }) })
      const data = await r.json()
      setVersets(data.versets || [])
    } catch { setVersets('error') }
    setLoading(false)
  }

  return (
    <>
      <Head><title>Connexions — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>الروابط</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Explore les thèmes du Coran et les versets qui les relient
          </div>
        </div>

        {!versets && !loading && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { setSelected(t.id); search(t.label) }} style={{
                  padding: '14px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  background: selected === t.id ? 'rgba(var(--tarjama-color-primary-rgb),.12)' : 'rgba(var(--tarjama-color-primary-rgb),.04)',
                  border: `1px solid ${selected === t.id ? 'rgba(var(--tarjama-color-primary-rgb),.3)' : 'rgba(var(--tarjama-color-primary-rgb),.08)'}`,
                  transition: 'all .15s'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-arabic)', marginTop: 2 }}>{t.ar}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input autoComplete="off" value={custom} onChange={e => setCustom(e.target.value)}
                placeholder="Ou cherche un thème..."
                onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) search(custom.trim()) }}
                style={{ flex: 1, padding: '12px', borderRadius: 8, fontSize: 13, background: 'var(--bg-elevated)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.12)', color: 'var(--text)' }}
              />
              <Button onClick={() => custom.trim() && search(custom.trim())} disabled={!custom.trim()}>→</Button>
            </div>
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 18, color: 'var(--gold)' }}>جاري البحث...</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Recherche des versets liés...</div>
          </div>
        )}

        {versets === 'error' && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--red)' }}>
            Erreur de connexion. Vérifie ton internet.
            <br/><button onClick={() => { setVersets(null); setSelected(null) }} style={{ marginTop: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Réessayer</button>
          </div>
        )}

        {versets && versets !== 'error' && versets.length > 0 && (
          <div>
            <button onClick={() => { setVersets(null); setSelected(null) }}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
              ← Changer de thème
            </button>

            <div style={{ position: 'relative', paddingLeft: 20 }}>
              <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'rgba(var(--tarjama-color-primary-rgb),.15)' }} />
              {versets.map((v, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 20, animation: `fadeInUp 0.4s ease ${i * 0.15}s both` }}>
                  <div style={{ position: 'absolute', left: -16, top: 8, width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)', border: '2px solid var(--bg-deep)' }} />
                  <div style={{
                    padding: 16, borderRadius: 10,
                    background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)'
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>
                      S.{v.sourate_num}:{v.verset_num} · {v.sourate_ar}
                    </div>
                    <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 20, color: 'var(--gold-light)', direction: 'rtl', textAlign: 'right', lineHeight: 2, marginBottom: 10 }}>
                      {v.arabe}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.7, marginBottom: 8 }}>
                      « {v.traduction} »
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{v.explication}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
