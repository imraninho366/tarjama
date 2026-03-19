import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { G } from '../lib/theme'
import s from '../styles/Piliers.module.css'

export default function PiliersPage({ user }) {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('islam') // islam | iman
  const [selectedPilier, setSelectedPilier] = useState(null)
  const [showGuide, setShowGuide] = useState(false) // guide de prière
  const [showAblutions, setShowAblutions] = useState(false)
  const [showJoumua, setShowJoumua] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    fetch('/piliers.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const goBack = () => { setSelectedPilier(null); setShowGuide(false); setShowAblutions(false); setShowJoumua(false) }
  const section = data?.[activeTab]
  const pilier = section?.piliers?.find(p => p.id === selectedPilier)

  if (!user) return <div className={s.loading}><div className={s.loadingText}>أركان</div></div>

  return (
    <>
      <Head><title>Piliers — Tarjama</title></Head>
      <div className={s.container}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerArabic}>{activeTab === 'islam' ? 'أركان الإسلام' : 'أركان الإيمان'}</div>
          <div className={s.headerSub}>
            {activeTab === 'islam' ? 'Les 5 Piliers de l\'Islam' : 'Les 6 Piliers de la Foi'}
          </div>
        </div>

        {/* Tabs */}
        <div className={s.tabs}>
          <button
            className={`${s.tab} ${activeTab === 'islam' ? s.tabActive : ''}`}
            onClick={() => { setActiveTab('islam'); setSelectedPilier(null); setShowGuide(false) }}
          >
            Les 5 Piliers de l'Islam
          </button>
          <button
            className={`${s.tab} ${activeTab === 'iman' ? s.tabActive : ''}`}
            onClick={() => { setActiveTab('iman'); setSelectedPilier(null); setShowGuide(false) }}
          >
            Les 6 Piliers de la Foi
          </button>
        </div>

        {loading && <div className={s.loading}><div className={s.loadingText}>...</div></div>}

        {/* Intro */}
        {section && !selectedPilier && !loading && (
          <div className={s.intro}>{section.intro}</div>
        )}

        {/* Pilier list */}
        {section && !selectedPilier && !loading && (
          <div className={s.pilierGrid}>
            {section.piliers.map(p => (
              <div key={p.id} className={s.pilierCard} onClick={() => setSelectedPilier(p.id)}>
                <div className={s.pilierIcon}>{p.icon}</div>
                <div className={s.pilierInfo}>
                  <div className={s.pilierName}>{p.nom}</div>
                  <div className={s.pilierNameAr}>{p.nomAr}</div>
                  <div className={s.pilierSousTitre}>{p.sousTitre || p.resume}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pilier detail */}
        {pilier && !showGuide && (
          <>
            <button className={s.backBtn} onClick={goBack}>&#8592; Retour</button>

            <div className={s.detailHeader}>
              <span className={s.detailIcon}>{pilier.icon}</span>
              <div>
                <div className={s.detailName}>{pilier.nom}</div>
                <div className={s.detailNameAr}>{pilier.nomAr}</div>
              </div>
            </div>

            {pilier.sousTitre && <div className={s.detailSousTitre}>{pilier.sousTitre}</div>}

            {/* Shahada — show arabic/phonetic/translation */}
            {pilier.arabe && (
              <div className={s.textBlock}>
                <div className={s.textAr} lang="ar">{pilier.arabe}</div>
                {pilier.phonetique && <div className={s.textPhonetic}>{pilier.phonetique}</div>}
                {pilier.traduction && <div className={s.textFr}>{pilier.traduction}</div>}
              </div>
            )}

            {/* Details */}
            <div className={s.detailsList}>
              {(pilier.details || []).map((d, i) => (
                <div key={i} className={s.detailItem}>
                  <span className={s.detailBullet}>{i + 1}</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>

            {pilier.ref && <div className={s.ref}>{pilier.ref}</div>}

            {/* Prayer times table */}
            {pilier.prieres && (
              <>
                <div className={s.subTitle}>Les 5 prieres quotidiennes</div>
                <div className={s.priereTable}>
                  {pilier.prieres.map(pr => (
                    <div key={pr.nom} className={s.priereRow}>
                      <div className={s.priereMain}>
                        <div className={s.priereNom}>{pr.nom}</div>
                        <div className={s.priereNomAr}>{pr.nomAr}</div>
                      </div>
                      <div className={s.priereDetails}>
                        <div className={s.priereHoraire}>{pr.horaire}</div>
                        <div className={s.priereRakaat}>
                          <span className={s.rakaatBadge}>{pr.rakaat} rak'at</span>
                          {pr.sunna_avant > 0 && <span className={s.sunnaBadge}>+{pr.sunna_avant} sunna avant</span>}
                          {pr.sunna_apres > 0 && <span className={s.sunnaBadge}>+{pr.sunna_apres} sunna apres</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buttons to guides */}
                <div className={s.guideBtnGroup}>
                  <button className={s.guideBtn} onClick={() => setShowAblutions(true)}>
                    Comment faire les ablutions (Al-Woudou)
                  </button>
                  <button className={s.guideBtn} onClick={() => setShowGuide(true)}>
                    Comment faire la priere etape par etape
                  </button>
                  <button className={s.guideBtn} onClick={() => setShowJoumua(true)}>
                    La priere du vendredi (Al-Joumou'a)
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Prayer step-by-step guide */}
        {showGuide && pilier?.guide_priere && (
          <>
            <button className={s.backBtn} onClick={() => setShowGuide(false)}>
              &#8592; Retour aux details
            </button>

            <div className={s.guideHeader}>Guide complet de la priere</div>
            <div className={s.guideSub}>Les etapes de la Salat, pas a pas</div>

            <div className={s.guideList}>
              {pilier.guide_priere.map(step => (
                <div key={step.etape} className={s.stepCard}>
                  <div className={s.stepHeader}>
                    <span className={s.stepNum}>{step.etape}</span>
                    <div>
                      <div className={s.stepTitle}>{step.titre}</div>
                      <div className={s.stepTitleAr}>{step.titreAr}</div>
                    </div>
                  </div>

                  <div className={s.stepDesc}>{step.description}</div>

                  {step.arabe && (
                    <div className={s.stepTextBlock}>
                      <div className={s.stepAr} lang="ar">{step.arabe}</div>
                      {step.phonetique && <div className={s.stepPhonetic}>{step.phonetique}</div>}
                      <div className={s.stepDivider} />
                      {step.traduction && <div className={s.stepFr}>{step.traduction}</div>}
                    </div>
                  )}

                  {step.detail && <div className={s.stepNote}>{step.detail}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Ablutions guide */}
        {showAblutions && pilier?.guide_ablutions && (
          <>
            <button className={s.backBtn} onClick={() => setShowAblutions(false)}>
              &#8592; Retour aux details
            </button>

            <div className={s.guideHeader}>Les ablutions (Al-Woudou)</div>
            <div className={s.guideSub}>Comment faire ses ablutions etape par etape</div>

            <div className={s.guideList}>
              {pilier.guide_ablutions.map(step => (
                <div key={step.etape} className={s.stepCard}>
                  <div className={s.stepHeader}>
                    <span className={s.stepNum}>{step.etape}</span>
                    <div>
                      <div className={s.stepTitle}>{step.titre}</div>
                      <div className={s.stepTitleAr}>{step.titreAr}</div>
                    </div>
                  </div>

                  <div className={s.stepDesc}>{step.description}</div>

                  {step.arabe && (
                    <div className={s.stepTextBlock}>
                      <div className={s.stepAr} lang="ar">{step.arabe}</div>
                      {step.phonetique && <div className={s.stepPhonetic}>{step.phonetique}</div>}
                      <div className={s.stepDivider} />
                      {step.traduction && <div className={s.stepFr}>{step.traduction}</div>}
                    </div>
                  )}

                  {step.detail && <div className={s.stepNote}>{step.detail}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Joumou'a guide */}
        {showJoumua && pilier?.guide_joumua && (
          <>
            <button className={s.backBtn} onClick={() => setShowJoumua(false)}>
              &#8592; Retour aux details
            </button>

            <div className={s.guideHeader}>{pilier.guide_joumua.titre}</div>
            <div className={s.guideSub}>{pilier.guide_joumua.titreAr}</div>

            {/* Intro */}
            <div className={s.intro}>{pilier.guide_joumua.intro}</div>

            {pilier.guide_joumua.ref && <div className={s.ref}>{pilier.guide_joumua.ref}</div>}

            {/* Conditions */}
            <div className={s.subTitle}>Conditions</div>
            <div className={s.detailsList}>
              {pilier.guide_joumua.conditions.map((c, i) => (
                <div key={i} className={s.detailItem}>
                  <span className={s.detailBullet}>&#10003;</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>

            {/* Sunna avant */}
            <div className={s.subTitle}>Sunna avant la priere</div>
            <div className={s.detailsList}>
              {pilier.guide_joumua.sunna_avant.map((su, i) => (
                <div key={i} className={s.detailItem}>
                  <span className={s.detailBullet}>&#9733;</span>
                  <span>{su}</span>
                </div>
              ))}
            </div>

            {/* Merites */}
            <div className={s.subTitle}>Merites du vendredi</div>
            <div className={s.detailsList}>
              {pilier.guide_joumua.merites.map((m, i) => (
                <div key={i} className={s.detailItem}>
                  <span className={s.detailBullet}>&#9830;</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>

            {/* Deroulement */}
            <div className={s.subTitle}>Deroulement</div>
            <div className={s.guideList}>
              {pilier.guide_joumua.deroulement.map(step => (
                <div key={step.etape} className={s.stepCard}>
                  <div className={s.stepHeader}>
                    <span className={s.stepNum}>{step.etape}</span>
                    <div>
                      <div className={s.stepTitle}>{step.titre}</div>
                    </div>
                  </div>
                  <div className={s.stepDesc}>{step.description}</div>
                  {step.detail && <div className={s.stepNote}>{step.detail}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
