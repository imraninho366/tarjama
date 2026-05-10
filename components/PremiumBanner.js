import { G } from '../lib/theme'

export default function PremiumBanner({ action, limit, onClose }) {
  const messages = {
    quiz: `Tu as atteint ta limite de ${limit} questions gratuites aujourd'hui.`,
    verify: `Tu as atteint ta limite de ${limit} vérifications gratuites aujourd'hui.`,
    hint: `Tu as atteint ta limite de ${limit} indices gratuits aujourd'hui.`,
    tafsir: `Tu as atteint ta limite de ${limit} tafsirs gratuits aujourd'hui.`,
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5,5,8,.85)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      <div style={{
        maxWidth: 380, width: '100%', background: 'var(--bg-card)',
        border: '1px solid var(--glass-border)', borderRadius: 16,
        padding: '32px 24px', textAlign: 'center'
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
        <div style={{
          fontSize: 20, fontFamily: 'var(--font-display)',
          color: 'var(--gold)', fontWeight: 700, marginBottom: 8
        }}>
          Passe à Tarjama Premium
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 20 }}>
          {messages[action] || 'Limite gratuite atteinte.'}
          <br />Débloque un accès illimité à toutes les fonctionnalités.
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          fontSize: 12, color: 'var(--text-dim)', textAlign: 'left',
          padding: '12px 16px', background: 'rgba(201,168,76,.05)',
          borderRadius: 8, marginBottom: 20
        }}>
          {[
            'Quiz illimité',
            'Traductions illimitées',
            'Tafsir & indices sans limite',
            'Soutiens un projet éducatif islamique',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: G.gold }}>✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => window.open('https://buy.stripe.com/your-link', '_blank')}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 10,
            border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${'var(--gold-dark)'}, ${'var(--gold)'})`,
            color: 'var(--bg-abyss)', fontSize: 15, fontWeight: 700,
            marginBottom: 10
          }}
        >
          Devenir Premium — 4,99€/mois
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 12, cursor: 'pointer', padding: 8
          }}
        >
          Continuer gratuitement demain
        </button>
      </div>
    </div>
  )
}
