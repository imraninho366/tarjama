import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { isAdmin, grantPremium, revokePremium } from '../lib/freemium'
import Button from '../components/common/Button'

export default function AdminPage({ user, authReady }) {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [premiumUsers, setPremiumUsers] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // authReady : la session est lue de facon asynchrone, donc au premier
    // rendu `user` vaut null par ignorance et non par absence. Sans cette
    // attente, rafraichir la page en etant connecte renvoyait a l'accueil.
    if (!authReady) return
    if (!user || !isAdmin(user.id)) { router.push('/'); return }
    loadData()
  }, [authReady, user])

  const loadData = async () => {
    const [profilesRes, premiumRes, suggestionsRes] = await Promise.all([
      supabase.from('profiles').select('id, username, color'),
      supabase.from('premium_users').select('id, created_at'),
      supabase.from('suggestions')
        .select('id, user_id, message, created_at, handled')
        .order('created_at', { ascending: false })
    ])
    setUsers(profilesRes.data || [])
    setPremiumUsers(premiumRes.data || [])
    // Une erreur ici ne doit pas afficher une liste vide sans explication.
    if (suggestionsRes.error) {
      console.error('[admin] suggestions:', suggestionsRes.error.message)
      setMessage("Les suggestions n'ont pas pu être chargées.")
    } else {
      setSuggestions(suggestionsRes.data || [])
    }
    setLoading(false)
  }

  const handleToggleHandled = async (id, handled) => {
    const { error } = await supabase.from('suggestions').update({ handled: !handled }).eq('id', id)
    if (error) { setMessage('Erreur : ' + error.message); return }
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, handled: !handled } : s))
  }

  const handleDeleteSuggestion = async (id) => {
    if (!confirm('Supprimer cette suggestion ? Cette action est irréversible.')) return
    const { error } = await supabase.from('suggestions').delete().eq('id', id)
    if (error) { setMessage('Erreur : ' + error.message); return }
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }

  if (!user || !isAdmin(user.id)) return null

  const premiumIds = premiumUsers.map(p => p.id)

  const filtered = search.trim()
    ? users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()))
    : users

  const handleGrant = async (userId, username) => {
    const { error } = await grantPremium(userId, user.id)
    if (error) { setMessage('Erreur : ' + error); return }
    setMessage(`${username} est maintenant Premium`)
    loadData()
  }

  const handleRevoke = async (userId, username) => {
    if (userId === user.id) { setMessage('Tu ne peux pas te retirer le premium'); return }
    const { error } = await revokePremium(userId, user.id)
    if (error) { setMessage('Erreur : ' + error); return }
    setMessage(`Premium retiré pour ${username}`)
    loadData()
  }

  const handleDelete = async (userId, username) => {
    if (userId === user.id) { setMessage('Tu ne peux pas te supprimer toi-même'); return }
    if (!confirm(`Supprimer le compte de ${username} ? Cette action est irréversible.`)) return
    try {
      await supabase.from('premium_users').delete().eq('id', userId)
      await supabase.from('progress').delete().eq('user_id', userId)
      await supabase.from('duels').delete().eq('player1_id', userId)
      await supabase.from('duels').delete().eq('player2_id', userId)
      const { error } = await supabase.from('profiles').delete().eq('id', userId)
      if (error) throw error
      setUsers(prev => prev.filter(u => u.id !== userId))
      setPremiumUsers(prev => prev.filter(p => p.id !== userId))
      setMessage(`${username} supprimé`)
    } catch (err) {
      setMessage(`Erreur suppression : ${err.message || 'Réessaie'}`)
    }
  }

  return (
    <>
      <Head><title>Admin — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <h1 style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--gold)', letterSpacing: 3, margin: 0, fontWeight: 400 }}>ADMIN</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {users.length} utilisateurs · {premiumIds.length} premium · {suggestions.length} idées
          </div>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(var(--tarjama-color-success-rgb, 45, 122, 79),.08)', border: '1px solid rgba(var(--tarjama-color-success-rgb, 45, 122, 79),.2)', fontSize: 13, color: 'var(--green)', textAlign: 'center', marginBottom: 12 }}>
            {message}
          </div>
        )}

        <input type="search" autoComplete="off" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Chercher un utilisateur..."
          style={{ width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, background: 'var(--bg-elevated)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.15)', color: 'var(--text)', marginBottom: 16 }}
        />

        {loading && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Chargement...</div>}

        {filtered.map(u => {
          const isPrem = premiumIds.includes(u.id)
          const isMe = u.id === user.id
          return (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0',
              borderBottom: '1px solid rgba(var(--tarjama-color-primary-rgb),.06)'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: u.color || 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#fff', fontWeight: 700, flexShrink: 0
              }}>{u.username?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: isMe ? 700 : 400 }}>
                  {u.username}{isMe ? ' (toi)' : ''}
                </div>
                {isPrem && <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 2 }}>Premium</div>}
              </div>
              {!isPrem && !isMe && (
                <Button variant="secondary" onClick={() => handleGrant(u.id, u.username)} style={{ fontSize: 11, padding: '6px 12px' }}>
                  Donner Premium
                </Button>
              )}
              {isPrem && !isMe && (
                <Button variant="ghost" onClick={() => handleRevoke(u.id, u.username)} style={{ fontSize: 11, padding: '6px 12px', color: 'var(--red)' }}>
                  Retirer
                </Button>
              )}
              {!isMe && (
                <Button variant="ghost" onClick={() => handleDelete(u.id, u.username)} style={{ fontSize: 11, padding: '6px 10px', color: 'var(--red)' }}>
                  ✕
                </Button>
              )}
              {isMe && <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>ADMIN</span>}
            </div>
          )
        })}

        {/* ── Boîte à idées ─────────────────────────────────── */}
        {suggestions.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{
              fontSize: 11, color: 'var(--gold)', letterSpacing: 3,
              textTransform: 'uppercase', textAlign: 'center', marginBottom: 16, fontWeight: 700
            }}>
              Idées des utilisateurs
            </div>

            {suggestions.map(s => {
              const author = users.find(u => u.id === s.user_id)
              return (
                <div key={s.id} style={{
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(var(--tarjama-color-primary-rgb),.06)',
                  opacity: s.handled ? 0.5 : 1
                }}>
                  <div style={{
                    fontSize: 14, color: 'var(--text)', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', marginBottom: 6
                  }}>
                    {s.message}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {author?.username || 'Utilisateur supprimé'} ·{' '}
                      {new Date(s.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <div style={{ flex: 1 }} />
                    <Button
                      variant="ghost"
                      onClick={() => handleToggleHandled(s.id, s.handled)}
                      style={{ fontSize: 11, padding: '4px 10px', color: s.handled ? 'var(--text-muted)' : 'var(--green)' }}
                    >
                      {s.handled ? 'Rouvrir' : 'Marquer traitée'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteSuggestion(s.id)}
                      style={{ fontSize: 11, padding: '4px 8px', color: 'var(--red)' }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
