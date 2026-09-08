/**
 * Complete data/vocab-fr.json en traduisant les gloses encore en anglais.
 *
 * POURQUOI CE SCRIPT PLUTOT QUE LE NAVIGATEUR
 * La premiere campagne de traduction tournait dans un onglet, l'etat vivant
 * dans `window`. Naviguer detruisait le travail ; 2070 traductions n'ont ete
 * sauvees que par un minuteur qui recopiait tout dans localStorage. Et le
 * resultat devait ensuite traverser la conversation pour atteindre le disque.
 *
 * Ici tout est local et reprenable : chaque lot est ecrit sur le disque des
 * qu'il arrive. Interrompre le script ne coute que le lot en cours, et le
 * relancer reprend exactement ou il s'etait arrete.
 *
 * CE QUE L'IA FAIT, ET CE QU'ELLE NE FAIT PAS
 * Elle traduit une glose anglaise deja verifiee. Elle ne choisit jamais ce
 * qu'un mot du Coran veut dire — c'est ce qui avait produit « قلب = naitre ».
 * L'arabe, la racine, la nature et la frequence viennent du corpus et ne
 * passent pas par elle. C'est aussi pourquoi ce script ne touche JAMAIS a
 * public/quran_vocab.json : ce fichier est produit par
 * scripts/construire_dictionnaire.py, qui seul assemble les donnees verifiees.
 *
 * Usage : node scripts/traduire_vocab.mjs [nombre-max-de-mots]
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const RACINE = path.resolve(import.meta.dirname, '..')

/* ── Environnement ────────────────────────────────────────────────────────
 * Les cles vivent dans .env.prod.local (`vercel env pull --environment=
 * production`). On ne lit que les cles IA : le reste ne sert a rien ici, et
 * chaque variable chargee inutilement est une occasion de fuite.
 *
 * ATTENTION : Vercel MASQUE les variables marquees « sensible ». Elles
 * reviennent en « [SENSITIVE] », et une cle masquee chargee telle quelle est
 * pire qu'absente — le fournisseur repond 401, la bascule le compte comme une
 * panne, et on croit a un quota epuise alors qu'il reste intact. Le motif
 * couvre toute etiquette entre crochets, la formulation exacte de Vercel
 * n'etant pas un contrat. */
const MASQUEE = /^\[[A-Z_]+\]$|^\*+$|^$/
for (const nom of ['.env.prod.local', '.env.local']) {
  const chemin = path.join(RACINE, nom)
  if (!fs.existsSync(chemin)) continue
  for (const ligne of fs.readFileSync(chemin, 'utf8').split('\n')) {
    const m = ligne.match(/^([A-Z_]*_API_KEY)="?([^"\n]*)"?$/)
    if (!m || process.env[m[1]]) continue
    if (MASQUEE.test(m[2].trim())) {
      console.warn(`  ${m[1]} est masquée par Vercel — fournisseur ignoré`)
      continue
    }
    process.env[m[1]] = m[2]
  }
}

/* lib/ai.js est en ESM alors que le paquet est en CommonJS : Node refuserait
 * de l'importer tel quel. On le recopie en .mjs plutot que de redupliquer la
 * table des fournisseurs, qui finirait par diverger du vrai fichier. */
const copie = path.join(os.tmpdir(), `tarjama-ai-${process.pid}.mjs`)
fs.copyFileSync(path.join(RACINE, 'lib/ai.js'), copie)
const { callAIJSON, configuredProviders } = await import(`file://${copie}`)
fs.unlinkSync(copie)

/* ── Donnees ──────────────────────────────────────────────────────────── */
const CHEMIN_FR = path.join(RACINE, 'data/vocab-fr.json')
const base = JSON.parse(fs.readFileSync(path.join(RACINE, 'data/vocab-base-corpus.json'), 'utf8'))
const trad = JSON.parse(fs.readFileSync(CHEMIN_FR, 'utf8'))

