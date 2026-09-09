import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useVocab } from '../lib/useVocab'
import Button from '../components/common/Button'
import { apiFetch } from '../lib/apiClient'

const MODES = [
  { id: 'traduction', icon: 'ت', title: 'Traduction', desc: 'Traduis 3 versets coraniques', rounds: 3 },
  { id: 'quiz-islam', icon: '☪', title: 'Quiz Islam', desc: '5 questions sur l\'Islam', rounds: 5 },
  { id: 'quiz-vocab', icon: 'ق', title: 'Quiz Vocabulaire', desc: '5 mots arabes à traduire', rounds: 5 },
]

/**
 * Tirage aleatoire REPRODUCTIBLE, a partir de la graine du duel.
 *
 * Le shuffle ci-dessus s'appuie sur Math.random, donc chaque joueur obtenait
 * ses propres mauvaises reponses : meme mot arabe, propositions differentes.
 * L'un pouvait avoir trois distracteurs absurdes et l'autre trois pieges, sur
 * la meme question. Dans un affrontement en tete-a-tete, c'est exactement ce
 * qu'il ne faut pas faire.
 *
 * Generateur de Lehmer : la graine doit rester dans [1, 2147483646]. A zero il
 * resterait bloque sur zero et servirait cinq fois le meme mot.
 */
