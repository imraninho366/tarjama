import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

/* ═══ Gold particles ═══ */
function GoldParticles() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Le canvas est masque en CSS sous 640px (max-sm:hidden) et en mouvement
    // reduit (motion-reduce:hidden). Sans cette sortie, la boucle tournait
    // quand meme sur chaque page, en permanence, pour un effet que la majorite
    // des utilisateurs — sur mobile — ne voit jamais.
    const hidden = window.matchMedia('(max-width: 639px), (prefers-reduced-motion: reduce)').matches
    if (hidden) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const count = window.innerWidth < 768 ? 8 : 18

    // Lu une seule fois : getComputedStyle force un recalcul de style
    // synchrone, et il etait appele a chaque image, soit 60 fois par seconde.
    const rgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--tarjama-color-primary-rgb').trim() || '184, 147, 42'

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < count; i++) {
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

    let visible = true
    const onVisibility = () => {
      visible = !document.hidden
      if (visible && !rafRef.current) animate()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const animate = () => {
      if (!visible) { rafRef.current = null; return }
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const t = Date.now() * 0.001

      for (const p of particlesRef.current) {
        p.x += p.vx + Math.sin(t + p.phase) * 0.05
        p.y += p.vy + Math.cos(t * 0.7 + p.phase) * 0.04
        if (p.x < -10) p.x = window.innerWidth + 10
        if (p.x > window.innerWidth + 10) p.x = -10
        if (p.y < -10) p.y = window.innerHeight + 10
        if (p.y > window.innerHeight + 10) p.y = -10

        const flicker = 0.7 + Math.sin(t * 1.5 + p.phase) * 0.3
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb}, ${p.opacity * flicker})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-[1] pointer-events-none max-sm:hidden motion-reduce:hidden"
      aria-hidden="true"
    />
  )
}

export default function Layout({ children, user, profile, onLogout, hideNav, theme, onToggleTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleRoute = () => setSidebarOpen(false)
    router.events.on('routeChangeStart', handleRoute)
    return () => router.events.off('routeChangeStart', handleRoute)
  }, [router])

  if (hideNav) {
    return (
      <div className="min-h-screen flex flex-col">
        <GoldParticles />
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GoldParticles />

      <Topbar
        profile={profile}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      <main
        className="flex-1 relative p-6 lg:ms-[var(--tarjama-sidebar-width)] max-sm:p-4"
        style={{
          minHeight: 'calc(100vh - var(--tarjama-topbar-height))',
          paddingBottom: 'calc(var(--tarjama-bottomnav-height, 0px) + env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        <div className="animate-[pageEnter_200ms_ease-out_both]" key={router.pathname}>
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
