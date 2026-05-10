import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Topbar.module.css'

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
  '/defi':         { fr: 'Défis', ar: 'التحدي' },
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

      {/* Theme toggle */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          className={styles.themeToggle}
          aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
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
