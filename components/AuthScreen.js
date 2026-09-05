import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AVATAR_COLORS } from '../lib/theme'

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [regColor, setRegColor] = useState('#C9A84C')
  const [resetSent, setResetSent] = useState(false)

  /**
   * Connexion Google. Supabase redirige vers Google puis revient sur l'origine :
   * on ne remet donc PAS authLoading à false en cas de succès, la page est en
   * train d'être quittée.
   *
   * Le profil (username, couleur) n'existe pas encore pour un compte Google —
   * il est créé au retour, dans _app.js. Sans ça l'utilisateur serait connecté
   * mais bloqué sur la landing page, que index.js affiche tant que le profil
   * est absent.
   */
  const doGoogle = async () => {
    setAuthError('')
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setAuthError('Connexion Google indisponible pour le moment.')
      console.error('[auth] Google OAuth:', error.message)
      setAuthLoading(false)
    }
  }

  const doReset = async (e) => {
    e.preventDefault()
    setAuthError('')
    const email = e.target.email.value.trim()
    if (!email || !email.includes('@')) return setAuthError('Entre ton adresse email')
    setAuthLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) setAuthError(error.message)
    else setResetSent(true)
    setAuthLoading(false)
  }

  const doLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    const input = e.target.email.value.trim()
    const password = e.target.password.value
    if (!input || !password) return setAuthError('Remplis tous les champs')
    const email = input.includes('@') ? input : `${input.toLowerCase().replace(/\s+/g, '_')}@tarjama.app`
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError('Identifiants incorrects.')
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

  /* Shared input classes */
  const inputCls = 'w-full bg-surface border border-[rgba(var(--tarjama-color-primary-rgb),0.12)] text-[color:var(--tarjama-color-text)] px-3.5 py-3 rounded-md font-body text-[15px] transition-all duration-200 placeholder:text-[color:var(--tarjama-color-text-muted)] placeholder:text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(var(--tarjama-color-primary-rgb),0.15)] max-sm:py-3.5 max-sm:text-base'

  /* Shared label classes */
  const labelCls = 'block text-xs font-semibold text-[color:var(--tarjama-color-text-secondary)] mb-1.5'

  return (
    <div>
      <div className="w-full max-w-[420px] mx-auto">

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="flex border-b-2 border-[rgba(var(--tarjama-color-primary-rgb),0.08)] mb-6">
          {['login', 'register'].map(mode => (
            <button
              key={mode}
              className={`flex-1 py-3 font-display text-[13px] tracking-[1.5px] text-center cursor-pointer transition-all duration-200 border-b-2 -mb-[2px] ${
                authMode === mode
                  ? 'text-primary border-primary'
                  : 'text-[color:var(--tarjama-color-text-muted)] border-transparent hover:text-[color:var(--tarjama-color-text-secondary)]'
              }`}
              onClick={() => { setAuthMode(mode); setAuthError('') }}
            >
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* ── Google ───────────────────────────────────────── */}
        {authMode !== 'reset' && (
          <>
            <button
              type="button"
              onClick={doGoogle}
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-md bg-surface border border-[rgba(var(--tarjama-color-primary-rgb),0.15)] text-[color:var(--tarjama-color-text)] text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:enabled:border-[rgba(var(--tarjama-color-primary-rgb),0.35)] hover:enabled:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed max-sm:py-3.5"
            >
              {/* Logo Google officiel — SVG, jamais un emoji */}
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"/>
                <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"/>
              </svg>
              {authMode === 'login' ? 'Se connecter avec Google' : "S'inscrire avec Google"}
            </button>

            {/* Séparateur */}
            <div className="flex items-center gap-3 my-5" aria-hidden="true">
              <span className="flex-1 h-px bg-[rgba(var(--tarjama-color-primary-rgb),0.12)]" />
              <span className="text-[11px] uppercase tracking-[2px] text-[color:var(--tarjama-color-text-secondary)]">ou</span>
              <span className="flex-1 h-px bg-[rgba(var(--tarjama-color-primary-rgb),0.12)]" />
            </div>
          </>
        )}

        {/* ── Form ─────────────────────────────────────────── */}
        <form key={authMode} onSubmit={authMode === 'login' ? doLogin : authMode === 'register' ? doRegister : doReset}>

          {/* Inscription : prénom */}
          {authMode === 'register' && (
            <div className="mb-4">
              <label className={labelCls} htmlFor="auth-username">Prénom</label>
              <input id="auth-username" name="username" type="text" placeholder="Ex: Ahmed, Fatima..." required autoComplete="given-name" className={inputCls} />
            </div>
          )}

          {/* Email / Username */}
          <div className="mb-4">
            <label className={labelCls} htmlFor="auth-email">
              {authMode === 'login' ? "Email ou nom d'utilisateur" : authMode === 'reset' ? 'Ton adresse email' : 'Adresse email'}
            </label>
            <input
              id="auth-email"
              name="email"
              type={authMode === 'login' ? 'text' : 'email'}
              placeholder={authMode === 'login' ? 'Email ou pseudo' : 'ton.email@gmail.com'}
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>

          {/* Mot de passe (pas en mode reset) */}
          {authMode !== 'reset' && (
            <div className="mb-4">
              <label className={labelCls} htmlFor="auth-password">
                Mot de passe{authMode === 'register' ? ' (min 6 car.)' : ''}
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                className={inputCls}
              />
            </div>
          )}

          {/* Couleur (inscription) */}
          {authMode === 'register' && (
            <div className="mb-4">
              <label className={labelCls}>Couleur de profil</label>
              <div className="flex gap-2.5" role="radiogroup" aria-label="Couleur de profil">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={regColor === c}
                    aria-label={`Couleur ${c}`}
                    className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all duration-150 hover:scale-[1.15] p-0 ${
                      regColor === c
                        ? 'border-[color:var(--tarjama-color-text)] shadow-[0_0_0_3px_rgba(var(--tarjama-color-primary-rgb),0.15)] scale-[1.15]'
                        : 'border-transparent'
                    }`}
                    style={{ background: c }}
                    onClick={() => setRegColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3.5 rounded-md border-none cursor-pointer bg-gradient-to-br from-[color:var(--tarjama-color-primary-dim)] to-[color:var(--tarjama-color-primary)] text-[color:var(--tarjama-color-background)] text-[15px] font-bold tracking-[1px] mt-2 transition-all duration-200 shadow-gold hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_6px_24px_rgba(var(--tarjama-color-primary-rgb),0.25)] active:enabled:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed max-sm:py-4 max-sm:text-base"
          >
            {authLoading
              ? (authMode === 'login' ? 'Connexion...' : authMode === 'register' ? 'Création...' : 'Envoi...')
              : (authMode === 'login' ? 'Se connecter' : authMode === 'register' ? 'Créer mon compte' : 'Envoyer le lien')
            }
          </button>
        </form>

        {/* Error */}
        {authError && (
          <div className="text-error text-[13px] text-center mt-4 p-2.5 bg-[rgba(var(--tarjama-color-error-rgb,220,38,38),0.12)] rounded-sm animate-[fadeInUp_0.2s_ease]" role="alert">
            {authError}
          </div>
        )}

        {/* Success */}
        {resetSent && (
          <div className="text-success text-[13px] text-center mt-4 p-2.5 bg-[rgba(var(--tarjama-color-success-rgb,45,122,79),0.12)] rounded-sm animate-[fadeInUp_0.2s_ease]" role="status">
            Un email de réinitialisation a été envoyé. Vérifie ta boîte mail (et tes spams).
          </div>
        )}

        {/* Switch links */}
        <div className="text-center mt-6 text-[13px] text-[color:var(--tarjama-color-text-secondary)]">
          {authMode === 'login' && (
            <>
              <button
                className="text-primary bg-transparent border-none cursor-pointer text-[13px] font-semibold underline p-0"
                onClick={() => { setAuthMode('reset'); setAuthError(''); setResetSent(false) }}
              >
                Mot de passe oublié ?
              </button>
              <br /><br />
              <span>Pas encore de compte ?{' '}
                <button
                  className="text-primary bg-transparent border-none cursor-pointer text-[13px] font-semibold underline p-0"
                  onClick={() => { setAuthMode('register'); setAuthError('') }}
                >
                  Inscris-toi
                </button>
              </span>
            </>
          )}
          {authMode === 'register' && (
            <span>Déjà un compte ?{' '}
              <button
                className="text-primary bg-transparent border-none cursor-pointer text-[13px] font-semibold underline p-0"
                onClick={() => { setAuthMode('login'); setAuthError('') }}
              >
                Connecte-toi
              </button>
            </span>
          )}
          {authMode === 'reset' && (
            <span>Retour à la{' '}
              <button
                className="text-primary bg-transparent border-none cursor-pointer text-[13px] font-semibold underline p-0"
                onClick={() => { setAuthMode('login'); setAuthError(''); setResetSent(false) }}
              >
                connexion
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
