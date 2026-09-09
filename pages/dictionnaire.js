import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { G, TYPE_COLORS, FREQ_COLORS } from '../lib/theme'
import { useVocab } from '../lib/useVocab'
import Button from '../components/common/Button'
import s from '../styles/Dictionnaire.module.css'
import { apiFetch } from '../lib/apiClient'
import { clickable } from '../lib/clickable'

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

/**
 * Regroupe les natures fines du corpus en familles filtrables.
 *
 * Le corpus distingue 25 natures — « accusatif », « inchoatif », « restriction »,
 * « surprise »... La barre de filtres, elle, en listait sept, ecrites en dur, et
 * qui ne correspondaient pas aux donnees : « particule », « expression » et
 * « 99 noms » ne renvoyaient AUCUN mot, et 221 mots — les 100 noms propres, les
 * pronoms, les lettres isolees, toutes les particules — n'etaient atteignables
 * que par « tous ».
 *
 * Le badge de chaque carte continue d'afficher la nature exacte : on ne regroupe
 * que pour naviguer, jamais pour decrire.
 */
const FAMILLES = {
  nom: 'nom', adjectif: 'adjectif', verbe: 'verbe', 'nom propre': 'nom propre',
  pronom: 'pronom', 'pronom personnel': 'pronom', 'pronom suffixe': 'pronom',
}
function famille(type) {
  // Tout le reste est un mot-outil : preposition, conjonction, negation,
  // demonstratif, interrogatif, lettres isolees...
  return FAMILLES[type] || 'particule'
}

