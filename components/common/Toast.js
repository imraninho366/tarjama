import { useState, useEffect } from 'react'
import styles from './Toast.module.css'

const ICONS = {
  success: '✓',
  error: '✗',
  warning: '!',
  info: '·',
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onClose?.(), 250)
    }, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className={styles.container}>
      <div className={`${styles.toast} ${styles[type] || ''} ${exiting ? styles.exit : ''}`}>
        <span className={styles.icon}>{ICONS[type] || ICONS.info}</span>
        <span className={styles.message}>{message}</span>
        <div
          className={styles.progress}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  )
}
