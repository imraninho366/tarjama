import { useEffect, useState } from 'react'

export default function Confetti({ active }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!active) return
    const colors = ['#C9A84C', '#4CAF7D', '#5B9BD5', '#9B7FD4', '#E8C97A', '#F5DFA0']
    const p = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: Math.random() * 6 + 4,
      duration: Math.random() * 1.5 + 1.5,
    }))
    setParticles(p)
    const t = setTimeout(() => setParticles([]), 3000)
    return () => clearTimeout(t)
  }, [active])

  if (particles.length === 0) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 150, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: -10, left: `${p.x}%`,
          width: p.size, height: p.size, borderRadius: p.size > 7 ? '50%' : '1px',
          background: p.color,
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
    </div>
  )
}
