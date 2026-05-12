import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { G } from '../lib/theme'
import { useVocab } from '../lib/useVocab'
import { checkLimit, trackUsage } from '../lib/freemium'
import Button from '../components/common/Button'
import PremiumBanner from '../components/PremiumBanner'
import s from '../styles/Quiz.module.css'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n)
}

function playFeedback(correct) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = correct ? 880 : 220
    osc.type = correct ? 'sine' : 'triangle'
    gain.gain.value = 0.15
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
  if (navigator.vibrate) navigator.vibrate(correct ? 50 : [50, 30, 50])
}

const MODES = [
  { id: 'all',        label: 'Tout le vocabulaire', desc: 'Tous les mots' },
  { id: 'frequent',   label: 'Mots fréquents',      desc: 'Fréquent & très fréquent' },
  { id: 'nom',        label: 'Noms uniquement',      desc: '2 168 noms' },
  { id: 'verbe',      label: 'Verbes uniquement',    desc: '1 168 verbes' },
  { id: 'adjectif',   label: 'Adjectifs uniquement', desc: '313 adjectifs' },
  { id: '99noms',     label: '99 noms d\'Allah',     desc: 'Asma ul-Husna' },
]

export default function Quiz() {
  const { vocab, loading: vocabLoading } = useVocab()
  const [mode,       setMode]       = useState(null)
  const [question,   setQuestion]   = useState(null)
  const [choices,    setChoices]    = useState([])
  const [selected,   setSelected]   = useState(null)
  const [correct,    setCorrect]    = useState(null)
  const [score,      setScore]      = useState({ ok: 0, total: 0, streak: 0, best: 0 })
  const [history,    setHistory]    = useState([])
  const [done,       setDone]       = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [showTranslit, setShowTranslit] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('tarjama_quiz_translit') !== 'false'
  })
  const loading = vocabLoading

  const toggleTranslit = () => {
    const next = !showTranslit
    setShowTranslit(next)
    localStorage.setItem('tarjama_quiz_translit', String(next))
  }

  // Filtrer selon mode
  const getPool = useCallback((m) => {
    if (!vocab.length) return []
    switch(m) {
      case 'frequent':  return vocab.filter(w => w.freq_label === 'fréquent' || w.freq_label === 'très fréquent')
      case 'nom':       return vocab.filter(w => w.type === 'nom')
      case 'verbe':     return vocab.filter(w => w.type === 'verbe')
      case 'adjectif':  return vocab.filter(w => w.type === 'adjectif')
      case '99noms':    return vocab.filter(w => w.categorie === '99 noms')
      default:          return vocab
    }
  }, [vocab])

  // Générer une question
  const nextQuestion = useCallback((m, currentScore) => {
    const pool = getPool(m)
    if (pool.length < 4) return

    const target = pool[Math.floor(Math.random() * pool.length)]
    const wrong  = pickRandom(pool.filter(w => w.ar !== target.ar), 3)
    const all    = shuffle([target, ...wrong])
    const correctIdx = all.findIndex(w => w.ar === target.ar)

    setQuestion(target)
    setChoices(all)
    setCorrect(correctIdx)
    setSelected(null)
    setDone(false)
  }, [getPool])

  const startQuiz = (m) => {
    setMode(m)
    setScore({ ok: 0, total: 0, streak: 0, best: 0 })
    setHistory([])
    nextQuestion(m, { ok: 0, total: 0, streak: 0, best: 0 })
  }

  const handleChoice = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    setDone(true)

    const isOk = idx === correct
    playFeedback(isOk)
    trackUsage('quiz')
    setScore(prev => {
      const newStreak = isOk ? prev.streak + 1 : 0
      return {
        ok:     prev.ok + (isOk ? 1 : 0),
        total:  prev.total + 1,
        streak: newStreak,
        best:   Math.max(prev.best, newStreak)
      }
    })
    if (isOk) {
      const prev = parseInt(localStorage.getItem('tarjama_quiz_correct') || '0')
      localStorage.setItem('tarjama_quiz_correct', String(prev + 1))
    }
    const entry = { ar: question.ar, sens: question.sens?.[0] || '', type: question.type, ok: isOk }
    setHistory(prev => [entry, ...prev.slice(0, 19)])
    try {
      const hist = JSON.parse(localStorage.getItem('tarjama_quiz_history') || '[]')
      hist.unshift(entry)
      localStorage.setItem('tarjama_quiz_history', JSON.stringify(hist.slice(0, 200)))
    } catch {}
  }

  const pct = score.total > 0 ? Math.round(score.ok / score.total * 100) : 0
  const pctColor = pct >= 80 ? G.green : pct >= 50 ? G.orange : G.red

  const typeColor = {
    nom: G.blue, verbe: G.purple, adjectif: G.orange,
    particule: G.green, préposition: G.gold, expression: G.goldLight
  }

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={s.loading}>
      <div className={s.loadingText}>CHARGEMENT...</div>
    </div>
  )

  // ── ACCUEIL ───────────────────────────────────────────────────────────────
  if (!mode) return (
    <>
      <Head>
        <title>Quiz — Tarjama</title>
      </Head>
      <div className={s.container}>
        <div className={s.pageTitle}>QUIZ</div>

        <div className={s.intro}>
          Entraîne-toi sur le vocabulaire coranique. Un mot arabe s'affiche — tu choisis sa traduction française parmi quatre propositions.
        </div>

        <div className={s.modeGrid}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => startQuiz(m.id)} className={s.modeCard}>
              <div>
                <div className={s.modeLabel}>{m.label}</div>
                <div className={s.modeDesc}>{m.desc}</div>
              </div>
              <div className={s.modeArrow}>›</div>
            </button>
          ))}
        </div>

        {/* Dashboard mots connus */}
        {(() => {
          const quizCorrect = parseInt(typeof window !== 'undefined' ? localStorage.getItem('tarjama_quiz_correct') || '0' : '0')
          const quizHistory = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tarjama_quiz_history') || '[]') : []
          const knownWords = [...new Set(quizHistory.filter(h => h.ok).map(h => h.ar))]
          const weakWords = [...new Set(quizHistory.filter(h => !h.ok).map(h => h.ar))].filter(w => !knownWords.includes(w))
          return quizCorrect > 0 ? (
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.08)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' }}>Tes stats quiz</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: knownWords.length > 0 ? 12 : 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--gold)', fontWeight: 700 }}>{quizCorrect}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Bonnes réponses</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--green)', fontWeight: 700 }}>{knownWords.length}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Mots connus</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--orange)', fontWeight: 700 }}>{weakWords.length}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>À revoir</div>
                </div>
              </div>
              {knownWords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                  {knownWords.slice(0, 20).map((w, i) => (
                    <span key={i} style={{ fontFamily: 'var(--font-arabic)', fontSize: 13, color: 'var(--green)', padding: '2px 8px', borderRadius: 6, background: 'rgba(76,175,125,.08)' }}>{w}</span>
                  ))}
                  {knownWords.length > 20 && <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 8px' }}>+{knownWords.length - 20}</span>}
                </div>
              )}
            </div>
          ) : null
        })()}

        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <button onClick={toggleTranslit} style={{
            fontSize: 11, padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
            background: showTranslit ? 'rgba(201,168,76,.12)' : 'rgba(201,168,76,.04)',
            border: `1px solid ${showTranslit ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.08)'}`,
            color: showTranslit ? 'var(--gold)' : 'var(--text-muted)'
          }}>
            {showTranslit ? 'Phonétique activée ✓' : 'Activer la phonétique'}
          </button>
        </div>

        <div className={s.statsFooter}>
          {vocab.length.toLocaleString('fr')} MOTS DANS LE DICTIONNAIRE
        </div>
      </div>
    </>
  )

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (!question) return null

  return (
    <>
      <Head>
        <title>Quiz — Tarjama</title>
      </Head>

      <div className={s.containerQuiz}>

        {/* Barre top */}
        <div className={s.topBar}>
          <button onClick={() => setMode(null)} className={s.quitBtn}>
            Quitter
          </button>
          <button onClick={toggleTranslit} style={{
            fontSize: 10, padding: '4px 10px', borderRadius: 12, cursor: 'pointer',
            background: showTranslit ? 'rgba(201,168,76,.12)' : 'rgba(201,168,76,.04)',
            border: `1px solid ${showTranslit ? 'rgba(201,168,76,.25)' : 'rgba(201,168,76,.08)'}`,
            color: showTranslit ? 'var(--gold)' : 'var(--text-muted)',
            letterSpacing: 1, textTransform: 'uppercase'
          }}>
            {showTranslit ? 'Phonétique ✓' : 'Phonétique'}
          </button>
          <div className={s.scoreArea}>
            {score.streak >= 3 && (
              <div className={s.streak}>
                {score.streak} série
              </div>
            )}
            <div className={s.pctDisplay} style={{ color: pctColor }}>
              {score.total > 0 ? `${pct}%` : '—'}
            </div>
            <div className={s.scoreCount}>
              {score.ok}/{score.total}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        {score.total > 0 && (
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: `${pct}%`, background: pctColor }} />
          </div>
        )}

        {/* Carte mot arabe */}
        <div className={s.questionCard}>
          {/* Type */}
          <div
            className={s.typeBadge}
            style={{
              color: typeColor[question.type] || G.textMuted,
              background: `${typeColor[question.type] || G.textMuted}15`,
            }}
          >
            {question.type}
          </div>

          {/* Mot arabe */}
          <div className={s.arabicWord}>
            {question.ar}
          </div>

          {/* Translittération (toggle) */}
          {showTranslit && question.translit && (
            <div className={s.translit}>
              {question.translit}
            </div>
          )}
          {!showTranslit && (
            <button onClick={() => setShowTranslit(true)} style={{
              fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none',
              cursor: 'pointer', padding: '4px 0', textDecoration: 'underline'
            }}>Voir la phonétique</button>
          )}

          {/* Racine */}
          {question.racine && (
            <div className={s.rootInfo}>
              racine : {question.racine}
            </div>
          )}
        </div>

        {/* Choix */}
        <div className={s.choicesGrid}>
          {choices.map((w, i) => {
            const isSelected = selected === i
            const isCorrectChoice = i === correct

            let btnClass = s.choiceBtn
            let letterClass = s.letterDefault
            let textClass = s.choiceTextDefault

            if (done) {
              btnClass += ` ${s.choiceDone}`
              if (isCorrectChoice) {
                btnClass += ` ${s.choiceCorrect}`
                letterClass = s.letterCorrect
                textClass = s.choiceTextCorrect
              } else if (isSelected && !isCorrectChoice) {
                btnClass += ` ${s.choiceWrong}`
                letterClass = s.letterWrong
                textClass = s.choiceTextWrong
              } else {
                letterClass = s.letterInactive
              }
            }

            return (
              <button key={i} onClick={() => handleChoice(i)} className={btnClass}>
                {/* Lettre */}
                <div className={`${s.letterCircle} ${letterClass}`}>
                  {['A','B','C','D'][i]}
                </div>

                {/* Texte */}
                <div>
                  <div className={`${s.choiceText} ${textClass}`}>
                    {w.sens?.[0] || '—'}
                  </div>
                  {w.sens?.length > 1 && (
                    <div className={s.choiceSubtext}>
                      {w.sens.slice(1,3).join(', ')}
                    </div>
                  )}
                </div>

                {/* Icone résultat */}
                {done && (isCorrectChoice || isSelected) && (
                  <div className={`${s.resultIcon} ${isCorrectChoice ? s.resultIconCorrect : s.resultIconWrong}`}>
                    {isCorrectChoice ? '✓' : '✗'}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Feedback après réponse */}
        {done && (
          <div className={s.feedback}>
            {/* Note contextuelle */}
            {question.note && (
              <div className={s.noteBox}>
                {question.note}
              </div>
            )}

            {/* Bouton suivant */}
            <Button
              variant={selected === correct ? 'success' : 'primary'}
              full
              onClick={() => {
                const { allowed, limit } = checkLimit('quiz')
                if (!allowed) { setShowPremium(true); return }
                nextQuestion(mode)
              }}
            >
              Suivant
            </Button>
          </div>
        )}

        {/* Historique compact */}
        {history.length > 0 && (
          <div className={s.historySection}>
            <div className={s.historyLabel}>
              Historique
            </div>
            <div className={s.historyBadges}>
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`${s.historyBadge} ${h.ok ? s.historyOk : s.historyWrong}`}
                  title={h.sens}
                >
                  {h.ar}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meilleure série */}
        {score.best >= 5 && (
          <div className={s.bestStreak}>
            Meilleure série : {score.best}
          </div>
        )}
      </div>
      {showPremium && <PremiumBanner action="quiz" limit={10} onClose={() => setShowPremium(false)} />}
    </>
  )
}
