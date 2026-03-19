import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { G } from '../lib/theme'
import Button from '../components/common/Button'
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

const MODES = [
  { id: 'all',        label: 'Tout le vocabulaire', desc: 'Tous les mots' },
  { id: 'frequent',   label: 'Mots fréquents',      desc: 'Fréquent & très fréquent' },
  { id: 'nom',        label: 'Noms uniquement',      desc: '2 168 noms' },
  { id: 'verbe',      label: 'Verbes uniquement',    desc: '1 168 verbes' },
  { id: 'adjectif',   label: 'Adjectifs uniquement', desc: '313 adjectifs' },
  { id: '99noms',     label: '99 noms d\'Allah',     desc: 'Asma ul-Husna' },
]

export default function Quiz() {
  const [vocab,      setVocab]      = useState([])
  const [mode,       setMode]       = useState(null)   // null = écran d'accueil
  const [question,   setQuestion]   = useState(null)
  const [choices,    setChoices]    = useState([])
  const [selected,   setSelected]   = useState(null)   // index choix
  const [correct,    setCorrect]    = useState(null)   // index correct
  const [score,      setScore]      = useState({ ok: 0, total: 0, streak: 0, best: 0 })
  const [history,    setHistory]    = useState([])     // {ar, sens, ok}
  const [done,       setDone]       = useState(false)
  const [loading,    setLoading]    = useState(true)

  // Charger le vocab
  useEffect(() => {
    fetch('/quran_vocab.json')
      .then(r => r.json())
      .then(d => { setVocab(d.mots || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Filtrer selon mode
  const getPool = useCallback((m) => {
    if (!vocab.length) return []
    switch(m) {
      case 'frequent':  return vocab.filter(w => w.freq_label === 'fréquent' || w.freq_label === 'tres frequent' || w.freq_label === 'très fréquent')
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
    setScore(prev => {
      const newStreak = isOk ? prev.streak + 1 : 0
      return {
        ok:     prev.ok + (isOk ? 1 : 0),
        total:  prev.total + 1,
        streak: newStreak,
        best:   Math.max(prev.best, newStreak)
      }
    })
    setHistory(prev => [{
      ar:   question.ar,
      sens: question.sens?.[0] || '',
      type: question.type,
      ok:   isOk
    }, ...prev.slice(0, 19)])
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
          <div className={s.scoreArea}>
            {score.streak >= 3 && (
              <div className={s.streak}>
                {score.streak} serie
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

          {/* Translittération */}
          <div className={s.translit}>
            {question.translit}
          </div>

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
              onClick={() => nextQuestion(mode)}
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
            Meilleure serie : {score.best}
          </div>
        )}
      </div>
    </>
  )
}
