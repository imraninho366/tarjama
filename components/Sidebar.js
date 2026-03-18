import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { href: '/',             icon: 'ت', label: 'Traduction', ar: 'ترجمة' },
  { href: '/quiz',         icon: 'ق', label: 'Quiz',       ar: 'اختبار' },
  { href: '/dictionnaire', icon: 'م', label: 'Dictionnaire', ar: 'المعجم' },
  { href: '/alphabet',     icon: 'أ', label: 'Alphabet',   ar: 'الحروف' },
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
          {NAV_ITEMS.map(item => {
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
