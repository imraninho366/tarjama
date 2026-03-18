import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { SOURATES_LIST } from '../lib/sourates'
import { QURAN } from '../lib/quran'
import { G, nvlColor, nvlBg, nvlBorder } from '../lib/theme'
import Head from 'next/head'
import AuthScreen from '../components/AuthScreen'
import Button from '../components/common/Button'
import Toast from '../components/common/Toast'
import s from '../styles/Home.module.css'

const SUGGESTIONS = [
  {n:1,ar:"الفاتحة",fr:"L'Ouverture",v:7},
  {n:112,ar:"الإخلاص",fr:"La Pureté",v:4},
  {n:103,ar:"العصر",fr:"L'Époque",v:3},
  {n:36,ar:"يس",fr:"Yâ-Sîn",v:83},
  {n:55,ar:"الرحمن",fr:"Le Miséricordieux",v:78},
  {n:67,ar:"الملك",fr:"La Royauté",v:30},
  {n:2,ar:"البقرة",fr:"La Vache",v:286},
]

function AudioPlayer({src}){
  const [playing,setPlaying]=useState(false)
  const [duration,setDuration]=useState(0)
  const [current,setCurrent]=useState(0)
  const [loading,setLoading]=useState(false)
  const audioRef=useRef(null)

  useEffect(()=>{
    setPlaying(false);setCurrent(0);setDuration(0);setLoading(false)
    if(audioRef.current){audioRef.current.pause();audioRef.current.src=src}
  },[src])

  const fmt=(s)=>{if(!s||isNaN(s))return'--:--';const m=Math.floor(s/60);const ss=Math.floor(s%60);return `${m}:${ss.toString().padStart(2,'0')}`}

  const toggle=()=>{
    if(!audioRef.current)return
    if(playing){audioRef.current.pause();setPlaying(false)}
    else{setLoading(true);audioRef.current.play().then(()=>{setPlaying(true);setLoading(false)}).catch(()=>setLoading(false))}
  }

  return(
    <div style={{padding:'8px 16px',borderBottom:'1px solid rgba(201,168,76,.06)',display:'flex',alignItems:'center',gap:12}}>
      <audio ref={audioRef} src={src} preload="none"
        onTimeUpdate={e=>setCurrent(e.target.currentTime)}
        onLoadedMetadata={e=>setDuration(e.target.duration)}
        onEnded={()=>{setPlaying(false);setCurrent(0)}}
        onError={()=>{setPlaying(false);setLoading(false)}}
      />
      <button onClick={toggle} aria-label={playing?'Pause':'Écouter'} style={{
        width:36,height:36,borderRadius:'50%',border:'1px solid rgba(201,168,76,.3)',
        background:playing?'rgba(201,168,76,.15)':'rgba(201,168,76,.07)',
        color:G.gold,cursor:'pointer',display:'flex',alignItems:'center',
        justifyContent:'center',fontSize:14,flexShrink:0,transition:'all .2s'
      }}>
        {loading?'···':playing?'❚❚':'►'}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:G.textMuted,marginBottom:4}}>Mishary Al-Afasy</div>
        <div style={{height:3,background:'rgba(201,168,76,.1)',borderRadius:2,overflow:'hidden',cursor:'pointer'}}
          onClick={e=>{if(!audioRef.current||!duration)return;const rect=e.currentTarget.getBoundingClientRect();audioRef.current.currentTime=(e.clientX-rect.left)/rect.width*duration}}>
          <div style={{height:'100%',width:`${duration?Math.round(current/duration*100):0}%`,background:'linear-gradient(90deg,#8B6914,#C9A84C)',borderRadius:2,transition:'width .3s'}}/>
        </div>
      </div>
      <span style={{fontFamily:'var(--font-display)',fontSize:11,color:G.gold,flexShrink:0,minWidth:40,textAlign:'right'}}>
        {playing||current>0?fmt(current):fmt(duration)}
      </span>
    </div>
  )
}

