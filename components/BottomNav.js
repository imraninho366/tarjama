import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './BottomNav.module.css'

const TABS = [
  { href: '/',             icon: 'ت', label: 'Traduire' },
  { href: '/quiz',         icon: 'ق', label: 'Quiz' },
  { href: '/dictionnaire', icon: 'م', label: 'Dico' },
  { href: '/hadith',       icon: 'ح', label: 'Hadith' },
  { href: '/duas',         icon: 'د', label: 'Du\'as' },
  { href: '/alphabet',     icon: 'أ', label: 'Alphabet' },
]

export default function BottomNav() {
  const router = useRouter()

  return (
    <nav className={styles.bottomNav} role="navigation" aria-label="Navigation mobile">
      {TABS.map(tab => {
        const isActive = router.pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
