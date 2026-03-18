#!/usr/bin/env node
/**
 * Fix vocab: translate English words to French, deduplicate, clean up
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VOCAB_PATH = path.join(__dirname, '..', 'public', 'quran_vocab.json')

// English → French translation map for common Quranic terms
const EN_FR = {
  // Common words
  'the': 'le/la', 'and': 'et', 'of': 'de', 'to': 'à/vers', 'in': 'dans', 'for': 'pour',
  'that': 'que/cela', 'is': 'est', 'it': 'il/ce', 'he': 'il', 'she': 'elle',
  'they': 'ils/elles', 'we': 'nous', 'you': 'vous/tu', 'not': 'ne pas', 'but': 'mais',
  'from': 'de/depuis', 'with': 'avec', 'this': 'ceci/ce', 'who': 'qui', 'what': 'quoi/que',
  'will': 'va/fera', 'be': 'être', 'has': 'a', 'have': 'avoir', 'was': 'était',
  'were': 'étaient', 'are': 'sont', 'do': 'faire', 'did': 'a fait',
  'or': 'ou', 'on': 'sur', 'at': 'à', 'by': 'par', 'as': 'comme',
  'if': 'si', 'so': 'donc/ainsi', 'no': 'non', 'all': 'tout/tous', 'my': 'mon/ma',
  'his': 'son/sa', 'her': 'son/sa', 'its': 'son/sa', 'our': 'notre',
  'your': 'votre/ton', 'their': 'leur', 'them': 'eux/les', 'him': 'lui',
  'us': 'nous', 'me': 'moi/me',
  'been': 'été', 'being': 'étant', 'would': 'ferait',
  'should': 'devrait', 'could': 'pourrait', 'shall': 'devra',
  'may': 'peut/puisse', 'might': 'pourrait', 'can': 'peut',
  'each': 'chaque', 'every': 'chaque/tout', 'those': 'ceux/celles',
  'these': 'ces', 'which': 'lequel/qui', 'when': 'quand/lorsque',
  'where': 'où', 'how': 'comment', 'why': 'pourquoi',
  'than': 'que', 'then': 'alors/puis', 'there': 'là/il y a',
  'here': 'ici', 'over': 'sur/au-dessus', 'under': 'sous',
  'upon': 'sur', 'into': 'dans', 'about': 'au sujet de',
  'between': 'entre', 'through': 'à travers',
  'before': 'avant', 'after': 'après', 'against': 'contre',
  'among': 'parmi', 'above': 'au-dessus', 'below': 'en-dessous',

  // Quranic terms
  'indeed': 'certes', 'surely': 'assurément', 'verily': 'en vérité',
  'truly': 'vraiment', 'except': 'sauf/excepté', 'without': 'sans',
  'toward': 'vers', 'towards': 'vers', 'until': 'jusqu\'à',
  'unless': 'à moins que', 'instead': 'au lieu de',
  'along': 'le long de', 'within': 'à l\'intérieur',
  'beyond': 'au-delà', 'around': 'autour', 'behind': 'derrière',
  'beside': 'à côté', 'beneath': 'en dessous', 'across': 'à travers',
  'god': 'Dieu', 'allah': 'Allah', 'lord': 'Seigneur',
  'people': 'gens/peuple', 'earth': 'terre', 'heaven': 'ciel',
  'heavens': 'cieux', 'sky': 'ciel', 'world': 'monde',
  'day': 'jour', 'night': 'nuit', 'time': 'temps',
  'life': 'vie', 'death': 'mort', 'soul': 'âme', 'souls': 'âmes',
  'heart': 'coeur', 'hearts': 'coeurs', 'eye': 'oeil', 'eyes': 'yeux',
  'hand': 'main', 'hands': 'mains', 'face': 'visage',
  'man': 'homme', 'men': 'hommes', 'woman': 'femme', 'women': 'femmes',
  'child': 'enfant', 'children': 'enfants', 'son': 'fils', 'father': 'père',
  'mother': 'mère', 'brother': 'frère', 'sister': 'soeur',
  'king': 'roi', 'prophet': 'prophète', 'messenger': 'messager',
  'angel': 'ange', 'angels': 'anges', 'devil': 'diable', 'satan': 'Satan',
  'believer': 'croyant', 'believers': 'croyants',
  'disbeliever': 'mécréant', 'disbelievers': 'mécréants',
  'righteous': 'vertueux/justes', 'evil': 'mal', 'good': 'bien/bon',
  'truth': 'vérité', 'false': 'faux', 'true': 'vrai',
  'mercy': 'miséricorde', 'merciful': 'miséricordieux',
  'gracious': 'bienveillant', 'wise': 'sage',
  'knowledge': 'savoir/connaissance', 'guidance': 'guidée',
  'light': 'lumière', 'darkness': 'ténèbres',
  'water': 'eau', 'fire': 'feu', 'garden': 'jardin', 'paradise': 'paradis',
  'hell': 'enfer', 'punishment': 'châtiment', 'reward': 'récompense',
  'sin': 'péché', 'forgiveness': 'pardon', 'repentance': 'repentir',
  'prayer': 'prière', 'worship': 'adoration', 'fast': 'jeûne',
  'book': 'livre', 'sign': 'signe', 'signs': 'signes',
  'verse': 'verset', 'verses': 'versets', 'word': 'mot/parole',
  'path': 'chemin', 'way': 'voie/chemin', 'straight': 'droit',
  'right': 'droit/juste', 'wrong': 'tort/injuste',
  'fear': 'crainte/peur', 'love': 'amour', 'hope': 'espoir',
  'believe': 'croire', 'know': 'savoir', 'say': 'dire',
  'said': 'a dit', 'come': 'venir', 'go': 'aller',
  'see': 'voir', 'hear': 'entendre', 'give': 'donner',
  'take': 'prendre', 'make': 'faire', 'create': 'créer',
  'created': 'a créé', 'send': 'envoyer', 'sent': 'envoyé',
  'call': 'appeler', 'follow': 'suivre', 'turn': 'se tourner',
  'return': 'revenir/retourner', 'enter': 'entrer',
  'leave': 'quitter', 'find': 'trouver', 'lose': 'perdre',
  'eat': 'manger', 'drink': 'boire', 'sleep': 'dormir',
  'sit': 'asseoir', 'stand': 'se lever', 'walk': 'marcher',
  'run': 'courir', 'fight': 'combattre', 'kill': 'tuer',
  'die': 'mourir', 'live': 'vivre', 'born': 'né',
  'remember': 'se rappeler', 'forget': 'oublier',
  'thank': 'remercier', 'praise': 'louange/louer',
  'help': 'aide/aider', 'protect': 'protéger',
  'judge': 'juger', 'justice': 'justice',
  'power': 'pouvoir/puissance', 'mighty': 'puissant',
  'great': 'grand', 'small': 'petit',
  'much': 'beaucoup', 'many': 'nombreux', 'few': 'peu',
  'some': 'certains/quelques', 'other': 'autre',
  'same': 'même', 'like': 'comme', 'such': 'tel',
  'only': 'seulement', 'also': 'aussi', 'even': 'même',
  'still': 'encore', 'yet': 'encore/pourtant',
  'never': 'jamais', 'always': 'toujours', 'again': 'encore',
  'now': 'maintenant', 'already': 'déjà',
  'most': 'le plus/la plupart', 'more': 'plus',
  'less': 'moins', 'very': 'très', 'own': 'propre',
  'thing': 'chose', 'things': 'choses', 'place': 'lieu/endroit',
  'nothing': 'rien', 'something': 'quelque chose',
  'everything': 'tout', 'anything': 'quoi que ce soit',
  'one': 'un/une', 'two': 'deux', 'three': 'trois',
  'seven': 'sept', 'twelve': 'douze',
  'first': 'premier', 'last': 'dernier',
  'new': 'nouveau', 'old': 'ancien/vieux',
  'another': 'un autre', 'both': 'les deux',
  'down': 'en bas', 'up': 'en haut', 'out': 'dehors',
  'back': 'retour', 'away': 'loin', 'off': 'loin/éteint',
  'well': 'bien', 'just': 'juste', 'ever': 'jamais/toujours',
  'too': 'aussi/trop', 'while': 'pendant que',
  'since': 'depuis/puisque', 'because': 'parce que',
  'whether': 'si/que ce soit', 'though': 'bien que',
  'although': 'bien que', 'however': 'cependant',
  'therefore': 'par conséquent', 'thus': 'ainsi',
  'hence': 'd\'où', 'moreover': 'de plus',
  'neither': 'ni', 'nor': 'ni', 'either': 'soit',
  'rather': 'plutôt', 'whose': 'dont',
  'whom': 'que/à qui', 'whoever': 'quiconque',
  'whatever': 'quoi que', 'wherever': 'où que',
  'whenever': 'chaque fois que',

  // More Quranic
  'worship': 'adorer', 'obey': 'obéir', 'disobey': 'désobéir',
  'command': 'ordre/commander', 'forbid': 'interdire',
  'promise': 'promesse', 'warn': 'avertir', 'warning': 'avertissement',
  'glad': 'heureux', 'tidings': 'nouvelles', 'glad tidings': 'bonne nouvelle',
  'hereafter': 'au-delà', 'resurrection': 'résurrection',
  'judgement': 'jugement', 'judgment': 'jugement',
  'account': 'compte', 'deed': 'acte', 'deeds': 'actes',
  'charity': 'aumône', 'wealth': 'richesse',
  'provision': 'subsistance', 'sustenance': 'subsistance',
  'mankind': 'humanité', 'creation': 'création',
  'creature': 'créature', 'servant': 'serviteur',
  'servants': 'serviteurs', 'slave': 'esclave',
  'companion': 'compagnon', 'companions': 'compagnons',
  'enemy': 'ennemi', 'enemies': 'ennemis',
  'friend': 'ami', 'friends': 'amis', 'ally': 'allié',
  'tribe': 'tribu', 'nation': 'nation', 'community': 'communauté',
  'mountain': 'montagne', 'mountains': 'montagnes',
  'sea': 'mer', 'river': 'rivière', 'rain': 'pluie',
  'wind': 'vent', 'cloud': 'nuage', 'clouds': 'nuages',
  'sun': 'soleil', 'moon': 'lune', 'star': 'étoile', 'stars': 'étoiles',
  'tree': 'arbre', 'trees': 'arbres', 'fruit': 'fruit', 'fruits': 'fruits',
  'cattle': 'bétail', 'animal': 'animal', 'bird': 'oiseau',
  'house': 'maison', 'home': 'foyer', 'city': 'cité',
  'land': 'terre', 'country': 'pays',
  'food': 'nourriture', 'clothing': 'vêtement',
  'iron': 'fer', 'gold': 'or', 'silver': 'argent',
  'spouse': 'époux/épouse', 'wife': 'épouse', 'husband': 'époux',
  'marriage': 'mariage', 'divorce': 'divorce',
  'orphan': 'orphelin', 'orphans': 'orphelins',
  'poor': 'pauvre', 'rich': 'riche', 'needy': 'nécessiteux',
  'patient': 'patient', 'patience': 'patience',
  'grateful': 'reconnaissant', 'ungrateful': 'ingrat',
  'humble': 'humble', 'arrogant': 'arrogant', 'pride': 'orgueil',
  'tongue': 'langue', 'ear': 'oreille', 'ears': 'oreilles',
  'skin': 'peau', 'blood': 'sang', 'bone': 'os',
  'breath': 'souffle', 'spirit': 'esprit',
  'secret': 'secret', 'hidden': 'caché', 'manifest': 'manifeste',
  'open': 'ouvert', 'close': 'fermer',
  'clear': 'clair', 'plain': 'clair/évident',
  'beautiful': 'beau', 'ugly': 'laid',
  'strong': 'fort', 'weak': 'faible',
  'high': 'haut/élevé', 'low': 'bas',
  'near': 'proche', 'far': 'loin',
  'easy': 'facile', 'hard': 'difficile',
  'fast': 'rapide', 'slow': 'lent',
  'deep': 'profond', 'wide': 'large',
  'long': 'long', 'short': 'court',
  'heavy': 'lourd', 'full': 'plein',
  'empty': 'vide', 'dark': 'sombre',
  'bright': 'brillant', 'white': 'blanc', 'black': 'noir',
  'red': 'rouge', 'green': 'vert', 'yellow': 'jaune', 'blue': 'bleu',
}

function translatePhrase(phrase) {
  if (!phrase) return ''
  let result = phrase.trim()

  // Remove English bracket markers like (is), [from], etc.
  result = result.replace(/[\[\(](is|are|was|were|be|been|being|of|the|a|an|to|in|for|by|at|on|with|from|do|does|did|has|have|had|will|would|shall|should|can|could|may|might|it|he|she|they|we|you|set|let|so|and|or|but)[\]\)]\s*/gi, '')

  // Split into words and translate each
  const words = result.split(/\s+/)
  const translated = words.map(w => {
    const clean = w.replace(/[.,;:!?()[\]{}'"]/g, '').toLowerCase()
    return EN_FR[clean] || w
  })

  return translated.join(' ').trim()
}

function isEnglish(text) {
  if (!text) return false
  const words = text.toLowerCase().replace(/[.,;:!?()[\]{}'"]/g, '').split(/\s+/)
  const englishWords = words.filter(w => EN_FR[w] || /^[a-z]+$/.test(w))
  return englishWords.length > words.length * 0.4
}

// Remove diacritics for dedup key
function stripTashkeel(ar) {
  return (ar || '').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function main() {
  const data = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'))
  const mots = data.mots

  console.log(`Total initial: ${mots.length}`)

  // 1. Translate English sens to French
  let translated = 0
  for (const m of mots) {
    if (!m.sens?.length) continue
    const newSens = m.sens.map(s => {
      if (isEnglish(s)) {
        translated++
        return translatePhrase(s)
      }
      return s
    })
    m.sens = [...new Set(newSens.filter(Boolean))]
    if (m.sens.length === 0) m.sens = ['(voir contexte)']
  }
  console.log(`Traductions anglais→français: ${translated}`)

  // 2. Deduplicate by stripped Arabic
  const dedup = new Map()
  for (const m of mots) {
    const key = stripTashkeel(m.ar)
    if (!key) continue

    if (dedup.has(key)) {
      const existing = dedup.get(key)
      // Keep the richer entry (the one with translit/racine/note)
      const existingRich = (existing.translit ? 1 : 0) + (existing.racine ? 1 : 0) + (existing.note ? 1 : 0)
      const newRich = (m.translit ? 1 : 0) + (m.racine ? 1 : 0) + (m.note ? 1 : 0)

      if (newRich > existingRich) {
        // New one is richer, merge sens and keep new
        const allSens = [...new Set([...m.sens, ...existing.sens])]
        m.sens = allSens.slice(0, 4)
        m.freq = Math.max(m.freq || 0, existing.freq || 0)
        dedup.set(key, m)
      } else {
        // Existing is richer, just merge new sens
        const allSens = [...new Set([...existing.sens, ...m.sens])]
        existing.sens = allSens.slice(0, 4)
        existing.freq = Math.max(existing.freq || 0, m.freq || 0)
      }
    } else {
      dedup.set(key, m)
    }
  }

  const uniqueMots = [...dedup.values()]

  // Sort by frequency
  uniqueMots.sort((a, b) => (b.freq || 0) - (a.freq || 0))

  console.log(`Après déduplication: ${uniqueMots.length}`)

  // Save
  const output = {
    version: '2.1',
    total: uniqueMots.length,
    generated: new Date().toISOString().split('T')[0],
    mots: uniqueMots
  }

  fs.writeFileSync(VOCAB_PATH, JSON.stringify(output), 'utf8')
  const size = (fs.statSync(VOCAB_PATH).size / 1024 / 1024).toFixed(2)
  console.log(`Sauvegardé: ${uniqueMots.length} mots (${size} MB)`)
}

main()
