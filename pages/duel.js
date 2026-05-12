import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Button from '../components/common/Button'

const ROUNDS = 3

export default function DuelPage({ user, profile }) {
  const router = useRouter()
  const [view, setView] = useState('menu')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [duel, setDuel] = useState(null)
  const [verses, setVerses] = useState([])
  const [round, setRound] = useState(0)
  const [translation, setTranslation] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [feedbacks, setFeedbacks] = useState([])
  const [roundScores, setRoundScores] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)
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
      if (status.status === 'active') { clearInterval(pollRef.current); loadVerses(status) }
    }, 2000)
  }

  const joinDuel = async () => {
    if (!joinCode.trim()) return
    setLoading(true); setError('')
    const data = await api({ action: 'join', code: joinCode.trim().toUpperCase() })
    if (data.error) { setError(data.error); setLoading(false); return }
    setCode(joinCode.trim().toUpperCase())
    setDuel(data)
    loadVerses(data)
    setLoading(false)
  }

  const loadVerses = async (d) => {
    try {
      const r = await fetch(`/api/sourate?num=${d.sourate_num}`)
      const data = await r.json()
      const available = data.verses || []
      const startIdx = Math.max(0, (d.verse_num || 1) - 1)
      const picked = available.slice(startIdx, startIdx + ROUNDS)
      const filled = picked.length < ROUNDS ? [...picked, ...available.filter(v => !picked.find(p => p.n === v.n)).slice(0, ROUNDS - picked.length)] : picked
      setVerses(filled.map(v => ({ ...v, sourate_num: d.sourate_num, sourate_fr: data.name_fr, sourate_ar: data.name_ar })))
      setRound(0)
      setFeedbacks([])
      setRoundScores([])
      setView('play')
    } catch { setError('Erreur chargement versets') }
  }

  const verse = verses[round]

  const submitRound = async () => {
    if (!translation.trim() || !verse) return
    setLoading(true)
    const r = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ arabic: verse.ar, sourate_num: verse.sourate_num, verse_num: verse.n, sourate_ar: verse.sourate_ar, sourate_fr: verse.sourate_fr, user_trans: translation }) })
    const feedback = await r.json()
    const scoreMap = { excellent: 100, good: 75, partial: 50, wrong: 25 }
    const score = scoreMap[feedback.niveau] || 0

    setFeedbacks(prev => [...prev, { ...feedback, userTrans: translation }])
    setRoundScores(prev => [...prev, score])
    setShowCorrection(true)
    setLoading(false)
  }

  const nextRound = async () => {
    setShowCorrection(false)
    setTranslation('')

    if (round + 1 >= ROUNDS || round + 1 >= verses.length) {
      const totalScore = [...roundScores].reduce((a, b) => a + b, 0)
      const avgScore = Math.round(totalScore / roundScores.length)
      await api({ action: 'submit', code, score: avgScore })
      setSubmitted(true)

      pollRef.current = setInterval(async () => {
        const status = await api({ action: 'status', code })
        if (status.status === 'finished') { clearInterval(pollRef.current); setResult(status) }
      }, 2000)
    } else {
      setRound(r => r + 1)
    }
  }

  const resetDuel = () => {
    setView('menu'); setResult(null); setSubmitted(false); setTranslation('')
    setCode(''); setDuel(null); setVerses([]); setFeedbacks([]); setRoundScores([])
    setRound(0); setShowCorrection(false)
  }

  const myScore = result ? (result.player1_id === user.id ? result.player1_score : result.player2_score) : null
  const oppScore = result ? (result.player1_id === user.id ? result.player2_score : result.player1_score) : null
  const oppName = result ? (result.player1_id === user.id ? result.player2_name : result.player1_name) : null
  const won = myScore !== null && oppScore !== null ? myScore > oppScore : null
  const currentFeedback = showCorrection ? feedbacks[feedbacks.length - 1] : null

  return (
    <>
      <Head><title>Duel — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>المبارزة</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Défie un ami — {ROUNDS} versets, le meilleur gagne</div>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</div>}

        {/* MENU */}
        {view === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
            <button onClick={createDuel} disabled={loading} style={{
              padding: '20px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)', transition: 'all .15s'
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>⚔</div>
              <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>Créer un duel</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Génère un code à partager</div>
            </button>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: 8 }}>— ou —</div>
            <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.1)' }}>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 10 }}>Rejoindre un duel</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE" maxLength={6}
                  style={{ flex: 1, padding: '12px', borderRadius: 8, fontSize: 18, textAlign: 'center', letterSpacing: 6, fontWeight: 700, textTransform: 'uppercase', background: 'var(--bg-elevated)', border: '1px solid rgba(201,168,76,.15)', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}
                />
                <Button onClick={joinDuel} disabled={loading || joinCode.length < 4}>Rejoindre</Button>
              </div>
            </div>
          </div>
        )}

        {/* WAITING */}
        {view === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Partage ce code à ton ami</div>
            <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', color: 'var(--gold)', letterSpacing: 8, marginBottom: 16, fontWeight: 700 }}>{code}</div>
            <Button variant="secondary" onClick={() => {
              const text = `Je te défie en traduction coranique ! ${ROUNDS} versets, qui traduit le mieux ? Rejoins-moi sur Tarjama avec le code : ${code}`
              if (navigator.share) navigator.share({ title: 'Duel Tarjama', text }).catch(() => {})
              else navigator.clipboard.writeText(text)
            }}>Partager le code</Button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20, animation: 'pulse 1.5s infinite' }}>En attente de ton adversaire...</div>
          </div>
        )}

        {/* PLAY */}
        {view === 'play' && verse && !showCorrection && !submitted && (
          <div>
            {/* Barre de progression des rounds */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {Array.from({ length: Math.min(ROUNDS, verses.length) }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i < round ? (roundScores[i] >= 75 ? 'var(--green)' : roundScores[i] >= 50 ? 'var(--orange)' : 'var(--red)') : i === round ? 'var(--gold)' : 'rgba(201,168,76,.1)'
                }} />
              ))}
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 6 }}>
              Verset {round + 1} / {Math.min(ROUNDS, verses.length)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 12 }}>
              {verse.sourate_ar} ({verse.sourate_fr})
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
            <Button variant="primary" full onClick={submitRound} disabled={loading || !translation.trim()} style={{ marginTop: 12 }}>
              {loading ? 'Vérification...' : 'Valider'}
            </Button>
          </div>
        )}

        {/* CORRECTION après chaque verset */}
        {showCorrection && currentFeedback && (
          <div style={{ animation: 'fadeInUp .3s ease' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {Array.from({ length: Math.min(ROUNDS, verses.length) }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i <= round ? (roundScores[i] >= 75 ? 'var(--green)' : roundScores[i] >= 50 ? 'var(--orange)' : 'var(--red)') : 'rgba(201,168,76,.1)'
                }} />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>
                {roundScores[round] >= 75 ? '✅' : roundScores[round] >= 50 ? '🟡' : '❌'}
              </div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: roundScores[round] >= 75 ? 'var(--green)' : roundScores[round] >= 50 ? 'var(--orange)' : 'var(--red)', fontWeight: 700 }}>
                {currentFeedback.titre || (roundScores[round] >= 75 ? 'Bien joué !' : 'Continue !')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Score : {roundScores[round]}/100
              </div>
            </div>

            {/* Feedback détaillé */}
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.08)', marginBottom: 12 }}>
              {currentFeedback.message && (
                <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 12 }}>
                  {currentFeedback.message}
                </div>
              )}

              {/* Ta traduction */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Ta traduction</div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic' }}>« {currentFeedback.userTrans} »</div>
              </div>

              {/* Traduction de référence */}
              {currentFeedback.traduction_ref && (
                <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(76,175,125,.06)', borderRadius: 6, borderLeft: '3px solid var(--green)' }}>
                  <div style={{ fontSize: 10, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Traduction de référence</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{currentFeedback.traduction_ref}</div>
                </div>
              )}

              {/* Mots importants */}
              {currentFeedback.mots_importants?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Mots importants</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {currentFeedback.mots_importants.map((w, i) => (
                      <span key={i} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 12,
                        background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.12)'
                      }}>
                        <span style={{ fontFamily: 'var(--font-arabic)', color: 'var(--gold-light)', marginRight: 6 }}>{w.ar}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{w.fr}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mot manqué */}
              {currentFeedback.mot_manque && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--orange)' }}>
                  Concept manquant : <strong>{currentFeedback.mot_manque}</strong>
                </div>
              )}
            </div>

            <Button variant="primary" full onClick={nextRound}>
              {round + 1 >= Math.min(ROUNDS, verses.length) ? 'Voir le résultat final' : `Verset suivant (${round + 2}/${Math.min(ROUNDS, verses.length)}) →`}
            </Button>
          </div>
        )}

        {/* WAITING FOR OPPONENT */}
        {submitted && !result && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 8 }}>
              Tes {roundScores.length} versets sont envoyés !
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
              Score moyen : <strong style={{ color: 'var(--gold)' }}>{Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)}/100</strong>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', animation: 'pulse 1.5s infinite', marginTop: 16 }}>
              En attente de ton adversaire...
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

            {/* Récap des rounds */}
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, textAlign: 'center' }}>Tes résultats par verset</div>
              {feedbacks.map((fb, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderBottom: '1px solid rgba(201,168,76,.05)'
                }}>
                  <span style={{ fontSize: 18 }}>{roundScores[i] >= 75 ? '✅' : roundScores[i] >= 50 ? '🟡' : '❌'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fb.traduction_ref || fb.userTrans}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: roundScores[i] >= 75 ? 'var(--green)' : roundScores[i] >= 50 ? 'var(--orange)' : 'var(--red)'
                  }}>{roundScores[i]}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button onClick={resetDuel}>Nouveau duel</Button>
              <Button variant="secondary" onClick={() => {
                const text = `Duel Tarjama (${ROUNDS} versets) ! J'ai eu ${myScore} vs ${oppName} ${oppScore}. Qui fait mieux ? tarjama.app`
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
