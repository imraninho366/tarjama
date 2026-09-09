import { rateLimit } from '../../lib/rateLimit'
import { requireUser, clientDeLAppelant } from '../../lib/apiAuth'
import { createClient } from '@supabase/supabase-js'
import { callAIJSON } from '../../lib/ai'
import { questionsVocab, questionsPubliques } from '../../lib/duelQuestions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const NB_QUESTIONS = 5

/** Modes dont les questions sont fabriquees et corrigees par le serveur. */
const MODES_QUIZ = ['quiz-islam', 'quiz-vocab']

/**
 * Plafond du malus de lenteur, en secondes.
 *
 * POURQUOI 15 ET PAS PLUS
 * Une bonne reponse vaut 100 moins le temps de reflexion, plafonne ici. Pour
 * que la vitesse ne renverse jamais le savoir, le malus cumule sur tout le
 * quiz doit rester inferieur a UNE bonne reponse :
 *
 *   5 bonnes reponses les plus lentes  -> 5 x 85 / 5 = 85
 *   4 bonnes reponses instantanees     -> 4 x 100 / 5 = 80
 *
 * Celui qui en sait plus gagne toujours ; la vitesse ne departage qu'a savoir
 * egal. Passer ce plafond a 20 rendrait les deux cas ex aequo, et au-dela le
 * plus rapide battrait le plus savant — l'inverse du but de l'application.
 */
const MALUS_MAX_S = 15

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

/**
 * Questions du quiz Islam, fabriquees UNE fois pour le duel.
 *
 * L'ancien code laissait chaque navigateur appeler /api/quiz-islam avec la
 * meme graine, en comptant sur le cache pour servir les memes questions aux
 * deux joueurs. Mais ce cache est une Map en memoire, propre a chaque instance
 * serverless : les deux joueurs, servis par des instances differentes,
 * affrontaient en realite deux quiz sans rapport.
 */
async function questionsIslam() {
  const prompt = `Génère ${NB_QUESTIONS} questions à choix multiples sur l'Islam, variées en difficulté.
Sujets possibles : piliers de l'Islam, piliers de la foi, prophètes, sourates, hadiths, histoire islamique, vocabulaire arabe, pratique religieuse.

IMPORTANT : les questions doivent être FACTUELLES et vérifiables, pas d'opinions.

Réponds UNIQUEMENT en JSON valide :
{"questions":[{"question":"La question ?","choices":["Choix A","Choix B","Choix C","Choix D"],"correct":0,"explanation":"Explication courte de la bonne réponse avec source si possible"}]}`

  const { ok, data, error } = await callAIJSON({ prompt, temperature: 0.5, route: 'quiz-islam' })
  if (!ok) return { erreur: error }

  const brutes = data?.questions
  if (!Array.isArray(brutes) || brutes.length < NB_QUESTIONS) {
    console.error('[duel] quiz-islam, format inattendu:', JSON.stringify(data).slice(0, 200))
    return { erreur: 'Les questions n’ont pas pu être préparées. Réessaie.' }
  }

  // Une question dont l'index de bonne reponse ne designe aucune proposition
  // serait impossible a gagner. Mieux vaut refuser le duel que le fausser.
  const questions = brutes.slice(0, NB_QUESTIONS).map(q => ({
    ar: null, translit: null,
    question: q.question,
    choices: q.choices,
    correct: q.correct,
    explication: q.explanation || null,
  }))
  const valide = questions.every(q =>
    typeof q.question === 'string' && Array.isArray(q.choices) && q.choices.length >= 2 &&
    Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.choices.length
  )
  if (!valide) {
    console.error('[duel] quiz-islam, question invalide')
    return { erreur: 'Les questions n’ont pas pu être préparées. Réessaie.' }
  }
  return { questions }
}

/**
 * Score d'un joueur a partir de ses reponses horodatees PAR LE SERVEUR.
 *
 * Chaque bonne reponse vaut 100 moins le temps de reflexion en secondes,
 * plafonne a MALUS_MAX_S ; une mauvaise vaut 0. Le temps de reflexion d'une
 * question est l'ecart avec la reponse precedente — pour la premiere, l'ecart
 * avec le moment ou le joueur a recu ses questions.
 */
function calculerScore(questions, reponses, debutMs) {
  let precedent = debutMs
  let total = 0
  for (let i = 0; i < questions.length; i++) {
    const r = reponses[i]
    const secondes = Math.max(0, (r.at - precedent) / 1000)
    precedent = r.at
    if (r.choice !== questions[i].correct) continue
    total += 100 - Math.min(secondes, MALUS_MAX_S)
  }
  return Math.round(total / questions.length)
}

/**
 * Vue d'un duel autorisee a sortir vers le navigateur.
 *
 * Tant que la partie n'est pas finie, trois choses restent cote serveur :
 *
 *   * les bonnes reponses — les envoyer reviendrait a donner le corrige avant
 *     que le joueur ait choisi ;
 *   * les reponses de l'adversaire ;
 *   * le SCORE de l'adversaire. Les deux joueurs ne finissent pas ensemble :
 *     celui qui termine en second verrait le score a battre, et saurait s'il
 *     peut se permettre de reflechir ou s'il doit tout donner.
 *
 * Une fois la partie finie, tout s'ouvre : c'est ce qui permet a chacun de
 * revoir ses erreurs.
 */
