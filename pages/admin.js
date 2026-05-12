import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { isAdmin, grantPremium, revokePremium } from '../lib/freemium'
import Button from '../components/common/Button'

export default function AdminPage({ user }) {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [premiumUsers, setPremiumUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user || !isAdmin(user.id)) { router.push('/'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    const [profilesRes, premiumRes] = await Promise.all([
      supabase.from('profiles').select('id, username, color'),
      supabase.from('premium_users').select('id, created_at')
    ])
    setUsers(profilesRes.data || [])
    setPremiumUsers(premiumRes.data || [])
    setLoading(false)
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

  return (
    <>
      <Head><title>Admin — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--gold)', letterSpacing: 3 }}>ADMIN</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {users.length} utilisateurs · {premiumIds.length} premium
          </div>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(76,175,125,.08)', border: '1px solid rgba(76,175,125,.2)', fontSize: 13, color: 'var(--green)', textAlign: 'center', marginBottom: 12 }}>
            {message}
          </div>
        )}

        <input type="search" autoComplete="off" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Chercher un utilisateur..."
          style={{ width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, background: 'var(--bg-elevated)', border: '1px solid rgba(201,168,76,.15)', color: 'var(--text)', marginBottom: 16 }}
        />

        {loading && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Chargement...</div>}

        {filtered.map(u => {
          const isPrem = premiumIds.includes(u.id)
          const isMe = u.id === user.id
          return (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0',
              borderBottom: '1px solid rgba(201,168,76,.06)'
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
              {isMe && <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>ADMIN</span>}
            </div>
          )
        })}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
