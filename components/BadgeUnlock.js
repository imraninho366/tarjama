import { useEffect, useState } from 'react'

export default function BadgeUnlock({ badge, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Depend de `badge` et non de rien : le composant reste monte en
    // permanence (voir plus bas), donc un effet a dependances vides aurait
    // lance son minuteur au chargement de la page, badge ou pas.
    if (!badge) { setVisible(false); return }
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 400) }, 4000)
    return () => clearTimeout(t)
  }, [badge, onClose])

  /*
   * Zone d'annonce montee en permanence, meme sans badge.
   *
   * Un lecteur d'ecran n'annonce une zone aria-live que si elle existait DEJA
   * quand son contenu change. Monte a la demande, ce composant creait la zone
   * et le texte du badge au meme instant : la recompense n'etait jamais
   * annoncee, et un utilisateur aveugle progressait sans jamais savoir qu'il
   * debloquait quoi que ce soit.
   *
   * pointerEvents:none et position fixed rendent la zone vide inoffensive.
   */
  return (
    <div
      style={{
        position: 'fixed', top: 20, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : -80}px)`,
        zIndex: 200, opacity: visible ? 1 : 0, transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: 'none'
      }}
      // « polite » : debloquer un badge est une bonne nouvelle, pas une
      // urgence — on attend que le lecteur ait fini sa phrase.
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {badge && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px', borderRadius: 16,
        background: 'var(--bg-card)', border: '2px solid var(--gold)',
        boxShadow: '0 8px 32px rgba(var(--tarjama-color-primary-rgb),.3)',
        minWidth: 260
      }}>
        <span style={{ fontSize: 36 }} aria-hidden="true">{badge.icon}</span>
        <div>
          <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
            Badge débloqué !
          </div>
          <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, marginTop: 2 }}>
            {badge.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {badge.desc}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
