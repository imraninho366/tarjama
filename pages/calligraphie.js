import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Button from '../components/common/Button'

const LETTERS = [
  { ar: 'ا', name: 'Alif', hint: 'Un trait vertical de haut en bas' },
  { ar: 'ب', name: 'Bā', hint: 'Une courbe horizontale avec un point dessous' },
  { ar: 'ت', name: 'Tā', hint: 'Même courbe que Bā avec deux points dessus' },
  { ar: 'ث', name: 'Thā', hint: 'Même courbe avec trois points dessus' },
  { ar: 'ج', name: 'Jīm', hint: 'Un crochet arrondi avec un point au milieu' },
  { ar: 'ح', name: 'Ḥā', hint: 'Même crochet que Jīm sans point' },
  { ar: 'خ', name: 'Khā', hint: 'Même crochet avec un point dessus' },
  { ar: 'د', name: 'Dāl', hint: 'Un petit crochet vers la droite' },
  { ar: 'ذ', name: 'Dhāl', hint: 'Même crochet que Dāl avec un point dessus' },
  { ar: 'ر', name: 'Rā', hint: 'Un petit trait courbé vers le bas' },
  { ar: 'ز', name: 'Zāy', hint: 'Même trait que Rā avec un point dessus' },
  { ar: 'س', name: 'Sīn', hint: 'Trois petites vagues horizontales' },
  { ar: 'ش', name: 'Shīn', hint: 'Trois vagues comme Sīn avec trois points dessus' },
  { ar: 'ص', name: 'Ṣād', hint: 'Une boucle ouverte vers la gauche' },
  { ar: 'ض', name: 'Ḍād', hint: 'Même boucle que Ṣād avec un point dessus' },
  { ar: 'ط', name: 'Ṭā', hint: 'Un ovale vertical avec un trait montant' },
  { ar: 'ظ', name: 'Ẓā', hint: 'Même forme que Ṭā avec un point dessus' },
  { ar: 'ع', name: "'Ayn", hint: 'Un C inversé, forme de tête' },
  { ar: 'غ', name: 'Ghayn', hint: "Même forme que 'Ayn avec un point dessus" },
  { ar: 'ف', name: 'Fā', hint: 'Un petit cercle avec un point dessus et une queue' },
  { ar: 'ق', name: 'Qāf', hint: 'Comme Fā mais plus rond avec deux points dessus' },
  { ar: 'ك', name: 'Kāf', hint: 'Un L inversé avec un petit trait à l\'intérieur' },
  { ar: 'ل', name: 'Lām', hint: 'Un trait vertical courbé vers la droite en bas' },
  { ar: 'م', name: 'Mīm', hint: 'Un petit cercle fermé avec une queue' },
  { ar: 'ن', name: 'Nūn', hint: 'Une demi-courbe avec un point dessus' },
  { ar: 'ه', name: 'Hā', hint: 'Un petit cercle ou nœud' },
  { ar: 'و', name: 'Wāw', hint: 'Un cercle avec une queue descendante' },
  { ar: 'ي', name: 'Yā', hint: 'Un crochet avec deux points dessous' },
]

export default function CalligraphiePage({ user }) {
  const router = useRouter()
  const canvasRef = useRef(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [drawing, setDrawing] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const lastPos = useRef(null)

  if (!user) { if (typeof window !== 'undefined') router.push('/'); return null }

  const letter = LETTERS[currentIdx]

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return { x: (touch.clientX - rect.left) * (canvas.width / rect.width), y: (touch.clientY - rect.top) * (canvas.height / rect.height) }
  }

  const startDraw = (e) => {
    e.preventDefault()
    setDrawing(true)
    lastPos.current = getPos(e)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = () => setDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setShowAnswer(false)
  }

  const reveal = () => {
    setShowAnswer(true)
    setTotal(t => t + 1)
  }

  const markCorrect = () => {
    setScore(s => s + 1)
    next()
  }

  const next = () => {
    clearCanvas()
    setShowAnswer(false)
    setCurrentIdx(i => (i + 1) % LETTERS.length)
  }

  return (
    <>
      <Head><title>Calligraphie — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>الخط العربي</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Apprends à écrire les lettres arabes</div>
        </div>

        {/* Score */}
        {total > 0 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            {score}/{total} correctes · Lettre {currentIdx + 1}/28
          </div>
        )}

        {/* Lettre à écrire */}
        <div style={{
          textAlign: 'center', padding: '16px', marginBottom: 12,
          background: 'rgba(201,168,76,.06)', borderRadius: 12, border: '1px solid rgba(201,168,76,.1)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Dessine cette lettre
          </div>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 64, color: 'var(--gold)', lineHeight: 1.2 }}>
            {letter.ar}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginTop: 4 }}>{letter.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>{letter.hint}</div>
        </div>

        {/* Canvas */}
        <div style={{
          position: 'relative', borderRadius: 12, overflow: 'hidden',
          border: '2px solid rgba(201,168,76,.2)', marginBottom: 12,
          background: 'var(--bg-card)'
        }}>
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            style={{ width: '100%', height: 'auto', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />

          {/* Lettre fantôme en arrière-plan */}
          {showAnswer && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontFamily: 'var(--font-arabic)', fontSize: 180, color: 'rgba(76,175,125,.15)',
              pointerEvents: 'none', lineHeight: 1
            }}>
              {letter.ar}
            </div>
          )}

          {/* Guide text */}
          {!drawing && !showAnswer && (
            <div style={{
              position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center',
              fontSize: 10, color: 'var(--text-muted)', pointerEvents: 'none'
            }}>
              Dessine avec ton doigt ou ta souris
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Button variant="ghost" onClick={clearCanvas} style={{ flex: 1 }}>Effacer</Button>
          {!showAnswer && <Button variant="secondary" onClick={reveal} style={{ flex: 1, color: 'var(--purple)', borderColor: 'rgba(155,127,212,.25)' }}>Voir la réponse</Button>}
          {showAnswer && <>
            <Button variant="secondary" onClick={next} style={{ flex: 1, color: 'var(--red)', borderColor: 'rgba(201,107,107,.25)' }}>Pas encore</Button>
            <Button variant="success" onClick={markCorrect} style={{ flex: 1 }}>Correct !</Button>
          </>}
        </div>

        {/* Grille de navigation rapide */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 32 }}>
          {LETTERS.map((l, i) => (
            <button key={i} onClick={() => { setCurrentIdx(i); clearCanvas() }} style={{
              width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
              fontFamily: 'var(--font-arabic)', fontSize: 16,
              background: i === currentIdx ? 'rgba(201,168,76,.15)' : 'rgba(201,168,76,.04)',
              border: `1px solid ${i === currentIdx ? 'rgba(201,168,76,.3)' : 'rgba(201,168,76,.06)'}`,
              color: i === currentIdx ? 'var(--gold)' : 'var(--text-muted)'
            }}>
              {l.ar}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
