import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import styles from './Layout.module.css'

// Particules dorées flottantes
function GoldParticles() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    // Init particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 18; i++) {
        particlesRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.2 + 0.05,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.12,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const t = Date.now() * 0.001

      for (const p of particlesRef.current) {
        p.x += p.vx + Math.sin(t + p.phase) * 0.05
        p.y += p.vy + Math.cos(t * 0.7 + p.phase) * 0.04

        // Wrap around
        if (p.x < -10) p.x = window.innerWidth + 10
        if (p.x > window.innerWidth + 10) p.x = -10
        if (p.y < -10) p.y = window.innerHeight + 10
        if (p.y > window.innerHeight + 10) p.y = -10

        const flicker = 0.7 + Math.sin(t * 1.5 + p.phase) * 0.3
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(201, 168, 76, ${p.opacity * flicker})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.particles} />
}

export default function Layout({ children, user, profile, onLogout, hideNav }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Fermer sidebar sur navigation
  useEffect(() => {
    const handleRoute = () => setSidebarOpen(false)
    router.events.on('routeChangeStart', handleRoute)
    return () => router.events.off('routeChangeStart', handleRoute)
  }, [router])

  // Pas de nav pour l'écran d'auth
  if (hideNav) {
    return (
      <div className={styles.layout}>
        <GoldParticles />
        {children}
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <GoldParticles />

      <Topbar
        profile={profile}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      <main className={styles.main}>
        <div className={styles.pageContent} key={router.pathname}>
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
