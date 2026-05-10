import { useState } from 'react'
import Link from 'next/link'
import AuthScreen from './AuthScreen'

const FEATURES = [
  { icon: 'ت', title: 'Traduction verset par verset', desc: 'Traduis le Coran avec correction IA instantanée' },
  { icon: 'ق', title: 'Quiz vocabulaire', desc: '6 300+ mots coraniques avec racines et fréquences' },
  { icon: 'م', title: 'Dictionnaire complet', desc: 'Recherche instantanée en arabe, translittération ou français' },
  { icon: 'ح', title: 'Hadiths Bukhari & Muslim', desc: 'Collections complètes avec traductions françaises' },
  { icon: 'د', title: 'Invocations (Hisn al-Muslim)', desc: '130+ duas classées par occasion' },
  { icon: 'أ', title: 'Alphabet arabe interactif', desc: '28 lettres avec prononciation et formes' },
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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div style={{ fontSize: 40, fontFamily: 'var(--font-arabic)', color: 'var(--gold)', marginBottom: 8 }}>ب</div>
        <h1 style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontFamily: 'var(--font-display)', color: 'var(--text)', margin: '0 0 8px', fontWeight: 700, letterSpacing: 3 }}>
          TARJAMA
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gold-light)', letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 20px' }}>
          ترجمة — Traduction coranique
        </p>
        <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 28px' }}>
          Apprends le vocabulaire du Coran en traduisant verset par verset.
          Correction IA, quiz, dictionnaire et plus — tout en français.
        </p>
        <button
          onClick={() => setShowAuth(true)}
          style={{
            padding: '14px 36px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${'var(--gold-dark)'}, ${'var(--gold)'})`,
            color: 'var(--bg-abyss)', fontSize: 15, fontWeight: 700, letterSpacing: 1,
            boxShadow: '0 4px 20px rgba(201,168,76,.3)',
            transition: 'transform .2s'
          }}
        >
          Commencer gratuitement →
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
          Gratuit · Pas de carte bancaire · Créé en 30 secondes
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 32,
        padding: '16px 12px', background: 'rgba(201,168,76,.04)',
        borderRadius: 12, border: '1px solid rgba(201,168,76,.1)'
      }}>
        {STATS.map(([num, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--gold)', fontWeight: 700 }}>{num}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, textAlign: 'center' }}>
          Fonctionnalités
        </div>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0',
            borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(201,168,76,.06)' : 'none'
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-arabic)', fontSize: 18, color: 'var(--gold)'
            }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial / Trust */}
      <div style={{
        textAlign: 'center', padding: '20px 16px', marginBottom: 32,
        background: 'rgba(201,168,76,.04)', borderRadius: 12,
        border: '1px solid rgba(201,168,76,.08)'
      }}>
        <div style={{ fontSize: 20, fontFamily: 'var(--font-arabic)', color: 'var(--gold-light)', marginBottom: 8, direction: 'rtl' }}>
          إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          « Nous l'avons fait descendre, un Coran en arabe, afin que vous raisonniez. »
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Sourate Yusuf (12:2)</div>
      </div>

      {/* CTA final */}
      {!showAuth && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button
            onClick={() => setShowAuth(true)}
            style={{
              padding: '14px 36px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${'var(--gold-dark)'}, ${'var(--gold)'})`,
              color: 'var(--bg-abyss)', fontSize: 15, fontWeight: 700, letterSpacing: 1,
              boxShadow: '0 4px 20px rgba(201,168,76,.3)'
            }}
          >
            Créer mon compte gratuitement →
          </button>
        </div>
      )}

      {/* Auth form */}
      {showAuth && (
        <div style={{ marginBottom: 32 }}>
          <AuthScreen />
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '16px 0 32px', borderTop: '1px solid rgba(201,168,76,.06)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
          Tarjama — Apprendre le Coran en français
        </div>
        <Link href="/mentions-legales" style={{ fontSize: 10, color: 'var(--text-muted)', textDecoration: 'underline' }}>
          Mentions légales & Confidentialité
        </Link>
      </div>
    </div>
  )
}
