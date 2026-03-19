import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { G } from '../lib/theme'
import s from '../styles/Hadith.module.css'

const COLLECTIONS = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', nameAr: 'صحيح البخاري' },
  { id: 'muslim',  name: 'Sahih Muslim',     nameAr: 'صحيح مسلم' },
]

// Thèmes pour guider les utilisateurs qui ne connaissent pas les hadiths
const THEMES = [
  { id: 'all',       label: 'Tous',          icon: '☰' },
  { id: 'foi',       label: 'Foi & croyance', icon: '♡', keywords: ['foi','croyance','croire','iman','belief','faith'] },
  { id: 'priere',    label: 'Priere',         icon: '۩', keywords: ['priere','salat','prayer','prostern','mosquee','adhan','appel'] },
  { id: 'jeune',     label: 'Jeune',          icon: '☾', keywords: ['jeune','ramadan','fasting','iftar'] },
  { id: 'zakat',     label: 'Zakat & dons',   icon: '♦', keywords: ['zakat','aumone','charite','dons','don','sadaqa','charity'] },
  { id: 'hajj',      label: 'Pelerinage',     icon: '◈', keywords: ['pelerinage','hajj','omra','mecque','makkah','pilgrimage','kaaba'] },
  { id: 'mariage',   label: 'Mariage',        icon: '⚭', keywords: ['mariage','divorce','epouse','femme','nikah','marriage','wedding'] },
  { id: 'science',   label: 'Science',        icon: '✦', keywords: ['science','savoir','connaissance','knowledge','apprendre'] },
  { id: 'prophete',  label: 'Le Prophete',    icon: '﷽', keywords: ['prophete','messager','muhammad','mohammed','prophet','messenger','merites'] },
  { id: 'jugement',  label: 'Jour dernier',   icon: '⏳', keywords: ['jugement','resurrection','paradis','enfer','fin des temps','hereafter','paradise','hell'] },
  { id: 'manieres',  label: 'Bonnes manieres', icon: '❋', keywords: ['maniere','adab','etiquette','politesse','salutation','permission'] },
  { id: 'invocations', label: 'Invocations',  icon: '☼', keywords: ['invocation','doua','dua','rappel','repentir','pardon'] },
]