export default function App({ user, profile, onLogout }){
  const [view,setView]=useState('dashboard')
  const [sourate,setSourate]=useState(null)
  const [vIdx,setVIdx]=useState(0)
  const [progress,setProgress]=useState({})
  const [loadingVerse,setLoadingVerse]=useState(false)
  const [search,setSearch]=useState('')
  const [searchResults,setSearchResults]=useState([])
  const [userTrans,setUserTrans]=useState('')
  const [feedback,setFeedback]=useState(null)
  const [hint,setHint]=useState('')
  const [showHint,setShowHint]=useState(false)
  const [verifying,setVerifying]=useState(false)
  const [hinting,setHinting]=useState(false)
  const [toast,setToast]=useState(null)
  const [hifzMode,setHifzMode]=useState(false)
  const [hifzStep,setHifzStep]=useState('listen')
  const [hifzInput,setHifzInput]=useState('')
  const [hifzResult,setHifzResult]=useState(null)
  const [translit,setTranslit]=useState('')
  const [showTranslit,setShowTranslit]=useState(false)
  const [translitLoading,setTranslitLoading]=useState(false)
  const [tafsir,setTafsir]=useState('')
  const [showTafsir,setShowTafsir]=useState(false)
  const [tafsirLoading,setTafsirLoading]=useState(false)
  const [recording,setRecording]=useState(false)
  const [recorderObj,setRecorderObj]=useState(null)
  const [recTranscript,setRecTranscript]=useState('')
  const [recScore,setRecScore]=useState(null)
  const [recLoading,setRecLoading]=useState(false)

  const showToast=(m,t='info')=>setToast({message:m,type:t})

  // Search sourates
  useEffect(()=>{
    if(!search.trim()){setSearchResults([]);return}
    const q=search.toLowerCase().trim()
    setSearchResults(SOURATES_LIST.filter(ss=>ss.fr.toLowerCase().includes(q)||ss.ar.includes(q)||String(ss.n).includes(q)||(ss.ph&&ss.ph.includes(q))).slice(0,8))
  },[search])

  // Load progress
  useEffect(()=>{
    if(!user) return
    loadProgress(user.id)
  },[user])

  const loadProgress=async(uid)=>{
    const{data}=await supabase.from('progress').select('*').eq('user_id',uid)
    const map={}
    data?.forEach(r=>{map[`${r.sourate_num}:${r.verse_num}`]={userTrans:r.user_trans,niveau:r.niveau,feedback:r.feedback,ts:r.updated_at}})
    setProgress(map)
  }

  // Spaced repetition
  const getReviewList=()=>{
    const today=new Date();today.setHours(0,0,0,0)
    const intervals={wrong:1,partial:3,skipped:1}
    const toReview=[]
    Object.entries(progress).forEach(([key,p])=>{
      if(!intervals[p.niveau]) return
      const ts=p.ts?new Date(p.ts):null
      if(!ts) return
      const daysSince=Math.floor((today-ts)/(1000*60*60*24))
      if(daysSince>=intervals[p.niveau]){
        const [sNum,vNum]=key.split(':').map(Number)
        const sInfo=SOURATES_LIST.find(ss=>ss.n===sNum)
        toReview.push({sNum,vNum,niveau:p.niveau,sInfo,key})
      }
    })
    return toReview
  }

  // Hifz
  const checkHifz=async()=>{
    if(!hifzInput.trim()||!sourate||!verse) return
    const correct=verse.ar.replace(/\s+/g,' ').trim()
    const input=hifzInput.replace(/\s+/g,' ').trim()
    const correctWords=correct.split(' ')
    const inputWords=input.split(' ')
    let matches=0
    inputWords.forEach(w=>{if(correctWords.includes(w))matches++})
    const score=Math.round(matches/correctWords.length*100)
    const niveau=score>=90?'excellent':score>=70?'good':score>=50?'partial':'wrong'
    setHifzResult({score,niveau,correct})
    await supabase.from('progress').upsert({user_id:user.id,sourate_num:sourate.num,verse_num:verse.n,user_trans:`[Hifz] ${hifzInput}`,niveau,feedback:{titre:'Mode Hifz',message:`Score de mémorisation : ${score}%`,niveau}},{onConflict:'user_id,sourate_num,verse_num'})
    setProgress(prev=>({...prev,[`${sourate.num}:${verse.n}`]:{userTrans:`[Hifz] ${hifzInput}`,niveau,feedback:{niveau}}}))
  }

  const startHifz=()=>{setHifzMode(true);setHifzStep('listen');setHifzInput('');setHifzResult(null)}
  const exitHifz=()=>{setHifzMode(false);setHifzStep('listen');setHifzInput('');setHifzResult(null)}

  const compareArabic=(ref,input)=>{
    const clean=(ss)=>ss.replace(/[ً-ٰٟ]/g,'').replace(/\s+/g,' ').trim()
    const refWords=clean(ref).split(' ')
    const inputWords=clean(input).split(' ')
    let correct=0
    const details=refWords.map(rw=>{const found=inputWords.some(iw=>iw===rw||iw.includes(rw.substring(0,3)));if(found)correct++;return{word:rw,ok:found}})
    return{score:Math.round(correct/refWords.length*100),details,correct,total:refWords.length}
  }

  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      const recorder=new MediaRecorder(stream,{mimeType:'audio/webm'})
      const chunks=[]
      recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data)}
      recorder.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop())
        setRecLoading(true)
        const blob=new Blob(chunks,{type:'audio/webm'})
        const reader=new FileReader()
        reader.onload=async()=>{
          const base64=reader.result.split(',')[1]
          try{
            const r=await fetch('/api/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:base64,mimeType:'audio/webm'})})
            const data=await r.json()
            if(data.error)throw new Error(data.error)
            const transcript=data.text||''
            setRecTranscript(transcript)
            if(verse&&transcript){
              const result=compareArabic(verse.ar,transcript)
              setRecScore(result)
              const niveau=result.score>=90?'excellent':result.score>=70?'good':result.score>=50?'partial':'wrong'
              await supabase.from('progress').upsert({user_id:user.id,sourate_num:sourate.num,verse_num:verse.n,user_trans:`[Récitation] ${transcript}`,niveau,feedback:{titre:'Récitation vocale',message:`Score : ${result.score}%`,niveau}},{onConflict:'user_id,sourate_num,verse_num'})
              setProgress(prev=>({...prev,[`${sourate.num}:${verse.n}`]:{userTrans:`[Récitation] ${transcript}`,niveau,feedback:{niveau},ts:new Date().toISOString()}}))
            }
          }catch(err){showToast('Erreur transcription: '+err.message,'error')}
          setRecLoading(false)
        }
        reader.readAsDataURL(blob)
      }
      recorder.start()
      setRecorderObj(recorder)
      setRecording(true)
      setRecTranscript('')
      setRecScore(null)
    }catch(err){showToast('Micro non disponible: '+err.message,'error')}
  }

  const stopRecording=()=>{if(recorderObj&&recording){recorderObj.stop();setRecording(false);setRecorderObj(null)}}

  const fetchTranslit=async()=>{
    if(showTranslit){setShowTranslit(false);return}
    setShowTranslit(true)
    if(translit)return
    setTranslitLoading(true)
    try{
      const r=await fetch('/api/hint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arabic:verse.ar,sourate_num:sourate.num,verse_num:verse.n,mode:'translit'})})
      const data=await r.json()
      setTranslit(data.translit||'Non disponible.')
    }catch{setTranslit('Erreur.')}
    setTranslitLoading(false)
  }

  const fetchTafsir=async()=>{
    if(showTafsir){setShowTafsir(false);return}
    setShowTafsir(true)
    if(tafsir)return
    setTafsirLoading(true)
    try{
      const r=await fetch('/api/tafsir',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arabic:verse.ar,sourate_num:sourate.num,verse_num:verse.n,sourate_ar:sourate.name_ar,sourate_fr:sourate.name_fr})})
      const data=await r.json()
      setTafsir(data.tafsir||'Non disponible.')
    }catch{setTafsir('Erreur.')}
    setTafsirLoading(false)
  }

  const openSourate=async(info)=>{
    setSearch('');setSearchResults([])
    setLoadingVerse(true);setView('sourate');setVIdx(0)
    setUserTrans('');setFeedback(null);setHint('');setShowHint(false);setTranslit('');setShowTranslit(false);setTafsir('');setShowTafsir(false);setRecScore(null);setRecTranscript('')
    const cached=QURAN[info.n]
    if(cached){setSourate({num:info.n,name_ar:info.ar,name_fr:info.fr,verses:cached.verses});setLoadingVerse(false);return}
    try{
      const res=await fetch(`/api/sourate?num=${info.n}`)
      const data=await res.json()
      if(data.error)throw new Error(data.error)
      setSourate({num:info.n,name_ar:info.ar,name_fr:info.fr,verses:data.verses})
    }catch(err){showToast('Erreur de chargement.','error');setView('dashboard')}
    setLoadingVerse(false)
  }

  const goVerse=(i)=>{setVIdx(i);setUserTrans('');setFeedback(null);setHint('');setShowHint(false);setTranslit('');setShowTranslit(false);setTafsir('');setShowTafsir(false);setRecScore(null);setRecTranscript('')}
  const getVP=(sn,vn)=>progress[`${sn}:${vn}`]||null

  const getGlobal=()=>{
    const total=Object.keys(progress).length
    let done=0
    Object.values(progress).forEach(p=>{if(p.niveau==='excellent'||p.niveau==='good')done++})
    return{total,done,pct:total?Math.round(done/total*100):0}
  }

  const verify=async()=>{
    if(verifying||!userTrans.trim()||!sourate)return
    setVerifying(true)
    const v=sourate.verses[vIdx]
    try{
      const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arabic:v.ar,sourate_num:sourate.num,verse_num:v.n,sourate_ar:sourate.name_ar,sourate_fr:sourate.name_fr,user_trans:userTrans})})
      const result=await r.json()
      if(result.error)throw new Error(result.error)
      setFeedback(result)
      await supabase.from('progress').upsert({user_id:user.id,sourate_num:sourate.num,verse_num:v.n,user_trans:userTrans,niveau:result.niveau,feedback:result},{onConflict:'user_id,sourate_num,verse_num'})
      setProgress(prev=>({...prev,[`${sourate.num}:${v.n}`]:{userTrans,niveau:result.niveau,feedback:result,ts:new Date().toISOString()}}))
      try{
        const vr=await fetch('/api/vocab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arabic:v.ar,sourate_num:sourate.num,verse_num:v.n,sourate_ar:sourate.name_ar,sourate_fr:sourate.name_fr})})
        const vdata=await vr.json()
        if(vdata.mots?.length>0){
          const rows=vdata.mots.map(m=>({user_id:user.id,ar:m.ar,translit:m.translit,racine:m.racine,sens:m.sens,freq:m.freq||0,freq_label:m.freq_label,type:m.type,exemple_autre:m.exemple_autre,exemple_ref:m.exemple_ref,sourate_num:sourate.num,verse_num:v.n}))
          await supabase.from('vocab').upsert(rows,{onConflict:'user_id,ar',ignoreDuplicates:true})
        }
      }catch(e){console.log('Vocab save error:',e.message)}
      const msgs={excellent:'مَاشَاءَ اللَّه — Excellent !',good:'جَيِّد — Bien !',partial:'تَقْرِيبًا — Presque !',wrong:'حَاوِلْ مَرَّةً — Réessaie !'}
      showToast(msgs[result.niveau]||'',result.niveau==='excellent'||result.niveau==='good'?'success':'warning')
    }catch(err){showToast(`Erreur: ${err.message}`,'error')}
    setVerifying(false)
  }

  const fetchHint=async()=>{
    if(showHint){setShowHint(false);return}
    if(hint){setShowHint(true);return}
    setHinting(true)
    const v=sourate.verses[vIdx]
    try{
      const r=await fetch('/api/hint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arabic:v.ar,sourate_num:sourate.num,verse_num:v.n})})
      const data=await r.json()
      setHint(data.hint||'Indice non disponible.');setShowHint(true)
    }catch{setHint('Erreur.');setShowHint(true)}
    setHinting(false)
  }

  const skipVerse=async()=>{
    const v=sourate.verses[vIdx]
    await supabase.from('progress').upsert({user_id:user.id,sourate_num:sourate.num,verse_num:v.n,user_trans:'(passé)',niveau:'skipped',feedback:null},{onConflict:'user_id,sourate_num,verse_num'})
    setProgress(prev=>({...prev,[`${sourate.num}:${v.n}`]:{userTrans:'(passé)',niveau:'skipped'}}))
    if(vIdx<sourate.verses.length-1)goVerse(vIdx+1);else setView('done')
  }

  const retryVerse=async()=>{
    if(!sourate||!sourate.verses[vIdx])return
    const v=sourate.verses[vIdx]
    const key=`${sourate.num}:${v.n}`
    await supabase.from("progress").delete().eq("user_id",user.id).eq("sourate_num",sourate.num).eq("verse_num",v.n)
    setProgress(prev=>{const next={...prev};delete next[key];return next})
    setUserTrans("");setFeedback(null);setHint("");setShowHint(false)
    showToast("Réessaie ta traduction !")
  }

  const VERSE_COUNTS={1:7,2:286,3:200,4:176,5:120,6:165,7:206,8:75,9:129,10:109,11:123,12:111,13:43,14:52,15:99,16:128,17:111,18:110,19:98,20:135,21:112,22:78,23:118,24:64,25:77,26:227,27:93,28:88,29:69,30:60,31:34,32:30,33:73,34:54,35:45,36:83,37:182,38:88,39:75,40:85,41:54,42:53,43:89,44:59,45:37,46:35,47:38,48:29,49:18,50:45,51:60,52:49,53:62,54:55,55:78,56:96,57:29,58:22,59:24,60:13,61:14,62:11,63:11,64:18,65:12,66:12,67:30,68:52,69:52,70:44,71:28,72:28,73:20,74:56,75:40,76:31,77:50,78:40,79:46,80:42,81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,90:20,91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,101:11,102:8,103:3,104:9,105:5,106:4,107:7,108:3,109:6,110:3,111:5,112:4,113:5,114:6}
  const getAbsoluteVerseNum=(sourateNum,verseNum)=>{let base=0;for(let i=1;i<sourateNum;i++)base+=VERSE_COUNTS[i]||0;return base+verseNum}

  // Swipe gesture for verse navigation
  const touchRef=useRef({startX:0,startY:0})
  const handleTouchStart=(e)=>{
    touchRef.current.startX=e.touches[0].clientX
    touchRef.current.startY=e.touches[0].clientY
  }
  const handleTouchEnd=(e)=>{
    if(!sourate||!verse)return
    const dx=e.changedTouches[0].clientX-touchRef.current.startX
    const dy=e.changedTouches[0].clientY-touchRef.current.startY
    if(Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*0.7)return // too short or too vertical
    if(dx<0&&vIdx<sourate.verses.length-1)goVerse(vIdx+1) // swipe left = next
    if(dx>0&&vIdx>0)goVerse(vIdx-1) // swipe right = prev
  }

  const glb=getGlobal()
  const verse=sourate?.verses?.[vIdx]
  const existing=verse?getVP(sourate.num,verse.n):null
  const isLast=sourate?vIdx===sourate.verses.length-1:false

  // ── AUTH SCREEN ─────────────────────────────────────────────
  if(!user||!profile) return(
    <>
      <Head><title>Tarjama — Connexion</title></Head>
      <AuthScreen />
    </>
  )

  // ── SIDEBAR CONTENT (rendered by page, used in Layout) ─────
  // For now, sidebar content is inlined here. In a future refactor,
  // this could be passed to Layout via context or render props.

  // ── APP ─────────────────────────────────────────────────────
  return(
    <>
      <Head><title>Tarjama — {profile.username}</title></Head>

      {/* ── SEARCH BOX (above main content on mobile) ──────── */}
      <div className={s.searchBox}>
        <div className={s.searchInput}>
          <span className={s.searchIcon}>◇</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une sourate..." className={s.searchField}/>
          {search&&<span className={s.searchClear} onClick={()=>setSearch('')}>✕</span>}
        </div>
        {searchResults.length>0&&(
          <div className={s.searchResults}>
            {searchResults.map(sr=>(
              <div key={sr.n} className={s.searchResult} onClick={()=>openSourate(sr)}>
                <span className={s.searchResultNum}>{sr.n}.</span>
                <span className={s.searchResultAr}>{sr.ar}</span>
                <div style={{textAlign:'right'}}>
                  <div className={s.searchResultFr}>{sr.fr}</div>
                  <div className={s.searchResultV}>{sr.v} versets</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={s.sectionLabel} style={{textAlign:'center',marginBottom:12}}>114 SOURATES</div>

      {/* Review button */}
      {(()=>{const rl=getReviewList();return rl.length>0?(
        <div className={`${s.reviewBtn} ${view==='review'?s.reviewBtnActive:''}`} onClick={()=>setView('review')}>
          <div className={s.reviewBadge}>{rl.length}</div>
          <div>
            <div className={s.reviewLabel}>À REVOIR AUJOURD'HUI</div>
            <div className={s.reviewSub}>{rl.length} verset{rl.length>1?'s':''} en attente</div>
          </div>
        </div>
      ):null})()}

      {/* Suggestions */}
      <div>
        <div className={s.sectionLabel} style={{marginBottom:8}}>Suggestions</div>
        {SUGGESTIONS.map(sg=>{
          const isA=sourate?.num===sg.n&&view==='sourate'
          const done=Object.keys(progress).filter(k=>k.startsWith(`${sg.n}:`)).length
          return(
            <div key={sg.n} className={`${s.sourateItem} ${isA?s.sourateItemActive:''}`} onClick={()=>openSourate(sg)}>
              <span className={s.sourateNum}>{sg.n}.</span>
              <div style={{flex:1,minWidth:0}}>
                <span className={s.sourateAr}>{sg.ar}</span>
                <span className={s.sourateFr}>{sg.fr} · {sg.v} v.</span>
              </div>
              {done>0&&<span className={s.sourateDone}>{done}</span>}
            </div>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT VIEWS
          ══════════════════════════════════════════════════════════ */}

      {/* DASHBOARD */}
      {view==='dashboard'&&(()=>{
        const total=Object.keys(progress).length
        let correct=0,partial=0,wrong=0
        Object.values(progress).forEach(p=>{if(p.niveau==='excellent'||p.niveau==='good')correct++;else if(p.niveau==='partial')partial++;else if(p.niveau==='wrong')wrong++})
        return<>
          <div className={s.welcome}>
            <span className={s.welcomeAr}>أَهْلًا وَسَهْلًا</span>
            <div>
              <div className={s.welcomeTitle}>Bienvenue, {profile.username} !</div>
              <div className={s.welcomeSub}>Recherche une sourate et commence à traduire.</div>
            </div>
          </div>
          <div className={s.statsGrid}>
            {[['Traduits',G.gold,total],['Excellents',G.green,correct],['Partiels',G.orange,partial],['À revoir',G.red,wrong]].map(([lbl,clr,num])=>(
              <div key={lbl} className={s.statCard}>
                <span className={s.statNum} style={{color:clr}}>{num}</span>
                <span className={s.statLabel}>{lbl}</span>
              </div>
            ))}
          </div>
          <div className={s.dashboardCta}>
            <p className={s.dashboardCtaText}>Recherche une sourate dans la barre ci-dessus</p>
            <Button onClick={()=>openSourate(SUGGESTIONS[0])}>Commencer par Al-Fatiha →</Button>
          </div>
        </>
      })()}

      {/* REVIEW */}
      {view==='review'&&(()=>{
        const rl=getReviewList()
        if(rl.length===0)return(
          <div className={s.emptyState}>
            <div className={s.emptyIcon}>—</div>
            <div className={s.emptyTitle}>Tout est à jour !</div>
            <div className={s.emptyText}>Tu n'as aucun verset à revoir aujourd'hui.<br/>Continue à traduire de nouvelles sourates.</div>
          </div>
        )
        return<>
          <div className={s.reviewHeader}>
            <span className={s.reviewHeaderLine}/>
            {rl.length} verset{rl.length>1?'s':''} à revoir aujourd'hui
          </div>
          {rl.map(item=>{
            const sInfo=item.sInfo||{ar:'?',fr:'?'}
            const badge={wrong:{label:'Faux',clr:G.red,bg:G.red+'1e'},partial:{label:'Partiel',clr:G.orange,bg:G.orange+'1e'},skipped:{label:'Passé',clr:G.textMuted,bg:G.textMuted+'1e'}}[item.niveau]||{label:'?',clr:G.textMuted,bg:'transparent'}
            return(
              <div key={item.key} className={s.reviewItem} onClick={()=>{
                const info={n:item.sNum,ar:sInfo.ar,fr:sInfo.fr,v:sInfo.v||0}
                openSourate(info).then(()=>setTimeout(()=>goVerse(item.vNum-1),500))
              }}>
                <div className={s.reviewItemRef}>{item.sNum}:{item.vNum}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className={s.reviewItemAr}>{sInfo.ar}</div>
                  <div className={s.reviewItemFr}>Verset {item.vNum} · {sInfo.fr}</div>
                </div>
                <span className={s.reviewItemBadge} style={{color:badge.clr,background:badge.bg}}>{badge.label}</span>
                <span className={s.reviewItemArrow}>→</span>
              </div>
            )
          })}
        </>
      })()}

      {/* LOADING */}
      {view==='sourate'&&loadingVerse&&(
        <div className={s.loading}>
          <div className={s.loadingSpinner}/>
          <div className={s.loadingText}>تحميل السورة...</div>
        </div>
      )}

      {/* SOURATE VIEW */}
      {view==='sourate'&&!loadingVerse&&sourate&&verse&&<div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className={s.sourateHeader}>
          <span className={s.sourateHeaderLine}/>{sourate.num}. {sourate.name_ar} — {sourate.name_fr}
          <span className={s.sourateHeaderCount}>{sourate.verses.length} versets</span>
        </div>

        {/* Verse pills */}
        <div className={s.versePills}>
          {sourate.verses.map((v,i)=>{
            const p=getVP(sourate.num,v.n);const isA=i===vIdx
            return<button key={v.n} onClick={()=>goVerse(i)} className={`${s.versePill} ${isA?s.versePillActive:''} ${p&&!isA?s.versePillDone:''}`}>{v.n}</button>
          })}
        </div>

        {/* Verse card */}
        <div className={s.verseCard}>
          <div className={s.verseCardHeader}>
            <span className={s.verseRef}>S.{sourate.num} — V.{verse.n}</span>
            {verse.n===1&&sourate.num!==9&&<span className={s.bismillahBadge}>بسملة</span>}
            <span className={s.verseProgress}>{vIdx+1} / {sourate.verses.length}</span>
          </div>

          {/* Arabic text */}
          {(!hifzMode||hifzStep==='listen')&&<div className={s.verseArabic} lang="ar">{verse.ar}</div>}
          {hifzMode&&hifzStep!=='listen'&&<div className={s.verseHidden}>Texte caché — écris de mémoire !</div>}

          {/* Toggle buttons */}
          <div className={s.toggleRow}>
            <button onClick={fetchTranslit} className={`${s.toggleBtn} ${showTranslit?s.toggleBtnActive:''}`}>
              {translitLoading?'...':(showTranslit?'Masquer Translittération':'Translittération')}
            </button>
            <button onClick={fetchTafsir} className={`${s.toggleBtn} ${showTafsir?s.toggleBtnPurple:''}`}>
              {tafsirLoading?'...':(showTafsir?'Masquer Tafsir':'Tafsir & Grammaire')}
            </button>
          </div>

          {/* Transliteration */}
          {showTranslit&&(
            <div className={s.panelTranslit}>
              <div className={s.panelLabel}>Translittération</div>
              <div className={s.panelText}>{translitLoading?'Chargement...':translit}</div>
            </div>
          )}

          {/* Tafsir */}
          {showTafsir&&(
            <div className={s.panelTafsir}>
              <div className={`${s.panelLabel} ${s.panelLabelPurple}`}>
                <span className={s.panelLabelLine}/>Tafsir & Grammaire
              </div>
              {tafsirLoading
                ?<div className={s.panelText}>L'IA analyse le verset...</div>
                :<div className={s.tafsirText}>{tafsir}</div>
              }
            </div>
          )}

          {/* Hifz toggle */}
          {!hifzMode&&<div style={{display:'flex',justifyContent:'flex-end',padding:'0 16px 8px'}}>
            <Button variant="secondary" small onClick={startHifz} style={{color:G.purple,borderColor:'rgba(155,127,212,.25)'}}>Mode Hifz</Button>
          </div>}

          {/* Hifz mode */}
          {hifzMode&&(
            <div className={s.hifzPanel}>
              <div className={s.hifzHeader}>
                <div className={s.hifzTitle}>Mode Hifz — Mémorisation</div>
                <Button variant="ghost" small onClick={exitHifz}>✕ Quitter</Button>
              </div>

              {hifzStep==='listen'&&(
                <div style={{textAlign:'center',padding:'10px 0'}}>
                  <div style={{fontSize:13,color:G.textDim,marginBottom:16,lineHeight:1.8}}>
                    1. Écoute la récitation du verset<br/>
                    <span style={{color:G.textMuted,fontSize:11}}>Tu peux l'écouter plusieurs fois</span>
                  </div>

                  {/* Recording section */}
                  <div className={s.recSection}>
                    <div className={s.recLabel}>Récitation vocale</div>
                    <div className={s.recActions}>
                      {!recording&&!recLoading&&<Button variant="danger" small onClick={startRecording}>Enregistrer</Button>}
                      {recording&&<Button variant="danger" small onClick={stopRecording} className={s.recPulsing}>Arreter</Button>}
                      {recording&&<span style={{fontSize:11,color:G.red}} className={s.recPulsing}>Enregistrement en cours...</span>}
                      {recLoading&&<span style={{fontSize:11,color:G.textMuted}}>Analyse en cours...</span>}
                    </div>

                    {recScore&&(
                      <div className={s.recScore}>
                        <div className={s.recScoreHeader}>
                          <span className={s.recScoreNum} style={{color:recScore.score>=70?G.green:recScore.score>=50?G.orange:G.red}}>{recScore.score}%</span>
                          <span className={s.recScoreSub}>{recScore.correct}/{recScore.total} mots corrects</span>
                        </div>
                        <div className={s.recWords}>
                          {recScore.details.map((d,i)=>(
                            <span key={i} className={`${s.recWord} ${d.ok?s.recWordOk:s.recWordWrong}`}>{d.word}</span>
                          ))}
                        </div>
                        {recTranscript&&<div className={s.recTranscript}>Transcrit : {recTranscript}</div>}
                      </div>
                    )}
                  </div>

                  <Button variant="secondary" onClick={()=>{setHifzStep('write');setRecScore(null);setRecTranscript('')}} style={{color:G.purple,borderColor:'rgba(155,127,212,.3)'}}>
                    Mode écrit → Écrire de mémoire
                  </Button>
                </div>
              )}

              {hifzStep==='write'&&(
                <div>
                  <div style={{fontSize:13,color:G.textDim,marginBottom:10,lineHeight:1.8}}>
                    2. Écris le verset de mémoire en arabe
                    <span style={{display:'block',color:G.textMuted,fontSize:11}}>Sans regarder le texte au-dessus !</span>
                  </div>
                  <textarea value={hifzInput} onChange={e=>setHifzInput(e.target.value)} placeholder="اكتب الآية من الذاكرة..." dir="rtl" className={s.hifzTextarea} lang="ar"/>
                  <div className={s.actions} style={{marginTop:10}}>
                    <Button variant="secondary" onClick={checkHifz} disabled={!hifzInput.trim()} style={{color:G.purple,borderColor:'rgba(155,127,212,.3)',flex:'1 1 auto'}}>Vérifier ma mémorisation</Button>
                    <Button variant="ghost" onClick={()=>setHifzStep('listen')}>← Réécouter</Button>
                  </div>
                </div>
              )}

              {hifzResult&&(
                <div style={{marginTop:12,padding:'12px 14px',background:nvlBg[hifzResult.niveau],border:`1px solid ${nvlBorder[hifzResult.niveau]}`,borderRadius:4,animation:'fadeInUp .3s ease'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <span style={{fontFamily:'var(--font-display)',fontSize:28,color:nvlColor[hifzResult.niveau],fontWeight:700}}>{hifzResult.score}%</span>
                    <div>
                      <div style={{fontSize:12,color:nvlColor[hifzResult.niveau],fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>
                        {hifzResult.niveau==='excellent'?'Mémorisé !':hifzResult.niveau==='good'?'Presque parfait':hifzResult.niveau==='partial'?'Continue !':'À retravailler'}
                      </div>
                      <div style={{fontSize:11,color:G.textMuted}}>Score de mémorisation</div>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:G.textMuted,marginBottom:8}}>Verset correct :</div>
                  <div style={{fontFamily:'var(--font-arabic)',fontSize:20,color:G.goldLight,direction:'rtl',textAlign:'right',lineHeight:1.8}} lang="ar">{hifzResult.correct}</div>
                  <div className={s.actions} style={{marginTop:12}}>
                    <Button variant="secondary" small onClick={()=>{setHifzInput('');setHifzResult(null);setHifzStep('listen')}} style={{color:G.purple,borderColor:'rgba(155,127,212,.25)'}}>Réessayer</Button>
                    {!isLast&&<Button variant="success" small onClick={()=>{exitHifz();goVerse(vIdx+1)}} style={{flex:'1 1 auto'}}>Verset suivant →</Button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audio player */}
          <AudioPlayer src={`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getAbsoluteVerseNum(sourate.num,verse.n)}.mp3`} key={`audio-${sourate.num}-${verse.n}`}/>

          {/* Hint */}
          {showHint&&<div className={s.hintBox}>{hint}</div>}

          {/* Translation input */}
          <div className={s.translationSection}>
            <div className={s.translationLabel}>
              <span className={s.translationLabelIcon}>—</span> Votre traduction en français
            </div>
            <textarea
              value={existing?(existing.userTrans||''):userTrans}
              onChange={e=>!existing&&setUserTrans(e.target.value)}
              disabled={!!existing||verifying}
              placeholder="Écrivez votre traduction de ce verset..."
              onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)verify()}}
              className={s.translationInput}
            />
            {verifying&&<div className={s.shimmerBar}/>}
            {verifying&&<div className={s.verifyingText}>L'IA analyse votre traduction...</div>}

            <div className={s.actions}>
              {!existing&&<>
                <Button onClick={verify} disabled={verifying||!userTrans.trim()} className={s.actionMain}>
                  {verifying?'...':'✓ Vérifier'}
                </Button>
                <Button variant="secondary" onClick={fetchHint} disabled={hinting} style={{color:G.purple,borderColor:'rgba(155,127,212,.25)'}}>
                  {hinting?'...':showHint?'Masquer':'Indice'}
                </Button>
                <Button variant="ghost" onClick={skipVerse}>→ Passer</Button>
              </>}
              {vIdx>0&&<Button variant="secondary" onClick={()=>goVerse(vIdx-1)} style={{color:G.blue,borderColor:'rgba(91,155,213,.2)'}}>← Préc.</Button>}
              {existing&&(existing.niveau==='wrong'||existing.niveau==='partial'||existing.niveau==='skipped')&&<Button variant="secondary" onClick={retryVerse} style={{color:G.orange,borderColor:'rgba(212,135,76,.25)'}}>Réessayer</Button>}
              {existing&&!isLast&&<Button variant="success" onClick={()=>goVerse(vIdx+1)} className={s.actionMain}>Suivant →</Button>}
              {existing&&isLast&&<Button variant="success" onClick={()=>setView('done')} className={s.actionMain}>Terminer</Button>}
            </div>
          </div>

          {/* Feedback */}
          {(feedback||existing?.feedback)&&(()=>{
            const r=feedback||existing?.feedback;const lv=r.niveau||'wrong'
            return<div className={s.feedbackWrap}>
              <div className={s.feedbackCard} style={{background:nvlBg[lv],border:`1px solid ${nvlBorder[lv]}`}}>
                <div className={s.feedbackHeader}>
                  <span className={s.feedbackTitle} style={{color:nvlColor[lv]}}>{r.titre||''}</span>
                </div>
                <div className={s.feedbackMessage}>{r.message||''}</div>
                {r.traduction_ref&&<div className={s.refSection}>
                  <div className={s.refLabel}>Traduction de référence</div>
                  <div className={s.refText}>{r.traduction_ref}</div>
                </div>}
                {r.mot_manque&&<div className={s.missingWord}>Mot à ne pas oublier — <strong className={s.missingWordHighlight}>{r.mot_manque}</strong></div>}
                {r.mots_importants?.length>0&&<div className={s.wordsSection}>
                  <div className={s.wordsLabel}>Mots importants</div>
                  <div className={s.wordsGrid}>
                    {r.mots_importants.map((w,i)=><div key={i} className={s.wordBadge}>
                      <span className={s.wordBadgeAr}>{w.ar}</span>
                      <span className={s.wordBadgeFr}>{w.fr}</span>
                    </div>)}
                  </div>
                </div>}
              </div>
            </div>
          })()}
        </div>
      </div>}

      {/* DONE */}
      {view==='done'&&sourate&&(()=>{
        const done=sourate.verses.filter(v=>getVP(sourate.num,v.n)).length
        const correct=sourate.verses.filter(v=>{const p=getVP(sourate.num,v.n);return p?.niveau==='excellent'||p?.niveau==='good'}).length
        const partial=sourate.verses.filter(v=>getVP(sourate.num,v.n)?.niveau==='partial').length
        const wrong=done-correct-partial
        const pct=Math.round((correct+partial*.5)/sourate.verses.length*100)
        return<div className={s.doneCard}>
          <div className={s.doneEmoji}>&#x2726;</div>
          <div className={s.doneTitle}>Sourate terminée !</div>
          <div className={s.doneSourate}>{sourate.name_ar} — {sourate.name_fr}</div>
          <div className={s.doneStats}>
            {[['Excellents',G.green,correct],['Partiels',G.orange,partial],['À revoir',G.red,wrong],['Score',G.gold,`${pct}%`]].map(([lbl,clr,val])=>(
              <div key={lbl} className={s.doneStat}>
                <span className={s.doneStatNum} style={{color:clr}}>{val}</span>
                <span className={s.doneStatLabel}>{lbl}</span>
              </div>
            ))}
          </div>
          <div className={s.doneActions}>
            <Button onClick={()=>openSourate({n:sourate.num,ar:sourate.name_ar,fr:sourate.name_fr,v:sourate.verses.length})}>Refaire</Button>
            <Button variant="ghost" onClick={()=>{setView('dashboard');setSourate(null)}}>Tableau de bord</Button>
          </div>
        </div>
      })()}

      {/* Toast */}
      <Toast message={toast?.message} type={toast?.type} onClose={()=>setToast(null)}/>
    </>
  )
}
