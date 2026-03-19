import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { G } from '../lib/theme'
import s from '../styles/Hadith.module.css'

const COLLECTIONS = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', nameAr: 'صحيح البخاري' },
  { id: 'muslim',  name: 'Sahih Muslim',     nameAr: 'صحيح مسلم' },
]

export default function HadithPage({ user }) {
  const router = useRouter()
  const [collection, setCollection] = useState('bukhari')
  const [sections, setSections] = useState([])
  const [totalHadiths, setTotalHadiths] = useState(0)
  const [selectedSection, setSelectedSection] = useState(null)
  const [hadiths, setHadiths] = useState([])
  const [sectionName, setSectionName] = useState('')
  const [sectionTotal, setSectionTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const LIMIT = 15

  useEffect(() => {
    if (!user) { router.push('/'); return }
    loadSections()
  }, [user, collection])

  const loadSections = async () => {
    setLoading(true)
    setSelectedSection(null)
    setHadiths([])
    setSearchResults(null)
    setSearch('')
    try {
      const r = await fetch(`/api/hadith?collection=${collection}`)
      const data = await r.json()
      setSections(data.sections || [])
      setTotalHadiths(data.totalHadiths || 0)
    } catch { setSections([]) }
    setLoading(false)
  }

  const loadSection = async (secNum, p = 1) => {
    setLoading(true)
    setSelectedSection(secNum)
    setPage(p)
    try {
      const r = await fetch(`/api/hadith?collection=${collection}&section=${secNum}&page=${p}&limit=${LIMIT}`)
      const data = await r.json()
      setHadiths(data.hadiths || [])
      setSectionName(data.sectionName || '')
      setSectionTotal(data.total || 0)
    } catch { setHadiths([]) }
    setLoading(false)
  }

  const doSearch = async () => {
    if (!search.trim()) { setSearchResults(null); return }
    setSearchLoading(true)
    try {
      const r = await fetch(`/api/hadith?collection=${collection}&search=${encodeURIComponent(search)}&limit=20`)
      const data = await r.json()
      setSearchResults(data.hadiths || [])
    } catch { setSearchResults([]) }
    setSearchLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { if (search.trim()) doSearch() }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const goBack = () => {
    setSelectedSection(null)
    setHadiths([])
    setSearch('')
    setSearchResults(null)
  }

  const switchCollection = (id) => {
    setCollection(id)
    setSelectedSection(null)
    setSearch('')
    setSearchResults(null)
  }

  const totalPages = Math.ceil(sectionTotal / LIMIT)
  const colInfo = COLLECTIONS.find(c => c.id === collection)

  if (!user) return <div className={s.loading}><div className={s.loadingText}>حديث</div></div>

  return (
    <>
      <Head><title>Hadith — Tarjama</title></Head>

      <div className={s.container}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerArabic}>الأحاديث الصحيحة</div>
          <div className={s.headerSub}>
            Hadiths authentiques — Bukhari & Muslim
          </div>
        </div>

        {/* Collection selector */}
        <div className={s.collectionRow}>
          {COLLECTIONS.map(c => (
            <button
              key={c.id}
              className={`${s.collectionPill} ${collection === c.id ? s.collectionPillActive : ''}`}
              onClick={() => switchCollection(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={s.searchBar}>
          <span className={s.searchIcon}>&#8981;</span>
          <input
            className={s.searchField}
            placeholder="Rechercher un hadith..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
          />
          {search && (
            <button className={s.searchClear} onClick={() => { setSearch(''); setSearchResults(null) }}>
              &times;
            </button>
          )}
        </div>

        {/* Stats */}
        {!selectedSection && !searchResults && (
          <div className={s.stats}>
            <div className={s.statCard}>
              <span className={s.statNum}>{totalHadiths.toLocaleString()}</span>
              <span className={s.statLabel}>Hadiths</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statNum}>{sections.length}</span>
              <span className={s.statLabel}>Chapitres</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statNum}>{colInfo?.nameAr}</span>
              <span className={s.statLabel}>Recueil</span>
            </div>
          </div>
        )}

        {/* Search results */}
        {searchResults !== null && (
          <>
            <div className={s.sectionTitle}>
              {searchLoading ? 'Recherche...' : `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}`}
            </div>
            <div className={s.sectionSub}>pour "{search}" dans {colInfo?.name}</div>

            {searchResults.length === 0 && !searchLoading && (
              <div className={s.empty}>
                <div className={s.emptyIcon}>&#1581;</div>
                <div className={s.emptyText}>Aucun hadith trouvé pour cette recherche</div>
              </div>
            )}

            <div className={s.hadithList}>
              {searchResults.map(h => (
                <HadithCard key={h.number} h={h} collection={collection} />
              ))}
            </div>
          </>
        )}

        {/* Chapter list */}
        {!selectedSection && searchResults === null && (
          loading ? (
            <div className={s.loading}><div className={s.loadingText}>...</div></div>
          ) : (
            <div className={s.chapterGrid}>
              {sections.map(sec => (
                <div
                  key={sec.num}
                  className={s.chapterCard}
                  onClick={() => loadSection(sec.num)}
                >
                  <div className={s.chapterNum}>{sec.num}</div>
                  <div className={s.chapterInfo}>
                    <div className={s.chapterName}>{sec.name}</div>
                    <div className={s.chapterCount}>{sec.count} hadith{sec.count > 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Section view */}
        {selectedSection && searchResults === null && (
          <>
            <button className={s.backBtn} onClick={goBack}>
              &#8592; Retour aux chapitres
            </button>

            <div className={s.sectionTitle}>{sectionName}</div>
            <div className={s.sectionSub}>
              Chapitre {selectedSection} — {sectionTotal} hadith{sectionTotal > 1 ? 's' : ''}
            </div>

            {loading ? (
              <div className={s.loading}><div className={s.loadingText}>...</div></div>
            ) : (
              <>
                <div className={s.hadithList}>
                  {hadiths.map(h => (
                    <HadithCard key={h.number} h={h} collection={collection} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className={s.pagination}>
                    <button
                      className={s.pageBtn}
                      disabled={page <= 1}
                      onClick={() => loadSection(selectedSection, page - 1)}
                    >
                      Precedent
                    </button>
                    <span className={s.pageInfo}>{page} / {totalPages}</span>
                    <button
                      className={s.pageBtn}
                      disabled={page >= totalPages}
                      onClick={() => loadSection(selectedSection, page + 1)}
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

function HadithCard({ h, collection }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={s.hadithCard} onClick={() => setExpanded(!expanded)}>
      <div className={s.hadithHeader}>
        <span className={s.hadithNum}>
          {collection === 'bukhari' ? 'Bukhari' : 'Muslim'} #{h.number}
        </span>
        {h.grades?.length > 0 && (
          <span className={s.hadithGrade}>
            {h.grades[0]?.grade || 'Sahih'}
          </span>
        )}
      </div>

      {/* Arabic text */}
      {h.textAr && (
        <div className={s.hadithAr} lang="ar">
          {expanded ? h.textAr : h.textAr.length > 200 ? h.textAr.slice(0, 200) + '...' : h.textAr}
        </div>
      )}

      {/* French text */}
      <div className={s.hadithFr}>
        {expanded ? h.textFr : h.textFr.length > 250 ? h.textFr.slice(0, 250) + '...' : h.textFr}
      </div>
    </div>
  )
}