const plafond = Number(process.argv[2]) || Infinity
const aFaire = base
  .filter(b => !trad[b.ar] && b.en)
  .sort((a, b) => (b.freq || 0) - (a.freq || 0))   // les plus frequents d'abord
  .slice(0, plafond)

console.log(`fournisseurs : ${configuredProviders().join(', ')}`)
console.log(`a traduire   : ${aFaire.length} lemmes sur ${base.length}`)
if (aFaire.length === 0) process.exit(0)

/* ── Alignement ───────────────────────────────────────────────────────────
 * Le meme garde-fou que /api/gen-vocab. On compare les squelettes
 * consonantiques : le modele renormalise parfois une voyelle en recopiant,
 * ce qui n'est pas un desalignement. Mais le mot CONSERVE est toujours celui
 * du corpus, jamais la version renvoyee par le modele. */
const squelette = s => (s || '')
  .normalize('NFC')
  .replace(/[ً-ٰٕـۖ-ۭ]/g, '')
  .replace(/[آأإٱ]/g, 'ا')
  .replace(/[ىی]/g, 'ي')
  .replace(/\s+/g, '')

async function traduireLot(lot) {
  const lignes = lot.map((w, i) => `${i + 1}. ${w.ar} = ${w.en}`).join('\n')
  const prompt = `Traduis en français le sens de chaque mot arabe coranique.
Le sens anglais est donné : il fait foi, ne le contredis pas, traduis-le.

${lignes}

Règles :
- Français simple et court (1 à 4 mots), comme dans un dictionnaire
- Recopie le mot arabe EXACTEMENT tel qu'il est écrit ci-dessus
- Exactement ${lot.length} entrées, dans le même ordre

Réponds UNIQUEMENT en JSON :
{"mots":[{"ar":"mot arabe recopié","fr":"sens français"}]}`

  const r = await callAIJSON({ prompt, temperature: 0, maxTokens: 3000, route: 'traduire-vocab' })
  if (!r.ok) return { ok: false, erreur: r.error }
  if (!Array.isArray(r.data?.mots) || r.data.mots.length !== lot.length) {
    return { ok: false, erreur: `lot désaligné : ${r.data?.mots?.length} réponses pour ${lot.length}` }
  }

  /* Un lot d'UN SEUL mot n'a pas de liste a decaler : la reponse ne peut
   * porter que sur lui. On accepte donc sa traduction meme si le modele a
   * reecrit l'arabe — il ecrit « مِنْهَج » pour « مِنْهَاج » et refuser
   * bloquerait ce mot pour toujours. La cle reste celle du corpus. */
  if (lot.length === 1) {
    const fr = r.data.mots[0]?.fr?.trim()
    if (!fr) return { ok: false, erreur: `traduction vide pour « ${lot[0].ar} »` }
    return { ok: true, sortie: [[lot[0].ar, fr]], isoles: [] }
  }

  /* Sinon on verifie chaque position. Un decalage de liste desaligne une
   * SUITE d'entrees a partir du point de rupture ; un mot isole que le modele
   * a reecrit n'en desaligne qu'une. On ne jette donc plus le lot entier : on
   * garde ce qui concorde et on renvoie les rares intrus, qui seront redemandes
   * seuls. C'est ce qui empechait les 10 derniers mots d'aboutir. */
  const sortie = [], isoles = []
  for (let i = 0; i < lot.length; i++) {
    const recu = r.data.mots[i]
    if (!recu?.ar || squelette(recu.ar) !== squelette(lot[i].ar)) {
      isoles.push(lot[i])
      continue
    }
    if (!recu.fr?.trim()) { isoles.push(lot[i]); continue }
    sortie.push([lot[i].ar, recu.fr.trim()])   // la cle reste celle du corpus
  }

  // Trop d'intrus : ce n'est plus un mot reecrit, c'est la liste qui a glisse.
  if (isoles.length > lot.length / 3) {
    return { ok: false, erreur: `lot désaligné : ${isoles.length} entrées sur ${lot.length}` }
  }
  return { ok: true, sortie, isoles }
}

