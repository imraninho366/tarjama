import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

import { rateLimit } from '../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 10, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, color')

    if (!profiles?.length) return res.json({ leaderboard: [] })

    const { data: progress } = await supabase
      .from('progress')
      .select('user_id, niveau')

    const stats = {}
    profiles.forEach(p => {
      stats[p.id] = { username: p.username, color: p.color, total: 0, excellent: 0 }
    })

    progress?.forEach(r => {
      if (!stats[r.user_id]) return
      stats[r.user_id].total++
      if (r.niveau === 'excellent' || r.niveau === 'good') stats[r.user_id].excellent++
    })

    const leaderboard = Object.values(stats)
      .filter(s => s.total > 0)
      .sort((a, b) => b.excellent - a.excellent || b.total - a.total)
      .slice(0, 20)

    res.json({ leaderboard })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
