import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Head from 'next/head'
import '../styles/globals.css'

// Pages qui ne montrent pas la nav (auth screen)
const NO_NAV_PATHS = ['/gen-dico']

export default function TarjamaApp({ Component, pageProps, router }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [displayedRoute, setDisplayedRoute] = useState(router.pathname)
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

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
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
        <meta name="theme-color" content="#C9A84C"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Tarjama"/>
        <meta name="description" content="Apprends le Coran en traduisant verset par verset avec correction IA"/>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icon.svg"/>
      </Head>
      <Layout
        user={user}
        profile={profile}
        onLogout={handleLogout}
        hideNav={hideNav}
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
    </>
  )
}