export default function Dictionnaire({ user, profile, authReady }) {
  const router = useRouter()
  const { vocab, loading: vocabLoading } = useVocab()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('tous')
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState('freq')
  const [visibleCount, setVisibleCount] = useState(50)
  const [mnemo, setMnemo] = useState('')
  const [mnemoLoading, setMnemoLoading] = useState(false)
  const loading = vocabLoading

  useEffect(() => {
    // authReady : sans lui, cet effet partait au premier rendu, quand la
    // session Supabase n'est pas encore lue et que `user` vaut null par
    // ignorance. Un utilisateur connecte qui rafraichissait cette page etait
    // renvoye a l'accueil.
    if (authReady && !user) router.push('/')
  }, [authReady, user, router])

  /**
   * Index de recherche, construit UNE fois par chargement du vocabulaire.
   *
   * La version precedente appelait JSON.stringify et normalize sur chacun des
   * 6344 mots A CHAQUE FRAPPE au clavier — soit des dizaines de milliers
   * d'allocations de chaines par seconde de saisie, sur un telephone. Ici le
   * travail couteux est fait une fois ; taper ne fait plus que comparer des
   * chaines deja pretes.
   *
   * Les champs restent SEPARES plutot que concatenes en un seul texte :
   * fusionner « translit » et « note » creerait des correspondances a cheval
   * sur la frontiere des deux, donc des resultats que l'ancienne version ne
   * renvoyait pas.
   */
  const indexed = useMemo(() => vocab.map(w => ({
    w,
    sens: w.sens ? JSON.stringify(w.sens).toLowerCase() : '',
    translitLower: w.translit?.toLowerCase() || '',
    nTranslit: normalize(w.translit) || '',
    nAr: normalize(w.ar) || '',
    nNote: normalize(w.note) || '',
  })), [vocab])

  /**
   * Ne depend QUE de ce qui change le resultat.
   *
   * Sans useMemo, ce filtre et ce tri repartaient a chaque rendu — donc aussi
   * en cliquant sur un mot, en affichant la suite de la liste, ou pendant la
   * generation d'un moyen mnemotechnique, alors qu'aucun de ces gestes ne
   * change la liste affichee.
   */
  const filtered = useMemo(() => indexed
    .filter(({ w, sens, translitLower, nTranslit, nAr, nNote }) => {
      if (filter === '99 noms') {
        if (w.categorie !== '99 noms') return false
      } else if (filter !== 'tous' && famille(w.type) !== filter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const qn = normalize(search)
      // Recherche directe
      if (w.ar?.includes(search)) return true
      if (translitLower.includes(q)) return true
      if (w.racine?.includes(search)) return true
      if (sens.includes(q)) return true
      // Recherche normalisée (sans diacritiques, ex: waqia -> Wāqi'a)
      if (qn.length >= 2) {
        if (nTranslit.includes(qn)) return true
        if (nAr.includes(qn)) return true
        if (nNote.includes(qn)) return true
      }
      return false
    })
    .map(({ w }) => w)
    // Le tri « recent » a ete retire : il comparait new Date(w.created_at), or
    // AUCUN des 6344 mots ne porte ce champ. La soustraction donnait NaN, donc
    // un ordre indefini — et le menu ne proposait de toute facon que les deux
    // tris ci-dessous.
    .sort((a, b) => {
      if (sortBy === 'alpha') return a.ar?.localeCompare(b.ar, 'ar') || 0
      return (b.freq || 0) - (a.freq || 0)
    }), [indexed, filter, search, sortBy])

  /*
   * Les filtres viennent des DONNEES, plus d'une liste ecrite en dur : c'est
   * ce qui rendait possible un bouton qui n'affiche rien. On n'en propose un
   * que si au moins un mot y repond, et « 99 noms » n'apparait que si des
   * entrees portent reellement cette categorie.
   */
  const types = useMemo(() => {
    const presentes = new Set(vocab.map(w => famille(w.type)))
    const ordre = ['nom', 'verbe', 'adjectif', 'nom propre', 'pronom', 'particule']
    return [
      'tous',
      ...(vocab.some(w => w.categorie === '99 noms') ? ['99 noms'] : []),
      ...ordre.filter(t => presentes.has(t)),
    ]
  }, [vocab])

  /**
   * Statistiques d'en-tete et maximum de frequence, en une seule passe.
   *
   * Il y avait quatre parcours complets du vocabulaire a chaque rendu : trois
   * filter pour les compteurs, et un Math.max(...vocab.map(...)). Ce dernier
   * etalait en plus 6344 arguments sur la pile d'appel — ce qui finit par
   * lever « Maximum call stack size exceeded » a mesure que le dictionnaire
   * grandit.
   */
  const stats = useMemo(() => {
    let maxFreq = 1, noms = 0, verbes = 0, tresFrequents = 0
    for (const w of vocab) {
      if ((w.freq || 0) > maxFreq) maxFreq = w.freq
      if (w.type === 'nom') noms++
      else if (w.type === 'verbe') verbes++
      if (w.freq_label === 'très fréquent') tresFrequents++
    }
    return { maxFreq, noms, verbes, tresFrequents }
  }, [vocab])

  const maxFreq = stats.maxFreq

  if (!user) return null

  if (loading) return (
    <div className={s.loading}>
      <div className={s.loadingText} aria-hidden="true">تحميل...</div>
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
          <h1 className={s.headerArabic} lang="ar" dir="rtl">المعجم القرآني</h1>
          <div className={s.headerSub}>
            {vocab.length} mots du vocabulaire coranique — recherche instantanée
          </div>
        </div>

        {/* SEARCH */}
        <div className={s.searchBar}>
          <span className={s.searchIcon}>◇</span>
          <input type="search" autoComplete="off"
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(50) }}
            placeholder="Recherche en arabe، translittération ou français..."
            className={s.searchField}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className={s.searchClear} aria-label="Effacer la recherche" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>✕</button>
          )}
        </div>

        {/* FILTERS + SORT */}
        <div className={s.filterRow}>
          <div className={s.filterPills}>
            {types.map(t => (
              <button
                key={t}
                onClick={() => { setFilter(t); setVisibleCount(50) }}
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
            {/* « Plus recents » a ete retire : aucun mot ne porte de date, le
                tri ne pouvait donc rien classer. Une option qui ne fait rien
                use la confiance plus surement qu'une option absente. */}
            <option value="freq">Par fréquence</option>
            <option value="alpha">Alphabétique</option>
          </select>
        </div>

        {/* STATS */}
        <div className={s.statsGrid}>
          {[
            ['Total', 'var(--tarjama-color-primary)', vocab.length],
            ['Noms', 'var(--tarjama-color-info)', stats.noms],
            ['Verbes', 'var(--tarjama-color-success)', stats.verbes],
            ['Très fréquents', 'var(--tarjama-color-primary)', stats.tresFrequents],
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
            <div className={s.emptyArabic} aria-hidden="true">كَلِمَة</div>
            <div className={s.emptyTitle}>Ton dictionnaire est vide pour l'instant</div>
            <div className={s.emptySub}>Traduis des versets pour enrichir ton dictionnaire automatiquement</div>
            <Link href="/">
              <Button variant="primary">Commencer à traduire →</Button>
            </Link>
          </div>
        )}

        {/* WORD GRID */}
        {filtered.length > 0 && (<>
          <div className={s.wordGrid}>
            {filtered.slice(0, visibleCount).map((w, i) => {
              const tc = TYPE_COLORS[w.type] || TYPE_COLORS.particule
              const fc = FREQ_COLORS[w.freq_label] || 'var(--tarjama-color-text-muted)'
              const sens = Array.isArray(w.sens) ? w.sens : (typeof w.sens === 'string' ? [w.sens] : [])
              return (
                <div
                  key={i}
                  {...clickable(() => setSelected(selected?.ar === w.ar ? null : w))}
                  className={`${s.wordCard} ${selected?.ar === w.ar ? s.wordCardSelected : ''}`}
                  style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
                >
                  <div className={s.wordArabic} lang="ar" dir="rtl">{w.ar}</div>
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
                      <span className={s.rootTag} lang="ar" dir="rtl">{w.racine}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {visibleCount < filtered.length && (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <Button variant="secondary" onClick={() => setVisibleCount(prev => prev + 50)}>
                Voir plus ({filtered.length - visibleCount} restants)
              </Button>
            </div>
          )}
        </>)}

        {/* WORD DETAIL */}
        {selected && (
          <div className={s.detailOverlay}>
            <div className={s.detailPanel}>
              <div className={s.detailHandle} />
              <div className={s.detailTop}>
                <div>
                  <div className={s.detailArabic} lang="ar" dir="rtl">{selected.ar}</div>
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
                  <div className={s.rootArabic} lang="ar" dir="rtl">{selected.racine}</div>
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
                    <div className={s.detailStatNum} style={{ color: 'var(--tarjama-color-primary)' }}>{selected.freq}</div>
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
                    <div className={s.detailStatFreq} style={{ color: FREQ_COLORS[selected.freq_label] || 'var(--tarjama-color-text-muted)' }}>
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
                  <div className={s.exampleArabic} lang="ar" dir="rtl">{selected.exemple_autre}</div>
                </div>
              )}

              {/* Mnémonique IA */}
              <div style={{ padding: '12px 0' }}>
                <Button variant="secondary" full onClick={async () => {
                  if (mnemo) { setMnemo(''); return }
                  setMnemoLoading(true)
                  try {
                    const r = await apiFetch('/api/mnemo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ar: selected.ar, translit: selected.translit, sens: selected.sens }) })
                    const data = await r.json()
                    // La route dit POURQUOI elle a echoue — quota atteint,
                    // fournisseurs a sec, session expiree. Se rabattre sur
                    // « Non disponible » cachait ce message et laissait croire
                    // que le mot n'avait pas de mnemonique.
                    setMnemo(data.mnemo || data.error || 'Non disponible')
                  } catch { setMnemo('Connexion impossible. Réessaie dans un instant.') }
                  setMnemoLoading(false)
                }} disabled={mnemoLoading}>
                  {mnemoLoading ? '...' : mnemo ? 'Masquer' : 'Mnémonique IA'}
                </Button>
                {mnemo && (
                  <div style={{
                    marginTop: 8, padding: '12px', borderRadius: 8,
                    background: 'rgba(var(--tarjama-color-purple-rgb, 155, 127, 212),.06)', border: '1px solid rgba(var(--tarjama-color-purple-rgb, 155, 127, 212),.15)',
                    fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8, fontStyle: 'italic'
                  }}>
                    {mnemo}
                  </div>
                )}
              </div>
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
