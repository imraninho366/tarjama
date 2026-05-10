import { rateLimit } from '../../lib/rateLimit'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function getDuelVerse() {
  const shortSourates = [1, 103, 108, 112, 113, 114, 97, 99, 100, 101, 102, 104, 105, 106, 107, 109, 110, 111]
  const VERSE_COUNTS = { 1:7, 97:5, 99:8, 100:11, 101:11, 102:8, 103:3, 104:9, 105:5, 106:4, 107:7, 108:3, 109:6, 110:3, 111:5, 112:4, 113:5, 114:6 }
  const sNum = shortSourates[Math.floor(Math.random() * shortSourates.length)]
  const vNum = Math.floor(Math.random() * (VERSE_COUNTS[sNum] || 3)) + 1
  return { sourate_num: sNum, verse_num: vNum }
}

export default async function handler(req, res) {
  const { ok } = rateLimit(req, { limit: 15, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  if (req.method === 'POST') {
    const { action, code, user_id, username, score } = req.body

    if (action === 'create') {
      const duelCode = generateCode()
      const verse = getDuelVerse()
      const { error } = await supabase.from('duels').insert({
        code: duelCode,
        sourate_num: verse.sourate_num,
        verse_num: verse.verse_num,
        player1_id: user_id,
        player1_name: username,
        status: 'waiting'
      })
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ code: duelCode, ...verse })
    }

    if (action === 'join') {
      const { data: duel } = await supabase.from('duels').select('*').eq('code', code).single()
      if (!duel) return res.status(404).json({ error: 'Duel introuvable' })
      if (duel.status !== 'waiting') return res.status(400).json({ error: 'Duel déjà commencé' })

      await supabase.from('duels').update({
        player2_id: user_id,
        player2_name: username,
        status: 'active'
      }).eq('code', code)

      return res.json({ code, sourate_num: duel.sourate_num, verse_num: duel.verse_num, opponent: duel.player1_name })
    }

    if (action === 'submit') {
      const { data: duel } = await supabase.from('duels').select('*').eq('code', code).single()
      if (!duel) return res.status(404).json({ error: 'Duel introuvable' })

      const isP1 = duel.player1_id === user_id
      const update = isP1 ? { player1_score: score } : { player2_score: score }

      if ((isP1 && duel.player2_score !== null) || (!isP1 && duel.player1_score !== null)) {
        update.status = 'finished'
      }

      await supabase.from('duels').update(update).eq('code', code)
      return res.json({ ok: true })
    }

    if (action === 'status') {
      const { data: duel } = await supabase.from('duels').select('*').eq('code', code).single()
      if (!duel) return res.status(404).json({ error: 'Duel introuvable' })
      return res.json(duel)
    }
  }

  res.status(405).end()
}
