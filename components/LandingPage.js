import Link from 'next/link'
import AuthScreen from './AuthScreen'

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
    <div className="max-w-[720px] mx-auto px-6 relative overflow-hidden">

      {/* Hero */}
      <div className="text-center pt-14 pb-10 animate-[fadeInUp_0.6s_ease-out]">
        <div className="text-[64px] font-arabic text-primary mb-4 leading-none animate-[breathe_4s_ease-in-out_infinite]"
          style={{ textShadow: '0 0 60px rgba(var(--tarjama-color-primary-rgb), 0.25), 0 0 120px rgba(var(--tarjama-color-primary-rgb), 0.15)' }}>
          ب
        </div>
        <h1 className="text-[clamp(30px,9vw,44px)] font-display text-[color:var(--tarjama-color-text)] font-bold tracking-[10px] mb-1 animate-[fadeInUp_0.8s_ease-out_0.1s_both]">
          TARJAMA
        </h1>
        <p className="text-sm text-primary tracking-[4px] uppercase mb-8 font-arabic animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
          ترجمة — Traduction coranique
        </p>
        <p className="text-base text-[color:var(--tarjama-color-text-secondary)] leading-relaxed max-w-[440px] mx-auto font-display animate-[fadeInUp_0.8s_ease-out_0.3s_both]">
          Apprends le Coran en traduisant verset par verset — gratuit.
        </p>
      </div>

      {/* Auth */}
      <div className="mb-8 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
        <AuthScreen />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 max-sm:grid-cols-2 max-sm:gap-6 gap-0 py-8 mb-10 relative animate-[fadeInUp_0.6s_ease-out_0.15s_both] border-y border-[rgba(var(--tarjama-color-primary-rgb),0.08)]">
        {STATS.map(([num, label], i) => (
          <div key={label} className={`text-center relative ${i < 3 ? "max-sm:after:hidden after:content-[''] after:absolute after:right-0 after:top-[20%] after:bottom-[20%] after:w-px after:bg-[rgba(var(--tarjama-color-primary-rgb),0.1)]" : ''}`}>
            <div className="text-[28px] font-display text-primary font-bold leading-none">{num}</div>
            <div className="text-[8px] text-[color:var(--tarjama-color-text-muted)] uppercase tracking-[2px] mt-1.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mb-10">
        <div className="text-[9px] text-[color:var(--tarjama-color-primary-dim)] uppercase tracking-[4px] mb-6 text-center">
          ✦ Fonctionnalités ✦
        </div>
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          {FEATURES.map((f, i) => (
            <div key={i}
              className="flex items-start gap-4 p-4 rounded-md bg-[rgba(var(--tarjama-color-primary-rgb),0.03)] border border-[rgba(var(--tarjama-color-primary-rgb),0.06)] transition-all duration-200 hover:bg-[rgba(var(--tarjama-color-primary-rgb),0.06)] hover:border-[rgba(var(--tarjama-color-primary-rgb),0.12)] animate-[fadeInUp_0.5s_ease-out_both]"
              style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
              <div className="w-[52px] h-[52px] rounded-lg shrink-0 bg-[rgba(var(--tarjama-color-primary-rgb),0.08)] border border-[rgba(var(--tarjama-color-primary-rgb),0.12)] flex items-center justify-center font-arabic text-[22px] text-primary transition-all duration-300 group-hover:shadow-gold">
                {f.icon}
              </div>
              <div>
                <div className="text-[15px] text-[color:var(--tarjama-color-text)] font-semibold mb-1 font-display tracking-wide">{f.title}</div>
                <div className="text-[13px] text-[color:var(--tarjama-color-text-secondary)] leading-relaxed font-display">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verset */}
      <div className="text-center py-10 px-8 max-sm:px-4 max-sm:py-8 relative mb-10 -mx-6 max-sm:-mx-4 bg-[rgba(var(--tarjama-color-primary-rgb),0.03)] border-y border-[rgba(var(--tarjama-color-primary-rgb),0.08)] animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
        <div className="text-[clamp(24px,6vw,32px)] font-arabic text-primary-light leading-[2.2] mb-4 relative" dir="rtl">
          إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ
        </div>
        <div className="text-sm text-[color:var(--tarjama-color-text-secondary)] font-display italic leading-relaxed max-w-[400px] mx-auto">
          « Nous l'avons fait descendre, un Coran en arabe, afin que vous raisonniez. »
        </div>
        <div className="text-[10px] text-[color:var(--tarjama-color-text-muted)] mt-2 uppercase tracking-[2px]">
          Sourate Yusuf · verset 2
        </div>
      </div>

      {/* Install */}
      <div className="p-6 mb-8 rounded-xl bg-[rgba(var(--tarjama-color-info-rgb,30,58,95),0.04)] border border-[rgba(var(--tarjama-color-info-rgb,30,58,95),0.1)] relative overflow-hidden animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
        <div className="text-sm font-bold text-[color:var(--tarjama-color-text)] mb-4 text-center font-display tracking-wide">
          Installe Tarjama sur ton téléphone
        </div>
        <div className="flex flex-col gap-3 mb-4">
          {[
            [1, <>Appuie sur <strong>Partager</strong> (Safari) ou <strong>⋮</strong> (Chrome)</>],
            [2, <>Choisis <strong>« Sur l'écran d'accueil »</strong></>],
            [3, <>Appuie <strong>Ajouter</strong> — c'est prêt !</>],
          ].map(([n, text]) => (
            <div key={n} className="flex items-center gap-4 text-[13px] text-[color:var(--tarjama-color-text-secondary)] leading-relaxed font-display">
              <span className="w-7 h-7 rounded-full bg-[rgba(var(--tarjama-color-info-rgb,30,58,95),0.12)] text-info flex items-center justify-center text-xs font-bold shrink-0 font-display">
                {n}
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-[color:var(--tarjama-color-text-muted)] text-center italic font-display">
          Fonctionne hors-ligne, comme une vraie app
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 pb-10 border-t border-[rgba(var(--tarjama-color-primary-rgb),0.04)]">
        <div className="text-[11px] text-[color:var(--tarjama-color-text-muted)] mb-2 font-display tracking-[2px]">
          Tarjama
        </div>
        <Link href="/mentions-legales" className="text-[10px] text-[color:var(--tarjama-color-text-muted)] no-underline border-b border-[rgba(var(--tarjama-color-primary-rgb),0.15)] pb-px hover:text-primary transition-colors">
          Mentions légales & Confidentialité
        </Link>
      </div>
    </div>
  )
}
