import Link from 'next/link'
import AuthScreen from './AuthScreen'
import s from './LandingPage.module.css'

const FEATURES = [
  { icon: 'ت', title: 'Traduction verset par verset', desc: 'Traduis le Coran avec correction IA instantanée' },
  { icon: 'ق', title: 'Quiz vocabulaire', desc: '6 300+ mots coraniques avec racines et fréquences' },
  { icon: '۩', title: 'Horaires de prière & Qibla', desc: 'Prières du jour et boussole vers la Mecque' },
  { icon: '☪', title: 'Savant IA', desc: 'Réponses sourcées du Coran et des hadiths' },
  { icon: 'م', title: 'Dictionnaire complet', desc: 'Recherche instantanée avec mnémoniques IA' },
  { icon: 'أ', title: 'Alphabet & Calligraphie', desc: '28 lettres avec prononciation et pratique' },
]

const STATS = [
  ['6 300+', 'Mots'],
  ['114', 'Sourates'],
  ['130+', 'Du\'as'],
  ['25', 'Prophètes'],
]

export default function LandingPage() {
  return (
    <div className={s.container}>

      {/* Hero court */}
      <div className={s.hero}>
        <div className={s.heroIcon}>ب</div>
        <h1 className={s.heroTitle}>TARJAMA</h1>
        <p className={s.heroSub}>ترجمة — Traduction coranique</p>
        <p className={s.heroDesc}>
          Apprends le Coran en traduisant verset par verset — gratuit.
        </p>
      </div>

      {/* Formulaire toujours visible */}
      <div className={s.authSection}>
        <AuthScreen />
      </div>

      {/* Stats */}
      <div className={s.statsBar}>
        {STATS.map(([num, label]) => (
          <div key={label} className={s.statItem}>
            <div className={s.statNum}>{num}</div>
            <div className={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className={s.featuresSection}>
        <div className={s.featuresTitle}>Fonctionnalités</div>
        <div className={s.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={s.featureItem} style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
              <div className={s.featureIcon}>{f.icon}</div>
              <div>
                <div className={s.featureName}>{f.title}</div>
                <div className={s.featureDesc}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verset */}
      <div className={s.verseQuote}>
        <div className={s.verseArabic}>إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ</div>
        <div className={s.verseFrench}>
          « Nous l'avons fait descendre, un Coran en arabe, afin que vous raisonniez. »
        </div>
        <div className={s.verseRef}>Sourate Yusuf · verset 2</div>
      </div>

      {/* Install */}
      <div className={s.installGuide}>
        <div className={s.installTitle}>Installe Tarjama sur ton téléphone</div>
        <div className={s.installSteps}>
          <div className={s.installStep}>
            <span className={s.installStepNum}>1</span>
            <span>Appuie sur <strong>Partager</strong> (Safari) ou <strong>⋮</strong> (Chrome)</span>
          </div>
          <div className={s.installStep}>
            <span className={s.installStepNum}>2</span>
            <span>Choisis <strong>« Sur l'écran d'accueil »</strong></span>
          </div>
          <div className={s.installStep}>
            <span className={s.installStepNum}>3</span>
            <span>Appuie <strong>Ajouter</strong> — c'est prêt !</span>
          </div>
        </div>
        <div className={s.installNote}>Fonctionne hors-ligne, comme une vraie app</div>
      </div>

      {/* Footer */}
      <div className={s.footer}>
        <div className={s.footerText}>Tarjama</div>
        <Link href="/mentions-legales" className={s.footerLink}>
          Mentions légales & Confidentialité
        </Link>
      </div>
    </div>
  )
}
