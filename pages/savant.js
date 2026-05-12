import { useState, useRef } from 'react'
import Head from 'next/head'
import Button from '../components/common/Button'

const SUGGESTIONS = [
  'Comment faire la prière ?',
  'Quels sont les piliers du jeûne ?',
  'Que dit le Coran sur la patience ?',
  'Comment faire les ablutions ?',
  'Quelles sont les invocations du matin ?',
  'Qu\'est-ce que la zakat et comment la calculer ?',
]

export default function SavantPage() {
  const [question, setQuestion] = useState('')
  const [askedQuestion, setAskedQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const inputRef = useRef(null)

  const ask = async (q) => {
    const query = q || question.trim()
    if (!query) return
    setLoading(true)
    setAnswer('')
    setAskedQuestion(query)
    try {
      const r = await fetch('/api/savant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setAnswer(data.answer || 'Pas de réponse disponible.')
      setHistory(prev => [{ q: query, a: data.answer }, ...prev.slice(0, 9)])
    } catch (err) {
      setAnswer(err.message === 'Trop de requêtes.'
        ? 'Trop de questions à la suite. Réessaie dans une minute.'
        : 'Erreur. Vérifie ta connexion internet.')
    }
    setLoading(false)
    setQuestion('')
  }

  return (
    <>
      <Head><title>Savant IA — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 28, color: 'var(--gold)' }}>العالِم</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Pose ta question sur l'Islam</div>
        </div>

        {/* Avertissement */}
        <div style={{
          padding: '10px 14px', marginBottom: 16, borderRadius: 8,
          background: 'rgba(212,135,76,.06)', border: '1px solid rgba(212,135,76,.15)',
          fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7, textAlign: 'center'
        }}>
          Les réponses sont basées sur le Coran et les hadiths authentiques.
          Pour les questions complexes, <strong>consulte toujours un savant qualifié</strong>.
          Cet outil informe, il ne remplace pas un imam ou un mufti.
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="search" autoComplete="off"
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') ask() }}
            placeholder="Ex: Comment faire la prière du Fajr ?"
            style={{
              flex: 1, padding: '14px', borderRadius: 10, fontSize: 14,
              background: 'var(--bg-elevated)', border: '1px solid rgba(201,168,76,.15)',
              color: 'var(--text)'
            }}
          />
          <Button onClick={() => ask()} disabled={loading || !question.trim()}>
            {loading ? '...' : 'Demander'}
          </Button>
        </div>

        {/* Suggestions */}
        {!answer && !loading && history.length === 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              Suggestions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setQuestion(s); ask(s) }} style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.1)',
                  color: 'var(--text-dim)', transition: 'all .15s'
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontFamily: 'var(--font-arabic)', fontSize: 16, color: 'var(--gold)', marginBottom: 8 }}>
              جاري البحث في المصادر...
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Recherche dans le Coran et les hadiths...</div>
          </div>
        )}

        {/* Réponse */}
        {answer && !loading && (
          <div style={{
            padding: 16, borderRadius: 12, marginBottom: 16,
            background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.1)',
            animation: 'fadeInUp .3s ease'
          }}>
            {askedQuestion && (
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(201,168,76,.08)' }}>
                {askedQuestion}
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              Réponse
            </div>
            <div style={{
              fontSize: 14, color: 'var(--text)', lineHeight: 2,
              fontFamily: 'var(--font-serif)', whiteSpace: 'pre-wrap'
            }}>
              {answer}
            </div>
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 6,
              background: 'rgba(212,135,76,.06)', border: '1px solid rgba(212,135,76,.1)',
              fontSize: 10, color: 'var(--orange)', lineHeight: 1.6, textAlign: 'center'
            }}>
              Cette réponse est générée par IA. Pour toute décision religieuse importante, consulte un savant qualifié.
            </div>
          </div>
        )}

        {/* Historique */}
        {history.length > 0 && !loading && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              Questions précédentes
            </div>
            {history.map((h, i) => (
              <button key={i} onClick={() => { setQuestion(h.q); setAnswer(h.a) }} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                marginBottom: 4, borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(201,168,76,.06)',
                color: 'var(--text-dim)', fontSize: 12, transition: 'all .15s'
              }}>
                {h.q}
              </button>
            ))}
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </>
  )
}
