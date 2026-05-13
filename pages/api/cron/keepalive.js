import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  // Vercel Cron jobs send a GET request — verify the secret header
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error) throw error

    const { error: keepErr } = await supabase.from('keepalive').upsert(
      { id: 1, pinged_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    if (keepErr) console.error('[keepalive] upsert failed:', keepErr.message)

    return res.status(200).json({ ok: true, pingedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[keepalive] Supabase ping failed:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
