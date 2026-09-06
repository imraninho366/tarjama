import Link from 'next/link'
import { useRouter } from 'next/router'

const NAV_SECTIONS = [
  { title: 'Apprendre', ar: 'تعلّم', items: [
    { href: '/',             icon: 'ت', label: 'Traduction', ar: 'ترجمة' },
    { href: '/quiz',         icon: 'ق', label: 'Quiz',       ar: 'اختبار' },
    { href: '/dictionnaire', icon: 'م', label: 'Dictionnaire', ar: 'المعجم' },
    { href: '/parcours',     icon: '▸', label: 'Parcours',   ar: 'المسار' },
    { href: '/alphabet',     icon: 'أ', label: 'Alphabet',   ar: 'الحروف' },
    { href: '/racines',      icon: 'ج', label: 'Racines',    ar: 'الجذور' },
  ]},
  { title: 'Pratiquer', ar: 'تدرّب', items: [
    { href: '/prieres',      icon: '۩', label: 'Prières',    ar: 'الصلاة' },
    { href: '/dhikr',        icon: '◯', label: 'Dhikr',      ar: 'الأذكار' },
    { href: '/calligraphie', icon: '✎', label: 'Calligraphie', ar: 'الخط' },
    { href: '/tajweed',      icon: '♪', label: 'Tajweed',    ar: 'التجويد' },
    { href: '/duel',         icon: '⚔', label: 'Duel',       ar: 'المبارزة' },
  ]},
  { title: 'Explorer', ar: 'اكتشف', items: [
    { href: '/savant',       icon: 'ع', label: 'Savant IA',  ar: 'العالِم' },
    { href: '/humeur',       icon: '♡', label: 'Humeur',     ar: 'المشاعر' },
    { href: '/connexions',   icon: '◎', label: 'Connexions', ar: 'الروابط' },
    { href: '/revelation',   icon: '↓', label: 'Révélation', ar: 'النزول' },
    { href: '/hadith',       icon: 'ح', label: 'Hadith',     ar: 'الحديث' },
    { href: '/duas',         icon: 'د', label: 'Invocations', ar: 'الدعاء' },
    { href: '/piliers',      icon: 'ر', label: 'Piliers',    ar: 'الأركان' },
    { href: '/prophetes',    icon: 'ن', label: 'Prophètes',  ar: 'الأنبياء' },
    { href: '/suggestions',  icon: '✦', label: 'Proposer une idée', ar: 'اقتراح' },
  ]},
]

