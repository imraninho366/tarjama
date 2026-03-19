import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { G } from '../lib/theme'
import s from '../styles/Duas.module.css'

// Thèmes pour regrouper les catégories
const THEMES = [
  { id: 'all', label: 'Toutes', icon: '☰' },
  { id: 'quotidien', label: 'Quotidien', icon: '☀', catIds: [2,3,4,5,6,7,8,9,10,11,12,70,71,72,73,74,75,76,77,78,79,80] },
  { id: 'priere', label: 'Priere', icon: '۩', catIds: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32] },
  { id: 'matin-soir', label: 'Matin & Soir', icon: '◑', catIds: [33,34] },
  { id: 'sommeil', label: 'Sommeil', icon: '☾', catIds: [35,36,37,38] },
  { id: 'repas', label: 'Repas', icon: '◈', catIds: [63,64,65,66,67,68,69] },
  { id: 'voyage', label: 'Voyage', icon: '→', catIds: [84,85,86,87,88,89,90,91,92] },
  { id: 'protection', label: 'Protection', icon: '☼', catIds: [39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62] },
  { id: 'occasions', label: 'Occasions', icon: '♦', catIds: [93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133] },
]

export default function DuasPage({ user }) {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTheme, setActiveTheme] = useState('all')
  const [selectedCat, setSelectedCat] = useState(null)
  const [expandedDuas, setExpandedDuas] = useState(new Set())

  useEffect(() => {
    if (!user) { router.push('/'); return }
    fetch('/duas.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const totalDuas = useMemo(() => data.reduce((sum, cat) => sum + (cat.dua?.length || 0), 0), [data])

  // Filter categories
  const filteredCats = useMemo(() => {
    let cats = data
    if (activeTheme !== 'all') {
      const theme = THEMES.find(t => t.id === activeTheme)
      if (theme?.catIds) cats = cats.filter(c => theme.catIds.includes(c.cat_id))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      cats = cats.filter(c =>
        c.tt_fr?.toLowerCase().includes(q) ||
        c.dua?.some(d => d.fr?.toLowerCase().includes(q) || d.ar?.includes(q) || d.tic?.toLowerCase().includes(q))
      )
    }
    return cats
  }, [data, activeTheme, search])

  const selectedCategory = data.find(c => c.cat_id === selectedCat)

  const toggleDua = (id) => {
    setExpandedDuas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!user) return <div className={s.loading}><div className={s.loadingText}>دعاء</div></div>

  return (
    <>
      <Head><title>Invocations — Tarjama</title></Head>

      <div className={s.container}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerArabic}>حصن المسلم</div>
          <div className={s.headerSub}>La Citadelle du Musulman — Invocations et rappels</div>
        </div>

        {/* Search */}
        <div className={s.searchBar}>
          <span className={s.searchIcon}>&#8981;</span>
          <input
            className={s.searchField}
            placeholder="Rechercher une invocation..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedCat(null) }}
          />
          {search && (
            <button className={s.searchClear} onClick={() => setSearch('')}>&times;</button>
          )}
        </div>

        {/* Stats */}
        {!selectedCat && (
          <div className={s.stats}>
            <div className={s.statCard}>
              <span className={s.statNum}>{totalDuas}</span>
              <span className={s.statLabel}>Invocations</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statNum}>{data.length}</span>
              <span className={s.statLabel}>Categories</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statNum}>حصن</span>
              <span className={s.statLabel}>Hisnul Muslim</span>
            </div>
          </div>
        )}

        {/* Theme filters */}
        {!selectedCat && (
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
        )}

        {/* Category grid */}
        {!selectedCat && !loading && (
          filteredCats.length === 0 ? (
            <div className={s.empty}>
              <div className={s.emptyIcon}>دعاء</div>
              <div className={s.emptyText}>Aucune invocation trouvee</div>
            </div>
          ) : (
            <div className={s.catGrid}>
              {filteredCats.map(cat => (
                <div
                  key={cat.cat_id}
                  className={s.catCard}
                  onClick={() => { setSelectedCat(cat.cat_id); setExpandedDuas(new Set()) }}
                >
                  <div className={s.catNum}>{cat.cat_id}</div>
                  <div className={s.catInfo}>
                    <div className={s.catName}>{cat.tt_fr}</div>
                    <div className={s.catCount}>{cat.dua?.length || 0} invocation{(cat.dua?.length || 0) > 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {loading && <div className={s.loading}><div className={s.loadingText}>...</div></div>}

        {/* Category detail view */}
        {selectedCategory && (
          <>
            <button className={s.backBtn} onClick={() => setSelectedCat(null)}>
              &#8592; Retour aux categories
            </button>

            <div className={s.sectionTitle}>{selectedCategory.tt_fr}</div>
            <div className={s.sectionSub}>
              {selectedCategory.dua?.length || 0} invocation{(selectedCategory.dua?.length || 0) > 1 ? 's' : ''}
            </div>

            <div className={s.duaList}>
              {(selectedCategory.dua || []).map((dua, idx) => (
                <div key={dua.id || idx} className={s.duaCard}>
                  {/* Dua number */}
                  <div className={s.duaHeader}>
                    <span className={s.duaNum}>Invocation {idx + 1}</span>
                    {dua.ref && <span className={s.duaRef}>{dua.ref}</span>}
                  </div>

                  {/* Arabic */}
                  {dua.ar && (
                    <div className={s.duaAr} lang="ar">{dua.ar}</div>
                  )}

                  {/* Phonétique */}
                  {dua.tic && (
                    <div className={s.duaPhonetic}>{dua.tic}</div>
                  )}

                  {/* Séparateur */}
                  <div className={s.duaDivider} />

                  {/* Traduction française */}
                  {dua.fr && (
                    <div className={s.duaFr}>{dua.fr}</div>
                  )}

                  {/* Référence */}
                  {dua.ref && (
                    <div className={s.duaRefBottom}>{dua.ref}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
