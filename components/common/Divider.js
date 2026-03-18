const DIVIDER_STYLE = {
  width: '100%',
  height: 1,
  background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.2) 30%, rgba(201,168,76,0.25) 50%, rgba(201,168,76,0.2) 70%, transparent 100%)',
  border: 'none',
  margin: '24px 0',
}

const ORNAMENT_WRAPPER = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  margin: '24px 0',
}

const LINE = {
  flex: 1,
  height: 1,
  background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2))',
}

const LINE_RIGHT = {
  flex: 1,
  height: 1,
  background: 'linear-gradient(90deg, rgba(201,168,76,0.2), transparent)',
}

const DIAMOND = {
  width: 6,
  height: 6,
  background: 'rgba(201,168,76,0.3)',
  transform: 'rotate(45deg)',
  flexShrink: 0,
}

export default function Divider({ ornament = false, style }) {
  if (ornament) {
    return (
      <div style={{ ...ORNAMENT_WRAPPER, ...style }}>
        <div style={LINE} />
        <div style={DIAMOND} />
        <div style={LINE_RIGHT} />
      </div>
    )
  }
  return <hr style={{ ...DIVIDER_STYLE, ...style }} />
}