export default function Sidebar({ isOpen, onClose, onLogout, stats }) {
  const router = useRouter()

  return (
    <>
      {/* Overlay (tablet) */}
      <div
        className={`hidden max-lg:block fixed inset-0 z-[calc(var(--tarjama-z-overlay)-1)] bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`w-[var(--tarjama-sidebar-width)] max-sm:w-[260px] h-[calc(100vh-var(--tarjama-topbar-height))] fixed top-[var(--tarjama-topbar-height)] left-0 z-[var(--tarjama-z-overlay)] flex flex-col py-6 overflow-y-auto overflow-x-hidden max-lg:-translate-x-full max-lg:transition-transform max-lg:duration-300 max-lg:ease-out max-lg:shadow-[4px_0_40px_rgba(0,0,0,0.5)] ${
          isOpen ? 'max-lg:translate-x-0' : ''
        }`}
        style={{
          background: 'linear-gradient(180deg, var(--tarjama-color-background) 0%, var(--tarjama-color-background) 100%)',
          backgroundImage: 'url(/patterns/geometric-star.svg), linear-gradient(180deg, var(--tarjama-color-background) 0%, var(--tarjama-color-background) 100%)',
          backgroundRepeat: 'repeat, no-repeat',
          backgroundSize: '120px 120px, 100% 100%',
        }}
        role="navigation"
        aria-label="Navigation principale"
      >
        {/* Gradient right border */}
        <span className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-[rgba(var(--tarjama-color-primary-rgb),0.15)] via-[rgba(var(--tarjama-color-primary-rgb),0.05)] to-transparent" aria-hidden="true" />

        <nav className="flex flex-col px-4">
          {NAV_SECTIONS.map(section => (
            <div key={section.title} className="mb-4 pb-2 border-b border-[rgba(var(--tarjama-color-primary-rgb),0.06)] last:border-b-0">
              <div className="flex items-center justify-between px-4 pt-4 pb-1">
                <span className="text-[9px] font-bold tracking-[3px] uppercase text-primary-dim">{section.title}</span>
                <span className="font-arabic text-[11px] text-[color:var(--tarjama-color-text-muted)] opacity-50" dir="rtl">{section.ar}</span>
              </div>
              {section.items.map(item => {
                const isActive = router.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 py-3 px-4 rounded-md no-underline transition-all duration-200 relative overflow-hidden hover:bg-[rgba(var(--tarjama-color-primary-rgb),0.05)] hover:translate-x-1 active:translate-x-0.5 active:scale-[0.98] ${
                      isActive ? 'bg-[rgba(var(--tarjama-color-primary-rgb),0.08)]' : ''
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClose}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-primary shadow-[0_0_8px_rgba(var(--tarjama-color-primary-rgb),0.15)]" aria-hidden="true" />
                    )}
                    <span className={`w-9 h-9 flex items-center justify-center rounded-sm text-base shrink-0 transition-colors duration-200 ${
                      isActive ? 'bg-[rgba(var(--tarjama-color-primary-rgb),0.12)]' : 'bg-[rgba(var(--tarjama-color-primary-rgb),0.06)]'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="flex flex-col gap-px min-w-0">
                      <span className={`font-display text-[13px] font-semibold tracking-[1.5px] transition-colors duration-200 ${
                        isActive ? 'text-primary-light' : 'text-[color:var(--tarjama-color-text-secondary)]'
                      }`}>
                        {item.label}
                      </span>
                      <span className="font-arabic text-[13px] text-[color:var(--tarjama-color-text-muted)]" dir="rtl" style={{ textAlign: 'start' }}>
                        {item.ar}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}

          {/* Profil */}
          <div className="mb-4">
            <Link
              href="/profil"
              className={`flex items-center gap-4 py-3 px-4 rounded-md no-underline transition-all duration-200 relative overflow-hidden hover:bg-[rgba(var(--tarjama-color-primary-rgb),0.05)] hover:translate-x-1 ${
                router.pathname === '/profil' ? 'bg-[rgba(var(--tarjama-color-primary-rgb),0.08)]' : ''
              }`}
              onClick={onClose}
            >
              {router.pathname === '/profil' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-primary shadow-[0_0_8px_rgba(var(--tarjama-color-primary-rgb),0.15)]" aria-hidden="true" />
              )}
              <span className={`w-9 h-9 flex items-center justify-center rounded-sm text-base shrink-0 ${
                router.pathname === '/profil' ? 'bg-[rgba(var(--tarjama-color-primary-rgb),0.12)]' : 'bg-[rgba(var(--tarjama-color-primary-rgb),0.06)]'
              }`}>&#9673;</span>
              <span className="flex flex-col gap-px min-w-0">
                <span className={`font-display text-[13px] font-semibold tracking-[1.5px] ${
                  router.pathname === '/profil' ? 'text-primary-light' : 'text-[color:var(--tarjama-color-text-secondary)]'
                }`}>Profil</span>
                <span className="font-arabic text-[13px] text-[color:var(--tarjama-color-text-muted)]" dir="rtl" style={{ textAlign: 'start' }}>الملف</span>
              </span>
            </Link>
          </div>
        </nav>

        {/* Stats */}
        {stats && (
          <div className="mt-auto pt-6 px-6 border-t border-[rgba(var(--tarjama-color-primary-rgb),0.06)]">
            {stats.translated > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[10px] text-[color:var(--tarjama-color-text-muted)] tracking-[1.5px] uppercase">Versets traduits</span>
                <span className="font-display text-sm text-primary">{stats.translated}</span>
              </div>
            )}
            {stats.streak > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[10px] text-[color:var(--tarjama-color-text-muted)] tracking-[1.5px] uppercase">Streak</span>
                <span className="font-display text-sm text-primary">{stats.streak} jours</span>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        {onLogout && (
          <button
            className="flex items-center gap-2 py-2.5 px-6 mx-4 mt-4 rounded-sm text-[11px] text-[color:var(--tarjama-color-text-muted)] tracking-[1.5px] uppercase cursor-pointer transition-all duration-200 hover:text-error hover:bg-[rgba(var(--tarjama-color-error-rgb,220,38,38),0.12)]"
            onClick={onLogout}
          >
            <span>&#8617;</span>
            Déconnexion
          </button>
        )}
      </aside>
    </>
  )
}
