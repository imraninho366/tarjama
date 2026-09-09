import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Button from '../components/common/Button'
import { apiFetch } from '../lib/apiClient'

const MODES = [
  { id: 'traduction', icon: 'ت', title: 'Traduction', desc: 'Traduis 3 versets coraniques', rounds: 3 },
  { id: 'quiz-islam', icon: '☪', title: 'Quiz Islam', desc: '5 questions sur l\'Islam', rounds: 5 },
  { id: 'quiz-vocab', icon: 'ق', title: 'Quiz Vocabulaire', desc: '5 mots arabes à traduire', rounds: 5 },
]

/*
 * Le tirage des questions vivait ici : chaque navigateur fabriquait les
 * siennes a partir d'une graine commune. Il est parti dans lib/duelQuestions.js
 * et dans /api/duel, pour deux raisons.
 *
 * D'abord le quiz Islam ne posait PAS les memes questions aux deux joueurs :
 * ses questions viennent de l'IA, mises en cache dans une Map en memoire,
 * propre a chaque instance serverless. Ensuite le navigateur connaissait la
 * bonne reponse avant que le joueur choisisse, et calculait lui-meme le score
 * final — il suffisait d'envoyer 100.
 *
 * Le serveur fabrique les questions une fois, les garde avec leurs reponses,
 * et corrige lui-meme.
 */