function duelPublic(duel, userId) {
  const fini = duel.status === 'finished'
  if (fini) return duel

  const estP1 = duel.player1_id === userId
  return {
    ...duel,
    questions: questionsPubliques(duel.questions),
    player1_answers: undefined,
    player2_answers: undefined,
    player1_score: estP1 ? duel.player1_score : null,
    player2_score: estP1 ? null : duel.player2_score,
  }
}

export default async function handler(req, res) {
  // 15 appels/minute etait sous le trafic normal d'un seul duel : la salle
  // d'attente interroge le serveur toutes les 3 s, soit 20 appels/minute a
  // elle seule, auxquels s'ajoutent les cinq reponses du quiz. Passe le
  // plafond, le serveur repondait 429 et le duel ne demarrait jamais.
  const { ok } = rateLimit(req, { limit: 60, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })

  // Un duel ecrit dans la base au nom d'un joueur : l'identite ne peut pas
  // venir du corps de la requete, qui est entierement sous controle de
  // l'appelant. Elle vient du jeton, que le navigateur ne peut pas fabriquer.
  const authUser = await requireUser(req, res)
  if (!authUser) return

  /*
   * Les operations sur `duels` passent par un client qui porte le jeton de
   * l'appelant, et non par le client anonyme du module.
   *
   * Sans cela, PostgreSQL voyait cette route comme un visiteur anonyme :
   * `auth.uid()` valait null, et la table ne pouvait pas etre protegee sans
   * casser le duel en meme temps. Mesure faite le 9 septembre 2026 : la table
   * renvoyait 17 lignes a un appelant sans compte, avec les identifiants, les
   * pseudos et les codes de partie.
   */
  const db = clientDeLAppelant(req)

  if (req.method !== 'POST') return res.status(405).end()

  // user_id et username sont volontairement ABSENTS de cette destructuration
  // meme si le client les envoie encore : les lire rouvrirait la faille.
  const { action, code, score, mode, round, choice } = req.body
  const user_id = authUser.id

  /** Charge le duel et situe l'appelant dedans. */
  const chargerDuel = async () => {
    const { data: duel, error } = await db.from('duels').select('*').eq('code', code).single()
    if (error || !duel) return { erreur: 'Duel introuvable', statut: 404 }
    const isP1 = duel.player1_id === user_id
    const isP2 = duel.player2_id === user_id
    // Le code precedent deduisait « joueur 2 » de « pas joueur 1 ». Un inconnu
    // en possession d'un code de duel tombait donc dans la branche player2 et
    // ecrasait le score de l'adversaire. L'appartenance se verifie, elle ne se
    // deduit pas.
    if (!isP1 && !isP2) return { erreur: 'Tu ne participes pas à ce duel.', statut: 403 }
    return { duel, isP1 }
  }

  if (action === 'create') {
    const duelCode = generateCode()
    const verse = getDuelVerse()
    const choisi = mode || 'traduction'

    // Les questions sont fabriquees maintenant, une fois pour les deux
    // joueurs, et rangees dans la ligne du duel.
    let questions = null
    if (choisi === 'quiz-vocab') {
      questions = questionsVocab(verse.sourate_num * 1000 + verse.verse_num, NB_QUESTIONS)
      if (!questions) return res.status(500).json({ error: 'Vocabulaire indisponible. Réessaie.' })
    } else if (choisi === 'quiz-islam') {
      const r = await questionsIslam()
      if (r.erreur) return res.status(502).json({ error: r.erreur })
      questions = r.questions
    }

    const { error } = await db.from('duels').insert({
      code: duelCode,
      sourate_num: verse.sourate_num,
      verse_num: verse.verse_num,
      player1_id: user_id,
      player1_name: await usernameOf(user_id),
      mode: choisi,
      questions,
      status: 'waiting'
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ code: duelCode, mode: choisi, ...verse })
  }

  if (action === 'join') {
    const { data: duel, error: findErr } = await db.from('duels').select('*').eq('code', code).single()
    if (findErr || !duel) return res.status(404).json({ error: 'Duel introuvable' })
    if (duel.status !== 'waiting') return res.status(400).json({ error: 'Duel déjà commencé' })
    // Se rejoindre soi-meme donnerait un duel a un seul joueur, gagne d'avance.
    if (duel.player1_id === user_id) {
      return res.status(400).json({ error: 'Tu ne peux pas rejoindre ton propre duel.' })
    }

    const { error: joinErr } = await db.from('duels').update({
      player2_id: user_id,
      player2_name: await usernameOf(user_id),
      status: 'active'
    }).eq('code', code)
    if (joinErr) return res.status(500).json({ error: joinErr.message })

    return res.json({ code, mode: duel.mode, sourate_num: duel.sourate_num, verse_num: duel.verse_num, opponent: duel.player1_name })
  }

  /*
   * Remet ses questions au joueur ET declenche son chronometre.
   *
   * Les deux se font ensemble a dessein : le temps de reflexion se compte a
   * partir du moment ou le joueur a effectivement recu de quoi jouer. Le
   * chronometre appartient donc au serveur, pas au navigateur — un joueur ne
   * peut pas se declarer plus rapide qu'il ne l'a ete.
   */
  if (action === 'questions') {
    const { duel, isP1, erreur, statut } = await chargerDuel()
    if (erreur) return res.status(statut).json({ error: erreur })
    if (!MODES_QUIZ.includes(duel.mode)) return res.status(400).json({ error: 'Ce mode n’a pas de questions.' })

    const champ = isP1 ? 'player1_started_at' : 'player2_started_at'
    // Rejouer cet appel ne remet pas le chronometre a zero : sinon il
    // suffirait de recharger la page avant chaque reponse pour paraitre
    // instantane.
    if (!duel[champ]) {
      const { error } = await db.from('duels').update({ [champ]: new Date().toISOString() }).eq('code', code)
      if (error) return res.status(500).json({ error: error.message })
    }
    return res.json({ questions: questionsPubliques(duel.questions) })
  }

  /*
   * Enregistre UNE reponse et renvoie la correction.
   *
   * Le navigateur ne recoit la bonne reponse qu'apres avoir envoye la sienne :
   * c'est ce qui rend le score inattaquable. Auparavant, il connaissait le
   * corrige des le chargement et calculait lui-meme le score final — il
   * suffisait d'envoyer 100.
   */
  if (action === 'answer') {
    const { duel, isP1, erreur, statut } = await chargerDuel()
    if (erreur) return res.status(statut).json({ error: erreur })
    if (!MODES_QUIZ.includes(duel.mode)) return res.status(400).json({ error: 'Ce mode n’a pas de questions.' })

    const champ = isP1 ? 'player1_answers' : 'player2_answers'
    const reponses = Array.isArray(duel[champ]) ? duel[champ] : []
    const questions = duel.questions || []

    // Les questions se repondent dans l'ordre, une seule fois chacune : sans
    // cela on pourrait repondre deux fois a la meme et se fabriquer un score.
    if (round !== reponses.length) {
      return res.status(409).json({ error: 'Question déjà répondue.' })
    }
    if (round >= questions.length) return res.status(400).json({ error: 'Quiz terminé.' })

    const q = questions[round]
    if (!Number.isInteger(choice) || choice < 0 || choice >= q.choices.length) {
      return res.status(400).json({ error: 'Réponse invalide.' })
    }

    const suivantes = [...reponses, { choice, at: Date.now() }]
    const update = { [champ]: suivantes }

    // Derniere question : le serveur corrige et arrete le chronometre.
    if (suivantes.length === questions.length) {
      const debut = duel[isP1 ? 'player1_started_at' : 'player2_started_at']
      const debutMs = debut ? new Date(debut).getTime() : suivantes[0].at
      const monScore = calculerScore(questions, suivantes, debutMs)
      update[isP1 ? 'player1_score' : 'player2_score'] = monScore
      const scoreAdverse = isP1 ? duel.player2_score : duel.player1_score
      if (scoreAdverse !== null && scoreAdverse !== undefined) update.status = 'finished'
    }

    const { error } = await db.from('duels').update(update).eq('code', code)
    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      juste: choice === q.correct,
      correct: q.correct,
      explication: q.explication,
      termine: suivantes.length === questions.length,
    })
  }

  /*
   * Score du mode Traduction, envoye par le navigateur.
   *
   * Ce mode reste corrige cote client parce que la note vient de l'IA
   * (/api/verify) : la refaire ici doublerait le cout et la latence de chaque
   * duel. Le score reste donc falsifiable dans ce mode-la — contrairement aux
   * deux quiz. On borne au moins ce qui entre en base pour qu'un score absurde
   * ne pollue ni les duels ni le classement.
   */
  if (action === 'submit') {
    const { duel, isP1, erreur, statut } = await chargerDuel()
    if (erreur) return res.status(statut).json({ error: erreur })
    if (MODES_QUIZ.includes(duel.mode)) {
      return res.status(400).json({ error: 'Ce mode est corrigé par le serveur.' })
    }

    const clean = Number(score)
    if (!Number.isInteger(clean) || clean < 0 || clean > 100) {
      return res.status(400).json({ error: 'Score invalide.' })
    }

    const update = isP1 ? { player1_score: clean } : { player2_score: clean }
    const scoreAdverse = isP1 ? duel.player2_score : duel.player1_score
    if (scoreAdverse !== null && scoreAdverse !== undefined) update.status = 'finished'

    const { error: updateErr } = await db.from('duels').update(update).eq('code', code)
    if (updateErr) return res.status(500).json({ error: updateErr.message })
    return res.json({ ok: true })
  }

  if (action === 'status') {
    const { data: duel, error: statusErr } = await db.from('duels').select('*').eq('code', code).single()
    if (statusErr || !duel) return res.status(404).json({ error: 'Duel introuvable' })
    return res.json(duelPublic(duel, user_id))
  }

  return res.status(400).json({ error: 'Action inconnue.' })
}
