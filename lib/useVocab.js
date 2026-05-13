import { useState, useEffect } from 'react'

let cachedVocab = null
let loadingPromise = null

export function useVocab() {
  const [vocab, setVocab] = useState(cachedVocab || [])
  const [loading, setLoading] = useState(!cachedVocab)

  useEffect(() => {
    if (cachedVocab) { setVocab(cachedVocab); setLoading(false); return }
    if (!loadingPromise) {
      loadingPromise = fetch('/quran_vocab.json')
        .then(r => r.json())
        .then(d => { cachedVocab = d.mots || []; return cachedVocab })
        .catch(() => { loadingPromise = null; return [] })
    }
    loadingPromise.then(mots => { setVocab(mots); setLoading(false) })
  }, [])

  return { vocab, loading }
}
