import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #050508 0%, #0F0F18 50%, #1D1D2C 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 8, color: '#C9A84C' }}>ب</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#EDE8D8',
            letterSpacing: 8,
            marginBottom: 12,
          }}
        >
          TARJAMA
        </div>
        <div
          style={{
            fontSize: 20,
            color: '#C9A84C',
            letterSpacing: 4,
            marginBottom: 32,
          }}
        >
          ترجمة — TRADUCTION CORANIQUE
        </div>
        <div
          style={{
            display: 'flex',
            gap: 32,
            marginBottom: 40,
          }}
        >
          {[
            ['6 300+', 'Mots'],
            ['114', 'Sourates'],
            ['130+', 'Duas'],
          ].map(([num, label]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 28px',
                background: 'rgba(201,168,76,0.08)',
                borderRadius: 12,
                border: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: '#C9A84C' }}>{num}</div>
              <div style={{ fontSize: 14, color: '#9A9280', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 16, color: '#5A5448' }}>
          Apprends le Coran en traduisant verset par verset
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
