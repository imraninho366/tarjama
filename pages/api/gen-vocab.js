import { callAIJSON } from '../../lib/ai'
import { rateLimit } from '../../lib/rateLimit'
import { requireAdmin } from '../../lib/apiAuth'

/**
 * TRADUCTION de gloses vérifiées — et non plus génération de définitions.
 *
 * ═══ CE QUE FAISAIT CETTE ROUTE, ET POURQUOI C'ÉTAIT FAUX ═══
 *
 * Elle envoyait une liste de mots arabes à l'IA en lui demandant leur sens.
 * Autrement dit : « souviens-toi de ce que veut dire ce mot ». Un modèle ne
 * s'en souvient pas, il produit du plausible — et sur des lots de 40, il
 * perdait l'alignement entre les mots reçus et les sens renvoyés.
 *
 * Résultat mesuré le 7 septembre 2026 sur les 6344 entrées produites :
 *   - قلب, دين et ولي portaient tous les trois le sens « naître/enfant »
 *   - موسي (Moïse) était traduit « auprès de »
 *   - ليس (n'est pas) était traduit « Dieu/divinité »
 *   - 666 translittérations étaient des squelettes sans voyelles (« rswl »)
 *   - 924 entrées ne correspondaient à aucun mot du Coran
 *
 * Et les fréquences n'étaient pas des décomptes. L'ancien code faisait :
 *   freqMap = { 'très fréquent': 500, 'fréquent': 150, 'courant': 40, 'rare': 5 }
 * soit une valeur forfaitaire tirée d'un label deviné par l'IA. C'est pourquoi
 * 1828 mots affichaient exactement « 150× ».
 *
 * ═══ CE QU'ELLE FAIT MAINTENANT ═══
 *
 * L'arabe, la racine, la nature et la fréquence viennent du Quranic Arabic
 * Corpus — des données alignées sur le texte par des linguistes. L'IA ne reçoit
 * plus qu'un couple (mot arabe, glose anglaise vérifiée) et le traduit.
 *
 * La translittération n'est plus demandée non plus : elle se dérive de l'arabe
 * par des règles (scripts/translitterer.py), ce qui retire un tiers de la
 * charge de sortie et supprime les « rswl » que le modèle produisait.
 *
 * Elle ne choisit plus ce qu'un mot veut dire. Elle ne peut donc plus écrire
 * « قلب = naître/enfant » : le sens anglais lui est imposé.
 *
 * ET L'ALIGNEMENT EST VÉRIFIÉ. La réponse doit renvoyer chaque mot arabe avec
 * sa traduction ; le lot entier est refusé si un seul mot ne correspond pas.
 * C'est ce contrôle qui manquait et qui a laissé passer le décalage.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 30, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  const user = await requireAdmin(req, res)
  if (!user) return

  // [{ar: "قَلْب", en: "heart"}]
  const { batch } = req.body
  if (!Array.isArray(batch) || batch.length === 0) {
    return res.status(400).json({ error: 'batch manquant' })
  }

  const lignes = batch.map((w, i) => `${i + 1}. ${w.ar} = ${w.en}`).join('\n')

  const prompt = `Traduis en français le sens de chaque mot arabe coranique.
Le sens anglais est donné : il fait foi, ne le contredis pas, traduis-le.

${lignes}

Règles :
- Français simple et court (1 à 4 mots), comme dans un dictionnaire
- Recopie le mot arabe EXACTEMENT tel qu'il est écrit ci-dessus
- Exactement ${batch.length} entrées, dans le même ordre

Réponds UNIQUEMENT en JSON :
{"mots":[{"ar":"mot arabe recopié","fr":"sens français"}]}`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0, maxTokens: 3000, route: 'gen-vocab'
  })
  if (!aiOk) return res.status(status).json({ error })

  if (!Array.isArray(result?.mots)) {
    console.error('[gen-vocab] format inattendu:', JSON.stringify(result).slice(0, 200))
    return res.status(502).json({ error: 'Réponse IA inattendue' })
  }

  /*
   * CONTRÔLE D'ALIGNEMENT — le garde-fou qui manquait.
   *
   * On ne se fie pas à l'ordre : on exige que chaque entrée renvoyée porte le
   * mot arabe d'origine. Un lot mal aligné est refusé en entier plutôt que
   * d'introduire des sens attribués au mauvais mot.
   */
  if (result.mots.length !== batch.length) {
    return res.status(502).json({
      error: `Lot désaligné : ${result.mots.length} réponses pour ${batch.length} mots.`,
    })
  }

  /*
   * Comparaison sur le SQUELETTE CONSONANTIQUE, pas sur la graphie exacte.
   *
   * L'IA recopie parfois le mot en normalisant une voyelle ou une chadda —
   * « نَبِىّ » pour « نَّبِىّ ». Ce n'est pas un désalignement, et refuser le lot
   * pour ça bloquerait la reconstruction sans rien protéger.
   *
   * En revanche les consonnes doivent correspondre : c'est ce qui garantit que
   * la traduction porte bien sur le mot demandé. Et le mot CONSERVÉ reste
   * toujours celui du corpus, jamais la version renvoyée par le modèle.
   */
  const squelette = (s) => (s || '')
    .normalize('NFC')
    .replace(/[ً-ْٰـۖ-ۭ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/\s+/g, '')

  const mots = []
  for (let i = 0; i < batch.length; i++) {
    const attendu = batch[i].ar
    const recu = result.mots[i]
    if (!recu?.ar || squelette(recu.ar) !== squelette(attendu)) {
      return res.status(502).json({
        error: `Lot désaligné à la position ${i + 1} : attendu « ${attendu} », reçu « ${recu?.ar || '—'} ».`,
      })
    }
    if (!recu.fr?.trim()) {
      return res.status(502).json({ error: `Traduction vide pour « ${attendu} ».` })
    }
    mots.push({ ar: attendu, fr: recu.fr.trim() })
  }

  return res.status(200).json({ mots })
}
