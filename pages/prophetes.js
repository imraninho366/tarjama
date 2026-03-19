import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { G } from '../lib/theme'
import s from '../styles/Prophetes.module.css'

export default function ProphetesPage({ user }) {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) { router.push('/'); return }
    fetch('/prophetes.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const prophetes = data?.prophetes || []
  const filtered = search.trim()
    ? prophetes.filter(p =>
        p.nom.toLowerCase().includes(search.toLowerCase()) ||
        p.nomAr.includes(search) ||
        p.titre.toLowerCase().includes(search.toLowerCase()) ||
        p.resume.toLowerCase().includes(search.toLowerCase())
      )
    : prophetes

  const prophete = prophetes.find(p => p.id === selected)

  if (!user) return <div className={s.loading}><div className={s.loadingText}>الأنبياء</div></div>

  return (
    <>
      <Head><title>Prophetes — Tarjama</title></Head>
      <div className={s.container}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerArabic}>الأنبياء والرسل</div>
          <div className={s.headerSub}>Les histoires des 25 Prophetes mentionnes dans le Coran</div>
        </div>

        {!selected && (
          <>
            {/* Search */}
            <div className={s.searchBar}>
              <span className={s.searchIcon}>&#8981;</span>
              <input
                className={s.searchField}
                placeholder="Rechercher un prophete..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className={s.searchClear} onClick={() => setSearch('')}>&times;</button>}
            </div>

            {/* Timeline */}
            {loading ? (
              <div className={s.loading}><div className={s.loadingText}>...</div></div>
            ) : (
              <div className={s.timeline}>
                {filtered.map((p, idx) => (
                  <div key={p.id} className={s.timelineItem} onClick={() => setSelected(p.id)}>
                    <div className={s.timelineLine}>
                      <div className={s.timelineDot}>{p.id}</div>
                      {idx < filtered.length - 1 && <div className={s.timelineConnector} />}
                    </div>
                    <div className={s.timelineCard}>
                      <div className={s.cardTop}>
                        <div className={s.cardName}>{p.nom}</div>
                        <div className={s.cardNameAr}>{p.nomAr}</div>
                      </div>
                      <div className={s.cardTitre}>{p.titre}</div>
                      <div className={s.cardResume}>{p.resume.length > 120 ? p.resume.slice(0, 120) + '...' : p.resume}</div>
                      <div className={s.cardMeta}>
                        <span>{p.epoque}</span>
                        <span>{p.mentionsCoran} dans le Coran</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Detail view */}
        {prophete && (
          <>
            <button className={s.backBtn} onClick={() => setSelected(null)}>&#8592; Retour</button>

            <div className={s.detailHeader}>
              <div className={s.detailNum}>{prophete.id}</div>
              <div>
                <div className={s.detailName}>{prophete.nom}</div>
                <div className={s.detailNameAr}>{prophete.nomAr}</div>
                <div className={s.detailTitre}>{prophete.titre}</div>
              </div>
            </div>

            {/* Meta */}
            <div className={s.metaGrid}>
              <div className={s.metaCard}><div className={s.metaLabel}>Epoque</div><div className={s.metaValue}>{prophete.epoque}</div></div>
              <div className={s.metaCard}><div className={s.metaLabel}>Lieu</div><div className={s.metaValue}>{prophete.lieu}</div></div>
              <div className={s.metaCard}><div className={s.metaLabel}>Dans le Coran</div><div className={s.metaValue}>{prophete.mentionsCoran}</div></div>
              <div className={s.metaCard}><div className={s.metaLabel}>Sourates</div><div className={s.metaValue}>{prophete.sourates}</div></div>
            </div>

            {/* Histoire */}
            <div className={s.sectionTitle}>Son histoire</div>
            <div className={s.histoireList}>
              {(prophete.histoire || []).map((h, i) => (
                <div key={i} className={s.histoireItem}>
                  <span className={s.histoireBullet}>{i + 1}</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Verset cle */}
            {prophete.versetCle && (
              <div className={s.versetBlock}>
                <div className={s.versetText}>"{prophete.versetCle}"</div>
                <div className={s.versetRef}>{prophete.versetRef}</div>
              </div>
            )}

            {/* Lecons */}
            {prophete.lecons?.length > 0 && (
              <>
                <div className={s.sectionTitle}>Lecons a retenir</div>
                <div className={s.leconsList}>
                  {prophete.lecons.map((l, i) => (
                    <div key={i} className={s.leconItem}>
                      <span className={s.leconIcon}>&#9733;</span>
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Navigation between prophets */}
            <div className={s.navProphetes}>
              {prophete.id > 1 && (
                <button className={s.navBtn} onClick={() => setSelected(prophete.id - 1)}>
                  &#8592; {prophetes.find(p => p.id === prophete.id - 1)?.nom}
                </button>
              )}
              <div className={s.navSpacer} />
              {prophete.id < prophetes.length && (
                <button className={s.navBtn} onClick={() => setSelected(prophete.id + 1)}>
                  {prophetes.find(p => p.id === prophete.id + 1)?.nom} &#8594;
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
