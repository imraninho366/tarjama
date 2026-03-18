import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const G = {
  dark:'#09090E', dark2:'#0F0F18', dark3:'#161622', dark4:'#1D1D2C',
  gold:'#C9A84C', goldLight:'#E8C97A', goldDim:'#8B6914',
  green:'#4CAF7D', blue:'#5B9BD5', red:'#C96B6B', orange:'#D4874C', purple:'#9B7FD4',
  text:'#EDE8D8', textDim:'#9A9280', textMuted:'#5A5448'
}

const FONT = "'EB Garamond','Georgia','Times New Roman',serif"

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
  { id: 'all',        label: 'Tout le vocabulaire', desc: '3 836 mots' },
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

  // Styles communs
  const card = {
    background: G.dark3,
    border: `1px solid rgba(201,168,76,.12)`,
    borderRadius: 6,
    padding: '20px 24px',
  }

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{minHeight:'100vh',background:G.dark,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:'Cinzel,serif',color:G.gold,fontSize:14,letterSpacing:3}}>CHARGEMENT...</div>
    </div>
  )

  // ── ACCUEIL ───────────────────────────────────────────────────────────────
  if (!mode) return (
    <>
      <Head>
        <title>Quiz — Tarjama</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" rel="stylesheet"/>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${G.dark}}`}</style>
      </Head>
      <div style={{maxWidth:540,margin:'0 auto',padding:'40px 20px',minHeight:'100vh',color:G.text,fontFamily:'Lato,sans-serif'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}>
          <Link href="/" style={{color:G.textMuted,textDecoration:'none',fontSize:11,letterSpacing:2,textTransform:'uppercase'}}>
            Retour
          </Link>
          <span style={{color:G.textMuted,fontSize:10}}>|</span>
          <div style={{fontFamily:'Cinzel,serif',fontSize:20,color:G.gold}}>QUIZ</div>
        </div>

        <div style={{fontFamily:FONT,fontSize:16,color:G.textDim,lineHeight:1.9,marginBottom:32}}>
          Entraîne-toi sur le vocabulaire coranique. Un mot arabe s'affiche — tu choisis sa traduction française parmi quatre propositions.
        </div>

        <div style={{display:'grid',gap:10}}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => startQuiz(m.id)}
              style={{
                ...card,
                cursor:'pointer',
                border: `1px solid rgba(201,168,76,.15)`,
                textAlign:'left',
                display:'flex',
                alignItems:'center',
                justifyContent:'space-between',
                transition:'all .2s',
                outline:'none',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,.15)'}
            >
              <div>
                <div style={{fontFamily:'Cinzel,serif',fontSize:13,color:G.goldLight,letterSpacing:1,marginBottom:3}}>{m.label}</div>
                <div style={{fontSize:11,color:G.textMuted,letterSpacing:1}}>{m.desc}</div>
              </div>
              <div style={{fontSize:18,color:G.gold,opacity:.5}}>›</div>
            </button>
          ))}
        </div>

        {/* Stats rapides */}
        <div style={{marginTop:32,padding:'14px 18px',background:'rgba(201,168,76,.04)',border:'1px solid rgba(201,168,76,.08)',borderRadius:6,fontSize:11,color:G.textMuted,letterSpacing:1,textAlign:'center'}}>
          {vocab.length.toLocaleString('fr')} MOTS DANS LE DICTIONNAIRE
        </div>
      </div>
    </>
  )

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (!question) return null

  const typeColor = {
    nom: G.blue, verbe: G.purple, adjectif: G.orange,
    particule: G.green, préposition: G.gold, expression: G.goldLight
  }

  return (
    <>
      <Head>
        <title>Quiz — Tarjama</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" rel="stylesheet"/>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:${G.dark}}
          @keyframes pop{0%{transform:scale(.95);opacity:0}100%{transform:scale(1);opacity:1}}
          @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        `}</style>
      </Head>

      <div style={{maxWidth:540,margin:'0 auto',padding:'24px 20px',minHeight:'100vh',color:G.text,fontFamily:'Lato,sans-serif'}}>

        {/* Barre top */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
          <button onClick={() => setMode(null)}
            style={{background:'none',border:'none',color:G.textMuted,cursor:'pointer',fontSize:11,letterSpacing:2,textTransform:'uppercase',fontFamily:'Lato,sans-serif'}}>
            Quitter
          </button>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            {score.streak >= 3 && (
              <div style={{fontSize:11,color:G.orange,letterSpacing:1}}>
                {score.streak} serie
              </div>
            )}
            <div style={{fontFamily:'Cinzel,serif',fontSize:22,color:pctColor,minWidth:50,textAlign:'right'}}>
              {score.total > 0 ? `${pct}%` : '—'}
            </div>
            <div style={{fontSize:11,color:G.textMuted,letterSpacing:1}}>
              {score.ok}/{score.total}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        {score.total > 0 && (
          <div style={{height:2,background:'rgba(255,255,255,.05)',borderRadius:1,marginBottom:24,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:pctColor,borderRadius:1,transition:'width .4s ease'}}/>
          </div>
        )}

        {/* Carte mot arabe */}
        <div style={{
          ...card,
          textAlign:'center',
          marginBottom:20,
          padding:'32px 24px',
          animation:'pop .25s ease',
          background:'rgba(22,22,34,.8)',
          border:`1px solid rgba(201,168,76,.2)`,
        }}>
          {/* Type */}
          <div style={{
            display:'inline-block',
            fontSize:9,
            letterSpacing:2,
            textTransform:'uppercase',
            color: typeColor[question.type] || G.textMuted,
            background: `${typeColor[question.type] || G.textMuted}15`,
            padding:'3px 8px',
            borderRadius:2,
            marginBottom:20
          }}>
            {question.type}
          </div>

          {/* Mot arabe */}
          <div style={{
            fontFamily:'Amiri,serif',
            fontSize:52,
            color:G.goldLight,
            direction:'rtl',
            lineHeight:1.3,
            marginBottom:14,
          }}>
            {question.ar}
          </div>

          {/* Translittération */}
          <div style={{
            fontFamily:FONT,
            fontSize:15,
            color:G.textMuted,
            fontStyle:'italic',
            letterSpacing:'.03em'
          }}>
            {question.translit}
          </div>

          {/* Racine */}
          {question.racine && (
            <div style={{
              marginTop:10,
              fontSize:10,
              color:G.textMuted,
              letterSpacing:2,
              textTransform:'uppercase',
              opacity:.6
            }}>
              racine : {question.racine}
            </div>
          )}
        </div>

        {/* Choix */}
        <div style={{display:'grid',gap:8,marginBottom:20}}>
          {choices.map((w, i) => {
            const isSelected = selected === i
            const isCorrectChoice = i === correct
            let bg = 'rgba(255,255,255,.03)'
            let border = 'rgba(255,255,255,.08)'
            let textColor = G.text

            if (done) {
              if (isCorrectChoice) {
                bg = 'rgba(76,175,125,.12)'
                border = G.green
                textColor = G.green
              } else if (isSelected && !isCorrectChoice) {
                bg = 'rgba(201,107,107,.12)'
                border = G.red
                textColor = G.red
              }
            } else {
              if (isSelected) {
                bg = 'rgba(201,168,76,.08)'
                border = G.gold
              }
            }

            return (
              <button key={i} onClick={() => handleChoice(i)}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 4,
                  padding: '14px 18px',
                  cursor: done ? 'default' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all .15s',
                  animation: done && isSelected && !isCorrectChoice ? 'shake .3s ease' : 'none',
                  outline: 'none',
                }}
              >
                {/* Lettre */}
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: done
                    ? isCorrectChoice ? G.green : isSelected ? G.red : 'rgba(255,255,255,.06)'
                    : 'rgba(201,168,76,.1)',
                  color: done
                    ? isCorrectChoice || isSelected ? G.dark : G.textMuted
                    : G.gold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  fontFamily: 'Lato,sans-serif',
                }}>
                  {['A','B','C','D'][i]}
                </div>

                {/* Texte */}
                <div>
                  <div style={{
                    fontFamily: FONT,
                    fontSize: 15,
                    color: textColor,
                    lineHeight: 1.5,
                  }}>
                    {w.sens?.[0] || '—'}
                  </div>
                  {w.sens?.length > 1 && (
                    <div style={{fontSize:12,color:G.textMuted,fontFamily:FONT,fontStyle:'italic',marginTop:2}}>
                      {w.sens.slice(1,3).join(', ')}
                    </div>
                  )}
                </div>

                {/* Icone résultat */}
                {done && (
                  <div style={{marginLeft:'auto',fontSize:14,color:isCorrectChoice ? G.green : isSelected ? G.red : 'transparent'}}>
                    {isCorrectChoice ? '✓' : isSelected ? '✗' : ''}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Feedback après réponse */}
        {done && (
          <div style={{animation:'fadeUp .25s ease'}}>
            {/* Note contextuelle */}
            {question.note && (
              <div style={{
                padding:'12px 16px',
                background:'rgba(155,127,212,.05)',
                border:'1px solid rgba(155,127,212,.15)',
                borderRadius:4,
                marginBottom:12,
                fontFamily:FONT,
                fontSize:14,
                color:G.textDim,
                lineHeight:1.9,
                borderLeft:`2px solid ${G.purple}`,
              }}>
                {question.note}
              </div>
            )}

            {/* Bouton suivant */}
            <button
              onClick={() => nextQuestion(mode)}
              style={{
                width:'100%',
                padding:'14px',
                background: selected === correct
                  ? 'linear-gradient(135deg,#2d6b4a,#4CAF7D)'
                  : 'linear-gradient(135deg,#8B6914,#C9A84C)',
                border:'none',
                borderRadius:4,
                color: G.dark,
                fontFamily:'Lato,sans-serif',
                fontSize:11,
                fontWeight:700,
                letterSpacing:3,
                textTransform:'uppercase',
                cursor:'pointer',
              }}
            >
              {selected === correct ? 'Suivant' : 'Suivant'}
            </button>
          </div>
        )}

        {/* Historique compact */}
        {history.length > 0 && (
          <div style={{marginTop:28}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:G.textMuted,marginBottom:10}}>
              Historique
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {history.map((h,i) => (
                <div key={i} style={{
                  padding:'3px 8px',
                  borderRadius:2,
                  background: h.ok ? 'rgba(76,175,125,.1)' : 'rgba(201,107,107,.1)',
                  border: `1px solid ${h.ok ? 'rgba(76,175,125,.25)' : 'rgba(201,107,107,.25)'}`,
                  fontSize:11,
                  color: h.ok ? G.green : G.red,
                  fontFamily:'Amiri,serif',
                  direction:'rtl',
                  title: h.sens,
                }}>
                  {h.ar}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meilleure série */}
        {score.best >= 5 && (
          <div style={{marginTop:16,textAlign:'center',fontSize:11,color:G.orange,letterSpacing:2}}>
            Meilleure serie : {score.best}
          </div>
        )}
      </div>
    </>
  )
}
