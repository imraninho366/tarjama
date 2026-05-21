import { useEffect, useRef } from 'react'
import Link from 'next/link'
import AuthScreen from './AuthScreen'

/* ═══════════════════════════════════════════════════════════════
   GRADIENT MESH — warm golds + terracotta + cool sage/dusty blue
   at very low opacity on cream, creating atmospheric depth via
   warm/cool contrast instead of brightness.
   ═══════════════════════════════════════════════════════════════ */
function GradientMesh() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const points = [
      { x: 0.15, y: 0.2, r: 0.35, color: [160, 120, 40] },
      { x: 0.75, y: 0.15, r: 0.3, color: [180, 100, 60] },
      { x: 0.5, y: 0.6, r: 0.4, color: [140, 110, 30] },
      { x: 0.85, y: 0.7, r: 0.3, color: [100, 130, 100] },
      { x: 0.1, y: 0.8, r: 0.25, color: [120, 100, 80] },
      { x: 0.6, y: 0.35, r: 0.2, color: [90, 110, 130] },
    ]

    points.forEach(p => {
      p.vx = (Math.random() - 0.5) * 0.0003
      p.vy = (Math.random() - 0.5) * 0.0003
      p.phase = Math.random() * Math.PI * 2
    })

    function resize() {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let frameId
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function draw(t) {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      for (const p of points) {
        p.x += p.vx + Math.sin(t * 0.0005 + p.phase) * 0.0001
        p.y += p.vy + Math.cos(t * 0.0004 + p.phase) * 0.0001
        if (p.x < -0.2) p.x = 1.2
        if (p.x > 1.2) p.x = -0.2
        if (p.y < -0.2) p.y = 1.2
        if (p.y > 1.2) p.y = -0.2

        const pulse = 1 + Math.sin(t * 0.001 + p.phase) * 0.15
        const radius = p.r * Math.min(w, h) * pulse
        const grad = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, radius)
        const [r, g, b] = p.color
        grad.addColorStop(0, `rgba(${r},${g},${b},0.12)`)
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.04)`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }
      frameId = requestAnimationFrame(draw)
    }

    if (!prefersReduced) frameId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 opacity-40"
      aria-hidden="true"
    />
  )
}

/* ═══ Data ═══ */
const FEATURES = [
  { icon: 'ت', title: 'Traduction verset par verset', desc: 'Traduis le Coran avec correction IA instantanée' },
  { icon: 'ق', title: 'Quiz vocabulaire', desc: '6 300+ mots coraniques avec racines et fréquences' },
  { icon: '۩', title: 'Horaires de prière & Qibla', desc: 'Prières du jour et boussole vers la Mecque' },
  { icon: 'ع', title: 'Savant IA', desc: 'Réponses sourcées du Coran et des hadiths' },
  { icon: 'م', title: 'Dictionnaire complet', desc: 'Recherche instantanée avec mnémoniques IA' },
  { icon: 'أ', title: 'Alphabet & Calligraphie', desc: '28 lettres avec prononciation et pratique' },
]

const STATS = [
  ['6 300+', 'Mots'],
  ['114', 'Sourates'],
  ['130+', "Du'as"],
  ['25', 'Prophètes'],
]

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — Field.io light kinetic design ("Riyad")
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <>
      {/* ── Background layers ──────────────────────────────────── */}
      <GradientMesh />

      <svg
        className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-[0.08]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="animate-[curveDrift1_20s_ease-in-out_infinite]"
          d="M0,450 Q360,200 720,400 T1440,350"
          fill="none"
          stroke="var(--tarjama-color-primary-dim)"
          strokeWidth="0.5"
          strokeLinecap="round"
        />
        <path
          className="animate-[curveDrift2_25s_ease-in-out_infinite]"
          d="M0,300 Q480,600 960,250 T1440,500"
          fill="none"
          stroke="var(--tarjama-color-primary-dim)"
          strokeWidth="0.5"
          strokeLinecap="round"
        />
        <path
          className="animate-[curveDrift3_18s_ease-in-out_infinite]"
          d="M-100,600 Q400,100 800,500 T1540,200"
          fill="none"
          stroke="var(--tarjama-color-primary-dim)"
          strokeWidth="0.5"
          strokeLinecap="round"
        />
      </svg>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="relative z-[1] max-w-[720px] mx-auto px-6 max-sm:px-4 flex flex-col items-center text-center">

        {/* ═══ Hero ═══ */}
        <div className="pt-16 pb-4 animate-[fadeInUp_0.6s_ease-out]">

          {/* Shimmer glyph */}
          <div
            className="font-arabic leading-none mb-4 cursor-default"
            style={{
              fontSize: 'clamp(80px, 20vw, 160px)',
              background: 'linear-gradient(135deg, #6B5210 0%, var(--tarjama-color-primary) 30%, var(--tarjama-color-primary-light) 50%, var(--tarjama-color-primary) 70%, #6B5210 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'glyphShimmer 4s ease-in-out infinite, glyphFloat 6s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 20px rgba(107, 82, 16, 0.2))',
            }}
            aria-hidden="true"
          >
            ب
          </div>

          {/* Title */}
          <h1
            className="font-display font-bold text-[color:var(--tarjama-color-text)] mb-2 animate-[fadeInUp_0.8s_ease-out_0.3s_both]"
            style={{ fontSize: 'clamp(32px, 8vw, 56px)', letterSpacing: '12px' }}
          >
            TARJAMA
          </h1>

          {/* Subtitle — gold-deep (#6B5210) = 6.56:1 contrast ✓ AA */}
          <p className="text-[15px] text-[#6B5210] tracking-[4px] uppercase mb-6 font-arabic animate-[fadeInUp_0.8s_ease-out_0.5s_both]">
            ترجمة — Traduction coranique
          </p>

          {/* Tagline */}
          <p className="text-base text-[color:var(--tarjama-color-text-secondary)] leading-relaxed max-w-[440px] mx-auto font-display animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
            Apprends le Coran en traduisant verset par verset — gratuit.
          </p>
        </div>

        {/* ═══ Cycling verbs ═══ */}
        <div
          className="font-body text-[color:var(--tarjama-color-text-secondary)] font-light mb-10 h-[36px] overflow-hidden animate-[fadeInUp_0.8s_ease-out_0.7s_both]"
          style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}
        >
          <span className="block animate-[cycleVerbs_12s_ease-in-out_infinite] leading-[36px]">
            Comprendre · فَهِمَ<br />
            Traduire · تَرْجَمَ<br />
            Mémoriser · حَفِظَ<br />
            Réciter · تَلَا<br />
            Apprendre · تَعَلَّمَ<br />
            Comprendre · فَهِمَ
          </span>
        </div>

        {/* ═══ Translation strip (Basmala) ═══ */}
        <div className="w-full max-w-[520px] border-t border-b border-[color:var(--tarjama-color-border)] py-6 mb-10 animate-[fadeInUp_0.8s_ease-out_0.9s_both]">
          <div
            className="font-arabic text-primary-dim leading-[2] mb-3"
            dir="rtl"
            lang="ar"
            style={{ fontSize: 'clamp(22px, 5vw, 30px)' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
          <div className="font-display text-[16px] text-[color:var(--tarjama-color-text-secondary)] italic leading-[1.8]">
            « Au nom d&#39;Allah, le Tout Miséricordieux, le Très Miséricordieux »
          </div>
          <div className="text-[11px] text-[color:var(--tarjama-color-text-secondary)] uppercase tracking-[3px] mt-2">
            Sourate Al-Fatiha · verset 1
          </div>
        </div>

        {/* ═══ Auth ═══ */}
        <div className="w-full mb-10 animate-[fadeInUp_0.6s_ease-out_1s_both]">
          <AuthScreen />
        </div>

        {/* ═══ Stats ═══ */}
        <div className="grid grid-cols-4 max-sm:grid-cols-2 max-sm:gap-6 gap-0 py-8 mb-10 w-full relative animate-[fadeInUp_0.6s_ease-out_1.1s_both] border-y border-[rgba(var(--tarjama-color-primary-rgb),0.08)]">
          {STATS.map(([num, label], i) => (
            <div
              key={label}
              className={`text-center relative ${
                i < 3
                  ? "max-sm:after:hidden after:content-[''] after:absolute after:right-0 after:top-[20%] after:bottom-[20%] after:w-px after:bg-[rgba(var(--tarjama-color-primary-rgb),0.1)]"
                  : ''
              }`}
            >
              {/* Stat number: primary-dim 4.30:1 at 28px bold = AA Large ✓ */}
              <div className="text-[28px] font-display text-primary-dim font-bold leading-none">{num}</div>
              {/* Stat label: text-secondary 5.10:1 ✓ AA */}
              <div className="text-[9px] text-[color:var(--tarjama-color-text-secondary)] uppercase tracking-[2px] mt-1.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ═══ Features ═══ */}
        <div className="w-full mb-10">
          <h2 className="text-[9px] text-[#6B5210] uppercase tracking-[4px] mb-6 text-center font-body font-normal">
            ✦ Fonctionnalités ✦
          </h2>
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-md bg-[rgba(var(--tarjama-color-primary-rgb),0.03)] border border-[rgba(var(--tarjama-color-primary-rgb),0.06)] transition-all duration-200 hover:bg-[rgba(var(--tarjama-color-primary-rgb),0.06)] hover:border-[rgba(var(--tarjama-color-primary-rgb),0.12)] animate-[fadeInUp_0.5s_ease-out_both]"
                style={{ animationDelay: `${1.2 + i * 0.06}s` }}
              >
                <div className="w-[52px] h-[52px] rounded-lg shrink-0 bg-[rgba(var(--tarjama-color-primary-rgb),0.08)] border border-[rgba(var(--tarjama-color-primary-rgb),0.12)] flex items-center justify-center font-arabic text-[22px] text-primary-dim" role="img" aria-label={f.title}>
                  {f.icon}
                </div>
                <div>
                  <div className="text-[15px] text-[color:var(--tarjama-color-text)] font-semibold mb-1 font-display tracking-wide">{f.title}</div>
                  <div className="text-[13px] text-[color:var(--tarjama-color-text-secondary)] leading-relaxed font-display">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Verset ═══ */}
        {/* Verset — primary-dim (4.30:1) at 24-32px = AA Large ✓ */}
        <div className="w-full text-center py-10 px-8 max-sm:px-4 max-sm:py-8 relative mb-10 bg-[rgba(var(--tarjama-color-primary-rgb),0.03)] border-y border-[rgba(var(--tarjama-color-primary-rgb),0.08)] animate-[fadeInUp_0.6s_ease-out_1.5s_both]">
          <div
            className="font-arabic text-primary-dim leading-[2.2] mb-4 relative"
            dir="rtl"
            lang="ar"
            style={{ fontSize: 'clamp(24px, 6vw, 32px)' }}
          >
            إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ
          </div>
          <div className="text-sm text-[color:var(--tarjama-color-text-secondary)] font-display italic leading-relaxed max-w-[400px] mx-auto">
            « Nous l&#39;avons fait descendre, un Coran en arabe, afin que vous raisonniez. »
          </div>
          <div className="text-[11px] text-[color:var(--tarjama-color-text-secondary)] mt-2 uppercase tracking-[2px]">
            Sourate Yusuf · verset 2
          </div>
        </div>

        {/* ═══ Install PWA ═══ */}
        <div className="w-full p-6 mb-8 rounded-xl bg-[rgba(var(--tarjama-color-info-rgb,30,58,95),0.04)] border border-[rgba(var(--tarjama-color-info-rgb,30,58,95),0.1)] relative overflow-hidden animate-[fadeInUp_0.6s_ease-out_1.6s_both]">
          <div className="text-sm font-bold text-[color:var(--tarjama-color-text)] mb-4 text-center font-display tracking-wide">
            Installe Tarjama sur ton téléphone
          </div>
          <div className="flex flex-col gap-3 mb-4">
            {[
              [1, <>Appuie sur <strong>Partager</strong> (Safari) ou <strong>⋮</strong> (Chrome)</>],
              [2, <>Choisis <strong>&laquo; Sur l&#39;écran d&#39;accueil &raquo;</strong></>],
              [3, <>Appuie <strong>Ajouter</strong> — c&#39;est prêt !</>],
            ].map(([n, text]) => (
              <div key={n} className="flex items-center gap-4 text-[13px] text-[color:var(--tarjama-color-text-secondary)] leading-relaxed font-display">
                <span className="w-7 h-7 rounded-full bg-[rgba(var(--tarjama-color-info-rgb,30,58,95),0.12)] text-info flex items-center justify-center text-xs font-bold shrink-0 font-display">
                  {n}
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-[color:var(--tarjama-color-text-secondary)] text-center italic font-display">
            Fonctionne hors-ligne, comme une vraie app
          </div>
        </div>

        {/* ═══ Footer ═══ */}
        <footer className="text-center py-6 pb-10 border-t border-[rgba(var(--tarjama-color-primary-rgb),0.04)] w-full">
          <div className="text-[11px] text-[color:var(--tarjama-color-text-secondary)] mb-2 font-display tracking-[2px]">
            Tarjama
          </div>
          <Link
            href="/mentions-legales"
            className="text-[11px] text-[color:var(--tarjama-color-text-secondary)] no-underline border-b border-[rgba(var(--tarjama-color-primary-rgb),0.15)] pb-px hover:text-primary transition-colors"
          >
            Mentions légales &amp; Confidentialité
          </Link>
        </footer>
      </div>
    </>
  )
}
