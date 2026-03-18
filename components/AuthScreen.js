import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AVATAR_COLORS } from '../lib/theme'
import Button from './common/Button'
import styles from './AuthScreen.module.css'

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [regColor, setRegColor] = useState('#C9A84C')

  const doLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    const username = e.target.username.value.trim()
    const password = e.target.password.value
    const email = `${username.toLowerCase().replace(/\s+/g, '_')}@tarjama.app`
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError('Identifiants incorrects.')
    setAuthLoading(false)
  }

  const doRegister = async (e) => {
    e.preventDefault()
    setAuthError('')
    const username = e.target.username.value.trim()
    const password = e.target.password.value
    if (username.length < 2) return setAuthError('Nom trop court (min 2 caractères)')
    if (password.length < 6) return setAuthError('Mot de passe trop court (min 6 caractères)')
    setAuthLoading(true)
    const email = `${username.toLowerCase().replace(/\s+/g, '_')}@tarjama.app`
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setAuthError(error.message); setAuthLoading(false); return }
    await supabase.from('profiles').insert({ id: data.user.id, username, color: regColor })
    setAuthLoading(false)
  }

  const FIELDS = {
    login: [
      ['username', "Nom d'utilisateur", 'Votre prénom ou pseudo', 'text'],
      ['password', 'Mot de passe', '••••••••', 'password'],
    ],
    register: [
      ['username', 'Prénom / Pseudo', 'Ex: Ahmed, Fatima...', 'text'],
      ['password', 'Mot de passe (min 6 car.)', 'Choisir un mot de passe', 'password'],
    ],
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.headerIcon}>ب</div>
        <div className={styles.headerTitle}>TARJAMA</div>
        <div className={styles.headerSub}>ترجمة — Traduction coranique</div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              className={`${styles.tab} ${authMode === m ? styles.tabActive : ''}`}
              onClick={() => { setAuthMode(m); setAuthError('') }}
            >
              {m === 'login' ? 'Se connecter' : 'Créer un compte'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={authMode === 'login' ? doLogin : doRegister}>
          {FIELDS[authMode].map(([name, label, ph, type]) => (
            <div key={name} className={styles.field}>
              <label className={styles.label}>{label}</label>
              <input
                name={name}
                type={type}
                placeholder={ph}
                required
                autoComplete={name}
                className={styles.input}
              />
            </div>
          ))}

          {/* Color picker (register only) */}
          {authMode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Couleur de profil</label>
              <div className={styles.colorPicker}>
                {AVATAR_COLORS.map(c => (
                  <div
                    key={c}
                    className={`${styles.colorDot} ${regColor === c ? styles.colorDotActive : ''}`}
                    style={{ background: c }}
                    onClick={() => setRegColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            full
            disabled={authLoading}
          >
            {authLoading
              ? (authMode === 'login' ? 'Connexion...' : 'Création...')
              : (authMode === 'login' ? 'Se connecter →' : 'Créer mon compte →')
            }
          </Button>
        </form>

        {authError && <div className={styles.error}>{authError}</div>}
      </div>
    </div>
  )
}
