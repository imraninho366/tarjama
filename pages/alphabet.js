import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { G } from '../lib/theme'
import s from '../styles/Alphabet.module.css'
import Button from '../components/common/Button'

// ══════════════════════════════════════════════════════════════════
// AUDIO — Web Speech API en arabe
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
// DONNEES COMPLETES — 28 lettres
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

  const TABS = [
    {id:'lecon',label:'Lecon'},
    {id:'grille',label:'Grille'},
    {id:'harakat',label:'Harakat'},
    {id:'quiz',label:'Quiz'},
  ]

  return (
    <>
      <Head>
        <title>Alphabet Arabe — Tarjama</title>
      </Head>

      <div className={s.page}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className={s.header}>
          <span className={s.headerTitle}>ALPHABET ARABE</span>
          {tab==='quiz' && score.total>0 && (
            <div className={s.headerScore}>
              {streak>=3 && <span className={s.streakBadge}>{streak} serie</span>}
              <span className={`${s.scorePct} ${pct>=70 ? s.scoreGood : s.scoreWarn}`}>
                {pct}%
              </span>
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className={s.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={()=>{setTab(t.id);setGridSel(null)}}
              className={`${s.tab} ${tab===t.id ? s.tabActive : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            ONGLET LECON
        ══════════════════════════════════════════════════════════ */}
        {tab==='lecon' && (
          <div className={s.viewContent}>

            {/* Barre de progression des 28 lettres */}
            <div className={s.letterBar}>
              {LETTERS.map((l,i) => (
                <button
                  key={i}
                  onClick={()=>{setCur(i);setShowFormes(false)}}
                  className={`${s.letterBarBtn} ${cur===i ? s.letterBarActive : ''}`}
                  style={{
                    background: cur===i ? `${l.couleur}22` : undefined,
                    borderColor: cur===i ? l.couleur : undefined,
                    color: cur===i ? l.couleur : undefined,
                  }}
                >
                  {l.ar}
                </button>
              ))}
            </div>

            {/* Carte lettre */}
            <div key={cur} className={s.lessonCard}>

              {/* Zone principale — lettre en grand */}
              <div className={s.heroZone} style={{ borderTop: `3px solid ${letter.couleur}` }}>
                {/* Numéro */}
                <div className={s.heroMeta}>
                  {letter.num} / 28 — {letter.solaire ? 'Lettre solaire' : 'Lettre lunaire'}
                </div>

                {/* Grande lettre cliquable (audio) */}
                <button
                  onClick={()=>speak(letter.audio)}
                  title="Ecouter la prononciation"
                  className={s.heroLetter}
                  style={{ color: letter.couleur }}
                >
                  {letter.ar}
                </button>

                {/* Bouton audio explicite */}
                <button onClick={()=>speak(letter.audio)} className={s.speakBtn}>
                  &#9654; Ecouter
                </button>

                {/* Nom + translit */}
                <div className={s.heroName}>{letter.name}</div>
                <div className={s.heroTranslit}>{letter.translit}</div>
              </div>

              {/* 4 formes */}
              <div className={s.formesGrid}>
                {letter.formes.map((f,i) => (
                  <button key={i} onClick={()=>speak(f + 'ا')} className={s.formeCard}>
                    <div className={s.formeLetter}>{f}</div>
                    <div className={s.formeLabel}>{letter.labels[i]}</div>
                  </button>
                ))}
              </div>

              {/* Harakat de cette lettre */}
              <div className={s.vocRow}>
                <span className={s.vocLabel}>Vocalisation :</span>
                {letter.harakat.map((h,i) => (
                  <button key={i} onClick={()=>speak(h)} className={s.vocBtn}>
                    {h}
                  </button>
                ))}
                {['a','i','u'].map((v,i) => (
                  <span key={i} className={s.vocHint}>{v}</span>
                ))}
              </div>

              {/* Prononciation */}
              <div className={s.infoSectionAccent} style={{ color: letter.couleur, borderLeftColor: letter.couleur }}>
                <div className={s.infoLabel} style={{ color: letter.couleur }}>Prononciation</div>
                <div className={s.infoText}>{letter.son}</div>
                <div className={s.infoTextSmall}>{letter.prononciation}</div>
              </div>

              {/* Mnémo */}
              <div className={s.infoSectionMnemo}>
                <div className={s.infoLabel} style={{ color: G.gold }}>Memorisation</div>
                <div className={s.infoTextSmall}>{letter.mnemo}</div>
              </div>

              {/* Exemple coranique */}
              <div className={s.exampleSection}>
                <button onClick={()=>speak(letter.exemple.ar)} className={s.exampleArabic}>
                  {letter.exemple.ar}
                </button>
                <div>
                  <div className={s.exampleLabel}>Exemple coranique</div>
                  <div className={s.exampleTranslit}>{letter.exemple.translit}</div>
                  <div className={s.exampleFr}>{letter.exemple.fr}</div>
                  <div className={s.exampleRef}>{letter.exemple.verset}</div>
                </div>
              </div>
            </div>

            {/* Prev / Next */}
            <div className={s.navRow}>
              <button
                onClick={()=>{setCur(c=>(c-1+28)%28);setShowFormes(false)}}
                className={s.navPrev}
              >
                &#8592; Precedent
              </button>
              <button
                onClick={()=>{setCur(c=>(c+1)%28);setShowFormes(false)}}
                className={s.navNext}
              >
                Suivant &#8594;
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET GRILLE
        ══════════════════════════════════════════════════════════ */}
        {tab==='grille' && (
          <div className={s.viewContent}>
            <div className={s.gridIntro}>
              Clique sur une lettre pour sa fiche — clique a nouveau pour entendre sa prononciation.
            </div>

            {/* Grille 7x4 */}
            <div className={s.grid}>
              {LETTERS.map((l,i) => (
                <button
                  key={i}
                  onClick={()=>{setGridSel(gridSel===i?null:i); speak(l.audio)}}
                  className={`${s.gridCell} ${gridSel===i ? s.gridCellActive : ''}`}
                  style={{
                    background: gridSel===i ? `${l.couleur}18` : undefined,
                    borderColor: gridSel===i ? l.couleur : undefined,
                  }}
                >
                  <div className={s.gridAr} style={{ color: gridSel===i ? l.couleur : undefined }}>{l.ar}</div>
                  <div className={s.gridName}>{l.name}</div>
                </button>
              ))}
            </div>

            {/* Fiche lettre selectionnee */}
            {gridSel !== null && (() => {
              const l = LETTERS[gridSel]
              return (
                <div key={gridSel} className={s.gridDetail} style={{ borderTopColor: l.couleur }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:l.couleur }} />
                  <div className={s.gridDetailHeader}>
                    <button onClick={()=>speak(l.audio)} className={s.gridDetailLetter} style={{ color: l.couleur }}>
                      {l.ar}
                    </button>
                    <div>
                      <div className={s.gridDetailName}>{l.name}</div>
                      <div className={s.gridDetailTranslit}>{l.translit}</div>
                      {/* 4 formes inline */}
                      <div className={s.gridDetailFormes}>
                        {l.formes.map((f,i)=>(
                          <div key={i} className={s.gridDetailForme}>
                            <button onClick={()=>speak(f)} className={s.gridDetailFormeLetter}>{f}</button>
                            <div className={s.gridDetailFormeLabel}>{l.labels[i]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={s.gridDetailSon} style={{ borderLeftColor: `${l.couleur}80`, color: undefined }}>
                    {l.son}
                  </div>
                  <div className={s.gridDetailExample}>
                    <button onClick={()=>speak(l.exemple.ar)} className={s.gridDetailExAr}>{l.exemple.ar}</button>
                    <span className={s.gridDetailExFr}>{l.exemple.fr}</span>
                  </div>
                  <button
                    onClick={()=>{setTab('lecon');setCur(gridSel)}}
                    className={s.gridDetailLeconBtn}
                  >
                    Lecon complete
                  </button>
                </div>
              )
            })()}

            {/* Lettres solaires / lunaires */}
            <div className={s.solarLunar}>
              {[
                {label:'Lettres lunaires',sub:'ال se prononce "al-"',color:G.gold,letters:LETTERS.filter(l=>!l.solaire)},
                {label:'Lettres solaires',sub:'ال s\'assimile a la lettre',color:G.red,letters:LETTERS.filter(l=>l.solaire)},
              ].map(g => (
                <div key={g.label} className={s.solarLunarCard}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:g.color }} />
                  <div className={s.solarLunarTitle} style={{ color: g.color }}>{g.label}</div>
                  <div className={s.solarLunarSub}>{g.sub}</div>
                  <div className={s.solarLunarLetters}>
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
          <div className={s.viewContent}>
            <div className={s.harakatIntro}>
              Les <strong className={s.harakatHighlight}>&#1581;&#1614;&#1585;&#1614;&#1603;&#1614;&#1575;&#1578;</strong> (harakat) sont les signes de vocalisation. Le Coran en est entierement voalise pour garantir une prononciation parfaite depuis 14 siecles.
            </div>

            <div className={s.harakatList}>
              {HARAKAT.map((h,i) => (
                <button key={i} onClick={()=>speak(h.exemple)} className={s.harakatRow} style={{ color: h.couleur, borderLeftColor: h.couleur }}>
                  <div className={s.harakatSym} style={{ color: h.couleur }}>
                    {'بـ' + h.sym}
                  </div>
                  <div className={s.harakatInfo}>
                    <div className={s.harakatNameRow}>
                      <span className={s.harakatName}>{h.nom}</span>
                      <span className={s.harakatTranslit}>/ {h.translit} /</span>
                    </div>
                    <div className={s.harakatSon}>{h.son}</div>
                    <div className={s.harakatExample}>
                      <span className={s.harakatExAr}>{h.exemple}</span>
                      <span className={s.harakatExFr}>{h.ex_fr}</span>
                      <span className={s.harakatPlay}>&#9654;</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Voyelles longues */}
            <div className={s.longVowels}>
              <div className={s.longVowelsTitle}>VOYELLES LONGUES</div>
              <div className={s.longVowelsGrid}>
                {[
                  {ar:'ا',name:'Alif',son:'a — A long',exemple:'كِتَابٌ',ex_fr:'kitab',couleur:G.gold},
                  {ar:'و',name:'Waw',son:'u — U long',exemple:'رَسُولٌ',ex_fr:'rasul',couleur:G.green},
                  {ar:'ي',name:'Ya',son:'i — I long',exemple:'بِسْمِ',ex_fr:'bismi',couleur:G.blue},
                ].map((v,i) => (
                  <button key={i} onClick={()=>speak(v.exemple)} className={s.vowelCard} style={{ borderColor: `${v.couleur}40` }}>
                    <div className={s.vowelAr} style={{ color: v.couleur }}>{v.ar}</div>
                    <div className={s.vowelName}>{v.name}</div>
                    <div className={s.vowelSon}>{v.son}</div>
                    <div className={s.vowelExAr}>{v.exemple}</div>
                    <div className={s.vowelExFr}>{v.ex_fr}</div>
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
          <div className={s.viewContent}>
            {/* Score */}
            {score.total > 0 && (
              <div className={s.quizScoreBar}>
                <div className={s.quizScoreLabel}>Score session</div>
                <div className={s.quizScoreRight}>
                  {streak>=3 && <span className={s.streakBadge}>{streak} en serie</span>}
                  <span className={`${s.quizScoreValue} ${pct>=70 ? s.scoreGood : s.scoreWarn}`}>
                    {pct}% — {score.ok}/{score.total}
                  </span>
                </div>
              </div>
            )}

            {/* Mode switch */}
            <div className={s.quizModes}>
              {[{id:'name',label:'Voir la lettre → Trouver le nom'},
                {id:'letter',label:'Voir le nom → Trouver la lettre'}].map(m => (
                <button
                  key={m.id}
                  onClick={()=>{setQuizMode(m.id);nextQuiz(m.id)}}
                  className={`${s.quizModeBtn} ${quizMode===m.id ? s.quizModeActive : ''}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {quizQ && (
              <div key={quizQ.ar + quizMode} className={s.quizCard}>

                {/* Question */}
                <div className={s.quizQuestion}>
                  {quizMode==='name' ? (
                    <>
                      <div className={s.quizPrompt}>
                        Quel est le nom de cette lettre ?
                      </div>
                      <button onClick={()=>speak(quizQ.audio)} className={s.quizBigLetter}>
                        {quizQ.ar}
                      </button>
                      <div className={s.quizHint}>Clique pour entendre</div>
                    </>
                  ) : (
                    <>
                      <div className={s.quizPrompt}>
                        Quelle lettre correspond a ce nom ?
                      </div>
                      <div className={s.quizBigName}>{quizQ.name}</div>
                      <div className={s.quizNameTranslit}>{quizQ.translit}</div>
                      <div className={s.quizNameHint}>{quizQ.son.slice(0,60)}...</div>
                    </>
                  )}
                </div>

                {/* Choix */}
                <div className={`${s.quizChoices} ${quizMode==='letter' ? s.quizChoices2col : ''}`}>
                  {quizChoices.map((l,i) => {
                    const isSel = quizAnswer === i
                    const isOk = i === quizCorrect
                    const answered = quizAnswer !== null

                    let choiceClass = s.quizChoice
                    if (answered) choiceClass += ' ' + s.quizChoiceDisabled
                    if (answered && isOk) choiceClass += ' ' + s.quizChoiceCorrect
                    if (answered && isSel && !isOk) choiceClass += ' ' + s.quizChoiceWrong

                    const textColor = answered
                      ? (isOk ? G.green : (isSel ? G.red : G.text))
                      : G.text

                    // Badge classes
                    let badgeClass = s.quizChoiceBadge
                    if (answered) {
                      if (isOk) badgeClass += ' ' + s.quizChoiceBadgeCorrect
                      else if (isSel) badgeClass += ' ' + s.quizChoiceBadgeWrong
                      else badgeClass += ' ' + s.quizChoiceBadgeNeutral
                    }

                    return (
                      <button
                        key={i}
                        onClick={()=>handleQuizAnswer(i)}
                        className={`${choiceClass} ${quizMode==='letter' ? s.quizChoicePadLetter : s.quizChoicePadName}`}
                      >
                        {quizMode==='letter' ? (
                          <div className={s.quizChoiceLetter} style={{ color: textColor }}>{l.ar}</div>
                        ) : (
                          <div className={s.quizChoiceRow}>
                            <div className={badgeClass}>
                              {['A','B','C','D'][i]}
                            </div>
                            <div className={s.quizChoiceInfo}>
                              <div className={s.quizChoiceName} style={{ color: textColor }}>{l.name}</div>
                              <div className={s.quizChoiceTranslit}>{l.translit}</div>
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Resultat */}
                {quizAnswer !== null && (
                  <div className={s.quizResult}>
                    {quizAnswer !== quizCorrect && (
                      <div className={s.quizWrongExplain}>
                        C&apos;etait <strong className={s.quizWrongHighlight}>{quizQ.name}</strong> ({quizQ.translit}) — {quizQ.son.slice(0,60)}
                      </div>
                    )}
                    <div className={s.quizActions}>
                      <button
                        onClick={()=>nextQuiz(quizMode)}
                        className={`${s.quizNextBtn} ${quizAnswer===quizCorrect ? s.quizNextCorrect : s.quizNextRetry}`}
                      >
                        {quizAnswer===quizCorrect ? 'Suivant →' : 'Reessayer'}
                      </button>
                      <button
                        onClick={()=>{setTab('lecon');setCur(LETTERS.indexOf(quizQ))}}
                        className={s.quizLeconBtn}
                      >
                        Voir la lecon
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
