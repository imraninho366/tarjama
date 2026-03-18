import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

import { G } from '../lib/theme'
const PW = 'tarjama-gen-2026'

export default function GenDico() {
  const [authed, setAuthed]   = useState(false)
  const [pw, setPw]           = useState('')
  const [pwErr, setPwErr]     = useState(false)
  const [status, setStatus]   = useState('idle')
  const [progress, setProg]   = useState({ done: 0, total: 0, words: 0 })
  const [log, setLog]         = useState([])
  const [newWords, setNewWords] = useState([])
  const [existingVocab, setExistingVocab] = useState([])
  const [pending, setPending] = useState([])
  const runRef = useRef(false)
  const logRef = useRef(null)

  const addLog = (msg, t='info') => {
    setLog(p => [...p.slice(-300), { msg, t, time: new Date().toLocaleTimeString() }])
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 30)
  }

  useEffect(() => {
    fetch('/quran_vocab.json').then(r => r.json()).then(d => setExistingVocab(d.mots || [])).catch(() => {})
    fetch('/pending_lemmas.json').then(r => r.json()).then(d => setPending(d)).catch(() => {})
  }, [])

  const startGen = async () => {
    if (!pending.length || !existingVocab.length) return
    runRef.current = true
    setStatus('running')

    const existingAr = new Set(existingVocab.map(m => m.ar))
    const allNew = []
    const BATCH = 40
    const batches = []
    for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH))

    setProg({ done: 0, total: batches.length, words: existingVocab.length })
    addLog(`Démarrage — ${pending.length} mots en ${batches.length} lots`, 'info')

    for (let i = 0; i < batches.length; i++) {
      if (!runRef.current) { setStatus('paused'); addLog('Pause'); break }
      const batch = batches[i]
      addLog(`Lot ${i+1}/${batches.length} — ${batch.length} mots...`)
      setProg(p => ({ ...p, done: i + 1 }))

      try {
        const r = await fetch('/api/gen-vocab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch })
        })
        const data = await r.json()
        if (data.error) { addLog(`Erreur: ${data.error}`, 'error'); await new Promise(r => setTimeout(r, 2000)); continue }

        let added = 0
        for (const mot of (data.mots || [])) {
          if (mot.ar && !existingAr.has(mot.ar)) {
            allNew.push(mot); existingAr.add(mot.ar); added++
          }
        }
        addLog(`  +${added} mots (total: ${existingVocab.length + allNew.length})`, 'success')
        setProg(p => ({ ...p, words: existingVocab.length + allNew.length }))
        setNewWords([...allNew])
        await new Promise(r => setTimeout(r, 350))
      } catch(e) {
        addLog(`Erreur réseau: ${e.message}`, 'error')
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    if (runRef.current) {
      setStatus('done')
      addLog(`Terminé ! ${allNew.length} nouveaux mots`, 'success')
      download([...existingVocab, ...allNew])
    }
  }

  const download = (mots) => {
    const blob = new Blob([JSON.stringify({ version:'2.0', total: mots.length, generated: new Date().toISOString().split('T')[0], mots }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'quran_vocab_complete.json'; a.click()
    addLog('Fichier quran_vocab_complete.json téléchargé !', 'success')
  }

  const pct = progress.total ? Math.round(progress.done / progress.total * 100) : 0

  if (!authed) return (
    <div style={{minHeight:'100vh',background:G.dark,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:G.dark3,border:`1px solid rgba(201,168,76,.2)`,borderRadius:6,padding:'32px 28px',width:340}}>
        <div style={{fontFamily:'Cinzel,serif',fontSize:18,color:G.gold,marginBottom:4}}>TARJAMA — GÉNÉRATION</div>
        <div style={{fontSize:11,color:G.textMuted,letterSpacing:2,marginBottom:20}}>ACCÈS RESTREINT</div>
        <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setPwErr(false)}}
          onKeyDown={e=>{if(e.key==='Enter'){if(pw===PW)setAuthed(true);else setPwErr(true)}}}
          placeholder="Mot de passe..." autoFocus
          style={{width:'100%',background:G.dark4,border:`1px solid ${pwErr?G.red:'rgba(201,168,76,.2)'}`,color:G.text,padding:'10px 12px',borderRadius:3,fontFamily:'Lato,sans-serif',fontSize:14,outline:'none',marginBottom:8}}/>
        {pwErr && <div style={{fontSize:12,color:G.red,marginBottom:8}}>Incorrect</div>}
        <button onClick={()=>{if(pw===PW)setAuthed(true);else setPwErr(true)}}
          style={{width:'100%',background:G.gold,color:G.dark,border:'none',borderRadius:3,padding:'10px',fontFamily:'Lato,sans-serif',fontWeight:700,fontSize:12,letterSpacing:2,cursor:'pointer'}}>
          ACCÉDER
        </button>
      </div>
    </div>
  )

  return (
    <>
      <Head><title>Génération Dictionnaire — Tarjama</title></Head>
      <div style={{maxWidth:760,margin:'0 auto',padding:24,minHeight:'100vh',background:G.dark,color:G.text,fontFamily:'Lato,sans-serif'}}>
        <div style={{fontFamily:'Cinzel,serif',fontSize:20,color:G.gold,marginBottom:4}}>GÉNÉRATION DICTIONNAIRE</div>
        <div style={{fontSize:11,color:G.textMuted,letterSpacing:2,marginBottom:24}}>
          {pending.length} LEMMES CORANIQUES · {existingVocab.length} MOTS ACTUELS
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
          {[['Mots actuels', existingVocab.length, G.gold],['Lots traités', `${progress.done}/${progress.total}`, '#5B9BD5'],['Nouveaux mots', newWords.length, G.green]].map(([l,v,c])=>(
            <div key={l} style={{background:G.dark3,border:`1px solid rgba(201,168,76,.1)`,borderRadius:4,padding:'12px 16px'}}>
              <div style={{fontFamily:'Cinzel,serif',fontSize:26,color:c}}>{v}</div>
              <div style={{fontSize:10,color:G.textMuted,textTransform:'uppercase',letterSpacing:2,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Barre de progression */}
        {progress.total > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:11,color:G.textMuted}}>
              <span>Progression</span><span style={{color:G.gold}}>{pct}%</span>
            </div>
            <div style={{height:4,background:'rgba(201,168,76,.1)',borderRadius:2}}>
              <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#8B6914,#C9A84C)',borderRadius:2,transition:'width .3s'}}/>
            </div>
          </div>
        )}

        {/* Boutons */}
        <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
          {status==='idle' && <button onClick={startGen}
            style={{background:G.green,color:G.dark,border:'none',borderRadius:3,padding:'10px 20px',fontFamily:'Lato,sans-serif',fontWeight:700,fontSize:11,letterSpacing:2,textTransform:'uppercase',cursor:'pointer'}}>
            LANCER ({pending.length} mots — ~{Math.ceil(pending.length/40*0.4/60)} min)
          </button>}
          {status==='running' && <button onClick={()=>{runRef.current=false}}
            style={{background:G.orange,color:G.dark,border:'none',borderRadius:3,padding:'10px 20px',fontFamily:'Lato,sans-serif',fontWeight:700,fontSize:11,letterSpacing:2,cursor:'pointer'}}>
            PAUSE
          </button>}
          {status==='paused' && <button onClick={startGen}
            style={{background:G.green,color:G.dark,border:'none',borderRadius:3,padding:'10px 20px',fontFamily:'Lato,sans-serif',fontWeight:700,fontSize:11,letterSpacing:2,cursor:'pointer'}}>
            REPRENDRE
          </button>}
          {(status==='done' || newWords.length>0) && <button onClick={()=>download([...existingVocab,...newWords])}
            style={{background:G.gold,color:G.dark,border:'none',borderRadius:3,padding:'10px 20px',fontFamily:'Lato,sans-serif',fontWeight:700,fontSize:11,letterSpacing:2,cursor:'pointer'}}>
            TELECHARGER JSON ({existingVocab.length+newWords.length} mots)
          </button>}
        </div>

        {status==='done' && <div style={{padding:'10px 14px',background:'rgba(76,175,125,.08)',border:`1px solid rgba(76,175,125,.2)`,borderRadius:4,fontSize:12,color:G.green,marginBottom:16}}>
          Terminé ! Remplace <code style={{color:G.gold}}>public/quran_vocab.json</code> par le fichier téléchargé puis redéploie sur Vercel.
        </div>}

        {/* Log */}
        <div ref={logRef} style={{background:G.dark4,border:`1px solid rgba(201,168,76,.08)`,borderRadius:4,padding:14,height:340,overflowY:'auto',fontFamily:'monospace',fontSize:11}}>
          {log.length===0 && <div style={{color:G.textMuted}}>En attente...</div>}
          {log.map((e,i)=>(
            <div key={i} style={{marginBottom:2,color:e.t==='error'?G.red:e.t==='success'?G.green:G.textDim}}>
              <span style={{color:G.textMuted,marginRight:6}}>{e.time}</span>{e.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
