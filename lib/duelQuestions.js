import fs from 'fs'
import path from 'path'

/**
 * Construction des questions d'un duel, COTE SERVEUR.
 *
 * POURQUOI CE FICHIER EXISTE
 * Les questions etaient fabriquees par le navigateur de chaque joueur, a
 * partir d'une graine commune. Deux consequences, toutes deux constatees le
 * 9 septembre 2026 :
 *
 * 1. Le quiz Islam ne posait PAS les memes questions aux deux joueurs. Ses
 *    questions viennent de l'IA, mises en cache par graine — mais le cache est
 *    une Map en memoire, donc propre a chaque instance serverless. Deux
 *    joueurs tombent presque toujours sur des instances differentes.
 *
 * 2. Le navigateur connaissait la bonne reponse avant que le joueur choisisse,
 *    et c'est lui qui calculait le score final. Rien n'empechait d'envoyer 100.
 *
 * Les questions sont desormais fabriquees une seule fois, a la creation du
 * duel, et rangees dans la ligne. Les deux joueurs lisent les memes ; le
 * serveur garde les bonnes reponses pour lui et corrige lui-meme.
 */

/**
 * Tirage aleatoire reproductible (generateur de Lehmer).
 *
 * La graine doit rester dans [1, 2147483646] : a zero, la suite reste bloquee
 * sur zero et servirait cinq fois le meme mot.
 */
export function makeRng(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function shuffleSeeded(arr, rnd) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Reservoir de mots pour le quiz de vocabulaire.
 *
 * Le tirage uniforme sur les 4941 mots du dictionnaire faisait tomber pres
 * d'une question sur deux sur un mot « rare » que personne ne reconnait. Les
 * rares sont ecartes, et les plus courants comptent plusieurs fois : ils
 * sortent plus souvent sans faire disparaitre les simplement « frequents ».
 */
const POIDS_FREQUENCE = { 'très fréquent': 4, 'courant': 3, 'fréquent': 1 }

let cacheReservoir = null

function reservoirVocab() {
  // Le fichier fait 4941 entrees : on le lit une fois par instance, pas a
  // chaque duel.
  if (cacheReservoir) return cacheReservoir

  const brut = fs.readFileSync(
    path.join(process.cwd(), 'public', 'quran_vocab.json'), 'utf8'
  )
  const mots = JSON.parse(brut).mots || []

  const pool = []
  for (const w of mots) {
    const poids = POIDS_FREQUENCE[w.freq_label]
    // Sans sens defini, la proposition s'afficherait « ? ».
    if (!poids || !w.sens?.[0] || w.en_attente) continue
    // Les noms divins sont ecartes : 51 des 91 ont un quasi-jumeau dans le
    // corpus — « ٱلْعَلِيمُ » = « L'Omniscient » face a « عَلِيم » = « Omniscient ».
    // Ils fourniraient des distracteurs impossibles a departager, et un duel
    // se perd sur une question sans reponse.
    if (w.categorie === '99 noms') continue
    for (let i = 0; i < poids; i++) pool.push(w)
  }

  cacheReservoir = pool
  return pool
}

/**
 * Cinq questions de vocabulaire, deterministes pour une graine donnee.
 *
 * @returns {Array|null} null si le reservoir est trop pauvre pour batir un
 *   quiz honnete — l'appelant doit alors refuser de creer le duel plutot que
 *   de servir des questions incompletes.
 */
export function questionsVocab(seed, nb = 5) {
  const pool = reservoirVocab()
  if (pool.length < 20) return null

  const rnd = makeRng(seed)
  const pick = () => pool[Math.floor(rnd() * pool.length)]

  const qs = []
  const motsVus = new Set()
  // Borne de securite : sans elle, un reservoir trop pauvre en sens distincts
  // ferait tourner la boucle indefiniment.
  let tours = 0

  while (qs.length < nb && tours++ < 500) {
    const target = pick()
    if (motsVus.has(target.ar)) continue
    motsVus.add(target.ar)

    // Les distracteurs doivent avoir un sens DIFFERENT de la bonne reponse.
    // Tires au hasard dans tout le dictionnaire, deux mots pouvaient partager
    // la meme traduction : la question avait alors deux bonnes reponses, et le
    // joueur en perdait une injustement.
    const sensPris = new Set([target.sens[0].toLowerCase()])
    const wrongs = []
    let essais = 0
    while (wrongs.length < 3 && essais++ < 200) {
      const c = pick()
      const sens = c.sens?.[0]?.toLowerCase()
      if (!sens || sensPris.has(sens)) continue
      sensPris.add(sens)
      wrongs.push(c)
    }
    if (wrongs.length < 3) continue

    const choices = shuffleSeeded([target, ...wrongs], rnd)
    qs.push({
      ar: target.ar,
      translit: target.translit,
      question: null,
      choices: choices.map(c => c.sens[0]),
      correct: choices.findIndex(c => c.ar === target.ar),
      explication: null,
    })
  }

  return qs.length === nb ? qs : null
}

/**
 * Retire des questions tout ce que le joueur ne doit pas voir avant d'avoir
 * repondu. C'est la seule forme qui a le droit de sortir vers le navigateur.
 */
export function questionsPubliques(questions) {
  return (questions || []).map(q => ({
    ar: q.ar, translit: q.translit, question: q.question, choices: q.choices,
  }))
}
