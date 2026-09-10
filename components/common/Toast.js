import { useState, useEffect, useRef } from 'react'
import styles from './Toast.module.css'

const ICONS = {
  success: '✓',
  error: '✗',
  warning: '!',
  info: '·',
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [exiting, setExiting] = useState(false)

  // Reset exiting state when a new message arrives
  useEffect(() => {
    if (message) setExiting(false)
  }, [message])

  /*
   * `onClose` ne fait plus partie des dependances du minuteur.
   *
   * La page d'accueil le passe sous forme de fonction flechee, donc une
   * NOUVELLE fonction a chaque rendu — et elle se re-rend a chaque frappe dans
   * le champ de traduction. Chaque frappe relancait le minuteur de zero : tant
   * que l'utilisateur tapait, le message ne disparaissait jamais. On lit
   * desormais la derniere version de onClose au moment de fermer.
   */
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!message) return
    let fermeture
    const timer = setTimeout(() => {
      setExiting(true)
      fermeture = setTimeout(() => onCloseRef.current?.(), 250)
    }, duration)
    return () => { clearTimeout(timer); clearTimeout(fermeture) }
  }, [message, duration])

  /*
   * Le conteneur reste monte meme sans message, et c'est deliberé.
   *
   * Un lecteur d'ecran n'annonce une zone aria-live que si elle etait DEJA
   * presente dans le document au moment ou son contenu change. En rendant
   * null puis en montant le toast d'un coup, l'ancienne version creait la
   * zone ET son contenu simultanement : rien n'etait annonce. Un utilisateur
   * aveugle ne savait donc pas que sa traduction avait echoue a
   * s'enregistrer.
   *
   * Le conteneur est en position fixed avec pointer-events:none : le laisser
   * en place ne coute ni espace ni interception de clic.
   */
  return (
    <div
      className={styles.container}
      // Une erreur interrompt la lecture en cours, le reste attend une pause
      // naturelle : on ne coupe la parole que quand l'information l'exige.
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      // Fait relire le message entier plutot que la seule partie modifiee.
      aria-atomic="true"
    >
      {message && (
        <div className={`${styles.toast} ${styles[type] || ''} ${exiting ? styles.exit : ''}`}>
          {/* Decoratif : le message porte deja l'information, et « ✓ » se
              prononcerait « coche » au milieu de la phrase. */}
          <span className={styles.icon} aria-hidden="true">{ICONS[type] || ICONS.info}</span>
          <span className={styles.message}>{message}</span>
          <div
            className={styles.progress}
            style={{ animationDuration: `${duration}ms` }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
