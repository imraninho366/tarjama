import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { G, TYPE_COLORS, FREQ_COLORS } from '../lib/theme'
import Button from '../components/common/Button'
import s from '../styles/Dictionnaire.module.css'

// Normalise une chaîne pour la recherche flexible
// ex: "waqia" -> "waqia", "Wāqi'a" -> "waqia"
function normalize(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    // Supprimer les macrons et diacritiques latins
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Supprimer apostrophes, tirets, espaces
    .replace(/[''ʼʾʿ\-]/g, '')
    // Simplifications phonétiques communes
    .replace(/dh/g, 'd').replace(/th/g, 't')
    .replace(/kh/g, 'k').replace(/gh/g, 'g')
    .replace(/sh/g, 's').replace(/ch/g, 's')
    .replace(/ph/g, 'f')
    .replace(/aa/g, 'a').replace(/ii/g, 'i').replace(/uu/g, 'u')
    .replace(/[aeiouāīū]/g, a => 'aeiou'.includes(a) ? a : ({ā:'a',ī:'i',ū:'u'}[a]||a))
    .trim()
}

export default function Dictionnaire({ user, profile }) {
  const router = useRouter()
  const [vocab, setVocab] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('tous')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('freq') // freq | recent | alpha

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadData()
  }, [user, router])

  const loadData = async () => {
    // Load static Quran dictionary
    try {
      const r = await fetch('/quran_vocab.json')
      const data = await r.json()
      setVocab(data.mots || [])
    } catch(e) {
      setVocab([])
    }
    setLoading(false)
  }

  const filtered = vocab
    .filter(w => {
      if (filter === '99 noms') {
        if (w.categorie !== '99 noms') return false
      } else if (filter !== 'tous' && w.type !== filter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const qn = normalize(search)
      // Recherche directe
      if (w.ar?.includes(search)) return true
      if (w.translit?.toLowerCase().includes(q)) return true
      if (w.racine?.includes(search)) return true
      if (w.sens && JSON.stringify(w.sens).toLowerCase().includes(q)) return true
      // Recherche normalisée (sans diacritiques, ex: waqia -> Wāqi'a)
      if (qn.length >= 2) {
        if (normalize(w.translit)?.includes(qn)) return true
        if (normalize(w.ar)?.includes(qn)) return true
        if (normalize(w.note)?.includes(qn)) return true
      }
      return false
    })
    .sort((a, b) => {
      if (sortBy === 'freq') return (b.freq || 0) - (a.freq || 0)
      if (sortBy === 'alpha') return a.ar?.localeCompare(b.ar, 'ar') || 0
      return new Date(b.created_at) - new Date(a.created_at)
    })

  const types = ['tous', '99 noms', 'nom', 'verbe', 'adjectif', 'particule', 'pronom', 'expression']

  // Max freq for bar visual
  const maxFreq = vocab.length > 0 ? Math.max(...vocab.map(w => w.freq || 0)) : 1

  if (!user) return null

  if (loading) return (
    <div className={s.loading}>
      <div className={s.loadingText}>تحميل...</div>
    </div>
  )

  return (
    <>
      <Head>
        <title>Dictionnaire coranique — Tarjama</title>
      </Head>

      <div className={s.container}>

        {/* HEADER */}
        <div className={s.header}>
          <div className={s.headerArabic}>المعجم القرآني</div>
          <div className={s.headerSub}>
            {vocab.length} mots du vocabulaire coranique — recherche instantanée
          </div>
        </div>

        {/* SEARCH */}
        <div className={s.searchBar}>
          <span className={s.searchIcon}>◇</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Recherche en arabe، translittération ou français..."
            className={s.searchField}
          />
          {search && (
            <span onClick={() => setSearch('')} className={s.searchClear}>✕</span>
          )}
        </div>

        {/* FILTERS + SORT */}
        <div className={s.filterRow}>
          <div className={s.filterPills}>
            {types.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`${s.filterPill} ${filter === t ? s.filterPillActive : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className={s.sortSelect}
          >
            <option value="freq">Par fréquence</option>
            <option value="recent">Plus récents</option>
            <option value="alpha">Alphabétique</option>
          </select>
        </div>

        {/* STATS */}
        <div className={s.statsGrid}>
          {[
            ['Total', G.gold, vocab.length],
            ['Noms', G.blue, vocab.filter(w => w.type === 'nom').length],
            ['Verbes', G.green, vocab.filter(w => w.type === 'verbe').length],
            ['Très fréquents', G.gold, vocab.filter(w => w.freq_label === 'très fréquent').length],
          ].map(([lbl, clr, num]) => (
            <div key={lbl} className={s.statCard}>
              <span className={s.statNumber} style={{ color: clr }}>{num}</span>
              <span className={s.statLabel}>{lbl}</span>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {vocab.length === 0 && (
          <div className={s.emptyState}>
            <div className={s.emptyArabic}>كَلِمَة</div>
            <div className={s.emptyTitle}>Ton dictionnaire est vide pour l'instant</div>
            <div className={s.emptySub}>Traduis des versets pour enrichir ton dictionnaire automatiquement</div>
            <Link href="/">
              <Button variant="primary">Commencer à traduire →</Button>
            </Link>
          </div>
        )}

        {/* WORD GRID */}
        {filtered.length > 0 && (
          <div className={s.wordGrid}>
            {filtered.map((w, i) => {
              const tc = TYPE_COLORS[w.type] || TYPE_COLORS.particule
              const fc = FREQ_COLORS[w.freq_label] || G.textMuted
              const sens = Array.isArray(w.sens) ? w.sens : (typeof w.sens === 'string' ? [w.sens] : [])
              return (
                <div
                  key={i}
                  onClick={() => setSelected(selected?.ar === w.ar ? null : w)}
                  className={`${s.wordCard} ${selected?.ar === w.ar ? s.wordCardSelected : ''}`}
                  style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
                >
                  <div className={s.wordArabic}>{w.ar}</div>
                  {w.translit && <div className={s.wordTranslit}>{w.translit}</div>}
                  <div className={s.wordSens}>{sens.slice(0, 2).join(' / ')}</div>
                  <div className={s.wordTags}>
                    {w.type && (
                      <span
                        className={s.typeBadge}
                        style={{ background: tc.bg, color: tc.color }}
                      >
                        {w.type}
                      </span>
                    )}
                    {w.categorie === '99 noms' && (
                      <span className={s.divineBadge}>NOM DIVIN</span>
                    )}
                    {w.freq > 0 && (
                      <span className={s.freqTag} style={{ color: fc }}>{w.freq}×</span>
                    )}
                    {w.racine && (
                      <span className={s.rootTag}>{w.racine}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* WORD DETAIL */}
        {selected && (
          <div className={s.detailOverlay}>
            <div className={s.detailPanel}>
              <div className={s.detailHandle} />
              <div className={s.detailTop}>
                <div>
                  <div className={s.detailArabic}>{selected.ar}</div>
                  {selected.translit && (
                    <div className={s.detailTranslit}>{selected.translit}</div>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className={s.detailClose}>✕</button>
              </div>

              {/* All meanings */}
              <div className={s.detailSection}>
                <div className={s.detailSectionTitle}>Traductions</div>
                {(Array.isArray(selected.sens) ? selected.sens : [selected.sens]).map((meaning, i) => (
                  <div key={i} className={s.meaningRow}>
                    <span className={`${s.meaningDot} ${i === 0 ? s.meaningDotPrimary : s.meaningDotSecondary}`} />
                    <span className={`${s.meaningText} ${i === 0 ? s.meaningTextPrimary : s.meaningTextSecondary}`}>{meaning}</span>
                    {i === 0 && <span className={s.meaningHint}>— sens principal</span>}
                  </div>
                ))}
              </div>

              {/* Racine */}
              {selected.racine && (
                <div className={s.detailSection}>
                  <div className={s.detailSectionTitle}>Racine triconsonantique</div>
                  <div className={s.rootArabic}>{selected.racine}</div>
                </div>
              )}

              {/* Frequency bar */}
              {selected.freq > 0 && (
                <div className={s.freqBarWrap}>
                  <div className={s.detailSectionTitle}>
                    Fréquence — {selected.freq} occurrence{selected.freq > 1 ? 's' : ''} dans le Coran
                  </div>
                  <div className={s.freqBarTrack}>
                    <div
                      className={s.freqBarFill}
                      style={{ width: `${Math.max((selected.freq / maxFreq) * 100, 2)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className={s.detailStats}>
                {selected.freq > 0 && (
                  <div className={s.detailStatCard}>
                    <div className={s.detailStatNum} style={{ color: G.gold }}>{selected.freq}</div>
                    <div className={s.detailStatLabel}>Occurrences dans le Coran</div>
                  </div>
                )}
                {selected.type && (
                  <div className={s.detailStatCard}>
                    <div className={s.detailStatType} style={{ color: TYPE_COLORS[selected.type]?.color || G.gold }}>
                      {selected.type}
                    </div>
                    <div className={s.detailStatLabel}>Type grammatical</div>
                  </div>
                )}
                {selected.freq_label && (
                  <div className={s.detailStatCard}>
                    <div className={s.detailStatFreq} style={{ color: FREQ_COLORS[selected.freq_label] || G.textMuted }}>
                      {selected.freq_label}
                    </div>
                    <div className={s.detailStatLabel}>Fréquence</div>
                  </div>
                )}
              </div>

              {/* Example */}
              {selected.exemple_autre && (
                <div className={s.exampleCard}>
                  <div className={s.exampleLabel}>
                    Exemple dans le Coran {selected.exemple_ref ? `(${selected.exemple_ref})` : ''}
                  </div>
                  <div className={s.exampleArabic}>{selected.exemple_autre}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {search && filtered.length === 0 && (
          <div className={s.noResults}>
            Aucun mot trouvé pour &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </>
  )
}
