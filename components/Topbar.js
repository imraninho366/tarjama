import Link from 'next/link'
import { useRouter } from 'next/router'

const PAGE_NAMES = {
  '/':             { fr: 'Traduction', ar: 'ترجمة' },
  '/quiz':         { fr: 'Quiz', ar: 'اختبار' },
  '/dictionnaire': { fr: 'Dictionnaire', ar: 'المعجم' },
  '/prieres':      { fr: 'Prières', ar: 'الصلاة' },
  '/hadith':       { fr: 'Hadith', ar: 'الحديث' },
  '/duas':         { fr: 'Invocations', ar: 'الدعاء' },
  '/piliers':      { fr: 'Piliers', ar: 'الأركان' },
  '/prophetes':    { fr: 'Prophètes', ar: 'الأنبياء' },
  '/alphabet':     { fr: 'Alphabet', ar: 'الحروف' },
  '/dhikr':        { fr: 'Dhikr', ar: 'الأذكار' },
  '/savant':       { fr: 'Savant IA', ar: 'العالِم' },
  '/humeur':       { fr: 'Humeur', ar: 'المشاعر' },
  '/duel':         { fr: 'Duel', ar: 'المبارزة' },
  '/connexions':   { fr: 'Connexions', ar: 'الروابط' },
  '/revelation':   { fr: 'Révélation', ar: 'النزول' },
  '/racines':      { fr: 'Racines', ar: 'الجذور' },
  '/parcours':     { fr: 'Parcours', ar: 'المسار' },
  '/calligraphie': { fr: 'Calligraphie', ar: 'الخط' },
  '/tajweed':      { fr: 'Tajweed', ar: 'التجويد' },
  '/profil':       { fr: 'Profil', ar: 'الملف' },
}

export default function Topbar({ profile, onToggleSidebar, theme, onToggleTheme }) {
  const router = useRouter()
  const page = PAGE_NAMES[router.pathname] || { fr: '', ar: '' }

  return (
    <header className="sticky top-0 z-[var(--tarjama-z-sticky)] h-[var(--tarjama-topbar-height)] flex items-center px-6 gap-4 bg-[var(--tarjama-color-surface-overlay)] backdrop-blur-[16px] [-webkit-backdrop-filter:blur(16px)] border-b border-transparent bg-clip-padding max-sm:px-4 max-sm:h-12">
      {/* Gradient bottom border */}
      <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(var(--tarjama-color-primary-rgb),0.25)] to-transparent" aria-hidden="true" />

      {/* Hamburger (tablet/mobile) */}
      <button
        className="hidden max-lg:flex w-11 h-11 items-center justify-center rounded-sm text-primary text-lg shrink-0 cursor-pointer transition-colors duration-150 hover:bg-[rgba(var(--tarjama-color-primary-rgb),0.08)]"
        onClick={onToggleSidebar}
        aria-label="Menu de navigation"
      >
        &#9776;
      </button>

      {/* Logo */}
      <Link
        href="/"
        className="font-display text-base max-sm:text-sm font-semibold tracking-[4px] max-sm:tracking-[3px] text-primary no-underline shrink-0 transition-all duration-200"
        style={{ textShadow: '0 0 24px rgba(var(--tarjama-color-primary-rgb), 0.15)' }}
      >
        TARJAMA
      </Link>

      {/* Breadcrumb (desktop) */}
      {router.pathname !== '/' && (
        <div className="flex items-center gap-2 text-xs text-[color:var(--tarjama-color-text-muted)] max-lg:hidden">
          <span className="text-[10px] opacity-40">/</span>
          <span className="text-[color:var(--tarjama-color-text-secondary)] tracking-[1px]">{page.fr}</span>
          <span className="font-arabic text-[13px] text-[color:var(--tarjama-color-text-muted)]" dir="rtl" aria-hidden="true">{page.ar}</span>
        </div>
      )}

      {/* Theme toggle */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          className="relative w-9 h-9 before:absolute before:content-[''] before:-inset-1 before:rounded-full rounded-full flex items-center justify-center text-base text-primary bg-[rgba(var(--tarjama-color-primary-rgb),0.06)] border border-[rgba(var(--tarjama-color-primary-rgb),0.15)] cursor-pointer transition-all duration-200 shrink-0 ms-auto hover:bg-[rgba(var(--tarjama-color-primary-rgb),0.15)] hover:border-[rgba(var(--tarjama-color-primary-rgb),0.3)]"
          aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      )}

      {/* User */}
      {profile && (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[color:var(--tarjama-color-background)] shrink-0 ring-[1.5px] ring-[rgba(var(--tarjama-color-primary-rgb),0.3)] hover:ring-[rgba(var(--tarjama-color-primary-rgb),0.6)] transition-all duration-200"
            style={{ background: profile.color || 'var(--tarjama-color-primary)' }}
          >
            {profile.username?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-xs text-[color:var(--tarjama-color-text-secondary)] tracking-[0.5px] max-sm:hidden">
            {profile.username}
          </span>
        </div>
      )}
    </header>
  )
}
