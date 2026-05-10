import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { SOURATES_LIST } from '../lib/sourates'
import Button from '../components/common/Button'

const SHORT_SOURATES = [1, 112, 113, 114, 103, 108, 110, 111, 97, 99, 100, 101, 102, 104, 105, 106, 107, 109]

export default function TajweedPage({ user }) {
  const router = useRouter()
  const [sourate, setSourate] = useState(null)
  const [verses, setVerses] = useState([])
  const [vIdx, setVIdx] = useState(0)
  const [recording, setRecording] = useState(false)
  const [recLoading, setRecLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const recorderRef = useRef(null)

  if (!user) { if (typeof window !== 'undefined') router.push('/'); return null }

  const loadSourate = async (num) => {
    setLoading(true); setResult(null); setVIdx(0)
    try {
      const r = await fetch(`/api/sourate?num=${num}`)
      const data = await r.json()
      setSourate({ num, ...SOURATES_LIST.find(s => s.n === num) })
      setVerses(data.verses || [])
    } catch {}
    setLoading(false)
  }

  const verse = verses[vIdx]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      const actualMime = recorder.mimeType || mimeType || 'audio/webm'
      const chunks = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecLoading(true)
        const blob = new Blob(chunks, { type: actualMime })
        const reader = new FileReader()
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1]
          try {
            const r = await fetch('/api/transcribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio: base64, mimeType: actualMime }) })
            const data = await r.json()
            if (data.text && verse) analyzeResult(data.text, verse.ar)
            else setResult({ score: 0, details: [], transcript: data.text || '' })
          } catch { setResult({ score: 0, details: [], transcript: 'Erreur transcription' }) }
          setRecLoading(false)
        }
        reader.readAsDataURL(blob)
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true); setResult(null)
    } catch {}
  }

  const stopRecording = () => {
    if (recorderRef.current && recording) { recorderRef.current.stop(); setRecording(false); recorderRef.current = null }
  }

  const analyzeResult = (transcript, original) => {
    const clean = (s) => s.replace(/[ًٌٍَُِّْٰٓٔ]/g, '').replace(/\s+/g, ' ').trim()
    const origWords = clean(original).split(' ')
    const transWords = clean(transcript).split(' ')
    let correct = 0
    const details = origWords.map(w => {
      const found = transWords.some(tw => tw === w || tw.includes(w.substring(0, 3)) || w.includes(tw.substring(0, 3)))
      if (found) correct++
      return { word: w, ok: found }
    })
    setResult({ score: Math.round(correct / origWords.length * 100), details, correct, total: origWords.length, transcript })
  }

  return (
    <>
      <Head><title>Tajweed — Tarjama</title></Head>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>التجويد</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Récite et vois tes mots colorés en temps réel</div>
        </div>

        {/* Choix de sourate */}
        {!sourate && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              Choisis une sourate courte
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SHORT_SOURATES.map(num => {
                const info = SOURATES_LIST.find(s => s.n === num)
                return (
                  <button key={num} onClick={() => loadSourate(num)} style={{
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.1)',
                    textAlign: 'left', transition: 'all .15s', flex: '1 1 140px'
                  }}>
                    <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 16, color: 'var(--gold-light)', direction: 'rtl' }}>{info?.ar}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{info?.fr}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement...</div>}

        {/* Mode récitation */}
        {sourate && verse && !loading && (
          <div>
            <button onClick={() => { setSourate(null); setVerses([]); setResult(null) }}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
              ← Changer de sourate
            </button>

            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              {sourate.ar} — Verset {vIdx + 1}/{verses.length}
            </div>

            {/* Texte arabe avec coloration */}
            <div style={{
              padding: '20px 16px', borderRadius: 12, marginBottom: 16, textAlign: 'center',
              background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.1)'
            }}>
              {!result ? (
                <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 26, color: 'var(--gold-light)', direction: 'rtl', lineHeight: 2.2 }}>
                  {verse.ar}
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 26, direction: 'rtl', lineHeight: 2.2, textAlign: 'right' }}>
                  {result.details.map((d, i) => (
                    <span key={i} style={{
                      color: d.ok ? 'var(--green)' : 'var(--red)',
                      background: d.ok ? 'rgba(76,175,125,.1)' : 'rgba(201,107,107,.1)',
                      padding: '2px 4px', borderRadius: 4, margin: '0 2px',
                      transition: 'all .3s ease',
                      animation: `fadeInUp 0.3s ease ${i * 0.05}s both`
                    }}>
                      {d.word}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score */}
            {result && (
              <div style={{
                textAlign: 'center', marginBottom: 16, padding: '12px',
                background: result.score >= 80 ? 'rgba(76,175,125,.06)' : result.score >= 50 ? 'rgba(201,168,76,.06)' : 'rgba(201,107,107,.06)',
                borderRadius: 10, border: `1px solid ${result.score >= 80 ? 'rgba(76,175,125,.2)' : result.score >= 50 ? 'rgba(201,168,76,.2)' : 'rgba(201,107,107,.2)'}`,
                animation: 'fadeInUp .3s ease'
              }}>
                <div style={{
                  fontSize: 36, fontFamily: 'var(--font-display)', fontWeight: 700,
                  color: result.score >= 80 ? 'var(--green)' : result.score >= 50 ? 'var(--gold)' : 'var(--red)'
                }}>
                  {result.score}%
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {result.correct}/{result.total} mots reconnus
                </div>
                {result.transcript && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                    Transcrit : {result.transcript}
                  </div>
                )}
              </div>
            )}

            {/* Contrôles */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {!recording && !recLoading && (
                <Button onClick={startRecording} style={{ background: 'var(--red)', color: '#fff', flex: 1 }}>
                  Réciter ce verset
                </Button>
              )}
              {recording && (
                <Button onClick={stopRecording} style={{ background: 'var(--red)', color: '#fff', flex: 1, animation: 'pulse 1s infinite' }}>
                  Arrêter l'enregistrement
                </Button>
              )}
              {recLoading && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 12 }}>Analyse en cours...</div>
              )}
            </div>

            {/* Navigation versets */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {vIdx > 0 && <Button variant="secondary" onClick={() => { setVIdx(i => i - 1); setResult(null) }}>← Précédent</Button>}
              {vIdx < verses.length - 1 && <Button onClick={() => { setVIdx(i => i + 1); setResult(null) }}>Suivant →</Button>}
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
