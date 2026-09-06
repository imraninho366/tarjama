import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import { SOURATES_LIST } from '../lib/sourates'
import { G, AVATAR_COLORS } from '../lib/theme'
import { isAdmin } from '../lib/freemium'
import Link from 'next/link'
import Button from '../components/common/Button'
import { activiteParJour, calculerSeries, grilleCalendrier, repartitionQualite } from '../lib/progression'

export default function ProfilPage({ user, profile, authReady, onLogout }) {
  const router = useRouter()
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // authReady : la session Supabase est lue de facon asynchrone, donc au
    // premier rendu `user` vaut null par ignorance et non par absence. Sans
    // cette attente, ouvrir ou rafraichir /profil en etant connecte renvoyait
    // a l'accueil.
    if (!authReady) return
    if (!user) { router.push('/'); return }
    loadData()
  }, [authReady, user])

  const loadData = async () => {
    const { data, error } = await supabase.from('progress').select('*').eq('user_id', user.id)
    if (error) { console.error('profil loadData:', error.message); setLoading(false); return }
    const map = {}
    data?.forEach(r => {
      map[`${r.sourate_num}:${r.verse_num}`] = { niveau: r.niveau, ts: r.updated_at }
    })
    setProgress(map)
    setLoading(false)
  }

  if (!user || !profile) return null

  const entries = Object.values(progress)
  const total = entries.length
  const qualite = repartitionQualite(entries)
  const excellent = qualite.maitrises

  // Activite dans le temps : c'est ce qui manquait. Les totaux ci-dessus
  // disent ou on en est, pas si on avance.
  const parJour = activiteParJour(entries)
  const series = calculerSeries(parJour)
  const calendrier = grilleCalendrier(parJour, 12)
  const joursActifs = parJour.size
  // Une grille vide peut vouloir dire « jamais rien fait » ou « rien fait
  // RECEMMENT ». Ces deux situations ne meritent pas le meme message.
  const activiteDansLaFenetre = calendrier.flat().reduce((n, j) => n + j.nb, 0)
  const dernierJour = [...parJour.keys()].sort().pop()

  // Total versets dans le Coran
  const TOTAL_QURAN_VERSES = 6236

  const sourates = SOURATES_LIST.map(s => {
    const done = Object.keys(progress).filter(k => k.startsWith(`${s.n}:`)).length
    const ok = Object.keys(progress).filter(k => {
      if (!k.startsWith(`${s.n}:`)) return false
      const p = progress[k]
      return p.niveau === 'excellent' || p.niveau === 'good'
    }).length
    return { ...s, done, ok, pct: s.v > 0 ? Math.round(done / s.v * 100) : 0 }
  }).filter(s => s.done > 0).sort((a, b) => b.pct - a.pct)


  // Mots connus (quiz)
  const quizHistory = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tarjama_quiz_history') || '[]') : []
  const knownWords = [...new Set(quizHistory.filter(h => h.ok).map(h => h.ar))]
  const TOTAL_QURAN_WORDS = 6344
  const pctMotsConnus = TOTAL_QURAN_WORDS > 0 ? Math.round(knownWords.length / TOTAL_QURAN_WORDS * 100) : 0

  // % mémorisation du Coran (versets excellents / total versets)
  const pctMemorisation = TOTAL_QURAN_VERSES > 0 ? Math.round(excellent / TOTAL_QURAN_VERSES * 100) : 0

  return (
    <>
      <Head><title>Profil — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        {/* Header profil */}
        <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
            background: profile.color || 'var(--gold)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, color: 'var(--bg-card)', fontWeight: 700,
            border: `3px solid ${'var(--gold)'}40`
          }}>
            {profile.username?.[0]?.toUpperCase() || '?'}
          </div>
          <h1 style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--text)', fontWeight: 600, margin: 0 }}>
            {profile.username}
          </h1>
        </div>

        {/* Stats principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            [total, 'Versets traduits', 'var(--gold)'],
            [excellent, 'Excellents', 'var(--green)'],
            [knownWords.length, 'Mots connus', 'var(--blue)'],
          ].map(([num, lbl, clr]) => (
            <div key={lbl} style={{
              textAlign: 'center', padding: '12px 4px',
              background: 'rgba(var(--tarjama-color-primary-rgb),.04)', borderRadius: 8,
              border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)'
            }}>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: clr, fontWeight: 700 }}>{num}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Barres de progression Coran */}
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text)' }}>Vocabulaire du Coran</span>
            <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--blue)', fontWeight: 700 }}>{pctMotsConnus}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(var(--tarjama-color-primary-rgb),.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${pctMotsConnus}%`, background: 'var(--blue)', transition: 'width .5s ease' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{knownWords.length} / {TOTAL_QURAN_WORDS} mots uniques</div>

          <div style={{ borderTop: '1px solid rgba(var(--tarjama-color-primary-rgb),.06)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text)' }}>Mémorisation du Coran</span>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--green)', fontWeight: 700 }}>{pctMemorisation}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(var(--tarjama-color-primary-rgb),.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${pctMemorisation}%`, background: 'var(--green)', transition: 'width .5s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{excellent} / {TOTAL_QURAN_VERSES} versets maîtrisés</div>
          </div>
        </div>

        {/* ── Régularité ─────────────────────────────────────────────
            La question « est-ce que j'avance ? » ne se lit pas dans un
            total. Elle se lit dans une suite de jours. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            [series.actuelle, series.actuelle > 1 ? 'Jours d’affilée' : 'Jour d’affilée', 'var(--orange)'],
            [series.record, 'Record', 'var(--gold)'],
            [joursActifs, joursActifs > 1 ? 'Jours actifs' : 'Jour actif', 'var(--text-secondary)'],
          ].map(([num, lbl, clr]) => (
            <div key={lbl} style={{
              textAlign: 'center', padding: '12px 4px',
              background: 'rgba(var(--tarjama-color-primary-rgb),.04)', borderRadius: 8,
              border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)'
            }}>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: clr, fontWeight: 700 }}>{num}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Calendrier d'activité ──────────────────────────────────
            Douze semaines, une colonne par semaine. L'intensité suit le
            nombre de versets du jour. */}
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)' }}>
          <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 10 }}>Ces 12 dernières semaines</div>

          {/* Le cas vide n'est pas le cas rare, c'est le cas majoritaire.
              Sur les 16 profils du 6 septembre 2026, 12 n'ont aucune
              progression et 3 des 4 restants ont une activité anterieure a la
              fenetre : 15 sur 16 voient une grille vide. Sans un mot
              d'explication, l'ecran semble affirmer qu'ils n'ont rien fait —
              alors que Yasmine a traduit 51 versets. */}
          {activiteDansLaFenetre === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
              {total === 0
                ? 'Traduis ton premier verset : il apparaîtra ici dès aujourd’hui.'
                : <>Rien sur cette période — ta dernière session remonte au{' '}
                    <strong style={{ color: 'var(--gold)' }}>
                      {new Date(dernierJour + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </strong>. Tes {total} versets sont bien enregistrés.</>}
            </div>
          )}

          <div
            style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 4 }}
            role="img"
            aria-label={`Calendrier d'activité : ${joursActifs} jour${joursActifs > 1 ? 's' : ''} de traduction sur les 12 dernières semaines.`}
          >
            {calendrier.map((semaine, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {semaine.map(jour => (
                  <div
                    key={jour.date}
                    // title : au survol, la date exacte et le nombre de versets.
                    title={jour.futur ? '' : `${new Date(jour.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${jour.nb} verset${jour.nb > 1 ? 's' : ''}`}
                    style={{
                      width: 11, height: 11, borderRadius: 2,
                      background: jour.futur ? 'transparent'
                        : jour.nb === 0 ? 'rgba(var(--tarjama-color-primary-rgb),.07)'
                        : jour.nb < 3 ? 'rgba(var(--tarjama-color-primary-rgb),.35)'
                        : jour.nb < 6 ? 'rgba(var(--tarjama-color-primary-rgb),.65)'
                        : 'var(--gold)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>Moins</span>
            {['.07', '.35', '.65'].map(o => (
              <span key={o} style={{ width: 9, height: 9, borderRadius: 2, background: `rgba(var(--tarjama-color-primary-rgb),${o})` }} />
            ))}
            <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--gold)' }} />
            <span>Plus</span>
          </div>
        </div>

        {/* ── Qualité des traductions ────────────────────────────────
            Ces trois nombres étaient déjà calculés dans le code, sans
            jamais être affichés. */}
        {total > 0 && (
          <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: 'rgba(var(--tarjama-color-primary-rgb),.04)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)' }}>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 10 }}>Qualité de tes traductions</div>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              {[
                [qualite.maitrises, 'var(--green)'],
                [qualite.partiels, 'var(--gold)'],
                [qualite.aRevoir, 'var(--orange)'],
              ].filter(([n]) => n > 0).map(([n, c]) => (
                <div key={c} style={{ width: `${n / total * 100}%`, background: c }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-secondary)' }}>
              {[
                [qualite.maitrises, 'maîtrisés', 'var(--green)'],
                [qualite.partiels, 'partiels', 'var(--gold)'],
                [qualite.aRevoir, 'à revoir', 'var(--orange)'],
              ].map(([n, lbl, c]) => (
                <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} aria-hidden="true" />
                  {n} {lbl}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Progression par sourate */}
        <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(var(--tarjama-color-primary-rgb),.1)' }}>
          Progression par sourate
        </div>
        {(
          <div>
            {sourates.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                Aucune sourate commencée. Traduis ton premier verset !
              </div>
            )}
            {sourates.map(s => (
              <div key={s.n} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderBottom: '1px solid rgba(var(--tarjama-color-primary-rgb),.05)'
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{s.n}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{s.ar} — {s.fr}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.done}/{s.v}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(var(--tarjama-color-primary-rgb),.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${s.pct}%`,
                      background: s.pct >= 80 ? 'var(--green)' : s.pct >= 40 ? 'var(--gold)' : 'var(--orange)',
                      transition: 'width .5s ease'
                    }} />
                  </div>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'right',
                  color: s.pct >= 80 ? 'var(--green)' : s.pct >= 40 ? 'var(--gold)' : 'var(--orange)'
                }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 24, paddingBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isAdmin(user.id) && (
            <Link href="/admin" style={{
              display: 'block', textAlign: 'center', padding: '12px', borderRadius: 8,
              background: 'rgba(var(--tarjama-color-primary-rgb),.08)', border: '1px solid rgba(var(--tarjama-color-primary-rgb),.15)',
              color: 'var(--gold)', fontSize: 14, fontWeight: 600, textDecoration: 'none'
            }}>
              Administration
            </Link>
          )}
          <Button variant="ghost" full onClick={onLogout} style={{ color: 'var(--red)', borderColor: 'rgba(var(--tarjama-color-error-rgb, 184, 74, 74),.2)' }}>
            Déconnexion
          </Button>
        </div>
      </div>
    </>
  )
}
