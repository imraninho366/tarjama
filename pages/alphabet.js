import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const G = {
  dark:'#09090E', dark2:'#0F0F18', dark3:'#161622', dark4:'#1D1D2C',
  gold:'#C9A84C', goldLight:'#E8C97A', goldDim:'#8B6914',
  green:'#4CAF7D', blue:'#5B9BD5', red:'#C96B6B', orange:'#D4874C', purple:'#9B7FD4',
  text:'#EDE8D8', textDim:'#9A9280', textMuted:'#5A5448'
}
const SERIF = "'EB Garamond','Georgia',serif"

// ══════════════════════════════════════════════════════════════════
// AUDIO — Forvo / CDN public (sons phonétiques)
// On utilise une synthèse vocale Web Speech API en arabe
// ══════════════════════════════════════════════════════════════════
function speakArabic(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ar-SA'
  u.rate = 0.7
  u.pitch = 1.0
  // Chercher une voix arabe
  const voices = window.speechSynthesis.getVoices()
  const arVoice = voices.find(v => v.lang.startsWith('ar')) || voices[0]
  if (arVoice) u.voice = arVoice
  window.speechSynthesis.speak(u)
}

// ══════════════════════════════════════════════════════════════════
// DONNÉES COMPLÈTES — 28 lettres
// ══════════════════════════════════════════════════════════════════
const LETTERS = [
  {
    num:1, name:'Alif', ar:'ا', translit:'ā / a',
    formes:['ا','ا','ـا','ـا'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'Voyelle longue "â" (comme dans "pâte") ou support de hamza. Ne se lie pas à la lettre suivante.',
    prononciation:'Ouvre grand la bouche, son pur et long.',
    mnemo:'Une colonne droite — le pilier de l\'écriture arabe.',
    solaire:false,
    exemple:{ ar:'اللَّهُ', translit:'Allāh', fr:'Allah', verset:'S.1:1' },
    harakat:['اَ','اِ','اُ'],
    couleur:G.gold,
    audio:'أَلِفْ'
  },
  {
    num:2, name:'Bā', ar:'ب', translit:'b',
    formes:['ب','بـ','ـبـ','ـب'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"B" bilabial comme en français. Un point sous la lettre.',
    prononciation:'Lèvres fermées qui s\'ouvrent en explosion douce.',
    mnemo:'Un bol retourné avec un point dessous — la bosse du bas.',
    solaire:false,
    exemple:{ ar:'بِسْمِ اللَّهِ', translit:'Bismi llāh', fr:'Au nom d\'Allah', verset:'S.1:1' },
    harakat:['بَ','بِ','بُ','بْ'],
    couleur:G.blue,
    audio:'بَاءْ'
  },
  {
    num:3, name:'Tā', ar:'ت', translit:'t',
    formes:['ت','تـ','ـتـ','ـت'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"T" comme en français. Deux points au-dessus.',
    prononciation:'Langue derrière les dents du haut, explosion sèche.',
    mnemo:'Même bol que Bā mais deux points au-dessus.',
    solaire:true,
    exemple:{ ar:'التَّوَّابُ', translit:'at-Tawwāb', fr:'Le Grand Pardonneur', verset:'S.2:37' },
    harakat:['تَ','تِ','تُ','تْ'],
    couleur:G.blue,
    audio:'تَاءْ'
  },
  {
    num:4, name:'Thā', ar:'ث', translit:'th',
    formes:['ث','ثـ','ـثـ','ـث'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Th" anglais de "think" — la langue entre les dents, son sourd.',
    prononciation:'Pointe de la langue entre les dents, souffle continu.',
    mnemo:'Même bol mais trois points au-dessus — le th du tiers.',
    solaire:false,
    exemple:{ ar:'الثَّوَابُ', translit:'ath-Thawāb', fr:'La récompense', verset:'S.3:195' },
    harakat:['ثَ','ثِ','ثُ','ثْ'],
    couleur:'#A8D8A8',
    audio:'ثَاءْ'
  },
  {
    num:5, name:'Jīm', ar:'ج', translit:'j',
    formes:['ج','جـ','ـجـ','ـج'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"J" français ou "Dj" africain selon les traditions de récitation.',
    prononciation:'Dos de la langue contre le palais, son continu ou explosif.',
    mnemo:'Une courbe fermée avec un point en dessous — le J du Jardin.',
    solaire:false,
    exemple:{ ar:'جَنَّةٌ', translit:'Janna', fr:'Le Paradis', verset:'S.2:25' },
    harakat:['جَ','جِ','جُ','جْ'],
    couleur:G.green,
    audio:'جِيمْ'
  },
  {
    num:6, name:'Ḥā', ar:'ح', translit:'ḥ',
    formes:['ح','حـ','ـحـ','ـح'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"H" soufflé du fond de la gorge — comme un souffle chaud sur une vitre. Sans point.',
    prononciation:'Gorge semi-fermée, souffle chaud et continu. Plus fort que le H français.',
    mnemo:'Même forme que Jīm sans point — le souffle pur et transparent.',
    solaire:false,
    exemple:{ ar:'الرَّحْمَنُ', translit:'ar-Raḥmān', fr:'Le Tout Miséricordieux', verset:'S.1:1' },
    harakat:['حَ','حِ','حُ','حْ'],
    couleur:G.gold,
    audio:'حَاءْ'
  },
  {
    num:7, name:'Khā', ar:'خ', translit:'kh',
    formes:['خ','خـ','ـخـ','ـخ'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Kh" comme le "J" espagnol (jota) ou le "ch" allemand dans "Bach".',
    prononciation:'Fond de la gorge, son rauque et frotté.',
    mnemo:'Même forme que Ḥā mais avec un point — le Kh du Khān.',
    solaire:false,
    exemple:{ ar:'خَيْرٌ', translit:'Khayr', fr:'Le bien', verset:'S.2:54' },
    harakat:['خَ','خِ','خُ','خْ'],
    couleur:G.orange,
    audio:'خَاءْ'
  },
  {
    num:8, name:'Dāl', ar:'د', translit:'d',
    formes:['د','د','ـد','ـد'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"D" comme en français. Ne se lie pas à la lettre suivante.',
    prononciation:'Langue derrière les dents, explosion sonore.',
    mnemo:'Comme un "d" latin renversé — la porte qui s\'ouvre.',
    solaire:true,
    exemple:{ ar:'الدِّينُ', translit:'ad-Dīn', fr:'La religion', verset:'S.1:4' },
    harakat:['دَ','دِ','دُ','دْ'],
    couleur:G.blue,
    audio:'دَالْ'
  },
  {
    num:9, name:'Dhāl', ar:'ذ', translit:'dh',
    formes:['ذ','ذ','ـذ','ـذ'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Dh" comme "th" anglais dans "this" — la langue entre les dents, son sonore.',
    prononciation:'Pointe de la langue entre les dents, vibration des cordes vocales.',
    mnemo:'Même forme que Dāl mais avec un point — le Dh voisé.',
    solaire:true,
    exemple:{ ar:'ذِكْرٌ', translit:'Dhikr', fr:'Le rappel d\'Allah', verset:'S.13:28' },
    harakat:['ذَ','ذِ','ذُ','ذْ'],
    couleur:G.purple,
    audio:'ذَالْ'
  },
  {
    num:10, name:'Rā', ar:'ر', translit:'r',
    formes:['ر','ر','ـر','ـر'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"R" roulé comme en espagnol ou en arabe marocain. Ne se lie pas à la lettre suivante.',
    prononciation:'Pointe de la langue qui vibre rapidement contre le palais.',
    mnemo:'Une petite vague qui roule vers la gauche.',
    solaire:true,
    exemple:{ ar:'الرَّحِيمُ', translit:'ar-Raḥīm', fr:'Le Très Miséricordieux', verset:'S.1:1' },
    harakat:['رَ','رِ','رُ','رْ'],
    couleur:G.gold,
    audio:'رَاءْ'
  },
  {
    num:11, name:'Zāy', ar:'ز', translit:'z',
    formes:['ز','ز','ـز','ـز'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Z" comme en français. Un point au-dessus. Ne se lie pas à la suivante.',
    prononciation:'Langue derrière les dents, vibration bourdonnante continue.',
    mnemo:'Même forme que Rā avec un point — le Z du Zèbre.',
    solaire:true,
    exemple:{ ar:'زَكَاةٌ', translit:'Zakāt', fr:'L\'aumône purificatrice', verset:'S.2:43' },
    harakat:['زَ','زِ','زُ','زْ'],
    couleur:G.green,
    audio:'زَايْ'
  },
  {
    num:12, name:'Sīn', ar:'س', translit:'s',
    formes:['س','سـ','ـسـ','ـس'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"S" comme en français. Trois petites dents en bas.',
    prononciation:'Langue derrière les dents, souffle sifflant pur.',
    mnemo:'Trois dents de scie qui sourient — le Sourire du Sīn.',
    solaire:true,
    exemple:{ ar:'السَّلَامُ', translit:'as-Salām', fr:'La Paix', verset:'S.59:23' },
    harakat:['سَ','سِ','سُ','سْ'],
    couleur:G.blue,
    audio:'سِينْ'
  },
  {
    num:13, name:'Shīn', ar:'ش', translit:'sh',
    formes:['ش','شـ','ـشـ','ـش'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Ch" comme en français. Trois points au-dessus.',
    prononciation:'Lèvres légèrement avancées, souffle chuchotant.',
    mnemo:'Même que Sīn avec trois points — le Ch Chuchoté.',
    solaire:true,
    exemple:{ ar:'الشَّمْسُ', translit:'ash-Shams', fr:'Le Soleil', verset:'S.91:1' },
    harakat:['شَ','شِ','شُ','شْ'],
    couleur:G.purple,
    audio:'شِينْ'
  },
  {
    num:14, name:'Ṣād', ar:'ص', translit:'ṣ',
    formes:['ص','صـ','ـصـ','ـص'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"S" emphatique — langue en arrière du palais, son grave et sourd. Distinct du Sīn.',
    prononciation:'Langue reculée, lèvres légèrement avancées, son profond et grave.',
    mnemo:'Un grand S emphatique avec une boucle arrondie.',
    solaire:false,
    exemple:{ ar:'الصَّلَاةُ', translit:'aṣ-Ṣalāh', fr:'La Prière', verset:'S.2:43' },
    harakat:['صَ','صِ','صُ','صْ'],
    couleur:G.orange,
    audio:'صَادْ'
  },
  {
    num:15, name:'Ḍād', ar:'ض', translit:'ḍ',
    formes:['ض','ضـ','ـضـ','ـض'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"D" emphatique — extrêmement rare dans les langues du monde. Propre à l\'arabe.',
    prononciation:'Côté de la langue contre les molaires, son grave et puissant.',
    mnemo:'Même forme que Ṣād avec un point — le D emphatique unique.',
    solaire:false,
    exemple:{ ar:'الأَرْضُ', translit:'al-Arḍ', fr:'La Terre', verset:'S.2:22' },
    harakat:['ضَ','ضِ','ضُ','ضْ'],
    couleur:G.red,
    audio:'ضَادْ'
  },
  {
    num:16, name:'Ṭā', ar:'ط', translit:'ṭ',
    formes:['ط','طـ','ـطـ','ـط'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"T" emphatique — langue en arrière, son grave et puissant.',
    prononciation:'Langue reculée contre le palais dur, explosion grave.',
    mnemo:'Une boucle fermée avec un mât vertical — le T forteresse.',
    solaire:false,
    exemple:{ ar:'الطَّرِيقُ', translit:'aṭ-Ṭarīq', fr:'La voie', verset:'S.4:68' },
    harakat:['طَ','طِ','طُ','طْ'],
    couleur:G.orange,
    audio:'طَاءْ'
  },
  {
    num:17, name:'Ẓā', ar:'ظ', translit:'ẓ',
    formes:['ظ','ظـ','ـظـ','ـظ'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Dh" emphatique — langue entre les dents, son grave et voisé.',
    prononciation:'Pointe de la langue entre les dents, vibration grave.',
    mnemo:'Même forme que Ṭā avec un point — le Dh emphatique.',
    solaire:false,
    exemple:{ ar:'الظَّالِمُونَ', translit:'aẓ-Ẓālimūn', fr:'Les injustes', verset:'S.2:254' },
    harakat:['ظَ','ظِ','ظُ','ظْ'],
    couleur:G.red,
    audio:'ظَاءْ'
  },
  {
    num:18, name:'ʿAyn', ar:'ع', translit:"ʿ",
    formes:['ع','عـ','ـعـ','ـع'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'Son pharyngal unique — constriction du fond de la gorge. Pas d\'équivalent en français.',
    prononciation:'Comprimer le fond de la gorge comme pour produire un "A" étranglé.',
    mnemo:'Un œil grand ouvert — "ʿAyn" signifie "œil" en arabe.',
    solaire:false,
    exemple:{ ar:'الْعَلِيمُ', translit:'al-ʿAlīm', fr:'L\'Omniscient', verset:'S.2:29' },
    harakat:['عَ','عِ','عُ','عْ'],
    couleur:G.gold,
    audio:'عَيْنْ'
  },
  {
    num:19, name:'Ghayn', ar:'غ', translit:'gh',
    formes:['غ','غـ','ـغـ','ـغ'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Gh" — comme le "R" grasseyé parisien, ou un gargarisme léger.',
    prononciation:'Fond de la gorge, son voisé et roulé. Vibration de la luette.',
    mnemo:'Même forme que ʿAyn avec un point — le Gh gargarisé.',
    solaire:false,
    exemple:{ ar:'الْغَفُورُ', translit:'al-Ghafūr', fr:'Le Grand Pardonneur', verset:'S.2:173' },
    harakat:['غَ','غِ','غُ','غْ'],
    couleur:G.purple,
    audio:'غَيْنْ'
  },
  {
    num:20, name:'Fā', ar:'ف', translit:'f',
    formes:['ف','فـ','ـفـ','ـف'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"F" labiodental comme en français.',
    prononciation:'Lèvre inférieure contre les dents du haut, souffle continu.',
    mnemo:'Un cercle avec une queue et un point — le F de la Fatiha.',
    solaire:false,
    exemple:{ ar:'الْفَاتِحَةُ', translit:'al-Fātiḥa', fr:'L\'Ouverture', verset:'Sourate 1' },
    harakat:['فَ','فِ','فُ','فْ'],
    couleur:G.blue,
    audio:'فَاءْ'
  },
  {
    num:21, name:'Qāf', ar:'ق', translit:'q',
    formes:['ق','قـ','ـقـ','ـق'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Q" du fond de la gorge — plus en arrière que le K. Deux points sous le cercle.',
    prononciation:'Fond de la gorge, explosion sèche et profonde. Comme avaler son K.',
    mnemo:'Même cercle que Fā mais deux points en dessous — le Q du Quran.',
    solaire:false,
    exemple:{ ar:'الْقُرْآنُ', translit:'al-Qurʾān', fr:'Le Coran', verset:'S.2:185' },
    harakat:['قَ','قِ','قُ','قْ'],
    couleur:G.gold,
    audio:'قَافْ'
  },
  {
    num:22, name:'Kāf', ar:'ك', translit:'k',
    formes:['ك','كـ','ـكـ','ـك'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"K" comme en français.',
    prononciation:'Dos de la langue contre le palais mou, explosion nette.',
    mnemo:'Ressemble à un K latin avec un petit trait intérieur.',
    solaire:false,
    exemple:{ ar:'الْكَرِيمُ', translit:'al-Karīm', fr:'Le Généreux', verset:'S.27:40' },
    harakat:['كَ','كِ','كُ','كْ'],
    couleur:G.green,
    audio:'كَافْ'
  },
  {
    num:23, name:'Lām', ar:'ل', translit:'l',
    formes:['ل','لـ','ـلـ','ـل'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"L" comme en français.',
    prononciation:'Pointe de la langue contre le palais, son latéral.',
    mnemo:'Une canne recourbée vers la gauche — le L du Lien.',
    solaire:true,
    exemple:{ ar:'اللَّهُ', translit:'Allāh', fr:'Allah', verset:'S.1:1' },
    harakat:['لَ','لِ','لُ','لْ'],
    couleur:G.gold,
    audio:'لَامْ'
  },
  {
    num:24, name:'Mīm', ar:'م', translit:'m',
    formes:['م','مـ','ـمـ','ـم'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"M" bilabial comme en français.',
    prononciation:'Lèvres fermées, son nasalisé.',
    mnemo:'Un petit cercle fermé — la bouche qui dit "Mmmm".',
    solaire:false,
    exemple:{ ar:'الرَّحِيمُ', translit:'ar-Raḥīm', fr:'Le Miséricordieux', verset:'S.1:1' },
    harakat:['مَ','مِ','مُ','مْ'],
    couleur:G.blue,
    audio:'مِيمْ'
  },
  {
    num:25, name:'Nūn', ar:'ن', translit:'n',
    formes:['ن','نـ','ـنـ','ـن'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"N" comme en français. Un point au-dessus.',
    prononciation:'Pointe de la langue contre les dents, son nasalisé.',
    mnemo:'Un bol avec un point au-dessus — la Note du Nūn.',
    solaire:true,
    exemple:{ ar:'النُّورُ', translit:'an-Nūr', fr:'La Lumière', verset:'S.24:35' },
    harakat:['نَ','نِ','نُ','نْ'],
    couleur:G.purple,
    audio:'نُونْ'
  },
  {
    num:26, name:'Hā', ar:'ه', translit:'h',
    formes:['ه','هـ','ـهـ','ـه'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"H" aspiré léger comme en anglais (house). Plus doux que le Ḥ.',
    prononciation:'Glotte légèrement resserrée, souffle presque inaudible.',
    mnemo:'Ressemble à un visage avec deux yeux — le H du Ha !',
    solaire:false,
    exemple:{ ar:'اللَّهُ', translit:'Allāh', fr:'Le H final du nom divin', verset:'S.1:1' },
    harakat:['هَ','هِ','هُ','هْ'],
    couleur:G.gold,
    audio:'هَاءْ'
  },
  {
    num:27, name:'Wāw', ar:'و', translit:'w / ū',
    formes:['و','و','ـو','ـو'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"W" semi-consonne ou voyelle longue "ū" (comme "ou" prolongé). Ne se lie pas à la suivante.',
    prononciation:'Lèvres arrondies — soit glissante (W) soit tenue longue (ū).',
    mnemo:'Un crochet avec une boucle — le hameçon du Wāw.',
    solaire:false,
    exemple:{ ar:'وَاللَّهُ', translit:'wa-llāh', fr:'Et Allah / Par Allah', verset:'S.3:62' },
    harakat:['وَ','وِ','وُ','وْ'],
    couleur:G.green,
    audio:'وَاوْ'
  },
  {
    num:28, name:'Yā', ar:'ي', translit:'y / ī',
    formes:['ي','يـ','ـيـ','ـي'],
    labels:['Isolée','Initiale','Médiane','Finale'],
    son:'"Y" semi-consonne ou voyelle longue "ī" (comme "i" prolongé). Deux points en dessous.',
    prononciation:'Lèvres étirées — soit glissante (Y) soit tenue longue (ī).',
    mnemo:'Une main tendue avec deux points — le Y du Yā Allāh.',
    solaire:false,
    exemple:{ ar:'يَا أَيُّهَا النَّاسُ', translit:'Yā ayyuhā n-nās', fr:'Ô vous les hommes !', verset:'S.2:21' },
    harakat:['يَ','يِ','يُ','يْ'],
    couleur:G.blue,
    audio:'يَاءْ'
  },
]

const HARAKAT = [
  { sym:'َ', nom:'Fatḥa', translit:'a', son:'Voyelle courte A', exemple:'كَتَبَ', ex_fr:'kataba', couleur:G.gold },
  { sym:'ِ', nom:'Kasra', translit:'i', son:'Voyelle courte I', exemple:'كِتَابٌ', ex_fr:'kitāb', couleur:G.blue },
  { sym:'ُ', nom:'Ḍamma', translit:'u', son:'Voyelle courte U', exemple:'كُتُبٌ', ex_fr:'kutub', couleur:G.green },
  { sym:'ً', nom:'Tanwīn Fatḥ', translit:'an', son:'Double A final (indéfini)', exemple:'كِتَابًا', ex_fr:'kitāban', couleur:G.orange },
  { sym:'ٌ', nom:'Tanwīn Ḍamm', translit:'un', son:'Double U final (indéfini)', exemple:'كِتَابٌ', ex_fr:'kitābun', couleur:G.orange },
  { sym:'ٍ', nom:'Tanwīn Kasr', translit:'in', son:'Double I final (indéfini)', exemple:'كِتَابٍ', ex_fr:'kitābin', couleur:G.orange },
  { sym:'ْ', nom:'Sukūn', translit:'—', son:'Consonne sans voyelle (arrêt)', exemple:'مَلَكْ', ex_fr:'malak', couleur:G.textDim },
  { sym:'ّ', nom:'Shadda', translit:'×2', son:'Consonne doublée (gémination)', exemple:'اللَّهُ', ex_fr:'allāh', couleur:G.red },
  { sym:'ٰ', nom:'Alif Khanjarī', translit:'ā', son:'Alif diacritique (A long)', exemple:'الرَّحْمَنُ', ex_fr:'raḥmān', couleur:G.purple },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]]
  }
  return a
}

// ══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function Alphabet() {
  const [tab, setTab]             = useState('lecon')
  const [cur, setCur]             = useState(0)
  const [showFormes, setShowFormes] = useState(false)
  const [quizQ, setQuizQ]         = useState(null)
  const [quizChoices, setQuizChoices] = useState([])
  const [quizAnswer, setQuizAnswer]   = useState(null)
  const [quizCorrect, setQuizCorrect] = useState(null)
  const [quizMode, setQuizMode]       = useState('name') // 'name' | 'letter'
  const [score, setScore]             = useState({ ok:0, total:0 })
  const [streak, setStreak]           = useState(0)
  const [gridSel, setGridSel]         = useState(null)
  const [voicesReady, setVoicesReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const load = () => setVoicesReady(true)
      window.speechSynthesis.onvoiceschanged = load
      if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true)
    }
  }, [])

  const speak = useCallback((text) => {
    speakArabic(text)
  }, [])

  const letter = LETTERS[cur]
  const pct = score.total > 0 ? Math.round(score.ok/score.total*100) : 0

  // Générer question quiz
  const nextQuiz = useCallback((mode) => {
    const idx = Math.floor(Math.random()*28)
    const target = LETTERS[idx]
    const wrong = shuffle(LETTERS.filter((_,i)=>i!==idx)).slice(0,3)
    const all = shuffle([target,...wrong])
    const ci = all.findIndex(l=>l.ar===target.ar)
    setQuizQ(target)
    setQuizChoices(all)
    setQuizCorrect(ci)
    setQuizAnswer(null)
  }, [])

  useEffect(() => {
    if (tab==='quiz') nextQuiz(quizMode)
  }, [tab])

  const handleQuizAnswer = (i) => {
    if (quizAnswer !== null) return
    setQuizAnswer(i)
    const ok = i === quizCorrect
    setScore(p => ({ ok: p.ok+(ok?1:0), total: p.total+1 }))
    setStreak(p => ok ? p+1 : 0)
    if (ok) speak(quizQ.audio)
  }

  return (
    <>
      <Head>
        <title>Alphabet Arabe — Tarjama</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" rel="stylesheet"/>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:${G.dark};color:${G.text};font-family:Lato,sans-serif}
          @keyframes pop{0%{transform:scale(.93);opacity:0}100%{transform:scale(1);opacity:1}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        `}</style>
      </Head>

      <div style={{maxWidth:580,margin:'0 auto',padding:'20px',minHeight:'100vh'}}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Link href="/" style={{color:G.textMuted,textDecoration:'none',fontSize:10,letterSpacing:2,textTransform:'uppercase'}}>← Retour</Link>
            <span style={{color:G.textMuted,fontSize:9}}>|</span>
            <span style={{fontFamily:'Cinzel,serif',fontSize:16,color:G.gold}}>ALPHABET ARABE</span>
          </div>
          {tab==='quiz' && score.total>0 && (
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {streak>=3 && <span style={{fontSize:10,color:G.orange,letterSpacing:1}}>{streak} serie</span>}
              <span style={{fontFamily:'Cinzel,serif',fontSize:18,color:pct>=70?G.green:G.orange}}>{pct}%</span>
            </div>
          )}
        </div>

        {/* ── Onglets ─────────────────────────────────────────────── */}
        <div style={{display:'flex',gap:3,marginBottom:22,background:G.dark3,borderRadius:4,padding:3}}>
          {[
            {id:'lecon',label:'Leçon'},
            {id:'grille',label:'Grille'},
            {id:'harakat',label:'Harakat'},
            {id:'quiz',label:'Quiz'},
          ].map(t => (
            <button key={t.id} onClick={()=>{setTab(t.id);setGridSel(null)}}
              style={{
                flex:1,padding:'8px 2px',
                background: tab===t.id ? G.dark4 : 'transparent',
                border: `1px solid ${tab===t.id ? 'rgba(201,168,76,.25)' : 'transparent'}`,
                borderRadius:3,
                color: tab===t.id ? G.goldLight : G.textMuted,
                fontFamily:'Lato,sans-serif',fontSize:10,fontWeight:700,
                letterSpacing:1,textTransform:'uppercase',cursor:'pointer',transition:'all .18s'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            ONGLET LEÇON
        ══════════════════════════════════════════════════════════ */}
        {tab==='lecon' && (
          <div style={{animation:'fadeUp .3s ease'}}>

            {/* Barre de progression des 28 lettres */}
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:18}}>
              {LETTERS.map((l,i) => (
                <button key={i} onClick={()=>{setCur(i);setShowFormes(false)}}
                  style={{
                    width:32,height:32,borderRadius:3,cursor:'pointer',
                    background: cur===i ? `${l.couleur}22` : G.dark3,
                    border:`1px solid ${cur===i ? l.couleur : 'rgba(255,255,255,.06)'}`,
                    color: cur===i ? l.couleur : G.textDim,
                    fontFamily:'Amiri,serif',fontSize:17,direction:'rtl',
                    transition:'all .12s',
                  }}>
                  {l.ar}
                </button>
              ))}
            </div>

            {/* Carte lettre */}
            <div key={cur} style={{animation:'pop .22s ease'}}>

              {/* Zone principale — lettre en grand */}
              <div style={{
                background:G.dark3,
                border:`1px solid ${letter.couleur}35`,
                borderTop:`3px solid ${letter.couleur}`,
                borderRadius:'6px 6px 0 0',
                padding:'28px 20px 20px',
                textAlign:'center',
              }}>
                {/* Numéro */}
                <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:G.textMuted,marginBottom:10}}>
                  {letter.num} / 28 — {letter.solaire ? 'Lettre solaire' : 'Lettre lunaire'}
                </div>

                {/* Grande lettre cliquable (audio) */}
                <button
                  onClick={()=>speak(letter.audio)}
                  title="Écouter la prononciation"
                  style={{
                    background:'none',border:'none',cursor:'pointer',
                    fontFamily:'Amiri,serif',fontSize:108,color:letter.couleur,
                    direction:'rtl',lineHeight:1,display:'block',margin:'0 auto 10px',
                    transition:'transform .1s',
                  }}
                  onMouseDown={e=>e.currentTarget.style.transform='scale(.95)'}
                  onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
                >
                  {letter.ar}
                </button>

                {/* Bouton audio explicite */}
                <button onClick={()=>speak(letter.audio)}
                  style={{
                    display:'inline-flex',alignItems:'center',gap:6,
                    background:'rgba(201,168,76,.08)',border:`1px solid rgba(201,168,76,.2)`,
                    borderRadius:20,padding:'5px 14px',cursor:'pointer',
                    color:G.gold,fontFamily:'Lato,sans-serif',fontSize:10,letterSpacing:1,
                    textTransform:'uppercase',marginBottom:14,
                  }}>
                  ▶ Écouter
                </button>

                {/* Nom + translit */}
                <div style={{fontFamily:'Cinzel,serif',fontSize:18,color:G.goldLight,letterSpacing:2}}>{letter.name}</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:14,color:G.textMuted,fontStyle:'italic',marginTop:3}}>{letter.translit}</div>
              </div>

              {/* 4 formes */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:G.dark4,border:`1px solid ${letter.couleur}18`,borderBottom:'none'}}>
                {letter.formes.map((f,i) => (
                  <button key={i} onClick={()=>speak(f + 'ا')}
                    style={{
                      textAlign:'center',padding:'12px 6px',cursor:'pointer',
                      borderRight: i<3 ? '1px solid rgba(255,255,255,.05)' : 'none',
                      background:'none',border:'none',borderRight: i<3 ? '1px solid rgba(255,255,255,.05)' : 'none',
                      transition:'background .15s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.03)'}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}
                  >
                    <div style={{fontFamily:'Amiri,serif',fontSize:26,color:G.text,direction:'rtl',marginBottom:4}}>{f}</div>
                    <div style={{fontSize:8,letterSpacing:1,textTransform:'uppercase',color:G.textMuted}}>{letter.labels[i]}</div>
                  </button>
                ))}
              </div>

              {/* Harakat de cette lettre */}
              <div style={{
                background:'rgba(0,0,0,.2)',
                border:`1px solid rgba(255,255,255,.05)`,
                borderBottom:'none',
                padding:'10px 16px',
                display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',
              }}>
                <span style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:G.textMuted,marginRight:4}}>Vocalisation :</span>
                {letter.harakat.map((h,i) => (
                  <button key={i} onClick={()=>speak(h)}
                    style={{
                      fontFamily:'Amiri,serif',fontSize:22,color:G.goldLight,
                      direction:'rtl',background:'rgba(201,168,76,.07)',
                      border:'1px solid rgba(201,168,76,.15)',borderRadius:3,
                      padding:'2px 10px',cursor:'pointer',
                    }}>
                    {h}
                  </button>
                ))}
                {['ā','i','u'].map((v,i) => (
                  <span key={i} style={{fontFamily:'Georgia,serif',fontSize:11,color:G.textMuted,fontStyle:'italic'}}>{v}</span>
                ))}
              </div>

              {/* Prononciation */}
              <div style={{
                background:G.dark3,border:`1px solid rgba(201,168,76,.08)`,
                borderBottom:'none',padding:'14px 18px',
                borderLeft:`3px solid ${letter.couleur}`,
              }}>
                <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:letter.couleur,marginBottom:7}}>Prononciation</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:15,color:G.textDim,lineHeight:1.9}}>{letter.son}</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:13,color:G.textMuted,fontStyle:'italic',marginTop:6,lineHeight:1.7}}>{letter.prononciation}</div>
              </div>

              {/* Mnémo */}
              <div style={{
                background:'rgba(201,168,76,.03)',border:`1px solid rgba(201,168,76,.07)`,
                borderBottom:'none',padding:'12px 18px',
              }}>
                <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:G.gold,marginBottom:5}}>Mémorisation</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:14,color:G.textMuted,lineHeight:1.8,fontStyle:'italic'}}>{letter.mnemo}</div>
              </div>

              {/* Exemple coranique */}
              <div style={{
                background:G.dark3,border:`1px solid rgba(201,168,76,.1)`,
                borderRadius:'0 0 6px 6px',padding:'14px 18px',
                display:'flex',alignItems:'center',gap:14,
              }}>
                <button onClick={()=>speak(letter.exemple.ar)}
                  style={{
                    background:'none',border:'none',cursor:'pointer',
                    fontFamily:'Amiri,serif',fontSize:28,color:G.goldLight,
                    direction:'rtl',flexShrink:0,
                  }}>
                  {letter.exemple.ar}
                </button>
                <div>
                  <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:G.textMuted,marginBottom:4}}>Exemple coranique</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:13,color:G.textDim,fontStyle:'italic'}}>{letter.exemple.translit}</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:13,color:G.text,marginTop:2}}>{letter.exemple.fr}</div>
                  <div style={{fontSize:10,color:G.textMuted,marginTop:2}}>{letter.exemple.verset}</div>
                </div>
              </div>
            </div>

            {/* Prev / Next */}
            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button onClick={()=>{setCur(c=>(c-1+28)%28);setShowFormes(false)}}
                style={{flex:1,padding:'12px',background:G.dark3,border:`1px solid rgba(201,168,76,.12)`,color:G.textDim,borderRadius:4,cursor:'pointer',fontFamily:'Lato,sans-serif',fontSize:10,letterSpacing:2,textTransform:'uppercase'}}>
                ← Précédent
              </button>
              <button onClick={()=>{setCur(c=>(c+1)%28);setShowFormes(false)}}
                style={{flex:1,padding:'12px',background:'linear-gradient(135deg,#8B6914,#C9A84C)',border:'none',color:G.dark,borderRadius:4,cursor:'pointer',fontFamily:'Lato,sans-serif',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase'}}>
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET GRILLE
        ══════════════════════════════════════════════════════════ */}
        {tab==='grille' && (
          <div style={{animation:'fadeUp .3s ease'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:14,color:G.textDim,lineHeight:1.8,marginBottom:16}}>
              Clique sur une lettre pour sa fiche — clique à nouveau pour entendre sa prononciation.
            </div>

            {/* Grille 7×4 */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,marginBottom:16}}>
              {LETTERS.map((l,i) => (
                <button key={i} onClick={()=>{setGridSel(gridSel===i?null:i); speak(l.audio)}}
                  style={{
                    padding:'10px 4px',textAlign:'center',cursor:'pointer',
                    background: gridSel===i ? `${l.couleur}18` : G.dark3,
                    border:`1px solid ${gridSel===i ? l.couleur : 'rgba(255,255,255,.06)'}`,
                    borderRadius:4,transition:'all .12s',
                  }}>
                  <div style={{fontFamily:'Amiri,serif',fontSize:24,color:gridSel===i?l.couleur:G.text,direction:'rtl',marginBottom:2}}>{l.ar}</div>
                  <div style={{fontSize:7,color:G.textMuted,letterSpacing:.5}}>{l.name}</div>
                </button>
              ))}
            </div>

            {/* Fiche lettre sélectionnée */}
            {gridSel !== null && (() => {
              const l = LETTERS[gridSel]
              return (
                <div key={gridSel} style={{animation:'pop .2s ease',background:G.dark3,border:`1px solid ${l.couleur}40`,borderRadius:6,padding:'18px',borderTop:`3px solid ${l.couleur}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:14}}>
                    <button onClick={()=>speak(l.audio)}
                      style={{background:'none',border:'none',cursor:'pointer',fontFamily:'Amiri,serif',fontSize:72,color:l.couleur,direction:'rtl',lineHeight:1}}>
                      {l.ar}
                    </button>
                    <div>
                      <div style={{fontFamily:'Cinzel,serif',fontSize:16,color:G.goldLight,letterSpacing:2}}>{l.name}</div>
                      <div style={{fontFamily:'Georgia,serif',fontSize:13,color:G.textMuted,fontStyle:'italic',marginTop:3}}>{l.translit}</div>
                      {/* 4 formes inline */}
                      <div style={{display:'flex',gap:10,marginTop:10}}>
                        {l.formes.map((f,i)=>(
                          <div key={i} style={{textAlign:'center'}}>
                            <button onClick={()=>speak(f)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:'Amiri,serif',fontSize:20,color:G.text,direction:'rtl',display:'block'}}>{f}</button>
                            <div style={{fontSize:7,color:G.textMuted,marginTop:1}}>{l.labels[i]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:14,color:G.textDim,lineHeight:1.9,borderLeft:`2px solid ${l.couleur}50`,paddingLeft:12,marginBottom:10}}>
                    {l.son}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <button onClick={()=>speak(l.exemple.ar)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:'Amiri,serif',fontSize:22,color:G.goldLight,direction:'rtl'}}>{l.exemple.ar}</button>
                    <span style={{fontFamily:'Georgia,serif',fontSize:13,color:G.textMuted,fontStyle:'italic'}}>{l.exemple.fr}</span>
                  </div>
                  <button onClick={()=>{setTab('lecon');setCur(gridSel)}}
                    style={{marginTop:10,padding:'6px 14px',background:'transparent',border:`1px solid rgba(201,168,76,.2)`,color:G.gold,borderRadius:3,cursor:'pointer',fontFamily:'Lato,sans-serif',fontSize:9,letterSpacing:2,textTransform:'uppercase'}}>
                    Leçon complète
                  </button>
                </div>
              )
            })()}

            {/* Lettres solaires / lunaires */}
            <div style={{marginTop:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[
                {label:'Lettres lunaires',sub:'ال se prononce "al-"',color:G.gold,letters:LETTERS.filter(l=>!l.solaire)},
                {label:'Lettres solaires',sub:'ال s\'assimile à la lettre',color:G.red,letters:LETTERS.filter(l=>l.solaire)},
              ].map(g => (
                <div key={g.label} style={{background:G.dark3,border:`1px solid ${g.color}22`,borderRadius:4,padding:'12px',borderTop:`2px solid ${g.color}`}}>
                  <div style={{fontSize:10,letterSpacing:1,textTransform:'uppercase',color:g.color,marginBottom:4}}>{g.label}</div>
                  <div style={{fontSize:10,color:G.textMuted,marginBottom:8,fontFamily:'Georgia,serif',fontStyle:'italic'}}>{g.sub}</div>
                  <div style={{fontFamily:'Amiri,serif',fontSize:20,color:G.text,direction:'rtl',lineHeight:1.9}}>
                    {g.letters.map(l=>l.ar).join(' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET HARAKAT
        ══════════════════════════════════════════════════════════ */}
        {tab==='harakat' && (
          <div style={{animation:'fadeUp .3s ease'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:15,color:G.textDim,lineHeight:1.9,marginBottom:18}}>
              Les <strong style={{color:G.goldLight}}>حَرَكَات</strong> (harakat) sont les signes de vocalisation. Le Coran en est entièrement voalisé pour garantir une prononciation parfaite depuis 14 siècles.
            </div>

            <div style={{display:'grid',gap:8,marginBottom:20}}>
              {HARAKAT.map((h,i) => (
                <button key={i} onClick={()=>speak(h.exemple)}
                  style={{
                    background:G.dark3,border:`1px solid rgba(255,255,255,.06)`,
                    borderLeft:`3px solid ${h.couleur}`,borderRadius:4,
                    padding:'14px 16px',display:'flex',alignItems:'center',gap:14,
                    cursor:'pointer',textAlign:'left',transition:'background .15s',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background=G.dark4}
                  onMouseLeave={e=>e.currentTarget.style.background=G.dark3}
                >
                  <div style={{fontFamily:'Amiri,serif',fontSize:38,color:h.couleur,direction:'rtl',minWidth:56,textAlign:'center'}}>
                    {'بـ' + h.sym}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                      <span style={{fontFamily:'Cinzel,serif',fontSize:12,color:G.goldLight,letterSpacing:1}}>{h.nom}</span>
                      <span style={{fontFamily:'Georgia,serif',fontSize:11,color:G.textMuted,fontStyle:'italic'}}>/ {h.translit} /</span>
                    </div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:14,color:G.textDim,lineHeight:1.6}}>{h.son}</div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                      <span style={{fontFamily:'Amiri,serif',fontSize:18,color:G.goldLight,direction:'rtl'}}>{h.exemple}</span>
                      <span style={{fontFamily:'Georgia,serif',fontSize:12,color:G.textMuted,fontStyle:'italic'}}>{h.ex_fr}</span>
                      <span style={{fontSize:10,color:G.gold,opacity:.6}}>▶</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Voyelles longues */}
            <div style={{background:G.dark3,border:'1px solid rgba(201,168,76,.1)',borderRadius:6,padding:'16px 18px'}}>
              <div style={{fontFamily:'Cinzel,serif',fontSize:12,color:G.gold,letterSpacing:2,marginBottom:12}}>VOYELLES LONGUES</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[
                  {ar:'ا',name:'Alif',son:'ā — A long',exemple:'كِتَابٌ',ex_fr:'kitāb',couleur:G.gold},
                  {ar:'و',name:'Wāw',son:'ū — U long',exemple:'رَسُولٌ',ex_fr:'rasūl',couleur:G.green},
                  {ar:'ي',name:'Yā',son:'ī — I long',exemple:'بِسْمِ',ex_fr:'bismi',couleur:G.blue},
                ].map((v,i) => (
                  <button key={i} onClick={()=>speak(v.exemple)}
                    style={{background:G.dark4,border:`1px solid ${v.couleur}25`,borderRadius:4,padding:'12px 8px',textAlign:'center',cursor:'pointer'}}>
                    <div style={{fontFamily:'Amiri,serif',fontSize:32,color:v.couleur,direction:'rtl',marginBottom:6}}>{v.ar}</div>
                    <div style={{fontFamily:'Cinzel,serif',fontSize:11,color:G.goldLight,letterSpacing:1,marginBottom:3}}>{v.name}</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:12,color:G.textDim,fontStyle:'italic'}}>{v.son}</div>
                    <div style={{fontFamily:'Amiri,serif',fontSize:16,color:G.goldLight,direction:'rtl',marginTop:6}}>{v.exemple}</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:11,color:G.textMuted,fontStyle:'italic',marginTop:2}}>{v.ex_fr}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET QUIZ
        ══════════════════════════════════════════════════════════ */}
        {tab==='quiz' && (
          <div style={{animation:'fadeUp .3s ease'}}>
            {/* Score */}
            {score.total > 0 && (
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,padding:'10px 16px',background:G.dark3,borderRadius:4,border:`1px solid rgba(201,168,76,.1)`}}>
                <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',color:G.textMuted}}>Score session</div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  {streak>=3 && <span style={{fontSize:10,color:G.orange,letterSpacing:1,animation:'pulse 1.5s infinite'}}>{streak} en série</span>}
                  <span style={{fontFamily:'Cinzel,serif',fontSize:18,color:pct>=70?G.green:G.orange}}>{pct}% — {score.ok}/{score.total}</span>
                </div>
              </div>
            )}

            {/* Mode switch */}
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {[{id:'name',label:'Voir la lettre → Trouver le nom'},
                {id:'letter',label:'Voir le nom → Trouver la lettre'}].map(m => (
                <button key={m.id} onClick={()=>{setQuizMode(m.id);nextQuiz(m.id)}}
                  style={{
                    flex:1,padding:'8px 6px',background: quizMode===m.id ? 'rgba(155,127,212,.15)' : G.dark3,
                    border:`1px solid ${quizMode===m.id ? G.purple : 'rgba(255,255,255,.06)'}`,
                    borderRadius:3,cursor:'pointer',color: quizMode===m.id ? G.purple : G.textMuted,
                    fontFamily:'Lato,sans-serif',fontSize:9,letterSpacing:.5,textAlign:'center',lineHeight:1.4,
                  }}>
                  {m.label}
                </button>
              ))}
            </div>

            {quizQ && (
              <div key={quizQ.ar + quizMode} style={{animation:'pop .22s ease'}}>

                {/* Question */}
                <div style={{
                  background:G.dark3,border:`1px solid rgba(201,168,76,.15)`,
                  borderRadius:6,padding:'28px 20px',textAlign:'center',marginBottom:14,
                }}>
                  {quizMode==='name' ? (
                    <>
                      <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:G.textMuted,marginBottom:12}}>
                        Quel est le nom de cette lettre ?
                      </div>
                      <button onClick={()=>speak(quizQ.audio)}
                        style={{background:'none',border:'none',cursor:'pointer',fontFamily:'Amiri,serif',fontSize:100,color:G.goldLight,direction:'rtl',lineHeight:1,display:'block',margin:'0 auto 10px'}}>
                        {quizQ.ar}
                      </button>
                      <div style={{fontSize:9,color:G.textMuted,letterSpacing:1,marginTop:4}}>Clique pour entendre</div>
                    </>
                  ) : (
                    <>
                      <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:G.textMuted,marginBottom:12}}>
                        Quelle lettre correspond à ce nom ?
                      </div>
                      <div style={{fontFamily:'Cinzel,serif',fontSize:36,color:G.goldLight,letterSpacing:3,marginBottom:6}}>{quizQ.name}</div>
                      <div style={{fontFamily:'Georgia,serif',fontSize:15,color:G.textMuted,fontStyle:'italic'}}>{quizQ.translit}</div>
                      <div style={{fontFamily:'Georgia,serif',fontSize:13,color:G.textDim,marginTop:8,lineHeight:1.6}}>{quizQ.son.slice(0,60)}...</div>
                    </>
                  )}
                </div>

                {/* Choix */}
                <div style={{display:'grid',gridTemplateColumns:quizMode==='letter'?'repeat(2,1fr)':'1fr',gap:8,marginBottom:14}}>
                  {quizChoices.map((l,i) => {
                    const isSel = quizAnswer === i
                    const isOk = i === quizCorrect
                    let bg = 'rgba(255,255,255,.03)', border = 'rgba(255,255,255,.07)', color = G.text
                    if (quizAnswer !== null) {
                      if (isOk) { bg='rgba(76,175,125,.1)'; border=G.green; color=G.green }
                      else if (isSel) { bg='rgba(201,107,107,.1)'; border=G.red; color=G.red }
                    }
                    return (
                      <button key={i} onClick={()=>handleQuizAnswer(i)}
                        style={{
                          background:bg,border:`1px solid ${border}`,borderRadius:4,
                          padding: quizMode==='letter' ? '18px 8px' : '14px 18px',
                          cursor:quizAnswer!==null?'default':'pointer',
                          textAlign:'center',transition:'all .12s',outline:'none',
                          animation: quizAnswer!==null && isSel && !isOk ? 'shake .3s ease' : 'none',
                        }}>
                        {quizMode==='letter' ? (
                          <div style={{fontFamily:'Amiri,serif',fontSize:44,color,direction:'rtl'}}>{l.ar}</div>
                        ) : (
                          <div style={{display:'flex',alignItems:'center',gap:12}}>
                            <div style={{width:28,height:28,borderRadius:'50%',background:quizAnswer!==null?(isOk?G.green:isSel?G.red:'rgba(255,255,255,.06)'):'rgba(201,168,76,.1)',color:quizAnswer!==null?(isOk||isSel?G.dark:G.textMuted):G.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>
                              {['A','B','C','D'][i]}
                            </div>
                            <div style={{textAlign:'left'}}>
                              <div style={{fontFamily:'Cinzel,serif',fontSize:14,color,letterSpacing:1}}>{l.name}</div>
                              <div style={{fontFamily:'Georgia,serif',fontSize:11,color:G.textMuted,fontStyle:'italic',marginTop:2}}>{l.translit}</div>
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Résultat */}
                {quizAnswer !== null && (
                  <div style={{animation:'fadeUp .2s ease'}}>
                    {quizAnswer !== quizCorrect && (
                      <div style={{padding:'12px 16px',background:'rgba(201,107,107,.06)',border:'1px solid rgba(201,107,107,.15)',borderRadius:4,marginBottom:10,fontFamily:'Georgia,serif',fontSize:14,color:G.textDim,lineHeight:1.8}}>
                        C'était <strong style={{color:G.goldLight}}>{quizQ.name}</strong> ({quizQ.translit}) — {quizQ.son.slice(0,60)}
                      </div>
                    )}
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>nextQuiz(quizMode)}
                        style={{flex:1,padding:'13px',background:quizAnswer===quizCorrect?'linear-gradient(135deg,#2d6b4a,#4CAF7D)':'linear-gradient(135deg,#8B6914,#C9A84C)',border:'none',borderRadius:4,color:G.dark,fontFamily:'Lato,sans-serif',fontSize:10,fontWeight:700,letterSpacing:2,textTransform:'uppercase',cursor:'pointer'}}>
                        {quizAnswer===quizCorrect ? 'Suivant →' : 'Réessayer'}
                      </button>
                      <button onClick={()=>{setTab('lecon');setCur(LETTERS.indexOf(quizQ))}}
                        style={{padding:'13px 14px',background:G.dark3,border:`1px solid rgba(201,168,76,.15)`,borderRadius:4,color:G.textMuted,cursor:'pointer',fontFamily:'Lato,sans-serif',fontSize:9,letterSpacing:1,textTransform:'uppercase'}}>
                        Voir la leçon
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}
