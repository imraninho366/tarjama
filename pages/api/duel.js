import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
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

function generateSeed() {
  return Math.floor(Math.random() * 1000000)
}

/**
 * Recupere le pseudo depuis la base plutot que depuis la requete.
 *
 * Le navigateur envoyait son propre `username`, donc n'importe qui pouvait
 * s'annoncer sous le nom d'un autre dans un duel. Le pseudo fait partie de
 * l'identite : il se lit cote serveur, a partir de l'identifiant du jeton.
 */
async function usernameOf(userId) {
  const { data, error } = await supabase
    .from('profiles').select('username').eq('id', userId).single()
  if (error) console.error('[duel] lecture du pseudo:', error.message)
  return data?.username || 'Joueur'
}

export default async function handler(req, res) {
  const { ok } = rateLimit(req, { limit: 15, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  // Un duel ecrit dans la base au nom d'un joueur : l'identite ne peut pas
  // venir du corps de la requete, qui est entierement sous controle de
  // l'appelant. Elle vient du jeton, que le navigateur ne peut pas fabriquer.
  const authUser = await requireUser(req, res)
  if (!authUser) return

  if (req.method === 'POST') {
    // user_id et username sont volontairement ABSENTS de cette destructuration
    // meme si le client les envoie encore : les lire rouvrirait la faille.
    const { action, code, score, mode } = req.body
    const user_id = authUser.id

    if (action === 'create') {
      const duelCode = generateCode()
      const verse = getDuelVerse()
      const seed = generateSeed()
      const { error } = await supabase.from('duels').insert({
        code: duelCode,
        sourate_num: verse.sourate_num,
        verse_num: verse.verse_num,
        player1_id: user_id,
        player1_name: await usernameOf(user_id),
        mode: mode || 'traduction',
        status: 'waiting'
      })
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ code: duelCode, mode: mode || 'traduction', ...verse, seed })
    }

    if (action === 'join') {
      const { data: duel, error: findErr } = await supabase.from('duels').select('*').eq('code', code).single()
      if (findErr || !duel) return res.status(404).json({ error: 'Duel introuvable' })
      if (duel.status !== 'waiting') return res.status(400).json({ error: 'Duel déjà commencé' })

      const { error: joinErr } = await supabase.from('duels').update({
        player2_id: user_id,
        player2_name: await usernameOf(user_id),
        status: 'active'
      }).eq('code', code)
      if (joinErr) return res.status(500).json({ error: joinErr.message })

      return res.json({ code, mode: duel.mode, sourate_num: duel.sourate_num, verse_num: duel.verse_num, opponent: duel.player1_name })
    }

    if (action === 'submit') {
      const { data: duel, error: findErr } = await supabase.from('duels').select('*').eq('code', code).single()
      if (findErr || !duel) return res.status(404).json({ error: 'Duel introuvable' })

      const isP1 = duel.player1_id === user_id
      const isP2 = duel.player2_id === user_id

      // Le code precedent deduisait « joueur 2 » de « pas joueur 1 ». Un
      // inconnu en possession d'un code de duel tombait donc dans la branche
      // player2 et ecrasait le score de l'adversaire. Il faut etre l'un des
      // deux joueurs, et l'appartenance se verifie, elle ne se deduit pas.
      if (!isP1 && !isP2) {
        return res.status(403).json({ error: 'Tu ne participes pas à ce duel.' })
      }

      // Le score vient du navigateur, donc reste falsifiable par nature — la
      // correction se fait cote client. On borne au moins ce qui entre en base
      // pour qu'un score absurde ne pollue pas les duels ni le classement.
      const clean = Number(score)
      if (!Number.isInteger(clean) || clean < 0 || clean > 100) {
        return res.status(400).json({ error: 'Score invalide.' })
      }

      const update = isP1 ? { player1_score: clean } : { player2_score: clean }

      if ((isP1 && duel.player2_score !== null) || (isP2 && duel.player1_score !== null)) {
        update.status = 'finished'
      }

      const { error: updateErr } = await supabase.from('duels').update(update).eq('code', code)
      if (updateErr) return res.status(500).json({ error: updateErr.message })
      return res.json({ ok: true })
    }

    if (action === 'status') {
      const { data: duel, error: statusErr } = await supabase.from('duels').select('*').eq('code', code).single()
      if (statusErr || !duel) return res.status(404).json({ error: 'Duel introuvable' })
      return res.json(duel)
    }
  }

  res.status(405).end()
}
