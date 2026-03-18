import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { SOURATES_LIST } from '../lib/sourates'
import { QURAN } from '../lib/quran'
import Head from 'next/head'

const AVATAR_COLORS = ['#C9A84C','#4CAF7D','#5B9BD5','#9B7FD4','#D4874C','#C96B6B']
const G = {
  dark:'#09090E',dark2:'#0F0F18',dark3:'#161622',dark4:'#1D1D2C',
  gold:'#C9A84C',goldLight:'#E8C97A',goldDim:'#8B6914',
  text:'#EDE8D8',textDim:'#9A9280',textMuted:'#5A5448',
  green:'#4CAF7D',blue:'#5B9BD5',red:'#C96B6B',orange:'#D4874C',purple:'#9B7FD4',
}
const nvlColor  = {excellent:G.green,good:G.gold,partial:G.orange,wrong:G.red}
const nvlBg     = {excellent:'rgba(76,175,125,.08)',good:'rgba(201,168,76,.07)',partial:'rgba(212,135,76,.07)',wrong:'rgba(201,107,107,.07)'}
const nvlBorder = {excellent:'rgba(76,175,125,.22)',good:'rgba(201,168,76,.18)',partial:'rgba(212,135,76,.2)',wrong:'rgba(201,107,107,.18)'}

const SUGGESTIONS = [
  {n:1,ar:"الفاتحة",fr:"L'Ouverture",v:7},
  {n:112,ar:"الإخلاص",fr:"La Pureté",v:4},
  {n:103,ar:"العصر",fr:"L'Époque",v:3},
  {n:36,ar:"يس",fr:"Yâ-Sîn",v:83},
  {n:55,ar:"الرحمن",fr:"Le Miséricordieux",v:78},
  {n:67,ar:"الملك",fr:"La Royauté",v:30},
  {n:2,ar:"البقرة",fr:"La Vache",v:286},
]

