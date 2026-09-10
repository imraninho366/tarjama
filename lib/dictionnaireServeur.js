import fs from 'fs'
import path from 'path'

/**
 * Le dictionnaire verifie, lu COTE SERVEUR.
 *
 * Existe pour que les routes API ne fassent jamais confiance au sens d'un mot
 * envoye par le navigateur. /api/mnemo mettait en cache sous le mot arabe un
 * moyen mnemotechnique construit sur le sens fourni par le client : un sens
 * invente produisait une astuce fausse, servie ensuite a tous les utilisateurs
 * qui ouvraient ce mot.
 *
 * Serveur uniquement : le fichier fait 4941 entrees, l'importer depuis une page
 * l'enverrait a chaque visiteur.
 */

let index = null

function charger() {
  if (index) return index
  const brut = fs.readFileSync(path.join(process.cwd(), 'public', 'quran_vocab.json'), 'utf8')
  index = new Map()
  for (const m of JSON.parse(brut).mots || []) {
    // Premiere occurrence gardee : un meme mot ecrit a l'identique ne doit pas
    // changer de sens selon l'ordre du fichier.
    if (!index.has(m.ar)) index.set(m.ar, m)
  }
  return index
}

/** L'entree verifiee du dictionnaire pour ce mot, ou null s'il n'y est pas. */
export function motDuDictionnaire(ar) {
  if (typeof ar !== 'string' || !ar) return null
  return charger().get(ar.normalize('NFC')) || charger().get(ar) || null
}
