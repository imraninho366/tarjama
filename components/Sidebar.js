import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Sidebar.module.css'

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
    { href: '/calligraphie', icon: '✎', label: 'Calligraphie', ar: 'الخط' },
    { href: '/tajweed',      icon: '♪', label: 'Tajweed',    ar: 'التجويد' },
    { href: '/defi',         icon: '✦', label: 'Défis',      ar: 'التحدي' },
    { href: '/duel',         icon: '⚔', label: 'Duel',       ar: 'المبارزة' },
  ]},
  { title: 'Explorer', ar: 'اكتشف', items: [
    { href: '/humeur',       icon: '♡', label: 'Humeur',     ar: 'المشاعر' },
    { href: '/connexions',   icon: '◎', label: 'Connexions', ar: 'الروابط' },
    { href: '/revelation',   icon: '↓', label: 'Révélation', ar: 'النزول' },
    { href: '/hadith',       icon: 'ح', label: 'Hadith',     ar: 'الحديث' },
    { href: '/duas',         icon: 'د', label: 'Invocations', ar: 'الدعاء' },
    { href: '/piliers',      icon: 'ر', label: 'Piliers',    ar: 'الأركان' },
    { href: '/prophetes',    icon: 'ن', label: 'Prophètes',  ar: 'الأنبياء' },
  ]},
]

export default function Sidebar({ isOpen, onClose, onLogout, stats }) {
  const router = useRouter()

  return (
    <>
      {/* Overlay (tablette) */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        role="navigation"
        aria-label="Navigation principale"
      >
        <nav className={styles.nav}>
          {NAV_SECTIONS.map(section => (
            <div key={section.title} className={styles.navSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>{section.title}</span>
                <span className={styles.sectionTitleAr}>{section.ar}</span>
              </div>
              {section.items.map(item => {
                const isActive = router.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navText}>
                      <span className={styles.navLabel}>{item.label}</span>
                      <span className={styles.navLabelAr}>{item.ar}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}

          <div className={styles.navSection}>
            <Link
              href="/profil"
              className={`${styles.navLink} ${router.pathname === '/profil' ? styles.navLinkActive : ''}`}
              onClick={onClose}
            >
              <span className={styles.navIcon}>◉</span>
              <span className={styles.navText}>
                <span className={styles.navLabel}>Profil</span>
                <span className={styles.navLabelAr}>الملف</span>
              </span>
            </Link>
          </div>
        </nav>

        {/* Stats */}
        {stats && (
          <div className={styles.stats}>
            {stats.translated > 0 && (
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Versets traduits</span>
                <span className={styles.statValue}>{stats.translated}</span>
              </div>
            )}
            {stats.streak > 0 && (
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Streak</span>
                <span className={styles.statValue}>{stats.streak} jours</span>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        {onLogout && (
          <button className={styles.logout} onClick={onLogout}>
            <span>↩</span>
            Déconnexion
          </button>
        )}
      </aside>
    </>
  )
}