/* ── Boucle ───────────────────────────────────────────────────────────────
 * UN travailleur, et une pause entre les lots.
 *
 * Six travailleurs en parallele avaient sature Gemini, OpenRouter et Mistral
 * en quelques minutes ; deux suffisaient a depasser Groq. La limite n'est pas
 * le temps de calcul mais le DEBIT EN TOKENS — Groq plafonne a 8000 par
 * minute — et paralleliser ne fait que le franchir plus vite, pour ne
 * recolter que des 429.
 *
 * Un lot de 10 mots coute environ 1000 tokens aller-retour. A une pause de
 * 9 s on tourne vers 6700 tokens/minute : sous la limite, sans marge inutile.
 * C'est plus lent en apparence et bien plus rapide en pratique, parce que
 * chaque lot compte. */
const TAILLE_LOT = 10
const TRAVAILLEURS = 1
const PAUSE_MS = 9000

const lots = []
for (let i = 0; i < aFaire.length; i += TAILLE_LOT) lots.push(aFaire.slice(i, i + TAILLE_LOT))

let suivant = 0, faits = 0, echecs = 0, epuise = false
const derniersEchecs = []
/* Un mot ne repasse en lot solitaire qu'une fois : sans cette garde, un mot
 * que le modele reecrit systematiquement se remettrait dans la file a chaque
 * echec et la boucle ne finirait jamais. */
const dejaIsole = new Set()

function sauver() {
  const trie = Object.fromEntries(Object.entries(trad).sort(([a], [b]) => a.localeCompare(b)))
  fs.writeFileSync(CHEMIN_FR, JSON.stringify(trie, null, 0))
}
process.on('SIGINT', () => {
  sauver()
  console.log('\ninterrompu — traductions sauvegardées')
  process.exit(0)
})

const ASEC = /indisponible|Trop de requêtes|429|quota/i

async function travailleur() {
  while (suivant < lots.length && !epuise) {
    const lot = lots[suivant++]
    const r = await traduireLot(lot)
    if (r.ok) {
      for (const [ar, fr] of r.sortie) trad[ar] = fr
      faits += r.sortie.length
      derniersEchecs.length = 0
      // Les mots que le modele a reecrits sont redemandes seuls, en fin de file.
      for (const mot of (r.isoles || [])) {
        if (!dejaIsole.has(mot.ar)) { dejaIsole.add(mot.ar); lots.push([mot]) }
      }
      sauver()
      if (faits % 100 < TAILLE_LOT) {
        console.log(`  ${faits} traduits, ${lots.length - suivant} lots restants`)
      }
      // Rester sous le debit par minute plutot que d'y entrer et rebondir.
      if (suivant < lots.length) await new Promise(ok => setTimeout(ok, PAUSE_MS))
    } else {
      echecs++
      derniersEchecs.push(r.erreur)
      if (!ASEC.test(r.erreur)) continue          // lot mal forme : on passe au suivant
      // Six echecs de quota d'affilee, sans succes entre-temps : tous les
      // fournisseurs sont a sec. Insister ne fait que perdre du temps.
      if (derniersEchecs.length >= 6 && derniersEchecs.slice(-6).every(e => ASEC.test(e))) {
        epuise = true
        break
      }
      await new Promise(ok => setTimeout(ok, 20000))   // laisser respirer le quota
    }
  }
}

await Promise.all(Array.from({ length: TRAVAILLEURS }, travailleur))
sauver()

console.log(`\ntraduits cette fois : ${faits}`)
console.log(`lots en échec       : ${echecs}`)
console.log(`total en français   : ${Object.keys(trad).length} / ${base.length}`)
if (epuise) console.log("quota épuisé — relancer plus tard reprendra où on s'est arrêté")
