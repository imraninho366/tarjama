import Link from 'next/link'
import { useRouter } from 'next/router'

const TABS = [
  { href: '/',             icon: 'ت', label: 'Traduire' },
  { href: '/prieres',      icon: '۩', label: 'Prières' },
  { href: '/quiz',         icon: 'ق', label: 'Quiz' },
  { href: '/dictionnaire', icon: 'م', label: 'Dico' },
  { href: '/profil',       icon: '◉', label: 'Profil' },
]

export default function BottomNav() {
  const router = useRouter()

  return (
    <nav
      className="hidden max-sm:flex fixed bottom-0 left-0 right-0 z-[var(--tarjama-z-sticky)] h-[var(--tarjama-bottomnav-height)] items-center justify-around bg-[var(--tarjama-color-surface-overlay)] backdrop-blur-[16px] [-webkit-backdrop-filter:blur(16px)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Navigation mobile"
    >
      {/* Gradient top border */}
      <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--tarjama-color-primary-rgb),0.25)] to-transparent" aria-hidden="true" />

      {TABS.map(tab => {
        const isActive = router.pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center gap-[3px] py-2 min-h-[48px] flex-1 rounded-md no-underline transition-all duration-150 relative [-webkit-tap-highlight-color:transparent] active:scale-[0.92]"
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <span className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-b-[3px] bg-primary shadow-[0_2px_8px_rgba(var(--tarjama-color-primary-rgb),0.25)]" aria-hidden="true" />
            )}
            <span className={`text-lg leading-none transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className={`text-[9px] font-bold tracking-[1px] uppercase transition-colors duration-200 ${
              isActive ? 'text-primary' : 'text-[color:var(--tarjama-color-text-muted)]'
            }`}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