export default function HadithPage({ user }) {
  const router = useRouter()
  const [collection, setCollection] = useState('bukhari')
  const [sections, setSections] = useState([])
  const [totalHadiths, setTotalHadiths] = useState(0)
  const [selectedSection, setSelectedSection] = useState(null)
  const [hadiths, setHadiths] = useState([])
  const [allHadiths, setAllHadiths] = useState([]) // for "load more" in section view
  const [sectionName, setSectionName] = useState('')
  const [sectionTotal, setSectionTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeTheme, setActiveTheme] = useState('all')
  const [visibleCount, setVisibleCount] = useState(10) // "load more" counter
  const [randomHadith, setRandomHadith] = useState(null)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    loadSections()
  }, [user, collection])

  const loadSections = async () => {
    setLoading(true)
    setSelectedSection(null)
    setHadiths([])
    setAllHadiths([])
    setSearchResults(null)
    setSearch('')
    setActiveTheme('all')
    setRandomHadith(null)
    try {
      const r = await fetch(`/api/hadith?collection=${collection}`)
      const data = await r.json()
      setSections(data.sections || [])
      setTotalHadiths(data.totalHadiths || 0)
    } catch { setSections([]) }
    setLoading(false)
  }

  const loadSection = async (secNum) => {
    setLoading(true)
    setSelectedSection(secNum)
    setVisibleCount(10)
    setSearchResults(null)
    try {
      // Load ALL hadiths of this section (limit=300 to get them all)
      const r = await fetch(`/api/hadith?collection=${collection}&section=${secNum}&page=1&limit=300`)
      const data = await r.json()
      setAllHadiths(data.hadiths || [])
      setHadiths((data.hadiths || []).slice(0, 10))
      setSectionName(data.sectionName || '')
      setSectionTotal(data.total || 0)
    } catch { setAllHadiths([]); setHadiths([]) }
    setLoading(false)
  }

  // "Voir plus" — load 10 more hadiths
  const loadMore = () => {
    const next = visibleCount + 10
    setVisibleCount(next)
    setHadiths(allHadiths.slice(0, next))
  }

  // Hadith du jour — random based on date
  const loadRandomHadith = async () => {
    setLoading(true)
    try {
      // Use today's date as seed for consistent daily hadith
      const today = new Date()
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
      const num = (seed % (totalHadiths || 7000)) + 1
      const r = await fetch(`/api/hadith?collection=${collection}&number=${num}`)
      const data = await r.json()
      setRandomHadith(data.hadith || null)
    } catch { setRandomHadith(null) }
    setLoading(false)
  }

  const doSearch = async () => {
    if (!search.trim()) { setSearchResults(null); return }
    setSearchLoading(true)
    try {
      const r = await fetch(`/api/hadith?collection=${collection}&search=${encodeURIComponent(search)}&limit=30`)
      const data = await r.json()
      setSearchResults(data.hadiths || [])
    } catch { setSearchResults([]) }
    setSearchLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { if (search.trim()) doSearch(); else setSearchResults(null) }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const goBack = () => {
    setSelectedSection(null)
    setHadiths([])
    setAllHadiths([])
    setSearch('')
    setSearchResults(null)
    setRandomHadith(null)
    setVisibleCount(10)
  }

  const switchCollection = (id) => {
    setCollection(id)
    setSelectedSection(null)
    setSearch('')
    setSearchResults(null)
    setRandomHadith(null)
    setActiveTheme('all')
  }

  // Filter sections by theme
  const filteredSections = activeTheme === 'all'
    ? sections
    : sections.filter(sec => {
        const theme = THEMES.find(t => t.id === activeTheme)
        if (!theme) return true
        const name = sec.name.toLowerCase()
        return theme.keywords.some(kw => name.includes(kw))
      })

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
            placeholder="Rechercher un hadith par mot-cle..."
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

        {/* Search results */}
        {searchResults !== null && (
          <>
            <button className={s.backBtn} onClick={() => { setSearch(''); setSearchResults(null) }}>
              &#8592; Retour
            </button>
            <div className={s.sectionTitle}>
              {searchLoading ? 'Recherche...' : `${searchResults.length} resultat${searchResults.length > 1 ? 's' : ''}`}
            </div>
            <div className={s.sectionSub}>pour "{search}" dans {colInfo?.name}</div>

            {searchResults.length === 0 && !searchLoading && (
              <div className={s.empty}>
                <div className={s.emptyIcon}>&#1581;</div>
                <div className={s.emptyText}>Aucun hadith trouve pour cette recherche</div>
              </div>
            )}

            <div className={s.hadithList}>
              {searchResults.map(h => (
                <HadithCard key={h.number} h={h} collection={collection} />
              ))}
            </div>
          </>
        )}

        {/* Main view — not searching, no section selected */}
        {!selectedSection && searchResults === null && !randomHadith && (
          loading ? (
            <div className={s.loading}><div className={s.loadingText}>...</div></div>
          ) : (
            <>
              {/* Stats + Hadith du jour button */}
              <div className={s.stats}>
                <div className={s.statCard}>
                  <span className={s.statNum}>{totalHadiths.toLocaleString()}</span>
                  <span className={s.statLabel}>Hadiths</span>
                </div>
                <div className={s.statCard}>
                  <span className={s.statNum}>{sections.length}</span>
                  <span className={s.statLabel}>Chapitres</span>
                </div>
                <div className={s.statCard} onClick={loadRandomHadith} style={{ cursor: 'pointer' }}>
                  <span className={s.statNum}>&#9733;</span>
                  <span className={s.statLabel}>Hadith du jour</span>
                </div>
              </div>

              {/* Theme filters */}
              <div className={s.themeRow}>
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    className={`${s.themePill} ${activeTheme === t.id ? s.themePillActive : ''}`}
                    onClick={() => setActiveTheme(t.id)}
                  >
                    <span className={s.themeIcon}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Chapter grid */}
              {filteredSections.length === 0 ? (
                <div className={s.empty}>
                  <div className={s.emptyIcon}>&#1581;</div>
                  <div className={s.emptyText}>Aucun chapitre pour ce theme</div>
                </div>
              ) : (
                <div className={s.chapterGrid}>
                  {filteredSections.map(sec => (
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
              )}
            </>
          )
        )}

        {/* Hadith du jour */}
        {randomHadith && !selectedSection && searchResults === null && (
          <>
            <button className={s.backBtn} onClick={goBack}>
              &#8592; Retour aux chapitres
            </button>
            <div className={s.dailyHeader}>Hadith du jour</div>
            <div className={s.dailySub}>Un hadith selectionne chaque jour</div>
            <div className={s.hadithList}>
              <HadithCard h={randomHadith} collection={collection} forceExpanded />
            </div>
          </>
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

                {visibleCount < allHadiths.length && (
                  <div className={s.loadMoreWrap}>
                    <button className={s.loadMoreBtn} onClick={loadMore}>
                      Voir plus ({allHadiths.length - visibleCount} restants)
                    </button>
                  </div>
                )}

                {visibleCount >= allHadiths.length && allHadiths.length > 10 && (
                  <div className={s.endMsg}>Fin du chapitre</div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

function HadithCard({ h, collection, forceExpanded = false }) {
  const [expanded, setExpanded] = useState(forceExpanded)
  const isLong = (h.textAr?.length > 200) || (h.textFr?.length > 250)

  return (
    <div
      className={`${s.hadithCard} ${expanded ? s.hadithCardExpanded : ''}`}
      onClick={() => !forceExpanded && setExpanded(!expanded)}
      style={!forceExpanded && isLong ? { cursor: 'pointer' } : {}}
    >
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
          {expanded || !isLong ? h.textAr : h.textAr.slice(0, 200) + '...'}
        </div>
      )}

      {/* French text */}
      <div className={s.hadithFr}>
        {expanded || !isLong ? h.textFr : h.textFr.slice(0, 250) + '...'}
      </div>

      {!forceExpanded && isLong && (
        <div className={s.expandHint}>
          {expanded ? 'Reduire' : 'Lire la suite'}
        </div>
      )}
    </div>
  )
}
