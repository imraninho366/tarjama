import { useState, useEffect, useRef } from 'react'
import { Playfair_Display, Source_Sans_3, Amiri, Reem_Kufi } from 'next/font/google'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Head from 'next/head'
import { Analytics } from '@vercel/analytics/react'
import { AVATAR_COLORS } from '../lib/theme'
import '../styles/globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--tarjama-font-display' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], weight: ['300', '400', '600', '700'], display: 'swap', variable: '--tarjama-font-body' })
const amiri = Amiri({ subsets: ['arabic', 'latin'], weight: ['400', '700'], display: 'swap', variable: '--tarjama-font-arabic' })
const reemKufi = Reem_Kufi({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--tarjama-font-arabic-display' })

// Pages qui ne montrent pas la nav (auth screen)
const NO_NAV_PATHS = ['/gen-dico']

export default function TarjamaApp({ Component, pageProps, router }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  // `user` vaut null dans DEUX situations que rien ne distinguait : « pas
  // connecte » et « on ne sait pas encore ». La session est lue de facon
  // asynchrone, donc au premier rendu elle est toujours nulle — et les pages
  // qui redirigent sur !user ejectaient un utilisateur pourtant connecte des
  // qu'il rafraichissait la page. authReady separe les deux cas.
  const [authReady, setAuthReady] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [displayedRoute, setDisplayedRoute] = useState(router.pathname)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [theme, setTheme] = useState('light')
  const timeoutRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user)
      }
      // Pose dans TOUS les cas, y compris sans session : le point n'est pas
      // qu'un utilisateur existe, mais que la question soit tranchee.
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          loadProfile(session.user)
        } else {
          setUser(null)
          setProfile(null)
        }
        setAuthReady(true)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('tarjama_theme') || 'light'
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

  /**
   * Crée le profil manquant d'un utilisateur.
   *
   * L'inscription par email crée le profil elle-même (AuthScreen.doRegister),
   * mais une connexion Google ne passe jamais par là : Supabase crée le compte
   * dans auth.users sans rien écrire dans `profiles`. Or index.js renvoie sur
   * la landing page tant que le profil est absent — l'utilisateur serait donc
   * authentifié et bloqué dehors. Ce filet rattrape aussi les inscriptions
   * email dont la création de profil a échoué.
   */
  const createMissingProfile = async (authUser) => {
    const meta = authUser.user_metadata || {}
    const rawName = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'Utilisateur'
    const username = rawName.trim().split(/\s+/)[0].slice(0, 20)
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: authUser.id, username, color }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('createMissingProfile error:', error.message)
      return null
    }
    return data
  }

  const loadProfile = async (authUser, retries = 2) => {
    const userId = authUser.id
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
      return
    }

    // PGRST116 = aucune ligne trouvée.
    if (error && error.code === 'PGRST116') {
      // On retente d'abord : juste après une inscription email, la lecture peut
      // précéder l'écriture du profil.
      if (retries > 0) {
        setTimeout(() => loadProfile(authUser, retries - 1), 500)
        return
      }
      // Toujours rien : le profil n'existe vraiment pas (cas Google).
      const created = await createMissingProfile(authUser)
      if (created) setProfile(created)
      return
    }

    if (error) console.error('loadProfile error:', error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const hideNav = !user || NO_NAV_PATHS.includes(router.pathname)

  const fontClasses = `${playfair.variable} ${sourceSans.variable} ${amiri.variable} ${reemKufi.variable}`

  return (
    /*
     * Les alias de police sont REDECLARES ici, et c'est indispensable.
     *
     * globals.css les declare sur :root sous la forme
     *   --font-arabic: var(--tarjama-font-arabic)
     * Or une variable CSS est substituee LA OU ELLE EST DECLAREE. A hauteur de
     * <html>, --tarjama-font-arabic vaut encore le nom litteral pose par
     * tokens.css ('Amiri', serif) — next/font, lui, pose sa vraie valeur sur ce
     * div, bien plus bas dans l'arbre. La valeur calculee 'Amiri', serif
     * descendait donc par heritage sur toute la page.
     *
     * Resultat mesure le 6 septembre 2026 : le texte arabe s'affichait en serif
     * generique. Les huit .woff2 de next/font etaient bien telecharges, et
     * jamais utilises. Verification : الرحمن الرحيم en 32px mesurait 155px,
     * identique a serif pur, contre 138px avec la vraie Amiri.
     *
     * En redeclarant les alias ICI, la substitution a lieu sur ce div, ou
     * --tarjama-font-* porte la valeur de next/font.
     */
    <div
      className={fontClasses}
      style={{
        '--font-arabic': 'var(--tarjama-font-arabic)',
        '--font-serif': 'var(--tarjama-font-display)',
        '--font-sans': 'var(--tarjama-font-body)',
        '--font-display': 'var(--tarjama-font-display)',
      }}
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="theme-color" content={theme === 'light' ? '#F5F1E8' : '#C9A84C'}/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Tarjama"/>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icon.svg"/>
        <meta name="description" content="Apprends le Coran en traduisant verset par verset avec correction IA. Quiz vocabulaire, dictionnaire arabe, horaires de prière et plus. Gratuit."/>
        <link rel="canonical" href="https://tarjama.app"/>
        <meta property="og:site_name" content="Tarjama"/>
        <meta property="og:title" content="Tarjama — Apprends le Coran en traduisant"/>
        <meta property="og:description" content="Traduis le Coran verset par verset avec correction IA. 6 300+ mots, 114 sourates, quiz, dictionnaire arabe-français. Gratuit."/>
        <meta property="og:type" content="website"/>
        <meta property="og:url" content="https://tarjama.app"/>
        <meta property="og:image" content="https://tarjama.app/api/og"/>
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="630"/>
        <meta property="og:locale" content="fr_FR"/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content="Tarjama — Apprends le Coran en traduisant"/>
        <meta name="twitter:description" content="Traduis le Coran verset par verset avec correction IA. Gratuit."/>
        <meta name="twitter:image" content="https://tarjama.app/api/og"/>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Tarjama",
          "url": "https://tarjama.app",
          "description": "Apprends le Coran en traduisant verset par verset avec correction IA",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
          "inLanguage": ["fr", "ar"],
          "author": { "@type": "Person", "name": "Imran" }
        })}} />
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
            authReady={authReady}
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
    </div>
  )
}
