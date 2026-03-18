import styles from './GlassCard.module.css'

export default function GlassCard({
  children,
  interactive = false,
  glow = false,
  active = false,
  compact = false,
  flush = false,
  onClick,
  className = '',
  style,
  ...props
}) {
  const classes = [
    styles.card,
    interactive && styles.interactive,
    glow && styles.glow,
    active && styles.active,
    compact && styles.compact,
    flush && styles.flush,
    className,
  ].filter(Boolean).join(' ')

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      className={classes}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </Tag>
  )
}