export default function DuelPage({ user, profile, authReady }) {
  const router = useRouter()
  const [view, setView] = useState('menu')
  const [selectedMode, setSelectedMode] = useState(null)
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [duel, setDuel] = useState(null)

  // Traduction state
  const [verses, setVerses] = useState([])
  const [round, setRound] = useState(0)
  const [translation, setTranslation] = useState('')
  const [feedbacks, setFeedbacks] = useState([])
  const [roundScores, setRoundScores] = useState([])
  const [showCorrection, setShowCorrection] = useState(false)

  // Quiz state (Islam + Vocab) — questions servies SANS leur bonne reponse
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [quizDone, setQuizDone] = useState(false)
  // Correction renvoyee par le serveur APRES l'envoi de la reponse : c'est la
  // seule facon dont le navigateur apprend la bonne reponse.
  const [correction, setCorrection] = useState(null)
  const [justes, setJustes] = useState([])
  // Score calcule par le serveur ; le navigateur ne fait que l'afficher.
  const [scorePerso, setScorePerso] = useState(null)

  // Common
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current) } }, [])

  // Tant que la session n'est pas tranchee, on n'affiche rien plutot que de
  // rediriger : `user` est encore null par ignorance, pas par absence.
  if (!authReady) return null

  // Le profil arrive APRES la session : _app le charge dans un second appel a
  // Supabase. authReady ne dit donc rien sur lui. Traiter « profil pas encore
  // arrive » comme « pas connecte » renvoyait a l'accueil un utilisateur
  // parfaitement authentifie — constate en ouvrant /duel le 6 septembre 2026.
  if (user && !profile) return null

  if (!user) { if (typeof window !== 'undefined') router.push('/'); return null }

  // Si la route renvoie une page d'erreur HTML (variable manquante, exception),
  // r.json() levait une SyntaxError jamais rattrapee : setLoading(false) n'etait
  // jamais atteint et le bouton restait bloque, ou l'intervalle de scrutation
  // repartait toutes les 2 s indefiniment sans jamais rien afficher.
  const api = async (body) => {
    try {
      // user_id et username ne sont plus envoyes : le serveur les tire du
      // jeton de session, seule source d'identite qui ne soit pas falsifiable.
      const r = await apiFetch('/api/duel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await r.json()
      if (!r.ok) return { error: data?.error || `Erreur serveur (${r.status})` }
      return data
    } catch (err) {
      console.error('[duel] appel API:', err.message)
      return { error: 'Connexion perdue. Verifie ton internet.' }
    }
  }

  const modeConfig = selectedMode ? MODES.find(m => m.id === selectedMode) : null

  // ── CREATE / JOIN ──────────────────────────────
  const createDuel = async (mode) => {
    setSelectedMode(mode); setLoading(true); setError('')
    const data = await api({ action: 'create', mode })
    if (data.error) { setError(data.error); setLoading(false); return }
    setCode(data.code); setDuel(data); setView('waiting'); setLoading(false)
    // 2 s faisait 30 appels/minute, au-dessus du plafond de la route : passe
    // 30 s d'attente le serveur repondait 429, et comme l'erreur n'etait pas
    // testee, la boucle tournait sans jamais lancer la partie.
    pollRef.current = setInterval(async () => {
      const status = await api({ action: 'status', code: data.code })
      if (status.error) { clearInterval(pollRef.current); setError(status.error); setView('menu'); return }
      if (status.status === 'active') { clearInterval(pollRef.current); startGame(status.mode || mode, status) }
    }, 3000)
  }

  const joinDuel = async () => {
    if (!joinCode.trim()) return
    setLoading(true); setError('')
    const data = await api({ action: 'join', code: joinCode.trim().toUpperCase() })
    if (data.error) { setError(data.error); setLoading(false); return }
    setCode(joinCode.trim().toUpperCase()); setDuel(data); setSelectedMode(data.mode)
    startGame(data.mode, data); setLoading(false)
  }

  // ── START GAME ─────────────────────────────────
  const startGame = async (mode, d) => {
    setRound(0); setFeedbacks([]); setRoundScores([]); setShowCorrection(false)
    setSelected(null); setQuizDone(false); setTranslation('')

    if (mode === 'traduction') {
      try {
        const r = await fetch(`/api/sourate?num=${d.sourate_num}`)
        const data = await r.json()
        const available = data.verses || []
        const startIdx = Math.max(0, (d.verse_num || 1) - 1)
        const picked = available.slice(startIdx, startIdx + 3)
        const filled = picked.length < 3 ? [...picked, ...available.filter(v => !picked.find(p => p.n === v.n)).slice(0, 3 - picked.length)] : picked
        setVerses(filled.map(v => ({ ...v, sourate_num: d.sourate_num, sourate_fr: data.name_fr, sourate_ar: data.name_ar })))
      } catch { setError('Erreur chargement') }
      setView('play-traduction')

    } else {
      // Cet appel remet les questions ET declenche le chronometre du joueur
      // cote serveur : le temps se compte a partir du moment ou il a
      // effectivement de quoi jouer.
      const data = await api({ action: 'questions', code: d.code || code })
      if (data.error) { setError(data.error); setView('menu'); return }
      setQuestions(data.questions || [])
      setJustes([]); setCorrection(null); setScorePerso(null)
      setView('play-quiz')
    }
  }

  // ── SUBMIT SCORE ───────────────────────────────
  // Le mode Traduction reste note par le navigateur : sa correction vient de
  // l'IA (/api/verify), et la refaire cote serveur doublerait le cout et la
  // latence de chaque duel. Les deux quiz, eux, sont corriges par le serveur.
  const submitFinalScore = async (scores) => {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const r = await api({ action: 'submit', code, score: avg })
    if (r.error) { setError(r.error); return }
    setScorePerso(avg)
    attendreAdversaire()
  }

  /** Scrute la fin du duel, sans boucler en silence si le serveur refuse. */
  const attendreAdversaire = () => {
    setSubmitted(true)
    pollRef.current = setInterval(async () => {
      const status = await api({ action: 'status', code })
      if (status.error) { clearInterval(pollRef.current); setError(status.error); return }
      // Mon propre score m'est visible des que je l'ai fini ; celui de
      // l'adversaire n'arrive qu'a la fin du duel.
      const mien = status.player1_id === user.id ? status.player1_score : status.player2_score
      if (mien !== null && mien !== undefined) setScorePerso(mien)
      if (status.status === 'finished') { clearInterval(pollRef.current); setResult(status) }
    }, 3000)
  }

  // ── TRADUCTION HANDLERS ────────────────────────
  const verse = verses[round]
  const currentFeedback = showCorrection ? feedbacks[feedbacks.length - 1] : null

  const submitRound = async () => {
    if (!translation.trim() || !verse) return
    setLoading(true)
    try {
      const r = await apiFetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ arabic: verse.ar, sourate_num: verse.sourate_num, verse_num: verse.n, sourate_ar: verse.sourate_ar, sourate_fr: verse.sourate_fr, user_trans: translation }) })
      const feedback = await r.json()
      const scoreMap = { excellent: 100, good: 75, partial: 50, wrong: 25 }
      const score = scoreMap[feedback.niveau] || 0
      setFeedbacks(prev => [...prev, { ...feedback, userTrans: translation }])
      setRoundScores(prev => [...prev, score])
      setShowCorrection(true)
    } catch (err) {
      setError('Erreur réseau. Vérifie ta connexion.')
    } finally {
      setLoading(false)
    }
  }

  const nextRound = () => {
    setShowCorrection(false); setTranslation('')
    if (round + 1 >= verses.length) { submitFinalScore(roundScores) }
    else { setRound(r => r + 1) }
  }

  // ── QUIZ HANDLERS ──────────────────────────────
  const quizQuestions = questions
  const quizQuestion = quizQuestions[round]

  /*
   * La reponse part au serveur, qui la range, l'horodate et renvoie SEULEMENT
   * ENSUITE la bonne reponse. Le navigateur ne l'a jamais avant le choix du
   * joueur : c'est ce qui rend le score inattaquable, et c'est aussi pourquoi
   * ce gestionnaire est asynchrone alors qu'il ne l'etait pas.
   */
  const handleQuizAnswer = async (idx) => {
    if (selected !== null || loading) return
    setSelected(idx); setLoading(true)

    const r = await api({ action: 'answer', code, round, choice: idx })
    setLoading(false)

    if (r.error) {
      // Sans ce retour en arriere, la question resterait verrouillee sur un
      // choix que le serveur n'a pas enregistre.
      setSelected(null); setError(r.error)
      return
    }

    setCorrection(r)
    setJustes(prev => [...prev, r.juste])
    if (navigator.vibrate) navigator.vibrate(r.juste ? 50 : [50, 30, 50])
    setQuizDone(true)
  }

  const nextQuizRound = () => {
    setSelected(null); setQuizDone(false); setCorrection(null)
    // Le score est calcule par le serveur a la derniere reponse : il n'y a
    // rien a lui envoyer, seulement a attendre l'adversaire.
    if (round + 1 >= quizQuestions.length) { attendreAdversaire() }
    else { setRound(r => r + 1) }
  }

  // ── RESULT ─────────────────────────────────────
  const resetDuel = () => {
    setView('menu'); setResult(null); setSubmitted(false); setTranslation('')
    setCode(''); setDuel(null); setVerses([]); setFeedbacks([]); setRoundScores([])
    setRound(0); setShowCorrection(false); setSelectedMode(null)
    setQuestions([]); setSelected(null); setQuizDone(false)
    setCorrection(null); setJustes([]); setScorePerso(null); setError('')
  }

  const myScore = result ? (result.player1_id === user.id ? result.player1_score : result.player2_score) : null
  const oppScore = result ? (result.player1_id === user.id ? result.player2_score : result.player1_score) : null
  const oppName = result ? (result.player1_id === user.id ? result.player2_name : result.player1_name) : null
  const won = myScore !== null && oppScore !== null ? myScore > oppScore : null

  /*
   * Les erreurs du joueur, reconstituees a la fin du duel.
   *
   * L'ecran de resultat n'affichait que deux nombres. Or c'est ici que le duel
   * peut servir a apprendre : savoir qu'on a fait 60 n'apprend rien, revoir le
   * mot qu'on a rate, si.
   *
   * Les bonnes reponses ne sortent du serveur qu'une fois la partie finie,
   * donc cette liste est vide tant que le duel est en cours — et n'existe pas
   * en mode Traduction, qui n'a pas de questions a choix.
   */
  const mesReponses = result ? (result.player1_id === user.id ? result.player1_answers : result.player2_answers) : null
  const erreurs = (result?.questions || []).map((q, i) => {
    const choix = Array.isArray(mesReponses) ? mesReponses[i]?.choice : undefined
    if (choix === undefined || choix === q.correct) return null
    return { ...q, i, choix }
  }).filter(Boolean)

  return (
    <>
      <Head><title>Duel — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
          <h1 style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)', margin: 0, fontWeight: 400 }} lang="ar" dir="rtl">المبارزة</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Défie un ami — choisis ton mode</div>
        </div>

        {error && <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</div>}

        {/* ═══ MENU : choix du mode ═══ */}
        {view === 'menu' && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, textAlign: 'center' }}>Créer un duel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => createDuel(m.id)} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.12)', textAlign: 'left', transition: 'all .15s'
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(var(--tarjama-color-primary-rgb),.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-arabic)', fontSize: 22, color: 'var(--gold)', flexShrink: 0 }} aria-hidden="true">{m.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: 8 }}>— ou —</div>
            <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)' }}>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 10 }}>Rejoindre un duel</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input autoComplete="off" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="CODE" maxLength={6}
                  style={{ flex: 1, padding: '12px', borderRadius: 8, fontSize: 18, textAlign: 'center', letterSpacing: 6, fontWeight: 700, background: 'var(--bg-elevated)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.15)', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}
                />
                <Button onClick={joinDuel} disabled={loading || joinCode.length < 4}>Rejoindre</Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ WAITING ═══ */}
        {view === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
              Mode : {modeConfig?.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 16 }}>Partage ce code</div>
            <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', color: 'var(--gold)', letterSpacing: 8, marginBottom: 16, fontWeight: 700 }}>{code}</div>
            <Button variant="secondary" onClick={() => {
              const text = `Duel Tarjama (${modeConfig?.title}) ! Rejoins-moi avec le code : ${code}`
              if (navigator.share) navigator.share({ title: 'Duel Tarjama', text }).catch(() => {})
              else navigator.clipboard.writeText(text)
            }}>Partager le code</Button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20, animation: 'pulse 1.5s infinite' }}>En attente de ton adversaire...</div>
          </div>
        )}

        {/* ═══ PLAY TRADUCTION ═══ */}
        {view === 'play-traduction' && verse && !showCorrection && !submitted && (
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {verses.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < round ? (roundScores[i] >= 75 ? 'var(--green)' : roundScores[i] >= 50 ? 'var(--orange)' : 'var(--red)') : i === round ? 'var(--gold)' : 'rgba(var(--tarjama-color-primary-rgb),.1)' }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 12 }}>Verset {round + 1} / {verses.length} · {verse.sourate_ar}</div>
            <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 24, color: 'var(--gold-light)', direction: 'rtl', textAlign: 'right', lineHeight: 2, padding: '16px', background: 'rgba(var(--tarjama-color-primary-rgb),.04)', borderRadius: 10, marginBottom: 16, border: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)' }} lang="ar">{verse.ar}</div>
            <textarea value={translation} onChange={e => setTranslation(e.target.value)} placeholder="Traduis ce verset..."
              style={{ width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, minHeight: 80, background: 'var(--bg-elevated)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.15)', color: 'var(--text)', resize: 'vertical', lineHeight: 1.7 }}
            />
            <Button variant="primary" full onClick={submitRound} disabled={loading || !translation.trim()} style={{ marginTop: 12 }}>
              {loading ? 'Vérification...' : 'Valider'}
            </Button>
          </div>
        )}

        {/* Correction traduction */}
        {view === 'play-traduction' && showCorrection && currentFeedback && (
          <div style={{ animation: 'fadeInUp .3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>{roundScores[round] >= 75 ? '✅' : roundScores[round] >= 50 ? '🟡' : '❌'}</div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: roundScores[round] >= 75 ? 'var(--green)' : roundScores[round] >= 50 ? 'var(--orange)' : 'var(--red)', fontWeight: 700 }}>{currentFeedback.titre || 'Résultat'}</div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)', marginBottom: 12 }}>
              {currentFeedback.message && <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 12 }}>{currentFeedback.message}</div>}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Ta traduction</div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic' }}>« {currentFeedback.userTrans} »</div>
              </div>
              {currentFeedback.traduction_ref && (
                <div style={{ padding: '10px 12px', background: 'rgba(var(--tarjama-color-success-rgb, 45, 122, 79),.06)', borderRadius: 6, borderLeft: '3px solid var(--green)', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Traduction de référence</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{currentFeedback.traduction_ref}</div>
                </div>
              )}
              {currentFeedback.mots_importants?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {currentFeedback.mots_importants.map((w, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, background: 'rgba(var(--tarjama-color-primary-rgb),.08)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.12)' }}>
                      <span style={{ fontFamily: 'var(--font-arabic)', color: 'var(--gold-light)', marginRight: 6 }} lang="ar" dir="rtl">{w.ar}</span>
                      <span style={{ color: 'var(--text-dim)' }}>{w.fr}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button variant="primary" full onClick={nextRound}>{round + 1 >= verses.length ? 'Voir le résultat final' : `Verset suivant →`}</Button>
          </div>
        )}

        {/* ═══ PLAY QUIZ (Islam + Vocab) ═══ */}
        {view === 'play-quiz' && quizQuestion && !submitted && (
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {quizQuestions.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < round ? (justes[i] ? 'var(--green)' : 'var(--red)') : i === round ? 'var(--gold)' : 'rgba(var(--tarjama-color-primary-rgb),.1)' }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 16 }}>
              Question {round + 1} / {quizQuestions.length}
            </div>

            {/* Question */}
            <div style={{ textAlign: 'center', padding: '20px 16px', marginBottom: 16, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', borderRadius: 12, border: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)' }}>
              {selectedMode === 'quiz-vocab' ? (
                <>
                  <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 32, color: 'var(--gold-light)', direction: 'rtl', marginBottom: 6 }} lang="ar">{quizQuestion.ar}</div>
                  {quizQuestion.translit && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{quizQuestion.translit}</div>}
                </>
              ) : (
                <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.8, fontFamily: 'var(--font-serif)' }}>{quizQuestion.question}</div>
              )}
            </div>

            {/* Choix */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {quizQuestion.choices.map((choice, i) => {
                const isSelected = selected === i
                const isCorrect = i === correction?.correct
                let bg = 'rgba(var(--tarjama-color-primary-rgb),.04)'
                let border = 'rgba(var(--tarjama-color-primary-rgb),.1)'
                let color = 'var(--text)'
                if (quizDone) {
                  if (isCorrect) { bg = 'rgba(var(--tarjama-color-success-rgb, 45, 122, 79),.1)'; border = 'var(--green)'; color = 'var(--green)' }
                  else if (isSelected) { bg = 'rgba(var(--tarjama-color-error-rgb, 184, 74, 74),.1)'; border = 'var(--red)'; color = 'var(--red)' }
                  else { bg = 'rgba(var(--tarjama-color-primary-rgb),.02)'; color = 'var(--text-muted)' }
                }
                return (
                  <button key={i} onClick={() => handleQuizAnswer(i)} disabled={quizDone} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    borderRadius: 10, cursor: quizDone ? 'default' : 'pointer',
                    background: bg, border: `1px solid ${border}`, textAlign: 'left', transition: 'all .15s'
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                      background: quizDone && isCorrect ? 'var(--green)' : quizDone && isSelected ? 'var(--red)' : 'rgba(var(--tarjama-color-primary-rgb),.1)',
                      color: quizDone && (isCorrect || isSelected) ? '#fff' : 'var(--text-muted)'
                    }}>{['A', 'B', 'C', 'D'][i]}</div>
                    <span style={{ fontSize: 14, color, lineHeight: 1.5 }}>{choice}</span>
                    {quizDone && isCorrect && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✓</span>}
                    {quizDone && isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Explication après réponse */}
            {quizDone && correction?.explication && (
              <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)', marginBottom: 16, animation: 'fadeInUp .3s ease' }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>{correction.explication}</div>
              </div>
            )}

            {quizDone && (
              <Button variant="primary" full onClick={nextQuizRound}>
                {round + 1 >= quizQuestions.length ? 'Voir le résultat final' : 'Question suivante →'}
              </Button>
            )}
          </div>
        )}

        {/* ═══ WAITING FOR OPPONENT ═══ */}
        {submitted && !result && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 8 }}>Résultats envoyés !</div>
            {scorePerso !== null && (
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                Score : <strong style={{ color: 'var(--gold)' }}>{scorePerso}/100</strong>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', animation: 'pulse 1.5s infinite', marginTop: 16 }}>En attente de ton adversaire...</div>
          </div>
        )}

        {/* ═══ RESULT ═══ */}
        {result && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{won === true ? '🏆' : won === false ? '😔' : '🤝'}</div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: 4 }}>
              {won === true ? 'Victoire !' : won === false ? 'Défaite...' : 'Égalité !'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Mode : {modeConfig?.title}</div>
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
            {result.questions?.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' }}>
                  {erreurs.length === 0 ? 'Sans faute' : erreurs.length === 1 ? 'Ton erreur' : `Tes ${erreurs.length} erreurs`}
                </div>
                {erreurs.map(e => (
                  <div key={e.i} style={{ padding: '12px 14px', marginBottom: 8, borderRadius: 10, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)' }}>
                    {e.ar
                      ? <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 24, color: 'var(--gold-light)', direction: 'rtl', marginBottom: 4 }} lang="ar" dir="rtl">{e.ar}</div>
                      : <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginBottom: 6 }}>{e.question}</div>}
                    {e.translit && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{e.translit}</div>}
                    <div style={{ fontSize: 13, color: 'var(--red)' }}>
                      <span style={{ opacity: .7 }}>Ta réponse : </span>{e.choices[e.choix]}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--green)' }}>
                      <span style={{ opacity: .7 }}>La bonne : </span>{e.choices[e.correct]}
                    </div>
                    {e.explication && <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 6 }}>{e.explication}</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* La revanche cree un duel du meme mode et affiche son code :
                  elle evite de repasser par le menu, mais l'adversaire doit
                  toujours saisir le nouveau code — rien ne permet de le
                  reinscrire d'office dans une partie qu'il n'a pas acceptee. */}
              <Button onClick={() => { const m = selectedMode; resetDuel(); createDuel(m) }}>Revanche</Button>
              <Button variant="secondary" onClick={resetDuel}>Nouveau duel</Button>
              <Button variant="secondary" onClick={() => {
                const text = `Duel Tarjama (${modeConfig?.title}) ! ${myScore} vs ${oppName} ${oppScore}. tarjama.app`
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
