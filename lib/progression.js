/**
 * Calculs de progression dans le temps.
 *
 * POURQUOI CE FICHIER EXISTE
 * La page /profil montrait un instantane — des totaux, des pourcentages — mais
 * rien sur l'evolution. Un utilisateur l'a demande le 6 septembre 2026 :
 * « J aimerai pouvoir regarder ma progression ». Un total ne dit pas si on
 * avance ; une suite de jours, si.
 *
 * L'intention existait deja : /profil calculait un ensemble `days` qu'il
 * n'affichait nulle part, et comptait `partial` et `wrong` sans les utiliser.
 *
 * Les fonctions ici sont pures : elles prennent des lignes de `progress` et
 * rendent des donnees. Aucune ne touche au DOM ni au reseau, donc chacune se
 * verifie isolement — ce qui compte pour du calcul de dates, ou les erreurs
 * sont silencieuses et ne se voient qu'au bout de plusieurs semaines.
 */

/**
 * Cle de jour locale, ex. « 2026-09-06 ».
 *
 * LE ZERO DEVANT N'EST PAS COSMETIQUE. L'ancien calcul de serie, dans
 * pages/index.js, fabriquait des cles « 2026-8-6 » puis les triait comme du
 * texte. Or « 2026-8-6 » se classe APRES « 2026-11-6 », et « 2026-8-9 » apres
 * « 2026-8-10 » : la serie se cassait des qu'on franchissait une dizaine de
 * jours ou un changement de mois. Avec deux chiffres partout, l'ordre
 * alphabetique coincide avec l'ordre chronologique.
 *
 * En heure LOCALE et non UTC, volontairement : quelqu'un qui traduit un verset
 * a 23h30 a Paris doit voir ce jour-la coche, pas le lendemain.
 */
function jourLocal(date) {
  const d = new Date(date)
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

/**
 * Nombre de versets travailles par jour.
 *
 * @param {Array<{ts?: string}>} entrees lignes de `progress`
 * @returns {Map<string, number>} « 2026-09-06 » -> 3
 */
export function activiteParJour(entrees) {
  const parJour = new Map()
  for (const e of entrees) {
    if (!e.ts) continue
    const k = jourLocal(e.ts)
    parJour.set(k, (parJour.get(k) || 0) + 1)
  }
  return parJour
}

/**
 * Serie en cours et record.
 *
 * La serie en cours accepte de s'arreter a HIER, pas seulement a aujourd'hui :
 * sinon elle tomberait a zero chaque matin, avant meme que l'utilisateur ait
 * eu l'occasion d'ouvrir l'application. Une serie qui punit le fait de ne pas
 * avoir ENCORE travaille aujourd'hui decourage au lieu d'encourager.
 *
 * @returns {{actuelle: number, record: number}}
 */
export function calculerSeries(parJour, aujourdhui = new Date()) {
  const jours = [...parJour.keys()].sort()
  if (jours.length === 0) return { actuelle: 0, record: 0 }

  const veilleDe = (cle) => {
    const d = new Date(cle + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    return jourLocal(d)
  }

  // Record : plus longue suite de jours consecutifs.
  let record = 1, courante = 1
  for (let i = 1; i < jours.length; i++) {
    courante = veilleDe(jours[i - 1]) === jours[i] ? courante + 1 : 1
    if (courante > record) record = courante
  }

  // Serie en cours : on remonte depuis le dernier jour travaille.
  const hier = new Date(aujourdhui)
  hier.setDate(hier.getDate() - 1)
  const dernier = jours[jours.length - 1]
  if (dernier !== jourLocal(aujourdhui) && dernier !== jourLocal(hier)) {
    return { actuelle: 0, record }
  }

  let actuelle = 1
  for (let i = jours.length - 1; i > 0; i--) {
    if (veilleDe(jours[i - 1]) !== jours[i]) break
    actuelle++
  }
  return { actuelle, record }
}

/**
 * Grille du calendrier d'activite, semaine par semaine.
 *
 * Chaque entree du tableau est une semaine (une colonne a l'ecran), et chaque
 * semaine contient sept jours. La grille se termine sur la semaine en cours et
 * remonte `semaines` en arriere.
 *
 * @returns {Array<Array<{date: string, nb: number, futur: boolean}>>}
 */
export function grilleCalendrier(parJour, semaines = 12, aujourdhui = new Date()) {
  const fin = new Date(aujourdhui)
  // Avancer jusqu'au samedi de la semaine en cours, pour que la derniere
  // colonne soit complete et que chaque ligne corresponde a un jour fixe.
  fin.setDate(fin.getDate() + (6 - fin.getDay()))

  const grille = []
  for (let s = semaines - 1; s >= 0; s--) {
    const colonne = []
    for (let j = 6; j >= 0; j--) {
      const d = new Date(fin)
      d.setDate(d.getDate() - (s * 7 + j))
      const k = jourLocal(d)
      colonne.push({ date: k, nb: parJour.get(k) || 0, futur: k > jourLocal(aujourdhui) })
    }
    grille.push(colonne)
  }
  return grille
}

/**
 * Repartition par qualite.
 *
 * `excellent` et `good` sont comptes ensemble : c'est deja ce que fait le
 * reste de l'application, et separer les deux n'apprend rien a l'utilisateur.
 */
export function repartitionQualite(entrees) {
  const r = { maitrises: 0, partiels: 0, aRevoir: 0 }
  for (const e of entrees) {
    if (e.niveau === 'excellent' || e.niveau === 'good') r.maitrises++
    else if (e.niveau === 'partial') r.partiels++
    else r.aRevoir++
  }
  return r
}
