import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AVATAR_COLORS } from '../lib/theme'
import styles from './AuthScreen.module.css'

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [regColor, setRegColor] = useState('#C9A84C')

  const doLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    const email = e.target.email.value.trim()
    const password = e.target.password.value
    if (!email || !password) return setAuthError('Remplis tous les champs')
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError('Email ou mot de passe incorrect.')
    setAuthLoading(false)
  }

  const doRegister = async (e) => {
    e.preventDefault()
    setAuthError('')
    const username = e.target.username.value.trim()
    const email = e.target.email.value.trim()
    const password = e.target.password.value
    if (username.length < 2) return setAuthError('Prénom trop court (min 2)')
    if (!email.includes('@')) return setAuthError('Email invalide')
    if (password.length < 6) return setAuthError('Mot de passe trop court (min 6)')
    setAuthLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, color: regColor } }
      })
      if (error) {
        if (error.message.includes('already registered')) setAuthError('Cet email est déjà utilisé. Connecte-toi.')
        else setAuthError(error.message)
        setAuthLoading(false)
        return
      }

      let userId = data.session?.user?.id || data.user?.id

      if (!data.session) {
        const { data: signInData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
        if (loginErr) { setAuthError('Compte créé mais connexion échouée. Essaie de te connecter.'); setAuthLoading(false); return }
        if (signInData?.user?.id) userId = signInData.user.id
      }

      if (userId) {
        const { error: profileErr } = await supabase.from('profiles').upsert(
          { id: userId, username, color: regColor },
          { onConflict: 'id' }
        )
        if (profileErr) { setAuthError(profileErr.message || 'Erreur création profil'); setAuthLoading(false); return }
      }
    } catch (err) {
      setAuthError(err.message === 'Failed to fetch' ? 'Connexion impossible. Vérifie ton internet.' : (err.message || 'Erreur'))
    }
    setAuthLoading(false)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${authMode === 'login' ? styles.tabActive : ''}`}
            onClick={() => { setAuthMode('login'); setAuthError('') }}
          >
            Connexion
          </button>
          <button
            className={`${styles.tab} ${authMode === 'register' ? styles.tabActive : ''}`}
            onClick={() => { setAuthMode('register'); setAuthError('') }}
          >
            Inscription
          </button>
        </div>

        <form key={authMode} onSubmit={authMode === 'login' ? doLogin : doRegister}>

          {/* Inscription : prénom */}
          {authMode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Prénom</label>
              <input name="username" type="text" placeholder="Ex: Ahmed, Fatima..." required autoComplete="given-name" className={styles.input} />
            </div>
          )}

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label}>Adresse email</label>
            <input name="email" type="email" placeholder="ton.email@gmail.com" required autoComplete="email" className={styles.input} />
          </div>

          {/* Mot de passe */}
          <div className={styles.field}>
            <label className={styles.label}>Mot de passe{authMode === 'register' ? ' (min 6 car.)' : ''}</label>
            <input name="password" type="password" placeholder="••••••••" required autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} className={styles.input} />
          </div>

          {/* Couleur (inscription) */}
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

          <button type="submit" disabled={authLoading} className={styles.submitBtn}>
            {authLoading
              ? (authMode === 'login' ? 'Connexion...' : 'Création...')
              : (authMode === 'login' ? 'Se connecter' : 'Créer mon compte')
            }
          </button>
        </form>

        {authError && <div className={styles.error}>{authError}</div>}

        <div className={styles.switchText}>
          {authMode === 'login' ? (
            <span>Pas encore de compte ? <button className={styles.switchLink} onClick={() => { setAuthMode('register'); setAuthError('') }}>Inscris-toi</button></span>
          ) : (
            <span>Déjà un compte ? <button className={styles.switchLink} onClick={() => { setAuthMode('login'); setAuthError('') }}>Connecte-toi</button></span>
          )}
        </div>
      </div>
    </div>
  )
}
