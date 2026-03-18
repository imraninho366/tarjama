import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'
import Link from 'next/link'

const G = {
  dark:'#09090E',dark2:'#0F0F18',dark3:'#161622',dark4:'#1D1D2C',
  gold:'#C9A84C',goldLight:'#E8C97A',goldDim:'#8B6914',
  text:'#EDE8D8',textDim:'#9A9280',textMuted:'#5A5448',
  green:'#4CAF7D',blue:'#5B9BD5',red:'#C96B6B',orange:'#D4874C',purple:'#9B7FD4',
}

const TYPE_COLORS = {
  nom: {bg:'rgba(91,155,213,.1)',color:'#5B9BD5'},
  verbe: {bg:'rgba(76,175,125,.1)',color:'#4CAF7D'},
  adjectif: {bg:'rgba(155,127,212,.1)',color:'#9B7FD4'},
  particule: {bg:'rgba(201,168,76,.1)',color:'#C9A84C'},
  pronom: {bg:'rgba(212,135,76,.1)',color:'#D4874C'},
}

const FREQ_COLORS = {
  'très fréquent': G.gold,
  'fréquent': G.green,
  'courant': G.blue,
  'rare': G.textMuted,
}


// Normalise une chaîne pour la recherche flexible
// ex: "waqia" -> "waqia", "Wāqi'a" -> "waqia"
function normalize(s) {
  if (!s) return ''
  return s
    .toLowerCase()
    // Supprimer les macrons et diacritiques latins
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Supprimer apostrophes, tirets, espaces
    .replace(/['’ʼʾʿ\-]/g, '')
    // Simplifications phonétiques communes
    .replace(/dh/g, 'd').replace(/th/g, 't')
    .replace(/kh/g, 'k').replace(/gh/g, 'g')
    .replace(/sh/g, 's').replace(/ch/g, 's')
    .replace(/ph/g, 'f')
    .replace(/aa/g, 'a').replace(/ii/g, 'i').replace(/uu/g, 'u')
    .replace(/[aeiouāīū]/g, a => 'aeiou'.includes(a) ? a : ({ā:'a',ī:'i',ū:'u'}[a]||a))
    .trim()
}

export default function Dictionnaire() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [vocab, setVocab] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('tous')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('freq') // freq | recent | alpha

  useEffect(() => {
    // Load static Quran vocabulary + user's personal words
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadData(session.user)
      else window.location.href = '/'
    })
  }, [])

  const loadData = async (u) => {
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    if (p) setProfile(p)
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

  if (loading) return (
    <div style={{minHeight:'100vh',background:G.dark,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:'Amiri,serif',fontSize:24,color:G.gold,opacity:.7}}>تحميل...</div>
    </div>
  )

  return (
    <>
      <Head>
        <title>Dictionnaire coranique — Tarjama</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
        <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:${G.dark};color:${G.text};font-family:'Lato',sans-serif}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(201,168,76,.15);border-radius:2px}`}</style>
      </Head>

      {/* TOPBAR */}
      <div style={{position:'sticky',top:0,zIndex:50,height:52,background:'rgba(9,9,14,.95)',backdropFilter:'blur(8px)',borderBottom:`1px solid rgba(201,168,76,.1)`,display:'flex',alignItems:'center',padding:'0 20px',gap:14}}>
        <Link href="/" style={{textDecoration:'none'}}>
          <div style={{fontFamily:'Cinzel,serif',fontSize:14,color:G.gold,letterSpacing:3,cursor:'pointer'}}>
            ← TARJAMA
          </div>
        </Link>
        <Link href="/quiz" style={{textDecoration:'none'}}>
          <div style={{fontFamily:'Lato,sans-serif',fontSize:10,color:G.purple,letterSpacing:2,cursor:'pointer',background:'rgba(155,127,212,.08)',border:'1px solid rgba(155,127,212,.2)',padding:'5px 10px',borderRadius:2,fontWeight:700,textTransform:'uppercase'}}>
            QUIZ
          </div>
        </Link>
        <Link href="/alphabet" style={{textDecoration:'none'}}>
          <div style={{fontFamily:'Lato,sans-serif',fontSize:10,color:G.blue,letterSpacing:2,cursor:'pointer',background:'rgba(91,155,213,.08)',border:'1px solid rgba(91,155,213,.2)',padding:'5px 10px',borderRadius:2,fontWeight:700,textTransform:'uppercase'}}>
            ALPHABET
          </div>
        </Link>
        <div style={{fontFamily:'Cinzel,serif',fontSize:14,color:G.textMuted,letterSpacing:2}}>
          / Dictionnaire coranique
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:24,height:24,borderRadius:'50%',background:profile?.color||G.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:G.dark}}>
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <span style={{fontSize:12,color:G.textDim}}>{profile?.username}</span>
        </div>
      </div>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'24px 20px'}}>

        {/* HEADER */}
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:'Amiri,serif',fontSize:22,color:G.goldLight,direction:'rtl',marginBottom:4}}>المعجم القرآني</div>
          <div style={{fontSize:13,color:G.textDim}}>
            {vocab.length} mots du vocabulaire coranique — recherche instantanée
          </div>
        </div>

        {/* SEARCH */}
        <div style={{display:'flex',alignItems:'center',gap:8,background:G.dark4,border:`1px solid rgba(201,168,76,.25)`,borderRadius:4,padding:'10px 14px',marginBottom:16}}>
          <span style={{color:G.gold,fontSize:16,flexShrink:0}}></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Recherche en arabe، translittération ou français..."
            style={{background:'transparent',border:'none',color:G.text,fontFamily:'Lato,sans-serif',fontSize:14,outline:'none',width:'100%'}}
          />
          {search && <span onClick={() => setSearch('')} style={{color:G.textMuted,cursor:'pointer',fontSize:16}}></span>}
        </div>

        {/* FILTERS + SORT */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20,alignItems:'center'}}>
          <div style={{display:'flex',gap:6,flex:1,flexWrap:'wrap'}}>
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                style={{padding:'5px 12px',borderRadius:2,border:`1px solid ${filter===t?'rgba(201,168,76,.4)':'rgba(201,168,76,.12)'}`,background:filter===t?'rgba(201,168,76,.1)':'transparent',color:filter===t?G.gold:G.textMuted,fontFamily:'Lato,sans-serif',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',cursor:'pointer'}}>
                {t}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{background:G.dark4,border:`1px solid rgba(201,168,76,.15)`,color:G.textDim,padding:'5px 10px',borderRadius:2,fontFamily:'Lato,sans-serif',fontSize:11,outline:'none',cursor:'pointer'}}>
            <option value="freq">Par fréquence</option>
            <option value="recent">Plus récents</option>
            <option value="alpha">Alphabétique</option>
          </select>
        </div>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10,marginBottom:24}}>
          {[
            ['Total',G.gold,vocab.length],
            ['Noms',G.blue,vocab.filter(w=>w.type==='nom').length],
            ['Verbes',G.green,vocab.filter(w=>w.type==='verbe').length],
            ['Très fréquents',G.gold,vocab.filter(w=>w.freq_label==='très fréquent').length],
          ].map(([lbl,clr,num]) => (
            <div key={lbl} style={{background:G.dark3,border:`1px solid rgba(201,168,76,.08)`,borderRadius:4,padding:'12px 14px'}}>
              <span style={{fontFamily:'Cinzel,serif',fontSize:24,color:clr,display:'block',lineHeight:1}}>{num}</span>
              <span style={{fontSize:9,color:G.textMuted,textTransform:'uppercase',letterSpacing:2,marginTop:3,display:'block'}}>{lbl}</span>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {vocab.length === 0 && (
          <div style={{textAlign:'center',padding:'60px 20px',color:G.textMuted}}>
            <div style={{fontFamily:'Amiri,serif',fontSize:32,color:G.gold,opacity:.4,marginBottom:16}}>كَلِمَة</div>
            <div style={{fontSize:14,marginBottom:8}}>Ton dictionnaire est vide pour l'instant</div>
            <div style={{fontSize:12}}>Traduis des versets pour enrichir ton dictionnaire automatiquement</div>
            <Link href="/" style={{textDecoration:'none'}}>
              <button style={{marginTop:16,background:'linear-gradient(135deg,#8B6914,#C9A84C)',color:G.dark,border:'none',padding:'10px 24px',borderRadius:2,fontFamily:'Lato,sans-serif',fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',cursor:'pointer'}}>
                Commencer à traduire →
              </button>
            </Link>
          </div>
        )}

        {/* WORD GRID */}
        {filtered.length > 0 && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
            {filtered.map((w, i) => {
              const tc = TYPE_COLORS[w.type] || TYPE_COLORS.particule
              const fc = FREQ_COLORS[w.freq_label] || G.textMuted
              const sens = Array.isArray(w.sens) ? w.sens : (typeof w.sens === 'string' ? [w.sens] : [])
              return (
                <div key={i} onClick={() => setSelected(selected?.ar === w.ar ? null : w)}
                  style={{background: selected?.ar === w.ar ? 'rgba(201,168,76,.08)' : G.dark3,
                    border:`1px solid ${selected?.ar === w.ar ? 'rgba(201,168,76,.3)' : 'rgba(201,168,76,.08)'}`,
                    borderRadius:4,padding:'14px 12px',cursor:'pointer',transition:'all .2s'}}>
                  {/* Arabic word */}
                  <div style={{fontFamily:'Amiri,serif',fontSize:28,color:G.goldLight,direction:'rtl',textAlign:'right',marginBottom:4,lineHeight:1.3}}>
                    {w.ar}
                  </div>
                  {/* Translit */}
                  {w.translit && <div style={{fontSize:11,color:G.textMuted,fontStyle:'italic',marginBottom:6}}>{w.translit}</div>}
                  {/* Sens */}
                  <div style={{fontSize:13,color:G.text,marginBottom:8,lineHeight:1.5}}>
                    {sens.slice(0,2).join(' / ')}
                  </div>
                  {/* Tags */}
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                    {w.type && <span style={{fontSize:9,padding:'2px 7px',borderRadius:2,background:tc.bg,color:tc.color,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>{w.type}</span>}
                    {w.categorie === '99 noms' && <span style={{fontSize:9,padding:'2px 7px',borderRadius:2,background:'rgba(201,168,76,.35)',color:'#E8C97A',fontWeight:700,letterSpacing:1}}>NOM DIVIN</span>}
                    {w.freq > 0 && <span style={{fontSize:9,color:fc,letterSpacing:1}}>{w.freq}×</span>}
                    {w.racine && <span style={{fontFamily:'Amiri,serif',fontSize:13,color:G.textMuted,direction:'rtl'}}>{w.racine}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* WORD DETAIL */}
        {selected && (
          <div style={{position:'fixed',bottom:0,left:0,right:0,background:G.dark3,border:`1px solid rgba(201,168,76,.2)`,borderRadius:'12px 12px 0 0',padding:'20px 24px',maxHeight:'60vh',overflowY:'auto',zIndex:100,boxShadow:'0 -8px 40px rgba(0,0,0,.6)'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <div style={{fontFamily:'Amiri,serif',fontSize:44,color:G.goldLight,direction:'rtl',lineHeight:1.2}}>{selected.ar}</div>
                {selected.translit && <div style={{fontSize:14,color:G.textMuted,fontStyle:'italic',marginTop:4}}>{selected.translit}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{background:'transparent',border:'none',color:G.textMuted,cursor:'pointer',fontSize:18,padding:4}}></button>
            </div>

            {/* All meanings */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textMuted,marginBottom:8}}>Traductions</div>
              {(Array.isArray(selected.sens) ? selected.sens : [selected.sens]).map((s, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:i===0?G.gold:G.textMuted,flexShrink:0,display:'block'}}/>
                  <span style={{fontSize:14,color:i===0?G.text:G.textDim}}>{s}</span>
                  {i === 0 && <span style={{fontSize:10,color:G.textMuted}}>— sens principal</span>}
                </div>
              ))}
            </div>

            {/* Racine */}
            {selected.racine && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textMuted,marginBottom:6}}>Racine triconsonantique</div>
                <div style={{fontFamily:'Amiri,serif',fontSize:26,color:G.gold,direction:'rtl'}}>{selected.racine}</div>
              </div>
            )}

            {/* Stats */}
            <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
              {selected.freq > 0 && (
                <div style={{background:G.dark4,borderRadius:3,padding:'8px 14px',textAlign:'center'}}>
                  <div style={{fontFamily:'Cinzel,serif',fontSize:22,color:G.gold}}>{selected.freq}</div>
                  <div style={{fontSize:9,color:G.textMuted,textTransform:'uppercase',letterSpacing:1,marginTop:2}}>Occurrences dans le Coran</div>
                </div>
              )}
              {selected.type && (
                <div style={{background:G.dark4,borderRadius:3,padding:'8px 14px',textAlign:'center'}}>
                  <div style={{fontFamily:'Cinzel,serif',fontSize:16,color:TYPE_COLORS[selected.type]?.color||G.gold,textTransform:'capitalize'}}>{selected.type}</div>
                  <div style={{fontSize:9,color:G.textMuted,textTransform:'uppercase',letterSpacing:1,marginTop:2}}>Type grammatical</div>
                </div>
              )}
              {selected.freq_label && (
                <div style={{background:G.dark4,borderRadius:3,padding:'8px 14px',textAlign:'center'}}>
                  <div style={{fontSize:13,color:FREQ_COLORS[selected.freq_label]||G.textMuted,textTransform:'capitalize'}}>{selected.freq_label}</div>
                  <div style={{fontSize:9,color:G.textMuted,textTransform:'uppercase',letterSpacing:1,marginTop:2}}>Fréquence</div>
                </div>
              )}
            </div>

            {/* Example */}
            {selected.exemple_autre && (
              <div style={{background:'rgba(201,168,76,.05)',border:`1px solid rgba(201,168,76,.1)`,borderRadius:3,padding:'12px 14px'}}>
                <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:G.textMuted,marginBottom:6}}>
                  Exemple dans le Coran {selected.exemple_ref ? `(${selected.exemple_ref})` : ''}
                </div>
                <div style={{fontFamily:'Amiri,serif',fontSize:20,color:G.goldLight,direction:'rtl',textAlign:'right',lineHeight:1.8}}>
                  {selected.exemple_autre}
                </div>
              </div>
            )}
          </div>
        )}

        {search && filtered.length === 0 && (
          <div style={{textAlign:'center',padding:40,color:G.textMuted,fontSize:13}}>
            Aucun mot trouvé pour "{search}"
          </div>
        )}
      </div>
    </>
  )
}
