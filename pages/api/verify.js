import { rateLimit } from '../../lib/rateLimit'
import { requireUser } from '../../lib/apiAuth'
import { callAIJSON } from '../../lib/ai'
import { versetDeLaRequete } from '../../lib/quranSource'

/** Au-dela, ce n'est plus la traduction d'un verset — et chaque caractere
 *  consomme le quota de tokens par minute que partagent TOUS les utilisateurs. */
const LONGUEUR_MAX = 1500

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 15, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une minute.' })

  // Sans ce controle, n'importe qui pouvait boucler sur cette route
  // et vider le quota IA de la journee sans meme avoir de compte.
  const user = await requireUser(req, res)
  if (!user) return

  const { user_trans } = req.body
  if (!user_trans?.trim()) return res.status(400).json({ error: 'Paramètres manquants' })
  if (user_trans.length > LONGUEUR_MAX) {
    return res.status(400).json({ error: `Ta traduction est trop longue (${LONGUEUR_MAX} caractères maximum).` })
  }

  // L'eleve est corrige sur le VRAI verset, pas sur celui que son navigateur
  // pretend afficher.
  const verset = versetDeLaRequete(req.body)
  if (!verset) return res.status(400).json({ error: 'Verset introuvable' })
  const { sourate_num, verset_num: verse_num, sourate_ar, sourate_fr, arabe: arabic } = verset


  const prompt = `Tu es un professeur de Coran bienveillant et encourageant. Évalue cette traduction avec INDULGENCE.

Verset : ${arabic}
Sourate ${sourate_num} (${sourate_ar} — ${sourate_fr}), verset ${verse_num}
${verset.traduction ? `Traduction de référence (Muhammad Hamidullah) : "${verset.traduction}"
Évalue l'élève PAR RAPPORT À CETTE TRADUCTION, pas d'après ton souvenir du verset.
` : ''}Traduction de l'élève : "${user_trans}"

RÈGLES D'ÉVALUATION (sois GÉNÉREUX) :
- "excellent" : le sens général est compris, même si les mots exacts diffèrent
- "good" : l'idée principale est là, même avec des approximations
- "partial" : au moins une partie du sens est correcte
- "wrong" : SEULEMENT si la traduction n'a aucun rapport avec le verset

IMPORTANT : un synonyme ou une reformulation est TOUJOURS accepté. Ne pénalise JAMAIS pour le style ou le choix des mots si le sens est correct. L'élève apprend, encourage-le !

Réponds UNIQUEMENT avec ce JSON :
{"niveau":"excellent|good|partial|wrong","emoji":"✅|👍|🔄|💪","titre":"4 mots max encourageants","message":"feedback BIENVEILLANT et encourageant, 2-3 phrases. Félicite d'abord ce qui est bien, puis suggère doucement ce qui peut être amélioré","mots_importants":[{"ar":"mot","fr":"sens"}],"mot_manque":"concept manquant ou null"}`

  const { ok: aiOk, data: result, error, status } = await callAIJSON({
    prompt, temperature: 0.2, route: 'verify'
  })
  if (!aiOk) return res.status(status).json({ error })

  /*
   * La « traduction de reference » affichee apres chaque correction etait
   * ECRITE PAR L'IA (champ traduction_ref du JSON). C'est exactement ce que la
   * regle du projet interdit : un modele ne recite pas le Coran, il le
   * reconstitue. Or la traduction de Hamidullah, verifiee verset par verset,
   * est embarquee cote serveur. Elle remplace celle du modele ; si elle manque,
   * on n'affiche rien plutot qu'une traduction inventee.
   */
  return res.status(200).json({ ...result, traduction_ref: verset.traduction || null })
}
