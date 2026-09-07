import { rateLimit } from '../../lib/rateLimit'
import { versetsDeSourate } from '../../lib/quranSource'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 30, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const { num } = req.query
  if (!num || isNaN(num) || num < 1 || num > 114) {
    return res.status(400).json({ error: 'Numéro de sourate invalide (1-114)' })
  }

  /*
   * Le retrait de la Basmala et la numerotation vivent desormais dans
   * lib/quranSource.js, partages avec /api/humeur.
   *
   * Ce qui se trouvait ici comparait le texte a la chaine brute « بسم الله »,
   * alors que l'edition ar.asem ecrit « بِسۡمِ ٱللَّهِ » — avec voyelles, alef
   * wasla et yeh persan. La comparaison echouait TOUJOURS : la Basmala restait
   * collee devant le verset 1 de 112 sourates.
   *
   * Et le piege : ce code retirait l'AYAH entiere, puis renumerotait avec
   * { n: i + 1 }. Faire « marcher » sa comparaison aurait supprime le vrai
   * verset 1 et decale toute la sourate d'un cran. La numerotation n'etait
   * juste que parce que le filtre ne filtrait rien.
   */
  try {
    return res.status(200).json(await versetsDeSourate(num))
  } catch (err) {
    console.error('Sourate fetch error:', err.message)
    return res.status(500).json({ error: 'Impossible de charger la sourate' })
  }
}
