import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Button from '../components/common/Button'

export default function DuelPage({ user, profile }) {
  const router = useRouter()
  const [view, setView] = useState('menu')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [duel, setDuel] = useState(null)
  const [verse, setVerse] = useState(null)
  const [translation, setTranslation] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current) } }, [])

  if (!user || !profile) { if (typeof window !== 'undefined') router.push('/'); return null }

  const api = async (body) => {
    const r = await fetch('/api/duel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, user_id: user.id, username: profile.username }) })
    return r.json()
  }

  const createDuel = async () => {
    setLoading(true); setError('')
    const data = await api({ action: 'create' })
    if (data.error) { setError(data.error); setLoading(false); return }
    setCode(data.code)
    setDuel(data)
    setView('waiting')
    setLoading(false)
    pollRef.current = setInterval(async () => {
      const status = await api({ action: 'status', code: data.code })
      if (status.status === 'active') { clearInterval(pollRef.current); loadVerse(status) }
    }, 2000)
  }

  const joinDuel = async () => {
    if (!joinCode.trim()) return
    setLoading(true); setError('')
    const data = await api({ action: 'join', code: joinCode.trim().toUpperCase() })
    if (data.error) { setError(data.error); setLoading(false); return }
    setCode(joinCode.trim().toUpperCase())
    setDuel(data)
    loadVerse(data)
    setLoading(false)
  }

  const loadVerse = async (d) => {
    try {
      const r = await fetch(`/api/sourate?num=${d.sourate_num}`)
      const data = await r.json()
      const v = data.verses?.find(vv => vv.n === d.verse_num) || data.verses?.[0]
      setVerse({ ...v, sourate_num: d.sourate_num, sourate_fr: data.name_fr, sourate_ar: data.name_ar })
      setView('play')
    } catch { setError('Erreur chargement verset') }
  }

  const submitTranslation = async () => {
    if (!translation.trim()) return
    setLoading(true)
    const r = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ arabic: verse.ar, sourate_num: verse.sourate_num, verse_num: verse.n, sourate_ar: verse.sourate_ar, sourate_fr: verse.sourate_fr, user_trans: translation }) })
    const feedback = await r.json()
    const scoreMap = { excellent: 100, good: 75, partial: 50, wrong: 25 }
    const score = scoreMap[feedback.niveau] || 0
    await api({ action: 'submit', code, score })
    setSubmitted(true)
    setLoading(false)

    pollRef.current = setInterval(async () => {
      const status = await api({ action: 'status', code })
      if (status.status === 'finished') {
        clearInterval(pollRef.current)
        setResult(status)
      }
    }, 2000)
  }

  const myScore = result ? (result.player1_id === user.id ? result.player1_score : result.player2_score) : null
  const oppScore = result ? (result.player1_id === user.id ? result.player2_score : result.player1_score) : null
  const oppName = result ? (result.player1_id === user.id ? result.player2_name : result.player1_name) : null
  const won = myScore !== null && oppScore !== null ? myScore > oppScore : null

  return (
    <>
      <Head><title>Duel — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>المبارزة</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Défie un ami en traduction coranique</div>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</div>}

        {/* MENU */}
        {view === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
            <button onClick={createDuel} disabled={loading} style={{
              padding: '20px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)',
              transition: 'all .15s'
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>⚔</div>
              <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>Créer un duel</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Génère un code à partager</div>
            </button>

            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: 8 }}>— ou —</div>

            <div style={{
              padding: '16px', borderRadius: 12,
              background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.1)'
            }}>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 10 }}>Rejoindre un duel</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE" maxLength={6}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 8, fontSize: 18, textAlign: 'center',
                    letterSpacing: 6, fontWeight: 700, textTransform: 'uppercase',
                    background: 'var(--bg-elevated)', border: '1px solid rgba(201,168,76,.15)',
                    color: 'var(--gold)', fontFamily: 'var(--font-display)'
                  }}
                />
                <Button onClick={joinDuel} disabled={loading || joinCode.length < 4}>Rejoindre</Button>
              </div>
            </div>
          </div>
        )}

        {/* WAITING */}
        {view === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              Partage ce code à ton ami
            </div>
            <div style={{
              fontSize: 36, fontFamily: 'var(--font-display)', color: 'var(--gold)',
              letterSpacing: 8, marginBottom: 16, fontWeight: 700
            }}>{code}</div>
            <Button variant="secondary" onClick={() => {
              const text = `Je te défie en traduction coranique ! Rejoins-moi sur Tarjama avec le code : ${code}`
              if (navigator.share) navigator.share({ title: 'Duel Tarjama', text }).catch(() => {})
              else { navigator.clipboard.writeText(text) }
            }}>Partager le code</Button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20, animation: 'pulse 1.5s infinite' }}>
              En attente de ton adversaire...
            </div>
          </div>
        )}

        {/* PLAY */}
        {view === 'play' && verse && !submitted && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 }}>
              Duel — {verse.sourate_ar} ({verse.sourate_fr})
            </div>
            <div style={{
              fontFamily: 'var(--font-arabic)', fontSize: 24, color: 'var(--gold-light)',
              direction: 'rtl', textAlign: 'right', lineHeight: 2, padding: '16px',
              background: 'rgba(201,168,76,.04)', borderRadius: 10, marginBottom: 16,
              border: '1px solid rgba(201,168,76,.1)'
            }}>{verse.ar}</div>

            <textarea value={translation} onChange={e => setTranslation(e.target.value)}
              placeholder="Traduis ce verset le mieux possible..."
              style={{
                width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, minHeight: 80,
                background: 'var(--bg-elevated)', border: '1px solid rgba(201,168,76,.15)',
                color: 'var(--text)', resize: 'vertical', lineHeight: 1.7
              }}
            />
            <Button variant="primary" full onClick={submitTranslation} disabled={loading || !translation.trim()} style={{ marginTop: 12 }}>
              {loading ? 'Vérification...' : 'Envoyer ma traduction'}
            </Button>
          </div>
        )}

        {/* WAITING FOR OPPONENT */}
        {submitted && !result && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 8 }}>Traduction envoyée !</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>
              En attente de la traduction de ton adversaire...
            </div>
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{won === true ? '🏆' : won === false ? '😔' : '🤝'}</div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: 16 }}>
              {won === true ? 'Victoire !' : won === false ? 'Défaite...' : 'Égalité !'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: won ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{myScore}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Toi</div>
              </div>
              <div style={{ fontSize: 20, color: 'var(--text-muted)', alignSelf: 'center' }}>vs</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: won === false ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{oppScore}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{oppName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button onClick={() => { setView('menu'); setResult(null); setSubmitted(false); setTranslation(''); setCode(''); setDuel(null); setVerse(null) }}>Nouveau duel</Button>
              <Button variant="secondary" onClick={() => {
                const text = `Duel Tarjama ! J'ai eu ${myScore} vs ${oppName} ${oppScore}. Qui fait mieux ? tarjama.app`
                if (navigator.share) navigator.share({ title: 'Résultat Duel', text }).catch(() => {})
                else navigator.clipboard.writeText(text)
              }}>Partager</Button>
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
