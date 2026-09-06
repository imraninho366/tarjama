import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'
import Button from '../components/common/Button'

const MIN = 10
const MAX = 1000

/**
 * Boîte à idées.
 *
 * Les suggestions sont privées : la politique RLS « lire ses suggestions ou
 * toutes si admin » laisse chacun relire les siennes, et seul l'admin voit
 * celles de tout le monde (page /admin).
 */
export default function SuggestionsPage({ user }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [mine, setMine] = useState([])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('suggestions')
      .select('id, message, created_at, handled')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        // Un échec de lecture ne doit pas empêcher d'envoyer une idée :
        // on loggue et on laisse le formulaire utilisable.
        if (err) { console.error('[suggestions] lecture:', err.message); return }
        setMine(data || [])
      })

    return () => { cancelled = true }
  }, [user])

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    const text = message.trim()
    if (text.length < MIN) return setError(`Décris ton idée en quelques mots (${MIN} caractères minimum).`)
    if (text.length > MAX) return setError(`C'est un peu long — ${MAX} caractères maximum.`)

    setSending(true)
    const { data, error: err } = await supabase
      .from('suggestions')
      .insert({ user_id: user.id, message: text })
      .select()
      .single()
    setSending(false)

    if (err) {
      console.error('[suggestions] envoi:', err.message)
      setError("Ton idée n'a pas pu être envoyée. Réessaie dans un instant.")
      return
    }

    setMine(prev => [data, ...prev])
    setMessage('')
    setSent(true)
  }

  if (!user) return null

  const remaining = MAX - message.trim().length

  return (
    <>
      <Head><title>Proposer une idée — Tarjama</title></Head>

      <div className="max-w-[600px] mx-auto px-4">

        {/* En-tête */}
        <div className="text-center pt-5 pb-2">
          <div className="font-arabic text-[28px] text-primary-dim" dir="rtl" lang="ar">اقتراحاتك</div>
          <h1 className="text-[13px] text-[color:var(--tarjama-color-text-secondary)] mt-1 font-body font-normal">
            Quelle fonctionnalité aimerais-tu voir sur Tarjama ?
          </h1>
        </div>

        <p className="text-[13px] text-[color:var(--tarjama-color-text-secondary)] leading-relaxed text-center mb-6">
          Tarjama est construite pour toi. Dis ce qui te manque — un type
          d&apos;exercice, un outil, un rappel — et je ferai tout mon possible,
          in shâ&apos; Allah, pour l&apos;ajouter.
        </p>

        {/* Formulaire */}
        <form onSubmit={submit} className="mb-6">
          <label htmlFor="idea" className="block text-xs font-semibold text-[color:var(--tarjama-color-text-secondary)] mb-1.5">
            Ton idée
          </label>
          <textarea
            id="idea"
            value={message}
            onChange={(e) => { setMessage(e.target.value); setSent(false) }}
            rows={5}
            maxLength={MAX}
            placeholder="Ex : pouvoir réviser uniquement les mots que j'ai ratés au quiz."
            className="w-full bg-surface border border-[rgba(var(--tarjama-color-primary-rgb),0.12)] text-[color:var(--tarjama-color-text)] px-3.5 py-3 rounded-md font-body text-[15px] leading-relaxed resize-y transition-all duration-200 placeholder:text-[color:var(--tarjama-color-text-muted)] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(var(--tarjama-color-primary-rgb),0.15)] max-sm:text-base"
          />

          <div className="h-5 mt-1.5 mb-3 text-[11px] text-[color:var(--tarjama-color-text-secondary)] text-right">
            {remaining < 100 ? `${remaining} caractères restants` : ''}
          </div>

          <Button type="submit" full disabled={sending}>
            {sending ? 'Envoi…' : 'Envoyer mon idée'}
          </Button>
        </form>

        {error && (
          <div className="text-error text-[13px] text-center mb-6 p-2.5 bg-[rgba(var(--tarjama-color-error-rgb,220,38,38),0.12)] rounded-sm" role="alert">
            {error}
          </div>
        )}

        {sent && !error && (
          <div className="text-success text-[13px] text-center mb-6 p-3 bg-[rgba(var(--tarjama-color-success-rgb,45,122,79),0.12)] rounded-sm" role="status">
            Merci — ton idée est bien arrivée. Je lis tout.
          </div>
        )}

        {/* Historique personnel */}
        {mine.length > 0 && (
          <div className="pb-10">
            <h2 className="text-[9px] text-primary-dim uppercase tracking-[3px] mb-4 text-center font-body font-bold">
              Tes idées envoyées
            </h2>

            <div className="flex flex-col gap-2">
              {mine.map(s => (
                <div
                  key={s.id}
                  className="p-4 rounded-md bg-[rgba(var(--tarjama-color-primary-rgb),0.03)] border border-[rgba(var(--tarjama-color-primary-rgb),0.06)]"
                >
                  <div className="text-[14px] text-[color:var(--tarjama-color-text)] leading-relaxed whitespace-pre-wrap">
                    {s.message}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-[color:var(--tarjama-color-text-secondary)]">
                      {new Date(s.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                    {s.handled && (
                      <span className="text-[10px] text-success uppercase tracking-[1.5px] font-bold">
                        ✓ Prise en compte
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