function Btn({onClick,disabled,style,children}){
  return <button onClick={onClick} disabled={disabled} style={{border:'none',borderRadius:2,fontFamily:'Lato,sans-serif',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',cursor:disabled?'default':'pointer',opacity:disabled?.45:1,transition:'all .2s',padding:'9px 18px',...style}}>{children}</button>
}

function AudioPlayer({src}){
  const [playing,setPlaying]=React.useState(false)
  const [duration,setDuration]=React.useState(0)
  const [current,setCurrent]=React.useState(0)
  const [loading,setLoading]=React.useState(false)
  const audioRef=React.useRef(null)

  React.useEffect(()=>{
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
    <div style={{padding:'8px 16px',borderBottom:`1px solid rgba(201,168,76,.06)`,display:'flex',alignItems:'center',gap:12}}>
      <audio ref={audioRef} src={src} preload="none"
        onTimeUpdate={e=>setCurrent(e.target.currentTime)}
        onLoadedMetadata={e=>setDuration(e.target.duration)}
        onEnded={()=>{setPlaying(false);setCurrent(0)}}
        onError={e=>{
          const fallback=src
          if(e.target.src!==fallback){e.target.src=fallback;if(playing)e.target.play()}
        }}
      />
      <button onClick={toggle} style={{
        width:36,height:36,borderRadius:'50%',border:`1px solid rgba(201,168,76,.3)`,
        background:playing?'rgba(201,168,76,.15)':'rgba(201,168,76,.07)',
        color:'#C9A84C',cursor:'pointer',display:'flex',alignItems:'center',
        justifyContent:'center',fontSize:14,flexShrink:0,transition:'all .2s'
      }}>
        {loading?'':playing?'II':''}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'#5A5448',marginBottom:4}}>
          Mishary Al-Afasy
        </div>
        <div style={{height:3,background:'rgba(201,168,76,.1)',borderRadius:2,overflow:'hidden',cursor:'pointer'}}
          onClick={e=>{
            if(!audioRef.current||!duration)return
            const rect=e.currentTarget.getBoundingClientRect()
            const pct=(e.clientX-rect.left)/rect.width
            audioRef.current.currentTime=pct*duration
          }}>
          <div style={{height:'100%',width:`${duration?Math.round(current/duration*100):0}%`,background:'linear-gradient(90deg,#8B6914,#C9A84C)',borderRadius:2,transition:'width .3s'}}/>
        </div>
      </div>
      <span style={{fontFamily:'Cinzel,serif',fontSize:11,color:'#C9A84C',flexShrink:0,minWidth:40,textAlign:'right'}}>
        {playing||current>0?fmt(current):fmt(duration)}
      </span>
    </div>
  )
}

export default function App(){
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [authMode,setAuthMode]=useState('login')
  const [authError,setAuthError]=useState('')
  const [authLoading,setAuthLoading]=useState(false)
  const [regColor,setRegColor]=useState('#C9A84C')
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
  const [toast,setToast]=useState('')
  const [hifzMode,setHifzMode]=useState(false)
  const [hifzStep,setHifzStep]=useState('listen') // listen | write | result
  const [hifzInput,setHifzInput]=useState('')
  const [hifzResult,setHifzResult]=useState(null)
  const [reviewList,setReviewList]=useState([])
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

  const showToast=(m)=>{setToast(m);setTimeout(()=>setToast(''),2500)}

  useEffect(()=>{
    if(!search.trim()){setSearchResults([]);return}
    const q=search.toLowerCase().trim()
    setSearchResults(SOURATES_LIST.filter(s=>s.fr.toLowerCase().includes(q)||s.ar.includes(q)||String(s.n).includes(q)||(s.ph&&s.ph.includes(q))).slice(0,8))
  },[search])

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{if(session?.user)loadProfile(session.user)})
    const {data:l}=supabase.auth.onAuthStateChange((_e,s)=>{if(s?.user)loadProfile(s.user);else{setUser(null);setProfile(null)}})
    return()=>l.subscription.unsubscribe()
  },[])

  const loadProfile=async(u)=>{
    setUser(u)
    const{data:p}=await supabase.from('profiles').select('*').eq('id',u.id).single()
    if(p){setProfile(p);await loadProgress(u.id)}
  }

  const loadProgress=async(uid)=>{
    const{data}=await supabase.from('progress').select('*').eq('user_id',uid)
    const map={}
    data?.forEach(r=>{map[`${r.sourate_num}:${r.verse_num}`]={userTrans:r.user_trans,niveau:r.niveau,feedback:r.feedback,ts:r.updated_at}})
    setProgress(map)
  }


  // Répétition espacée — calcule les versets à revoir aujourd'hui
  const getReviewList=()=>{
    const today=new Date(); today.setHours(0,0,0,0)
    const intervals={wrong:1,partial:3,skipped:1} // jours avant de revoir
    const toReview=[]
    Object.entries(progress).forEach(([key,p])=>{
      if(!intervals[p.niveau]) return
      const ts=p.ts ? new Date(p.ts) : null
      if(!ts) return
      const daysSince=Math.floor((today-ts)/(1000*60*60*24))
      if(daysSince>=intervals[p.niveau]){
        const [sNum,vNum]=key.split(':').map(Number)
        const sInfo=SOURATES_LIST.find(s=>s.n===sNum)
        toReview.push({sNum,vNum,niveau:p.niveau,sInfo,key})
      }
    })
    return toReview
  }

  // Mode Hifz — vérifie la mémorisation
  const checkHifz=async()=>{
    if(!hifzInput.trim()||!sourate||!verse) return
    const correct=verse.ar.replace(/\s+/g,' ').trim()
    const input=hifzInput.replace(/\s+/g,' ').trim()
    // Simple similarity check
    const correctWords=correct.split(' ')
    const inputWords=input.split(' ')
    let matches=0
    inputWords.forEach(w=>{if(correctWords.includes(w))matches++})
    const score=Math.round(matches/correctWords.length*100)
    const niveau=score>=90?'excellent':score>=70?'good':score>=50?'partial':'wrong'
    setHifzResult({score,niveau,correct})
    // Save to progress
    await supabase.from('progress').upsert({
      user_id:user.id,sourate_num:sourate.num,verse_num:verse.n,
      user_trans:`[Hifz] ${hifzInput}`,niveau,feedback:{titre:'Mode Hifz',message:`Score de mémorisation : ${score}%`,niveau}
    },{onConflict:'user_id,sourate_num,verse_num'})
    setProgress(prev=>({...prev,[`${sourate.num}:${verse.n}`]:{userTrans:`[Hifz] ${hifzInput}`,niveau,feedback:{niveau}}}))
  }

  const startHifz=()=>{
    setHifzMode(true)
    setHifzStep('listen')
    setHifzInput('')
    setHifzResult(null)
  }

  const exitHifz=()=>{
    setHifzMode(false)
    setHifzStep('listen')
    setHifzInput('')
    setHifzResult(null)
  }

  // Compare deux textes arabes mot par mot
  const compareArabic=(ref,input)=>{
    const clean=(s)=>s.replace(/[ً-ٰٟ]/g,'').replace(/\s+/g,' ').trim()
    const refWords=clean(ref).split(' ')
    const inputWords=clean(input).split(' ')
    let correct=0
    const details=refWords.map(rw=>{
      const found=inputWords.some(iw=>iw===rw||iw.includes(rw.substring(0,3)))
      if(found)correct++
      return{word:rw,ok:found}
    })
    const score=Math.round(correct/refWords.length*100)
    return{score,details,correct,total:refWords.length}
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
            const r=await fetch('/api/transcribe',{
              method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({audio:base64,mimeType:'audio/webm'})
            })
            const data=await r.json()
            if(data.error)throw new Error(data.error)
            const transcript=data.text||''
            setRecTranscript(transcript)
            if(verse&&transcript){
              const result=compareArabic(verse.ar,transcript)
              setRecScore(result)
              // Save to progress
              const niveau=result.score>=90?'excellent':result.score>=70?'good':result.score>=50?'partial':'wrong'
              await supabase.from('progress').upsert({
                user_id:user.id,sourate_num:sourate.num,verse_num:verse.n,
                user_trans:`[Récitation] ${transcript}`,niveau,
                feedback:{titre:'Récitation vocale',message:`Score : ${result.score}%`,niveau}
              },{onConflict:'user_id,sourate_num,verse_num'})
              setProgress(prev=>({...prev,[`${sourate.num}:${verse.n}`]:{userTrans:`[Récitation] ${transcript}`,niveau,feedback:{niveau},ts:new Date().toISOString()}}))
            }
          }catch(err){showToast('Erreur transcription: '+err.message)}
          setRecLoading(false)
        }
        reader.readAsDataURL(blob)
      }
      recorder.start()
      setRecorderObj(recorder)
      setRecording(true)
      setRecTranscript('')
      setRecScore(null)
    }catch(err){
      showToast('Micro non disponible: '+err.message)
    }
  }

  const stopRecording=()=>{
    if(recorderObj&&recording){
      recorderObj.stop()
      setRecording(false)
      setRecorderObj(null)
    }
  }

  const fetchTranslit=async()=>{
    if(showTranslit){setShowTranslit(false);return}
    setShowTranslit(true)
    if(translit)return
    setTranslitLoading(true)
    try{
      const r=await fetch('/api/hint',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({arabic:verse.ar,sourate_num:sourate.num,verse_num:verse.n,mode:'translit'})})
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
      const r=await fetch('/api/tafsir',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({arabic:verse.ar,sourate_num:sourate.num,verse_num:verse.n,sourate_ar:sourate.name_ar,sourate_fr:sourate.name_fr})})
      const data=await r.json()
      setTafsir(data.tafsir||'Non disponible.')
    }catch{setTafsir('Erreur.')}
    setTafsirLoading(false)
  }

  const doRegister=async(e)=>{
    e.preventDefault();setAuthError('')
    const username=e.target.username.value.trim()
    const password=e.target.password.value
    if(username.length<2)return setAuthError('Nom trop court (min 2 caractères)')
    if(password.length<6)return setAuthError('Mot de passe trop court (min 6 caractères)')
    setAuthLoading(true)
    const email=`${username.toLowerCase().replace(/\s+/g,'_')}@tarjama.app`
    const{data,error}=await supabase.auth.signUp({email,password})
    if(error){setAuthError(error.message);setAuthLoading(false);return}
    await supabase.from('profiles').insert({id:data.user.id,username,color:regColor})
    setAuthLoading(false)
  }

  const doLogin=async(e)=>{
    e.preventDefault();setAuthError('')
    const username=e.target.username.value.trim()
    const password=e.target.password.value
    const email=`${username.toLowerCase().replace(/\s+/g,'_')}@tarjama.app`
    setAuthLoading(true)
    const{error}=await supabase.auth.signInWithPassword({email,password})
    if(error)setAuthError('Identifiants incorrects.')
    setAuthLoading(false)
  }

  const doLogout=async()=>{
    await supabase.auth.signOut()
    setProgress({});setView('dashboard');setSourate(null)
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
    }catch(err){showToast('Erreur de chargement.');setView('dashboard')}
    setLoadingVerse(false)
  }

  const goVerse=(i)=>{setVIdx(i);setUserTrans('');setFeedback(null);setHint('');setShowHint(false);setTranslit('');setShowTranslit(false);setTafsir('');setShowTafsir(false);setRecScore(null);setRecTranscript('')}
  const getVP=(s,v)=>progress[`${s}:${v}`]||null

  const getGlobal=()=>{
    const total=Object.keys(progress).length
    let done=0
    Object.values(progress).forEach(p=>{if(p.niveau==='excellent'||p.niveau==='good')done++})
    return{total,done,pct:total?Math.round(done/total*100):0}
  }

  const verify=async()=>{
    if(verifying||!userTrans.trim()||!sourate)return
    setVerifying(true)
    const verse=sourate.verses[vIdx]
    try{
      const r=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arabic:verse.ar,sourate_num:sourate.num,verse_num:verse.n,sourate_ar:sourate.name_ar,sourate_fr:sourate.name_fr,user_trans:userTrans})})
      const result=await r.json()
      if(result.error)throw new Error(result.error)
      setFeedback(result)
      await supabase.from('progress').upsert({user_id:user.id,sourate_num:sourate.num,verse_num:verse.n,user_trans:userTrans,niveau:result.niveau,feedback:result},{onConflict:'user_id,sourate_num,verse_num'})
      setProgress(prev=>({...prev,[`${sourate.num}:${verse.n}`]:{userTrans,niveau:result.niveau,feedback:result,ts:new Date().toISOString()}}))
      // Enrichir le dictionnaire avec les mots du verset
      try{
        const vr=await fetch('/api/vocab',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({arabic:verse.ar,sourate_num:sourate.num,verse_num:verse.n,sourate_ar:sourate.name_ar,sourate_fr:sourate.name_fr})})
        const vdata=await vr.json()
        if(vdata.mots?.length>0){
          const rows=vdata.mots.map(m=>({
            user_id:user.id,ar:m.ar,translit:m.translit,racine:m.racine,
            sens:m.sens,freq:m.freq||0,freq_label:m.freq_label,type:m.type,
            exemple_autre:m.exemple_autre,exemple_ref:m.exemple_ref,
            sourate_num:sourate.num,verse_num:verse.n
          }))
          await supabase.from('vocab').upsert(rows,{onConflict:'user_id,ar',ignoreDuplicates:true})
        }
      }catch(e){console.log('Vocab save error:',e.message)}
            const msgs={excellent:'مَاشَاءَ اللَّه — Excellent !',good:'جَيِّد — Bien !',partial:'تَقْرِيبًا — Presque !',wrong:'حَاوِلْ مَرَّةً — Réessaie !'}
      showToast(msgs[result.niveau]||'')
    }catch(err){showToast(`Erreur: ${err.message}`)}
    setVerifying(false)
  }

  const fetchHint=async()=>{
    if(showHint){setShowHint(false);return}
    if(hint){setShowHint(true);return}
    setHinting(true)
    const verse=sourate.verses[vIdx]
    try{
      const r=await fetch('/api/hint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arabic:verse.ar,sourate_num:sourate.num,verse_num:verse.n})})
      const data=await r.json()
      setHint(data.hint||'Indice non disponible.')
      setShowHint(true)
    }catch{setHint('Erreur.');setShowHint(true)}
    setHinting(false)
  }

  const skipVerse=async()=>{
    const verse=sourate.verses[vIdx]
    await supabase.from('progress').upsert({user_id:user.id,sourate_num:sourate.num,verse_num:verse.n,user_trans:'(passé)',niveau:'skipped',feedback:null},{onConflict:'user_id,sourate_num,verse_num'})
    setProgress(prev=>({...prev,[`${sourate.num}:${verse.n}`]:{userTrans:'(passé)',niveau:'skipped'}}))
    if(vIdx<sourate.verses.length-1)goVerse(vIdx+1);else setView('done')
  }

  const retryVerse=async()=>{
    if(!sourate||!sourate.verses[vIdx])return
    const v=sourate.verses[vIdx]
    const key=`${sourate.num}:${v.n}`
    await supabase.from("progress").delete().eq("user_id",user.id).eq("sourate_num",sourate.num).eq("verse_num",v.n)
    setProgress(prev=>{const next={...prev};delete next[key];return next})
    setUserTrans("")
    setFeedback(null)
    setHint("")
    setShowHint(false)
    showToast("Réessaie ta traduction !")
  }

  const glb=getGlobal()

  // Calcule le numéro absolu du verset dans le Coran pour l'URL audio
  const VERSE_COUNTS={1:7,2:286,3:200,4:176,5:120,6:165,7:206,8:75,9:129,10:109,11:123,12:111,13:43,14:52,15:99,16:128,17:111,18:110,19:98,20:135,21:112,22:78,23:118,24:64,25:77,26:227,27:93,28:88,29:69,30:60,31:34,32:30,33:73,34:54,35:45,36:83,37:182,38:88,39:75,40:85,41:54,42:53,43:89,44:59,45:37,46:35,47:38,48:29,49:18,50:45,51:60,52:49,53:62,54:55,55:78,56:96,57:29,58:22,59:24,60:13,61:14,62:11,63:11,64:18,65:12,66:12,67:30,68:52,69:52,70:44,71:28,72:28,73:20,74:56,75:40,76:31,77:50,78:40,79:46,80:42,81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,90:20,91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,101:11,102:8,103:3,104:9,105:5,106:4,107:7,108:3,109:6,110:3,111:5,112:4,113:5,114:6}
  const getAbsoluteVerseNum=(sourateNum,verseNum)=>{
    let base=0
    for(let i=1;i<sourateNum;i++) base+=VERSE_COUNTS[i]||0
    return base+verseNum
  }
  const verse=sourate?.verses?.[vIdx]
  const existing=verse?getVP(sourate.num,verse.n):null
  const isLast=sourate?vIdx===sourate.verses.length-1:false

  // LOGIN
  if(!user||!profile)return(
    <>
      <Head>
        <title>Tarjama — Connexion</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content="#C9A84C"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Tarjama"/>
        <meta name="description" content="Apprends le Coran en traduisant verset par verset avec correction IA"/>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icon.svg"/>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
      </Head>
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:G.dark}}>
        <div style={{background:G.dark3,border:`1px solid rgba(201,168,76,.2)`,borderRadius:8,padding:'36px 28px',width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
          <div style={{fontFamily:'Amiri,serif',fontSize:30,color:G.gold,textAlign:'center',opacity:.7,marginBottom:6}}></div>
          <div style={{fontFamily:'Cinzel,serif',fontSize:26,color:G.gold,textAlign:'center',letterSpacing:5,marginBottom:4}}>TARJAMA</div>
          <div style={{fontSize:11,color:G.textMuted,textAlign:'center',letterSpacing:3,textTransform:'uppercase',marginBottom:28}}>ترجمة — Traduction coranique</div>
          <div style={{display:'flex',border:`1px solid rgba(201,168,76,.15)`,borderRadius:3,overflow:'hidden',marginBottom:22}}>
            {['login','register'].map(m=>(
              <button key={m} onClick={()=>{setAuthMode(m);setAuthError('')}} style={{flex:1,padding:'9px 0',background:authMode===m?'rgba(201,168,76,.1)':'transparent',border:'none',color:authMode===m?G.gold:G.textDim,fontFamily:'Lato,sans-serif',fontSize:11,letterSpacing:2,textTransform:'uppercase',cursor:'pointer'}}>
                {m==='login'?'Se connecter':'Créer un compte'}
              </button>
            ))}
          </div>
          {authMode==='login'?(
            <form onSubmit={doLogin}>
              {[['username',"Nom d'utilisateur",'Votre prénom ou pseudo','text'],['password','Mot de passe','••••••••','password']].map(([name,label,ph,type])=>(
                <div key={name} style={{marginBottom:14}}>
                  <label style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textDim,display:'block',marginBottom:5}}>{label}</label>
                  <input name={name} type={type} placeholder={ph} required autoComplete={name} style={{width:'100%',background:G.dark4,border:`1px solid rgba(201,168,76,.15)`,color:G.text,padding:'10px 13px',borderRadius:3,fontFamily:'Lato,sans-serif',fontSize:14,outline:'none'}}/>
                </div>
              ))}
              <button type="submit" disabled={authLoading} style={{width:'100%',background:'linear-gradient(135deg,#8B6914,#C9A84C)',color:G.dark,border:'none',padding:13,borderRadius:3,fontFamily:'Lato,sans-serif',fontSize:12,fontWeight:700,letterSpacing:3,textTransform:'uppercase',cursor:'pointer',opacity:authLoading?.6:1}}>
                {authLoading?'Connexion...':'Se connecter →'}
              </button>
            </form>
          ):(
            <form onSubmit={doRegister}>
              {[['username','Prénom / Pseudo','Ex: Ahmed, Fatima...','text'],['password','Mot de passe (min 6 car.)','Choisir un mot de passe','password']].map(([name,label,ph,type])=>(
                <div key={name} style={{marginBottom:14}}>
                  <label style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textDim,display:'block',marginBottom:5}}>{label}</label>
                  <input name={name} type={type} placeholder={ph} required style={{width:'100%',background:G.dark4,border:`1px solid rgba(201,168,76,.15)`,color:G.text,padding:'10px 13px',borderRadius:3,fontFamily:'Lato,sans-serif',fontSize:14,outline:'none'}}/>
                </div>
              ))}
              <div style={{marginBottom:14}}>
                <label style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textDim,display:'block',marginBottom:7}}>Couleur de profil</label>
                <div style={{display:'flex',gap:8}}>{AVATAR_COLORS.map(c=><div key={c} onClick={()=>setRegColor(c)} style={{width:28,height:28,borderRadius:'50%',background:c,cursor:'pointer',border:regColor===c?'2px solid #fff':'2px solid transparent'}}/>)}</div>
              </div>
              <button type="submit" disabled={authLoading} style={{width:'100%',background:'linear-gradient(135deg,#8B6914,#C9A84C)',color:G.dark,border:'none',padding:13,borderRadius:3,fontFamily:'Lato,sans-serif',fontSize:12,fontWeight:700,letterSpacing:3,textTransform:'uppercase',cursor:'pointer',opacity:authLoading?.6:1}}>
                {authLoading?'Création...':'Créer mon compte →'}
              </button>
            </form>
          )}
          {authError&&<div style={{color:G.red,fontSize:12,textAlign:'center',marginTop:10}}>{authError}</div>}
        </div>
      </div>
    </>
  )

  // APP
  return(
    <>
      <Head>
        <title>Tarjama — {profile.username}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Tarjama"/>
        <meta name="theme-color" content="#C9A84C"/>
        <meta name="description" content="Apprends le Coran en traduisant verset par verset avec correction IA"/>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icon.svg"/>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
        <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:${G.dark};color:${G.text};font-family:'Lato',sans-serif}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(201,168,76,.15);border-radius:2px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:640px){
  .app-body{flex-direction:column!important;height:auto!important}
  .sidebar-mob{width:100%!important;border-right:none!important;border-bottom:1px solid rgba(201,168,76,.08)!important;padding:12px!important;max-height:320px!important;overflow-y:auto!important}
  .main-mob{padding:14px 12px!important}
  .topbar-prog{display:none!important}
  .dash-grid{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}
  .verse-ar{font-size:clamp(24px,7vw,36px)!important;padding:16px 14px 10px!important}
}`}</style>
      </Head>

      {/* TOPBAR */}
      <div style={{position:'sticky',top:0,zIndex:50,height:52,background:'rgba(9,9,14,.95)',backdropFilter:'blur(8px)',borderBottom:`1px solid rgba(201,168,76,.1)`,display:'flex',alignItems:'center',padding:'0 14px',gap:10}}>
        <div onClick={()=>{setView('dashboard');setSourate(null)}} style={{fontFamily:'Cinzel,serif',fontSize:14,color:G.gold,letterSpacing:3,cursor:'pointer',flexShrink:0}}>
          TARJAMA <span style={{color:G.textMuted,fontWeight:300,fontSize:11}}>ترجمة</span>
        </div>
        <div className="topbar-prog" style={{flex:1,maxWidth:160}}>
          <div style={{fontSize:8,color:G.textMuted,letterSpacing:2,textTransform:'uppercase',marginBottom:3}}>{glb.total} versets traduits</div>
          <div style={{height:3,background:'rgba(201,168,76,.1)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${glb.pct}%`,background:'linear-gradient(90deg,#8B6914,#C9A84C)',transition:'width .5s'}}/>
          </div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(201,168,76,.07)',border:`1px solid rgba(201,168,76,.15)`,borderRadius:20,padding:'4px 10px 4px 5px'}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:profile.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:G.dark}}>{profile.username[0].toUpperCase()}</div>
            <span style={{fontFamily:'Cinzel,serif',fontSize:11,color:G.gold,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile.username}</span>
          </div>
          <a href="/dictionnaire" style={{textDecoration:'none'}}>
            <button style={{background:'rgba(201,168,76,.07)',border:`1px solid rgba(201,168,76,.15)`,color:G.gold,cursor:'pointer',fontSize:10,padding:'5px 10px',borderRadius:2,fontFamily:'Lato,sans-serif',letterSpacing:1,textTransform:'uppercase',fontWeight:700}}>
              DICO
            </button>
          </a>
          <a href="/quiz" style={{textDecoration:'none'}}>
            <button style={{background:'rgba(155,127,212,.08)',border:`1px solid rgba(155,127,212,.2)`,color:G.purple,cursor:'pointer',fontSize:10,padding:'5px 10px',borderRadius:2,fontFamily:'Lato,sans-serif',letterSpacing:1,textTransform:'uppercase',fontWeight:700}}>
              QUIZ
            </button>
          </a>
          <a href="/alphabet" style={{textDecoration:'none'}}>
            <button style={{background:'rgba(91,155,213,.08)',border:`1px solid rgba(91,155,213,.2)`,color:G.blue,cursor:'pointer',fontSize:10,padding:'5px 10px',borderRadius:2,fontFamily:'Lato,sans-serif',letterSpacing:1,textTransform:'uppercase',fontWeight:700}}>
              ALPHABET
            </button>
          </a>
          <button onClick={doLogout} style={{background:'transparent',border:`1px solid rgba(201,168,76,.15)`,color:G.textMuted,cursor:'pointer',fontSize:10,padding:'5px 8px',borderRadius:2}}></button>
        </div>
      </div>

      {/* BODY */}
      <div className="app-body" style={{display:'flex',height:'calc(100vh - 52px)'}}>

        {/* SIDEBAR */}
        <div className="sidebar-mob" style={{width:290,flexShrink:0,borderRight:`1px solid rgba(201,168,76,.08)`,background:G.dark2,overflowY:'auto',padding:'14px 12px',display:'flex',flexDirection:'column',gap:10}}>

          {/* SEARCH */}
          <div style={{position:'relative'}}>
            <div style={{display:'flex',alignItems:'center',background:G.dark4,border:`1px solid rgba(201,168,76,.25)`,borderRadius:4,padding:'9px 12px',gap:8}}>
              <span style={{color:G.gold,fontSize:14,flexShrink:0}}></span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Rechercher une sourate..."
                style={{background:'transparent',border:'none',color:G.text,fontFamily:'Lato,sans-serif',fontSize:13,outline:'none',width:'100%'}}/>
              {search&&<span onClick={()=>setSearch('')} style={{color:G.textMuted,cursor:'pointer',fontSize:16,flexShrink:0}}></span>}
            </div>

            {searchResults.length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:G.dark3,border:`1px solid rgba(201,168,76,.2)`,borderRadius:4,marginTop:4,zIndex:200,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,.5)'}}>
                {searchResults.map(s=>(
                  <div key={s.n} onClick={()=>openSourate(s)}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:`1px solid rgba(201,168,76,.06)`,transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,.08)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{fontFamily:'Cinzel,serif',fontSize:11,color:G.goldDim,minWidth:26}}>{s.n}.</span>
                    <span style={{fontFamily:'Amiri,serif',fontSize:20,color:G.goldLight,direction:'rtl',flex:1}}>{s.ar}</span>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:11,color:G.textDim,whiteSpace:'nowrap'}}>{s.fr}</div>
                      <div style={{fontSize:9,color:G.textMuted}}>{s.v} versets</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{fontSize:10,color:G.textMuted,textAlign:'center',letterSpacing:1}}>114 SOURATES</div>

          {/* REVIEW BUTTON */}
          {(()=>{
            const rl=getReviewList()
            return rl.length>0?(
              <div onClick={()=>setView('review')} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:3,cursor:'pointer',
                background:view==='review'?'rgba(201,107,107,.15)':'rgba(201,107,107,.08)',
                border:`1px solid ${view==='review'?'rgba(201,107,107,.4)':'rgba(201,107,107,.2)'}`,transition:'all .2s'}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:'#C96B6B',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{rl.length}</div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'#C96B6B',letterSpacing:1}}>À REVOIR AUJOURD'HUI</div>
                  <div style={{fontSize:10,color:G.textMuted}}>{rl.length} verset{rl.length>1?'s':''} en attente</div>
                </div>
              </div>
            ):null
          })()}

          {/* SUGGESTIONS */}
          <div>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:G.textMuted,marginBottom:8,paddingLeft:2}}>Suggestions</div>
            {SUGGESTIONS.map(s=>{
              const isA=sourate?.num===s.n&&view==='sourate'
              const done=Object.keys(progress).filter(k=>k.startsWith(`${s.n}:`)).length
              return(
                <div key={s.n} onClick={()=>openSourate(s)}
                  style={{display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:3,cursor:'pointer',marginBottom:2,background:isA?'rgba(201,168,76,.1)':'transparent',border:`1px solid ${isA?'rgba(201,168,76,.25)':'transparent'}`,transition:'all .18s'}}
                  onMouseEnter={e=>{if(!isA)e.currentTarget.style.background='rgba(201,168,76,.05)'}}
                  onMouseLeave={e=>{if(!isA)e.currentTarget.style.background=isA?'rgba(201,168,76,.1)':'transparent'}}>
                  <span style={{fontFamily:'Cinzel,serif',fontSize:10,color:G.goldDim,minWidth:20}}>{s.n}.</span>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{fontFamily:'Amiri,serif',fontSize:18,color:G.goldLight,direction:'rtl',display:'block'}}>{s.ar}</span>
                    <span style={{fontSize:10,color:G.textMuted}}>{s.fr} · {s.v} v.</span>
                  </div>
                  {done>0&&<span style={{fontSize:9,color:G.green,flexShrink:0}}>{done}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* MAIN */}
        <div className="main-mob" style={{flex:1,overflowY:'auto',padding:'24px 28px'}}>

          {/* DASHBOARD */}
          {view==='dashboard'&&(()=>{
            const total=Object.keys(progress).length
            let correct=0,partial=0,wrong=0
            Object.values(progress).forEach(p=>{if(p.niveau==='excellent'||p.niveau==='good')correct++;else if(p.niveau==='partial')partial++;else if(p.niveau==='wrong')wrong++})
            return<>
              <div style={{background:'linear-gradient(135deg,rgba(201,168,76,.07),rgba(201,168,76,.03))',border:`1px solid rgba(201,168,76,.15)`,borderRadius:5,padding:'18px 22px',marginBottom:22,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                <span style={{fontFamily:'Amiri,serif',fontSize:26,color:G.goldLight}}>أَهْلًا وَسَهْلًا</span>
                <div>
                  <div style={{fontFamily:'Cinzel,serif',fontSize:17,color:G.gold,letterSpacing:2}}>Bienvenue, {profile.username} !</div>
                  <div style={{fontSize:12,color:G.textDim,marginTop:3,lineHeight:1.6}}>Recherche une sourate et commence à traduire.</div>
                </div>
              </div>
              <div className="dash-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:22}}>
                {[['Traduits',G.gold,total],['Excellents',G.green,correct],['Partiels',G.orange,partial],['À revoir',G.red,wrong]].map(([lbl,clr,num])=>(
                  <div key={lbl} style={{background:G.dark3,border:`1px solid rgba(201,168,76,.1)`,borderRadius:4,padding:'15px 14px'}}>
                    <span style={{fontFamily:'Cinzel,serif',fontSize:28,color:clr,display:'block',lineHeight:1}}>{num}</span>
                    <span style={{fontSize:10,color:G.textMuted,textTransform:'uppercase',letterSpacing:2,marginTop:4,display:'block'}}>{lbl}</span>
                  </div>
                ))}
              </div>

              <div style={{textAlign:'center',padding:16}}>
                <p style={{fontSize:13,color:G.textDim,marginBottom:14}}> Recherche une sourate dans la barre de gauche !</p>
                <Btn onClick={()=>openSourate(SUGGESTIONS[0])} style={{background:'linear-gradient(135deg,#8B6914,#C9A84C)',color:G.dark}}>Commencer par Al-Fatiha →</Btn>
              </div>
            </>
          })()}

          {/* REVIEW VIEW — Répétition espacée */}
          {view==='review'&&(()=>{
            const rl=getReviewList()
            if(rl.length===0) return(
              <div style={{textAlign:'center',padding:'60px 24px'}}>
                <div style={{fontSize:40,marginBottom:12}}></div>
                <div style={{fontFamily:'Cinzel,serif',fontSize:18,color:G.gold,marginBottom:8}}>Tout est à jour !</div>
                <div style={{fontSize:13,color:G.textDim,lineHeight:1.7}}>Tu n'as aucun verset à revoir aujourd'hui.<br/>Continue à traduire de nouvelles sourates.</div>
              </div>
            )
            return(
              <>
                <div style={{fontFamily:'Cinzel,serif',fontSize:12,letterSpacing:3,textTransform:'uppercase',color:G.red,marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
                  <span style={{width:18,height:1,background:G.red,display:'block'}}/>
                  {rl.length} verset{rl.length>1?'s':''} à revoir aujourd'hui
                </div>
                {rl.map((item,i)=>{
                  const sInfo=item.sInfo||{ar:'?',fr:'?'}
                  const badge={wrong:{label:'Faux',clr:G.red},partial:{label:'Partiel',clr:G.orange},skipped:{label:'Passé',clr:G.textMuted}}[item.niveau]||{label:'?',clr:G.textMuted}
                  return(
                    <div key={item.key} onClick={()=>{
                      const info={n:item.sNum,ar:sInfo.ar,fr:sInfo.fr,v:sInfo.v||0}
                      openSourate(info).then(()=>setTimeout(()=>goVerse(item.vNum-1),500))
                    }}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:G.dark3,border:`1px solid rgba(201,168,76,.1)`,borderRadius:4,marginBottom:8,cursor:'pointer',transition:'all .18s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,.05)'}
                    onMouseLeave={e=>e.currentTarget.style.background=G.dark3}>
                      <div style={{fontFamily:'Cinzel,serif',fontSize:11,color:G.goldDim,minWidth:24}}>{item.sNum}:{item.vNum}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:'Amiri,serif',fontSize:16,color:G.goldLight,direction:'rtl',marginBottom:2}}>{sInfo.ar}</div>
                        <div style={{fontSize:11,color:G.textMuted}}>Verset {item.vNum} · {sInfo.fr}</div>
                      </div>
                      <span style={{fontSize:10,letterSpacing:1,textTransform:'uppercase',color:badge.clr,background:`rgba(${badge.clr==='#C96B6B'?'201,107,107':badge.clr==='#D4874C'?'212,135,76':'90,84,72'},.12)`,padding:'3px 8px',borderRadius:2,flexShrink:0}}>
                        {badge.label}
                      </span>
                      <span style={{color:G.gold,fontSize:14}}>→</span>
                    </div>
                  )
                })}
              </>
            )
          })()}

          {/* LOADING SOURATE */}
          {view==='sourate'&&loadingVerse&&(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:300,gap:16}}>
              <div style={{width:36,height:36,border:`2px solid rgba(201,168,76,.1)`,borderTopColor:G.gold,borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
              <div style={{fontFamily:'Amiri,serif',fontSize:18,color:G.gold,opacity:.7}}>تحميل السورة...</div>
            </div>
          )}

          {/* SOURATE VIEW */}
          {view==='sourate'&&!loadingVerse&&sourate&&verse&&<>
            <div style={{fontFamily:'Cinzel,serif',fontSize:12,letterSpacing:3,textTransform:'uppercase',color:G.gold,marginBottom:14,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{width:18,height:1,background:G.gold,display:'block'}}/>{sourate.num}. {sourate.name_ar} — {sourate.name_fr}
              <span style={{fontSize:10,color:G.textMuted,marginLeft:'auto'}}>{sourate.verses.length} versets</span>
            </div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:16}}>
              {sourate.verses.map((v,i)=>{
                const p=getVP(sourate.num,v.n);const isA=i===vIdx
                return<button key={v.n} onClick={()=>goVerse(i)} style={{background:isA?'rgba(201,168,76,.1)':p?'rgba(76,175,125,.07)':G.dark4,border:`1px solid ${isA?G.gold:p?'rgba(76,175,125,.25)':'rgba(201,168,76,.12)'}`,color:isA?G.gold:p?G.green:G.textDim,padding:'4px 10px',borderRadius:2,fontSize:11,cursor:'pointer',fontFamily:'Lato,sans-serif',minWidth:32}}>{v.n}</button>
              })}
            </div>
            <div style={{background:G.dark3,border:`1px solid rgba(201,168,76,.18)`,borderRadius:6,overflow:'hidden',boxShadow:'0 6px 30px rgba(0,0,0,.35)',marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(201,168,76,.04)',borderBottom:`1px solid rgba(201,168,76,.08)`,flexWrap:'wrap'}}>
                <span style={{fontFamily:'Cinzel,serif',fontSize:11,color:G.gold,letterSpacing:1}}>S.{sourate.num} — V.{verse.n}</span>
                {verse.n===1&&sourate.num!==9&&<span style={{fontSize:9,background:'rgba(201,168,76,.1)',border:`1px solid rgba(201,168,76,.2)`,color:G.gold,padding:'2px 8px',borderRadius:10}}>بسملة</span>}
                <span style={{marginLeft:'auto',fontSize:10,color:G.textMuted}}>{vIdx+1} / {sourate.verses.length}</span>
              </div>
              {/* Hide arabic in hifz write step */}
              {(!hifzMode||hifzStep==='listen')&&<div className="verse-ar" style={{fontFamily:'Amiri,serif',fontSize:'clamp(26px,4.5vw,44px)',color:G.goldLight,direction:'rtl',textAlign:'right',padding:'22px 20px 14px',lineHeight:1.9}}>{verse.ar}</div>}
              {hifzMode&&hifzStep!=='listen'&&<div style={{padding:'18px 20px 14px',textAlign:'center',color:G.textMuted,fontSize:13,fontStyle:'italic',borderBottom:`1px solid rgba(201,168,76,.06)`}}>Texte caché — écris de mémoire !</div>}
              {/* TRANSLIT + TAFSIR BUTTONS */}
              <div style={{display:'flex',gap:0,borderBottom:`1px solid rgba(201,168,76,.06)`}}>
                <button onClick={fetchTranslit} style={{flex:1,padding:'8px 12px',background:'transparent',border:'none',borderRight:`1px solid rgba(201,168,76,.06)`,color:showTranslit?G.gold:G.textMuted,fontFamily:'Lato,sans-serif',fontSize:10,letterSpacing:2,textTransform:'uppercase',cursor:'pointer',transition:'all .2s'}}>
                  {translitLoading?'...':(showTranslit?'Masquer Translittération':'Afficher Translittération')}
                </button>
                <button onClick={fetchTafsir} style={{flex:1,padding:'8px 12px',background:'transparent',border:'none',color:showTafsir?G.purple:G.textMuted,fontFamily:'Lato,sans-serif',fontSize:10,letterSpacing:2,textTransform:'uppercase',cursor:'pointer',transition:'all .2s'}}>
                  {tafsirLoading?'...':(showTafsir?'Masquer Tafsir & Grammaire':'Afficher Tafsir & Grammaire')}
                </button>
              </div>

              {/* TRANSLIT */}
              {showTranslit&&(
                <div style={{padding:'10px 16px 8px',borderBottom:`1px solid rgba(201,168,76,.06)`,animation:'fadeUp .25s ease'}}>
                  <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textMuted,marginBottom:5}}>Translittération</div>
                  {translitLoading
                    ?<div style={{fontSize:13,color:G.textMuted,fontStyle:'italic'}}>Chargement...</div>
                    :<div style={{fontSize:14,color:G.textDim,lineHeight:1.8,fontStyle:'italic'}}>{translit}</div>
                  }
                </div>
              )}

              {/* TAFSIR */}
              {showTafsir&&(
                <div style={{padding:'12px 16px',borderBottom:`1px solid rgba(201,168,76,.06)`,animation:'fadeUp .25s ease',background:'rgba(155,127,212,.03)'}}>
                  <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.purple,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                    <span style={{width:12,height:1,background:G.purple,display:'block'}}/>Tafsir & Grammaire
                  </div>
                  {tafsirLoading
                    ?<div style={{fontSize:13,color:G.textMuted,fontStyle:'italic',fontFamily:'Georgia,serif'}}>L'IA analyse le verset...</div>
                    :<div style={{
                      fontSize:14,
                      color:G.textDim,
                      lineHeight:2.0,
                      whiteSpace:'pre-wrap',
                      fontFamily:"'EB Garamond','Georgia','Times New Roman',serif",
                      letterSpacing:'0.01em',
                      fontStyle:'normal',
                      borderLeft:`2px solid rgba(155,127,212,.3)`,
                      paddingLeft:14,
                      marginTop:4
                    }}>{tafsir}</div>
                  }
                </div>
              )}

              {/* HIFZ MODE TOGGLE */}
              {!hifzMode&&<div style={{display:'flex',justifyContent:'flex-end',padding:'0 16px 8px'}}>
                <button onClick={startHifz} style={{background:'rgba(155,127,212,.1)',border:`1px solid rgba(155,127,212,.25)`,color:G.purple,padding:'5px 14px',borderRadius:2,fontFamily:'Lato,sans-serif',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',cursor:'pointer'}}>
                  Mode Hifz
                </button>
              </div>}

              {/* HIFZ MODE UI */}
              {hifzMode&&(()=>{
                return(
                  <div style={{padding:'16px',background:'rgba(155,127,212,.05)',borderTop:`1px solid rgba(155,127,212,.15)`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                      <div style={{fontFamily:'Cinzel,serif',fontSize:11,letterSpacing:3,textTransform:'uppercase',color:G.purple}}>Mode Hifz — Mémorisation</div>
                      <button onClick={exitHifz} style={{background:'transparent',border:'none',color:G.textMuted,cursor:'pointer',fontSize:12}}> Quitter</button>
                    </div>

                    {hifzStep==='listen'&&(
                      <div style={{textAlign:'center',padding:'10px 0'}}>
                        <div style={{fontSize:13,color:G.textDim,marginBottom:16,lineHeight:1.8}}>
                          1. Écoute la récitation du verset<br/>
                          <span style={{color:G.textMuted,fontSize:11}}>Tu peux l'écouter plusieurs fois</span>
                        </div>

                        {/* RECITATION MIC SECTION */}
                        <div style={{background:'rgba(201,168,76,.05)',border:`1px solid rgba(201,168,76,.12)`,borderRadius:4,padding:'14px',marginBottom:14,textAlign:'left'}}>
                          <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textMuted,marginBottom:10}}>Récitation vocale</div>
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
                            {!recording&&!recLoading&&<button onClick={startRecording}
                              style={{display:'flex',alignItems:'center',gap:8,background:'rgba(201,107,107,.15)',border:`1px solid rgba(201,107,107,.3)`,color:G.red,padding:'8px 16px',borderRadius:2,fontFamily:'Lato,sans-serif',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',cursor:'pointer'}}>
                              Enregistrer
                            </button>}
                            {recording&&<button onClick={stopRecording}
                              style={{display:'flex',alignItems:'center',gap:8,background:'rgba(201,107,107,.25)',border:`1px solid ${G.red}`,color:G.red,padding:'8px 16px',borderRadius:2,fontFamily:'Lato,sans-serif',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',cursor:'pointer',animation:'pulse 1s infinite'}}>
                               Arrêter
                            </button>}
                            {recording&&<span style={{fontSize:11,color:G.red,animation:'pulse 1s infinite'}}>Enregistrement en cours...</span>}
                            {recLoading&&<span style={{fontSize:11,color:G.textMuted}}>Analyse en cours...</span>}
                          </div>

                          {recScore&&(
                            <div style={{animation:'fadeUp .3s ease'}}>
                              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                                <span style={{fontFamily:'Cinzel,serif',fontSize:24,color:recScore.score>=70?G.green:recScore.score>=50?G.orange:G.red,fontWeight:700}}>{recScore.score}%</span>
                                <span style={{fontSize:12,color:G.textDim}}>{recScore.correct}/{recScore.total} mots corrects</span>
                              </div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                                {recScore.details.map((d,i)=>(
                                  <span key={i} style={{fontFamily:'Amiri,serif',fontSize:16,color:d.ok?G.green:G.red,padding:'2px 6px',background:d.ok?'rgba(76,175,125,.1)':'rgba(201,107,107,.1)',borderRadius:2,direction:'rtl'}}>
                                    {d.word}
                                  </span>
                                ))}
                              </div>
                              {recTranscript&&<div style={{fontSize:11,color:G.textMuted,marginTop:4,fontStyle:'italic'}}>Transcrit : {recTranscript}</div>}
                            </div>
                          )}
                        </div>

                        <Btn onClick={()=>{setHifzStep('write');setRecScore(null);setRecTranscript('')}} style={{background:'rgba(155,127,212,.2)',color:G.purple,border:`1px solid rgba(155,127,212,.3)`}}>
                          Mode écrit → Écrire de mémoire
                        </Btn>
                      </div>
                    )}

                    {hifzStep==='write'&&(
                      <div>
                        <div style={{fontSize:13,color:G.textDim,marginBottom:10,lineHeight:1.8}}>
                          2. Écris le verset de mémoire en arabe
                          <span style={{display:'block',color:G.textMuted,fontSize:11}}>Sans regarder le texte au-dessus !</span>
                        </div>
                        <textarea
                          value={hifzInput}
                          onChange={e=>setHifzInput(e.target.value)}
                          placeholder="اكتب الآية من الذاكرة..."
                          dir="rtl"
                          style={{width:'100%',background:G.dark4,border:`1px solid rgba(155,127,212,.2)`,color:G.text,padding:'11px 13px',borderRadius:3,fontFamily:'Amiri,serif',fontSize:22,lineHeight:1.8,resize:'none',minHeight:80,outline:'none',textAlign:'right'}}
                        />
                        <div style={{display:'flex',gap:8,marginTop:10}}>
                          <Btn onClick={checkHifz} disabled={!hifzInput.trim()} style={{background:'rgba(155,127,212,.2)',color:G.purple,border:`1px solid rgba(155,127,212,.3)`,flex:'1 1 auto',textAlign:'center'}}>
                            Vérifier ma mémorisation
                          </Btn>
                          <Btn onClick={()=>setHifzStep('listen')} style={{background:'rgba(201,168,76,.07)',color:G.textDim,border:`1px solid rgba(201,168,76,.12)`}}>
                            ← Réécouter
                          </Btn>
                        </div>
                      </div>
                    )}

                    {hifzResult&&(
                      <div style={{marginTop:12,padding:'12px 14px',background:nvlBg[hifzResult.niveau]||nvlBg.wrong,border:`1px solid ${nvlBorder[hifzResult.niveau]||nvlBorder.wrong}`,borderRadius:4,animation:'fadeUp .3s ease'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                          <span style={{fontFamily:'Cinzel,serif',fontSize:28,color:nvlColor[hifzResult.niveau]||G.red,fontWeight:700}}>{hifzResult.score}%</span>
                          <div>
                            <div style={{fontSize:12,color:nvlColor[hifzResult.niveau]||G.red,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>
                              {hifzResult.niveau==='excellent'?'Mémorisé !':hifzResult.niveau==='good'?'Presque parfait':hifzResult.niveau==='partial'?'Continue !':'À retravailler'}
                            </div>
                            <div style={{fontSize:11,color:G.textMuted}}>Score de mémorisation</div>
                          </div>
                        </div>
                        <div style={{fontSize:11,color:G.textMuted,marginBottom:8}}>Verset correct :</div>
                        <div style={{fontFamily:'Amiri,serif',fontSize:20,color:G.goldLight,direction:'rtl',textAlign:'right',lineHeight:1.8}}>{hifzResult.correct}</div>
                        <div style={{display:'flex',gap:8,marginTop:12}}>
                          <Btn onClick={()=>{setHifzInput('');setHifzResult(null);setHifzStep('listen')}} style={{background:'rgba(155,127,212,.15)',color:G.purple,border:`1px solid rgba(155,127,212,.25)`}}>Réessayer</Btn>
                          {!isLast&&<Btn onClick={()=>{exitHifz();goVerse(vIdx+1)}} style={{background:'rgba(76,175,125,.15)',color:G.green,border:`1px solid rgba(76,175,125,.25)`,flex:'1 1 auto',textAlign:'center'}}>Verset suivant →</Btn>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* AUDIO PLAYER — Sheikh Abdul Rahman Al-Sudais */}
                <AudioPlayer src={`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getAbsoluteVerseNum(sourate.num,verse.n)}.mp3`} key={`audio-${sourate.num}-${verse.n}`} />

                {showHint&&<div style={{
                  background:'rgba(155,127,212,.06)',
                  border:`1px solid rgba(155,127,212,.18)`,
                  borderRadius:3,
                  padding:'12px 16px',
                  margin:'0 16px 12px',
                  fontSize:14,
                  color:G.textDim,
                  lineHeight:2.0,
                  animation:'fadeUp .3s ease',
                  fontFamily:"'EB Garamond','Georgia','Times New Roman',serif",
                  fontStyle:'italic',
                  letterSpacing:'0.01em'
                }}>{hint}</div>}
              <div style={{padding:'16px'}}>
                <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textDim,marginBottom:7,display:'flex',alignItems:'center',gap:7}}>
                  <span style={{color:G.gold,fontSize:13}}></span> Votre traduction en français
                </div>
                <textarea value={existing?(existing.userTrans||''):userTrans} onChange={e=>!existing&&setUserTrans(e.target.value)} disabled={!!existing||verifying}
                  placeholder="Écrivez votre traduction de ce verset..." onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)verify()}}
                  style={{width:'100%',background:G.dark4,border:`1px solid rgba(201,168,76,.15)`,color:G.text,padding:'11px 13px',borderRadius:3,fontFamily:'Lato,sans-serif',fontSize:14,lineHeight:1.7,resize:'vertical',minHeight:80,outline:'none',opacity:existing||verifying?.7:1}}/>
                {verifying&&<div style={{height:2,background:'linear-gradient(90deg,transparent,#C9A84C,transparent)',backgroundSize:'200% 100%',animation:'shimmer 1.1s ease infinite',marginTop:4}}/>}
                {verifying&&<div style={{fontFamily:'Amiri,serif',fontSize:15,color:G.textMuted,padding:'6px 0',fontStyle:'italic'}}>L'IA analyse votre traduction...</div>}
                <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                  {!existing&&<>
                    <Btn onClick={verify} disabled={verifying||!userTrans.trim()} style={{background:'linear-gradient(135deg,#8B6914,#C9A84C)',color:G.dark,flex:'1 1 120px',textAlign:'center'}}>{verifying?'...':' Vérifier'}</Btn>
                    <Btn onClick={fetchHint} disabled={hinting} style={{background:'rgba(155,127,212,.15)',color:G.purple,border:`1px solid rgba(155,127,212,.25)`}}>{hinting?'...':showHint?'':'Indice'}</Btn>
                    <Btn onClick={skipVerse} style={{background:'rgba(201,168,76,.07)',color:G.textDim,border:`1px solid rgba(201,168,76,.12)`}}>→ Passer</Btn>
                  </>}
                  {vIdx>0&&<Btn onClick={()=>goVerse(vIdx-1)} style={{background:'rgba(91,155,213,.1)',color:G.blue,border:`1px solid rgba(91,155,213,.2)`}}>← Préc.</Btn>}
                  {existing&&(existing.niveau==='wrong'||existing.niveau==='partial'||existing.niveau==='skipped')&&<Btn onClick={()=>retryVerse()} style={{background:'rgba(212,135,76,.12)',color:G.orange,border:`1px solid rgba(212,135,76,.25)`}}>Réessayer</Btn>}
                  {existing&&!isLast&&<Btn onClick={()=>goVerse(vIdx+1)} style={{background:'rgba(76,175,125,.15)',color:G.green,border:`1px solid rgba(76,175,125,.25)`,flex:'1 1 120px',textAlign:'center'}}>Suivant →</Btn>}
                  {existing&&isLast&&<Btn onClick={()=>setView('done')} style={{background:'rgba(76,175,125,.15)',color:G.green,border:`1px solid rgba(76,175,125,.25)`,flex:'1 1 120px',textAlign:'center'}}>Terminer</Btn>}
                </div>
              </div>
              {(feedback||existing?.feedback)&&(()=>{
                const r=feedback||existing?.feedback;const lv=r.niveau||'wrong'
                return<div style={{padding:'0 16px 16px',animation:'fadeUp .3s ease'}}>
                  <div style={{background:nvlBg[lv]||nvlBg.wrong,border:`1px solid ${nvlBorder[lv]||nvlBorder.wrong}`,borderRadius:4,padding:'13px 15px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
                      <span style={{fontSize:20}}>{null}</span>
                      <span style={{fontFamily:'Cinzel,serif',fontSize:13,letterSpacing:3,color:nvlColor[lv]||G.red,textTransform:'uppercase',fontWeight:600}}>{r.titre||''}</span>
                    </div>
                    <div style={{
                      fontSize:14,
                      color:G.textDim,
                      lineHeight:2.0,
                      fontFamily:"'EB Garamond','Georgia','Times New Roman',serif",
                      letterSpacing:'0.01em',
                      marginTop:2
                    }}>{r.message||''}</div>
                    {r.traduction_ref&&<div style={{marginTop:12}}>
                      <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:G.textMuted,marginBottom:6}}>Traduction de référence</div>
                      <div style={{
                        fontFamily:"'EB Garamond','Georgia','Times New Roman',serif",
                        fontSize:14,
                        color:G.goldLight,
                        background:'rgba(201,168,76,.05)',
                        borderLeft:`2px solid ${G.gold}`,
                        padding:'10px 14px',
                        borderRadius:'0 4px 4px 0',
                        lineHeight:1.9,
                        fontStyle:'italic',
                        letterSpacing:'0.02em'
                      }}>{r.traduction_ref}</div>
                    </div>}
                    {r.mot_manque&&<div style={{
                      fontSize:12,
                      color:G.orange,
                      marginTop:10,
                      fontFamily:"'EB Garamond','Georgia',serif",
                      fontSize:14,
                      letterSpacing:'0.02em'
                    }}>Mot à ne pas oublier — <strong style={{color:G.goldLight}}>{r.mot_manque}</strong></div>}
                    {r.mots_importants?.length>0&&<div style={{marginTop:11}}>
                      <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:G.textMuted,marginBottom:7}}>Mots importants</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {r.mots_importants.map((w,i)=><div key={i} style={{background:G.dark4,border:`1px solid rgba(201,168,76,.12)`,borderRadius:3,padding:'6px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                          <span style={{fontFamily:'Amiri,serif',fontSize:19,color:G.goldLight,direction:'rtl'}}>{w.ar}</span>
                          <span style={{fontSize:10,color:G.textMuted,letterSpacing:1,fontFamily:"'EB Garamond','Georgia',serif",fontStyle:'italic'}}>{w.fr}</span>
                        </div>)}
                      </div>
                    </div>}
                  </div>
                </div>
              })()}
            </div>
          </>}

          {/* DONE */}
          {view==='done'&&sourate&&(()=>{
            const done=sourate.verses.filter(v=>getVP(sourate.num,v.n)).length
            const correct=sourate.verses.filter(v=>{const p=getVP(sourate.num,v.n);return p?.niveau==='excellent'||p?.niveau==='good'}).length
            const partial=sourate.verses.filter(v=>getVP(sourate.num,v.n)?.niveau==='partial').length
            const wrong=done-correct-partial
            const pct=Math.round((correct+partial*.5)/sourate.verses.length*100)
            return<div style={{textAlign:'center',padding:'40px 24px',background:G.dark3,border:`1px solid rgba(201,168,76,.2)`,borderRadius:6,animation:'fadeUp .4s ease'}}>
              <div style={{fontSize:52,marginBottom:10}}></div>
              <div style={{fontFamily:'Cinzel,serif',fontSize:22,color:G.gold,letterSpacing:3,marginBottom:8}}>Sourate terminée !</div>
              <div style={{fontFamily:'Amiri,serif',fontSize:28,color:G.goldLight,direction:'rtl',marginBottom:20}}>{sourate.name_ar} — {sourate.name_fr}</div>
              <div style={{display:'flex',justifyContent:'center',gap:20,flexWrap:'wrap',marginBottom:24}}>
                {[['Excellents',G.green,correct],['Partiels',G.orange,partial],['À revoir',G.red,wrong],['Score',G.gold,`${pct}%`]].map(([lbl,clr,val])=>(
                  <div key={lbl} style={{textAlign:'center'}}><span style={{fontFamily:'Cinzel,serif',fontSize:28,color:clr,display:'block'}}>{val}</span><span style={{fontSize:10,color:G.textDim,textTransform:'uppercase',letterSpacing:2}}>{lbl}</span></div>
                ))}
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
                <Btn onClick={()=>openSourate({n:sourate.num,ar:sourate.name_ar,fr:sourate.name_fr,v:sourate.verses.length})} style={{background:'linear-gradient(135deg,#8B6914,#C9A84C)',color:G.dark}}>Refaire</Btn>
                <Btn onClick={()=>{setView('dashboard');setSourate(null)}} style={{background:'rgba(201,168,76,.07)',color:G.textDim,border:`1px solid rgba(201,168,76,.12)`}}>Tableau de bord</Btn>
              </div>
            </div>
          })()}
        </div>
      </div>

      {toast&&<div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:G.dark4,border:`1px solid rgba(201,168,76,.3)`,color:G.gold,padding:'9px 20px',borderRadius:3,zIndex:999,fontFamily:'Amiri,serif',fontSize:16,whiteSpace:'nowrap',pointerEvents:'none',animation:'fadeUp .3s ease'}}>{toast}</div>}
    </>
  )
}