function makeRng(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function shuffleSeeded(arr, rnd) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Reservoir de mots pour le quiz de vocabulaire.
 *
 * Le tirage se faisait uniformement sur les 6344 mots du dictionnaire. Or 2976
 * d'entre eux — 47 % — portent le label « rare » : des mots comme غصة, qui
 * apparait cinq fois dans tout le Coran. Pres d'une question sur deux tombait
 * donc sur un mot que personne ne reconnait.
 *
 * Les mots rares sont ecartes, et les plus courants comptent plusieurs fois
 * dans le reservoir : ils sortent donc plus souvent, sans faire disparaitre
 * ceux qui sont simplement « frequents ». C'est un duel entre amis, pas un
 * concours d'erudition.
 */
const POIDS_FREQUENCE = { 'très fréquent': 4, 'courant': 3, 'fréquent': 1 }

function reservoirVocab(vocab) {
  const pool = []
  for (const w of vocab) {
    const poids = POIDS_FREQUENCE[w.freq_label]
    // Sans sens defini, la proposition s'afficherait « ? ».
    if (!poids || !w.sens?.[0] || w.en_attente) continue
    // Les noms divins sont ecartes : 51 des 91 ont un quasi-jumeau dans le
    // corpus — « ٱلْعَلِيمُ » = « L'Omniscient » face a « عَلِيم » = « Omniscient ».
    // Ils fourniraient des distracteurs impossibles a departager, et un duel
    // se perd sur une question sans reponse.
    if (w.categorie === '99 noms') continue
    for (let i = 0; i < poids; i++) pool.push(w)
  }
  return pool
}

export default function DuelPage({ user, profile, authReady }) {
  const router = useRouter()
  const { vocab } = useVocab()
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

  // Quiz Islam state
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [quizDone, setQuizDone] = useState(false)

  // Quiz Vocab state
  const [vocabQuestions, setVocabQuestions] = useState([])

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
    pollRef.current = setInterval(async () => {
      const status = await api({ action: 'status', code: data.code })
      if (status.status === 'active') { clearInterval(pollRef.current); startGame(status.mode || mode, status) }
    }, 2000)
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

    } else if (mode === 'quiz-islam') {
      try {
        const r = await apiFetch('/api/quiz-islam', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 5, seed: d.sourate_num * 1000 + d.verse_num }) })
        const data = await r.json()
        setQuestions(data.questions || [])
      } catch { setError('Erreur chargement questions') }
      setView('play-quiz')

    } else if (mode === 'quiz-vocab') {
      const pool = reservoirVocab(vocab)
      if (pool.length < 20) { setError('Vocabulaire en chargement...'); return }

      // Meme graine chez les deux joueurs : ils affrontent les memes questions,
      // avec les memes propositions, dans le meme ordre.
      const rnd = makeRng(d.sourate_num * 1000 + d.verse_num)
      const pick = () => pool[Math.floor(rnd() * pool.length)]

      const qs = []
      const motsVus = new Set()
      // Borne de securite : sans elle, un reservoir trop pauvre en sens
      // distincts ferait tourner la boucle indefiniment et figerait la page.
      let tours = 0

      while (qs.length < 5 && tours++ < 500) {
        const target = pick()
        if (motsVus.has(target.ar)) continue
        motsVus.add(target.ar)

        // Les distracteurs doivent avoir un sens DIFFERENT de la bonne
        // reponse. Tires au hasard dans tout le dictionnaire, deux mots
        // pouvaient partager la meme traduction — la question avait alors
        // deux bonnes reponses, et le joueur en perdait une injustement.
        const sensPris = new Set([target.sens[0].toLowerCase()])
        const wrongs = []
        let essais = 0
        while (wrongs.length < 3 && essais++ < 200) {
          const c = pick()
          const sens = c.sens?.[0]?.toLowerCase()
          if (!sens || sensPris.has(sens)) continue
          sensPris.add(sens)
          wrongs.push(c)
        }
        if (wrongs.length < 3) continue

        const choices = shuffleSeeded([target, ...wrongs], rnd)
        qs.push({
          ar: target.ar,
          translit: target.translit,
          choices: choices.map(c => c.sens[0]),
          correct: choices.findIndex(c => c.ar === target.ar),
        })
      }

      if (qs.length < 5) { setError('Impossible de préparer le quiz. Réessaie.'); return }
      setVocabQuestions(qs)
      setView('play-quiz')
    }
  }

  // ── SUBMIT SCORE ───────────────────────────────
  const submitFinalScore = async (scores) => {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    await api({ action: 'submit', code, score: avg })
    setSubmitted(true)
    pollRef.current = setInterval(async () => {
      const status = await api({ action: 'status', code })
      if (status.status === 'finished') { clearInterval(pollRef.current); setResult(status) }
    }, 2000)
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
  const quizQuestions = selectedMode === 'quiz-islam' ? questions : vocabQuestions
  const quizQuestion = quizQuestions[round]

  const handleQuizAnswer = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    const isCorrect = idx === quizQuestion.correct
    const score = isCorrect ? 100 : 0
    setRoundScores(prev => [...prev, score])
    if (navigator.vibrate) navigator.vibrate(isCorrect ? 50 : [50, 30, 50])
    setQuizDone(true)
  }

  const nextQuizRound = () => {
    setSelected(null); setQuizDone(false)
    if (round + 1 >= quizQuestions.length) { submitFinalScore(roundScores) }
    else { setRound(r => r + 1) }
  }

  // ── RESULT ─────────────────────────────────────
  const resetDuel = () => {
    setView('menu'); setResult(null); setSubmitted(false); setTranslation('')
    setCode(''); setDuel(null); setVerses([]); setFeedbacks([]); setRoundScores([])
    setRound(0); setShowCorrection(false); setSelectedMode(null)
    setQuestions([]); setVocabQuestions([]); setSelected(null); setQuizDone(false)
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
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < round ? (roundScores[i] >= 100 ? 'var(--green)' : 'var(--red)') : i === round ? 'var(--gold)' : 'rgba(var(--tarjama-color-primary-rgb),.1)' }} />
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
                const isCorrect = i === quizQuestion.correct
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
            {quizDone && quizQuestion.explanation && (
              <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)', marginBottom: 16, animation: 'fadeInUp .3s ease' }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>{quizQuestion.explanation}</div>
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
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
              Score : <strong style={{ color: 'var(--gold)' }}>{Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)}/100</strong>
            </div>
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
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Button onClick={resetDuel}>Nouveau duel</Button>
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
