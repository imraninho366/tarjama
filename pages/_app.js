import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Head from 'next/head'
import { Analytics } from '@vercel/analytics/react'
import '../styles/globals.css'

// Pages qui ne montrent pas la nav (auth screen)
const NO_NAV_PATHS = ['/gen-dico']

export default function TarjamaApp({ Component, pageProps, router }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [displayedRoute, setDisplayedRoute] = useState(router.pathname)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [theme, setTheme] = useState('dark')
  const timeoutRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          loadProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('tarjama_theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('tarjama_theme', next)
  }

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Page transition effect
  useEffect(() => {
    const handleStart = (url) => {
      if (url === router.asPath) return
      setTransitioning(true)
    }
    const handleComplete = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setTransitioning(false)
        setDisplayedRoute(router.pathname)
      }, 50)
    }
    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)
    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [router])

  const loadProfile = async (userId, retries = 2) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data)
    } else if (retries > 0) {
      setTimeout(() => loadProfile(userId, retries - 1), 500)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const hideNav = !user || NO_NAV_PATHS.includes(router.pathname)

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content={theme === 'light' ? '#F2EFE8' : '#C9A84C'}/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Tarjama"/>
        <meta name="description" content="Apprends le Coran en traduisant verset par verset avec correction IA"/>
        <meta property="og:title" content="Tarjama — Traduction coranique"/>
        <meta property="og:description" content="Apprends le vocabulaire du Coran en traduisant verset par verset. Quiz, dictionnaire, hadiths et plus."/>
        <meta property="og:type" content="website"/>
        <meta property="og:image" content="/api/og"/>
        <meta property="og:locale" content="fr_FR"/>
        <meta name="twitter:card" content="summary"/>
        <meta name="twitter:title" content="Tarjama — Traduction coranique"/>
        <meta name="twitter:description" content="Apprends le vocabulaire du Coran en traduisant verset par verset avec correction IA."/>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icon.svg"/>
      </Head>
      <Layout
        user={user}
        profile={profile}
        onLogout={handleLogout}
        hideNav={hideNav}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        <div
          key={displayedRoute}
          className={transitioning ? 'page-transition-exit' : 'page-transition-enter'}
        >
          <Component
            {...pageProps}
            user={user}
            profile={profile}
            onLogout={handleLogout}
          />
        </div>
      </Layout>
      {showInstall && installPrompt && (
        <div style={{
          position:'fixed',bottom:'calc(var(--bottomnav-height) + env(safe-area-inset-bottom, 0px) + 8px)',left:12,right:12,zIndex:50,
          background:'var(--bg-card)',border:'1px solid var(--glass-border)',borderRadius:12,
          padding:'14px 16px',display:'flex',alignItems:'center',gap:12,
          boxShadow:'0 -4px 24px rgba(0,0,0,.5)'
        }}>
          <div style={{fontSize:28}}>ب</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,color:'#EDE8D8',fontWeight:600}}>Installer Tarjama</div>
            <div style={{fontSize:11,color:'#9A9280'}}>Accès rapide depuis ton écran d'accueil</div>
          </div>
          <button onClick={async()=>{installPrompt.prompt();const r=await installPrompt.userChoice;if(r.outcome==='accepted')setShowInstall(false);setInstallPrompt(null)}} style={{
            padding:'8px 14px',borderRadius:8,border:'none',cursor:'pointer',
            background:'#C9A84C',color:'#050508',fontSize:12,fontWeight:700
          }}>Installer</button>
          <button onClick={()=>setShowInstall(false)} style={{
            background:'none',border:'none',color:'#5A5448',fontSize:18,cursor:'pointer',padding:4
          }}>✕</button>
        </div>
      )}
      <Analytics />
    </>
  )
}
