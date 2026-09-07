import { SOURATES_LIST } from './sourates'
import { cacheGet, cacheSet } from './cache'

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

const API = 'https://api.alquran.cloud/v1/surah'
const EDITION_AR = 'ar.asem'
const EDITION_FR = 'fr.hamidullah'

/**
 * Motif de la Basmala, tolérant aux voyelles et aux variantes de lettres.
 *
 * L'ancien code cherchait la chaîne brute « بسم الله ». L'édition ar.asem
 * écrit « بِسۡمِ ٱللَّهِ » — avec voyelles, alef wasla (ٱ) et yeh persan (ی).
 * La comparaison échouait donc toujours, et la Basmala restait collée devant
 * le verset 1 de 112 sourates.
 */
const DIACRITIQUES = '[ً-ْٰـۖ-ۭ]*'

function motifDuMot(mot) {
  let out = ''
  for (const c of mot) {
    if (c === 'ا') out += '[اٱأإآ]'
    else if (c === 'ي') out += '[يیى]'
    else out += c
    out += DIACRITIQUES
  }
  return out
}

const BASMALA = new RegExp(
  '^\\s*' + ['بسم', 'الله', 'الرحمن', 'الرحيم'].map(motifDuMot).join('\\s*') + '\\s*'
)

/**
 * Retire la Basmala placée en tête du verset 1.
 *
 * ATTENTION — LE PIÈGE À NE PAS REFAIRE. L'ancien code utilisait `filter()`
 * pour retirer l'AYAH entière, puis renumérotait avec `{ n: i + 1 }`. Comme
 * sa comparaison échouait toujours, il ne retirait jamais rien et la
 * numérotation restait juste PAR ACCIDENT.
 *
 * Rendre cette comparaison fonctionnelle aurait supprimé le vrai verset 1 et
 * décalé toute la sourate : le verset 1 aurait affiché le texte du 2, et ainsi
 * de suite sur 114 sourates. Une erreur invisible, bien pire que celle qu'elle
 * prétendait corriger.
 *
 * On retire donc du TEXTE, jamais le verset. Et on ne renumérote jamais : le
 * numéro vient de la source.
 *
 * Sourate 1 exceptée : la Basmala EST son verset 1.
 * Sourate 9 : elle n'en a pas.
 */
function retirerBasmala(texte, sourateNum, versetNum) {
  if (sourateNum === 1 || versetNum !== 1) return texte
  return texte.replace(BASMALA, '').trim()
}

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
 * Récupère une sourate entière dans une édition donnée.
 *
 * Deux reprises avec attente croissante : alquran.cloud limite le débit et
 * répond 429 quand on l'interroge trop vite — mesuré le 7 septembre 2026, 63
 * sourates sur 114 refusées lors d'une vérification en rafale. En usage réel
 * le cache absorbe l'essentiel, mais un 429 passager ne doit pas priver
 * l'utilisateur de son verset.
 */
async function chargerSourate(num, edition, essai = 0) {
  const cle = `quran:${edition}:${num}`
  const enCache = cacheGet(cle)
  if (enCache) return enCache

  const r = await fetch(`${API}/${num}/${edition}`)
  if (!r.ok) {
    if ((r.status === 429 || r.status >= 500) && essai < 2) {
      await new Promise(res => setTimeout(res, 400 * (essai + 1)))
      return chargerSourate(num, edition, essai + 1)
    }
    throw new Error(`alquran.cloud a répondu ${r.status}`)
  }
  const data = await r.json()
  if (data.code !== 200 || !Array.isArray(data.data?.ayahs)) {
    throw new Error('réponse alquran.cloud inattendue')
  }

  const info = sourateInfo(num)
  // Garde-fou : si la source ne renvoie pas le nombre de versets attendu,
  // c'est qu'elle a changé de format. Mieux vaut ne rien servir.
  if (info && data.data.ayahs.length !== info.v) {
    throw new Error(`${num} : ${data.data.ayahs.length} versets reçus, ${info.v} attendus`)
  }

  cacheSet(cle, data.data)
  return data.data
}

/**
 * Les versets d'une sourate, texte authentique, Basmala retirée.
 *
 * @returns {Promise<{num, name_ar, name_fr, verses: Array<{n, ar}>}>}
 */
export async function versetsDeSourate(num) {
  const data = await chargerSourate(num, EDITION_AR)
  return {
    num: data.number,
    name_ar: data.name,
    name_fr: sourateInfo(num)?.fr || data.englishName,
    // n vient de numberInSurah, jamais d'un compteur de boucle.
    verses: data.ayahs.map(a => ({
      n: a.numberInSurah,
      ar: retirerBasmala(a.text, Number(num), a.numberInSurah),
    })),
  }
}

/**
 * UN verset authentique, avec sa traduction française de référence.
 *
 * Renvoie null — jamais un texte approximatif — si la référence est invalide
 * ou si la source est injoignable. C'est à l'appelant d'omettre le verset.
 *
 * @returns {Promise<{sourate_num, verset_num, sourate_ar, sourate_fr, arabe, traduction}|null>}
 */
export async function versetAuthentique(sourateNum, versetNum) {
  const s = Number(sourateNum), v = Number(versetNum)
  if (!referenceValide(s, v)) {
    console.warn(`[quran] référence refusée : ${sourateNum}:${versetNum}`)
    return null
  }

  try {
    const [ar, fr] = await Promise.all([
      chargerSourate(s, EDITION_AR),
      // La traduction est secondaire : son échec ne doit pas priver
      // l'utilisateur du texte arabe, qui est l'essentiel.
      chargerSourate(s, EDITION_FR).catch(() => null),
    ])

    const ayah = ar.ayahs.find(a => a.numberInSurah === v)
    if (!ayah) return null

    const info = sourateInfo(s)
    return {
      sourate_num: s,
      verset_num: v,
      sourate_ar: ar.name,
      sourate_fr: info?.fr || ar.englishName,
      arabe: retirerBasmala(ayah.text, s, v),
      traduction: fr?.ayahs.find(a => a.numberInSurah === v)?.text || null,
    }
  } catch (err) {
    console.error(`[quran] ${s}:${v} introuvable — ${err.message}`)
    return null
  }
}
