import { SOURATES_LIST } from './sourates'
import TEXTE_AR from '../data/quran-ar.json'
import TEXTE_FR from '../data/quran-fr.json'

/**
 * SOURCE UNIQUE ET VÉRIFIÉE DU TEXTE CORANIQUE.
 *
 * ═══ POURQUOI CE FICHIER EXISTE ═══
 *
 * Le 6 septembre 2026, Tarjama a affiché ceci :
 *
 *   « S.65 — V.2 · الطلاق (AT-TALAQ) »
 *   فَإِذَا فَرَغْتَ فَانصَبْ إِلَىٰ رَبِّكَ وَانْحَرْ
 *
 * Ce verset n'existe pas. C'est un assemblage de deux sourates différentes :
 * « فَإِذَا فَرَغْتَ فَانصَبْ » vient d'Ash-Sharh (94:7), « وَانْحَرْ » vient
 * d'Al-Kawthar (108:2), et la référence 65:2 ne correspond à aucun des deux.
 *
 * La cause : /api/humeur et /api/smart-verse demandaient à l'IA d'écrire
 * « arabe: texte arabe du verset ». Un modèle de langue ne récite pas, il
 * reconstitue — et il recolle des fragments qui se ressemblent.
 *
 * AUCUNE FORMULATION DE PROMPT NE CORRIGE CELA. La seule réponse est de
 * retirer ce rôle au modèle : il peut choisir QUEL verset citer, jamais
 * écrire ce que le verset dit. Le texte vient d'ici, et d'ici seulement.
 *
 * ═══ RÈGLE ═══
 *
 * Si le texte authentique ne peut pas être obtenu, on n'affiche RIEN. Un
 * verset manquant est un désagrément ; un verset inventé est une faute qu'on
 * ne rattrape pas.
 */

/**
 * ═══ LE TEXTE EST EMBARQUÉ, PLUS AUCUN APPEL RÉSEAU ═══
 *
 * data/quran-ar.json : texte Uthmani vocalisé, 114 sourates, 6236 versets.
 * data/quran-fr.json : traduction Muhammad Hamidullah, même découpage.
 *
 * Les deux fichiers sont produits une fois pour toutes depuis alquran.cloud,
 * vérifiés contre les nombres de versets canoniques, et la Basmala y est déjà
 * retirée du verset 1 des 112 sourates concernées (jamais de la sourate 1, où
 * elle EST le verset 1, ni de la 9, qui n'en a pas).
 *
 * POURQUOI EMBARQUER PLUTÔT QU'APPELER
 * Le texte du Coran ne change pas. En dépendre par le réseau, c'était accepter
 * qu'il devienne indisponible : alquran.cloud limite le débit et a refusé 63
 * sourates sur 114 lors d'une vérification en rafale le 7 septembre 2026.
 * Désormais rien ne peut empêcher un verset de s'afficher.
 *
 * CE FICHIER NE DOIT ÊTRE IMPORTÉ QUE PAR DES ROUTES API. Ces deux JSON pèsent
 * 2,4 Mo : importés depuis une page, Next.js les enverrait au navigateur de
 * chaque visiteur. Ils restent aujourd'hui dans les fonctions serveur.
 */

/** Métadonnées locales d'une sourate, ou null si la référence est invalide. */
export function sourateInfo(num) {
  return SOURATES_LIST.find(s => s.n === Number(num)) || null
}

/**
 * La référence pointe-t-elle vers un verset qui existe réellement ?
 *
 * Premier rempart contre une référence inventée : le nombre de versets de
 * chaque sourate est connu localement, sans aucun appel réseau.
 */
export function referenceValide(sourateNum, versetNum) {
  const info = sourateInfo(sourateNum)
  if (!info) return false
  const v = Number(versetNum)
  return Number.isInteger(v) && v >= 1 && v <= info.v
}

/**
 * Les versets d'une sourate, texte authentique.
 *
 * Lecture directe du fichier embarque : ni reseau, ni cache, ni latence, et
 * donc aucune facon pour un verset de ne pas s'afficher.
 *
 * @returns {{num, name_ar, name_fr, verses: Array<{n, ar}>}}
 */
export function versetsDeSourate(num) {
  const s = Number(num)
  const bloc = TEXTE_AR[String(s)]
  if (!bloc) throw new Error(`sourate ${num} inconnue`)
  return {
    num: s,
    name_ar: bloc.name_ar,
    name_fr: sourateInfo(s)?.fr || '',
    // n vient du fichier, jamais d'un compteur de boucle : renumeroter est
    // precisement ce qui aurait decale les 114 sourates dans la version
    // precedente.
    verses: bloc.verses.map(v => ({ n: v.n, ar: v.t })),
  }
}

/**
 * UN verset authentique, avec sa traduction francaise de reference.
 *
 * Renvoie null — jamais un texte approximatif — si la reference n'existe pas.
 * C'est a l'appelant d'omettre le verset plutot que d'en inventer un.
 *
 * @returns {{sourate_num, verset_num, sourate_ar, sourate_fr, arabe, traduction}|null}
 */
export function versetAuthentique(sourateNum, versetNum) {
  const s = Number(sourateNum), v = Number(versetNum)
  if (!referenceValide(s, v)) {
    console.warn(`[quran] reference refusee : ${sourateNum}:${versetNum}`)
    return null
  }

  const bloc = TEXTE_AR[String(s)]
  const ayah = bloc?.verses.find(x => x.n === v)
  if (!ayah) return null

  return {
    sourate_num: s,
    verset_num: v,
    sourate_ar: bloc.name_ar,
    sourate_fr: sourateInfo(s)?.fr || '',
    arabe: ayah.t,
    traduction: TEXTE_FR[String(s)]?.verses.find(x => x.n === v)?.t || null,
  }
}
