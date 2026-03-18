const SPINNER_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: '40px 20px',
}

const LETTER_STYLE = {
  fontFamily: "'Amiri', serif",
  fontSize: 36,
  color: '#C9A84C',
  animation: 'spin 2s linear infinite',
  display: 'inline-block',
  textShadow: '0 0 20px rgba(201, 168, 76, 0.2)',
}

const LABEL_STYLE = {
  fontFamily: "'Cinzel', serif",
  fontSize: 11,
  letterSpacing: 3,
  color: '#5A5448',
  textTransform: 'uppercase',
}

export default function LoadingSpinner({ label = 'Chargement...' }) {
  return (
    <div style={SPINNER_STYLE}>
      <span style={LETTER_STYLE}>ب</span>
      <span style={LABEL_STYLE}>{label}</span>
    </div>
  )
}
