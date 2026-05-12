import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { SOURATES_LIST } from '../lib/sourates'
import { BADGES, computeStats, getUnlockedBadges } from '../lib/badges'
import Button from '../components/common/Button'

const VERSE_COUNTS = {1:7,2:286,3:200,4:176,5:120,6:165,7:206,8:75,9:129,10:109,11:123,12:111,13:43,14:52,15:99,16:128,17:111,18:110,19:98,20:135,21:112,22:78,23:118,24:64,25:77,26:227,27:93,28:88,29:69,30:60,31:34,32:30,33:73,34:54,35:45,36:83,37:182,38:88,39:75,40:85,41:54,42:53,43:89,44:59,45:37,46:35,47:38,48:29,49:18,50:45,51:60,52:49,53:62,54:55,55:78,56:96,57:29,58:22,59:24,60:13,61:14,62:11,63:11,64:18,65:12,66:12,67:30,68:52,69:52,70:44,71:28,72:28,73:20,74:56,75:40,76:31,77:50,78:40,79:46,80:42,81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,90:20,91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,101:11,102:8,103:3,104:9,105:5,106:4,107:7,108:3,109:6,110:3,111:5,112:4,113:5,114:6}

function getDailyVerse() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const shortSourates = [1, 103, 108, 112, 113, 114, 97, 99, 100, 101, 102, 104, 105, 106, 107, 109, 110, 111, 93, 94, 95, 96]
  const sIdx = seed % shortSourates.length
  const sNum = shortSourates[sIdx]
  const vNum = (seed % (VERSE_COUNTS[sNum] || 1)) + 1
  const info = SOURATES_LIST.find(s => s.n === sNum)
  return { sNum, vNum, info }
}

export default function DefiPage({ user, profile }) {
  const router = useRouter()
  const [tab, setTab] = useState('defi')
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    loadData(user.id)
  }, [user])

  const loadData = async (userId) => {
    try {
      const { data } = await supabase.from('progress').select('sourate_num, verse_num, niveau').eq('user_id', userId)
      const map = {}
      data?.forEach(r => { map[`${r.sourate_num}:${r.verse_num}`] = { niveau: r.niveau } })
      setProgress(map)
    } catch {}
    setLoading(false)
  }

  if (!user || !profile) return null
  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 20, color: 'var(--gold)' }}>التحدي</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Chargement...</div>
    </div>
  )

  const daily = getDailyVerse() || { sNum: 1, vNum: 1, info: null }
  const dailyDone = !!progress[`${daily.sNum}:${daily.vNum}`]
  const stats = (() => { try { return computeStats(progress) } catch { return { total: 0, excellent: 0, souratesCompleted: 0, streak: 0, quizCorrect: 0, fatihaComplete: false, nightOwl: false, earlyBird: false } } })()
  const unlocked = (() => { try { return getUnlockedBadges(stats) } catch { return [] } })()
  const locked = BADGES.filter(b => !unlocked.find(u => u.id === b.id))

  const tabStyle = (t) => ({
    padding: '10px 16px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
    background: tab === t ? 'rgba(201,168,76,.12)' : 'transparent',
    color: tab === t ? 'var(--gold)' : 'var(--text-muted)',
    border: 'none', borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
    cursor: 'pointer', fontWeight: 600, flex: 1, textAlign: 'center'
  })

  return (
    <>
      <Head><title>Défi & Badges — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>التحدي</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Défis, badges et progression</div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,168,76,.1)', marginBottom: 16 }}>
          <button onClick={() => setTab('defi')} style={tabStyle('defi')}>Défi du jour</button>
          <button onClick={() => setTab('badges')} style={tabStyle('badges')}>Badges</button>
          <button onClick={() => setTab('carte')} style={tabStyle('carte')}>Carte</button>
        </div>

        {/* DÉFI QUOTIDIEN */}
        {tab === 'defi' && (
          <div>
            <div style={{
              textAlign: 'center', padding: '24px 16px', marginBottom: 16,
              background: dailyDone ? 'rgba(76,175,125,.06)' : 'rgba(201,168,76,.06)',
              border: `1px solid ${dailyDone ? 'rgba(76,175,125,.2)' : 'rgba(201,168,76,.15)'}`,
              borderRadius: 12
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                Verset du jour — {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold)', marginBottom: 4 }}>
                {daily.info?.ar} — {daily.info?.fr}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
                Sourate {daily.sNum}, Verset {daily.vNum}
              </div>
              {dailyDone ? (
                <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14 }}>
                  Défi complété !
                </div>
              ) : (
                <Button onClick={() => {
                  sessionStorage.setItem('tarjama_view', 'sourate')
                  sessionStorage.setItem('tarjama_sourate', JSON.stringify({ num: daily.sNum, name_ar: daily.info?.ar, name_fr: daily.info?.fr, verses: null }))
                  sessionStorage.setItem('tarjama_vidx', String(daily.vNum - 1))
                  router.push('/')
                }}>
                  Relever le défi →
                </Button>
              )}
            </div>

          </div>
        )}

        {/* BADGES */}
        {tab === 'badges' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 16 }}>
              {unlocked.length}/{BADGES.length} badges débloqués
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
              {unlocked.map(b => (
                <div key={b.id} style={{
                  textAlign: 'center', padding: '14px 8px', borderRadius: 10,
                  background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.15)'
                }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{b.icon}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{b.desc}</div>
                </div>
              ))}
            </div>
            {locked.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                  À débloquer
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {locked.map(b => (
                    <div key={b.id} style={{
                      textAlign: 'center', padding: '14px 8px', borderRadius: 10,
                      background: 'rgba(90,84,72,.06)', border: '1px solid rgba(90,84,72,.1)',
                      opacity: 0.5
                    }}>
                      <div style={{ fontSize: 28, marginBottom: 4, filter: 'grayscale(1)' }}>{b.icon}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* CARTE DE CHALEUR */}
        {tab === 'carte' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 16 }}>
              Ta progression sur les 114 sourates
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
              {SOURATES_LIST.map(s => {
                const total = VERSE_COUNTS[s.n] || 0
                const done = Object.keys(progress).filter(k => k.startsWith(`${s.n}:`)).length
                const pct = total > 0 ? done / total : 0
                const bg = pct === 0 ? 'rgba(90,84,72,.15)'
                  : pct < 0.3 ? 'rgba(201,168,76,.2)'
                  : pct < 0.7 ? 'rgba(201,168,76,.45)'
                  : pct < 1 ? 'rgba(76,175,125,.4)'
                  : 'rgba(76,175,125,.7)'
                return (
                  <div key={s.n} title={`${s.n}. ${s.fr} — ${done}/${total}`} style={{
                    width: 28, height: 28, borderRadius: 4, background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: pct > 0 ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'transform .15s',
                    fontWeight: 700
                  }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  onClick={() => router.push('/')}
                  >
                    {s.n}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 10, color: 'var(--text-muted)' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(90,84,72,.15)', marginRight: 4, verticalAlign: 'middle' }}/>Pas commencé</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(201,168,76,.45)', marginRight: 4, verticalAlign: 'middle' }}/>En cours</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(76,175,125,.7)', marginRight: 4, verticalAlign: 'middle' }}/>Terminé</span>
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
