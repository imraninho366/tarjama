import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Topbar.module.css'

const PAGE_NAMES = {
  '/':             { fr: 'Traduction', ar: 'ترجمة' },
  '/quiz':         { fr: 'Quiz', ar: 'اختبار' },
  '/dictionnaire': { fr: 'Dictionnaire', ar: 'المعجم' },
  '/hadith':       { fr: 'Hadith', ar: 'الحديث' },
  '/duas':         { fr: 'Invocations', ar: 'الدعاء' },
  '/piliers':      { fr: 'Piliers', ar: 'الأركان' },
  '/alphabet':     { fr: 'Alphabet', ar: 'الحروف' },
}

export default function Topbar({ profile, onToggleSidebar }) {
  const router = useRouter()
  const page = PAGE_NAMES[router.pathname] || { fr: '', ar: '' }

  return (
    <header className={styles.topbar}>
      {/* Hamburger (tablette/mobile) */}
      <button
        className={styles.hamburger}
        onClick={onToggleSidebar}
        aria-label="Menu de navigation"
      >
        ☰
      </button>

      {/* Logo */}
      <Link href="/" className={styles.logo}>
        TARJAMA
      </Link>

      {/* Breadcrumb (desktop) */}
      {router.pathname !== '/' && (
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbPage}>{page.fr}</span>
          <span className={styles.breadcrumbAr}>{page.ar}</span>
        </div>
      )}

      {/* User */}
      {profile && (
        <div className={styles.userSection}>
          <div
            className={styles.avatar}
            style={{ background: profile.color || '#C9A84C' }}
          >
            {profile.username?.[0]?.toUpperCase() || '?'}
          </div>
          <span className={styles.username}>{profile.username}</span>
        </div>
      )}
    </header>
  )
}
