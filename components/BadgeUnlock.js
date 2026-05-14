import { useEffect, useState } from 'react'

export default function BadgeUnlock({ badge, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 400) }, 4000)
    return () => clearTimeout(t)
  }, [])

  if (!badge) return null

  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : -80}px)`,
      zIndex: 200, opacity: visible ? 1 : 0, transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      pointerEvents: 'none'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px', borderRadius: 16,
        background: 'var(--bg-card)', border: '2px solid var(--gold)',
        boxShadow: '0 8px 32px rgba(var(--tarjama-color-primary-rgb),.3)',
        minWidth: 260
      }}>
        <span style={{ fontSize: 36 }}>{badge.icon}</span>
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
    </div>
  )
}
