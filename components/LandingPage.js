import { useState } from 'react'
import Link from 'next/link'
import AuthScreen from './AuthScreen'
import s from './LandingPage.module.css'

const FEATURES = [
  { icon: 'ت', title: 'Traduction verset par verset', desc: 'Traduis le Coran avec correction IA instantanée' },
  { icon: 'ق', title: 'Quiz vocabulaire', desc: '6 300+ mots coraniques avec racines et fréquences' },
  { icon: 'م', title: 'Dictionnaire complet', desc: 'Recherche instantanée en arabe, translittération ou français' },
  { icon: '۩', title: 'Horaires de prière & Qibla', desc: 'Prières du jour et boussole vers la Mecque' },
  { icon: 'ح', title: 'Hadiths Bukhari & Muslim', desc: 'Collections complètes avec traductions françaises' },
  { icon: 'أ', title: 'Alphabet arabe interactif', desc: '28 lettres avec prononciation et calligraphie' },
]

const STATS = [
  ['6 300+', 'Mots coraniques'],
  ['114', 'Sourates'],
  ['130+', 'Invocations'],
  ['25', 'Prophètes'],
]

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)

  return (
    <div className={s.container}>

      <div className={s.hero}>
        <div className={s.heroIcon}>ب</div>
        <h1 className={s.heroTitle}>TARJAMA</h1>
        <p className={s.heroSub}>ترجمة — Traduction coranique</p>
        <p className={s.heroDesc}>
          Apprends le vocabulaire du Coran en traduisant verset par verset.
          Correction IA, quiz, dictionnaire et plus — tout en français.
        </p>
        <button className={s.cta} onClick={() => setShowAuth(true)}>
          Commencer gratuitement →
        </button>
        <p className={s.ctaNote}>Gratuit · Pas de carte bancaire · Créé en 30 secondes</p>
      </div>

      <div className={s.statsBar}>
        {STATS.map(([num, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div className={s.statNum}>{num}</div>
            <div className={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 32 }}>
        <div className={s.featuresTitle}>Fonctionnalités</div>
        {FEATURES.map((f, i) => (
          <div key={i} className={s.featureItem} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className={s.featureIcon}>{f.icon}</div>
            <div>
              <div className={s.featureName}>{f.title}</div>
              <div className={s.featureDesc}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={s.verseQuote}>
        <div className={s.verseArabic}>إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ</div>
        <div className={s.verseFrench}>
          « Nous l'avons fait descendre, un Coran en arabe, afin que vous raisonniez. »
        </div>
        <div className={s.verseRef}>Sourate Yusuf (12:2)</div>
      </div>

      {!showAuth && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button className={s.cta} onClick={() => setShowAuth(true)}>
            Créer mon compte gratuitement →
          </button>
        </div>
      )}

      {showAuth && (
        <div style={{ marginBottom: 32 }}>
          <AuthScreen />
        </div>
      )}

      <div className={s.footer}>
        <div className={s.footerText}>Tarjama — Apprendre le Coran en français</div>
        <Link href="/mentions-legales" className={s.footerLink}>
          Mentions légales & Confidentialité
        </Link>
      </div>
    </div>
  )
}
