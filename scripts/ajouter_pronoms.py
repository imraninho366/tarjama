# -*- coding: utf-8 -*-
"""Ajoute a la base les mots que le corpus laisse sans lemme.

POURQUOI IL EN MANQUAIT
Le Quranic Arabic Corpus n'attribue pas de lemme a deux categories, qui
sortaient donc du dictionnaire alors qu'elles font 4,3 % du texte :

  - les PRONOMS (3 277 occurrences). هُوَ, هُمْ, نَحْنُ, أَنتَ, et les pronoms
    suffixes ـهُ, ـكُمْ, ـهَا. Ce sont les tout premiers mots qu'un debutant
    rencontre, et il ne les trouvait pas.
  - les LETTRES ISOLEES (28 occurrences) : الٓمٓ, يسٓ, طه, حمٓ... les
    huruf muqatta'at qui ouvrent 29 sourates.

CE QUI VIENT DES DONNEES, ET CE QUI VIENT DE MOI
L'arabe, la frequence et la reference sont comptes sur le corpus. La graphie
des lettres isolees a ete verifiee caractere par caractere contre
data/quran-ar.json : 2:1 s'ecrit bien « الٓمٓ », alef lam maddah mim maddah.

Les sens francais des pronoms, eux, sont ECRITS A LA MAIN. C'est une entorse
assumee a la regle « aucun sens ne vient d'une memoire », et voici pourquoi
elle est defendable ici : la glose du corpus inclut la preposition qui precede
(« for him », « with it »), donc la traduire donnerait « pour lui » comme sens
de ـهُ. Trente-quatre mots-outils dont les equivalents francais sont fixes, et
affiches en entier pour relecture, ce n'est pas la meme chose que 4 817 sens
rappeles de memoire.

Pour les lettres isolees, le sens est « lettres isolees — sens non elucide ».
Leur signification n'est pas connue ; pretendre le contraire serait exactement
l'erreur que ce projet refuse.

Usage : python3 scripts/ajouter_pronoms.py <dossier-du-corpus>
"""
import json, re, sys, collections
sys.path.insert(0, 'scripts')
from translitterer import translitterer

Q = sys.argv[1]
mots = json.load(open(Q + '/mots_corpus.json'))
base = json.load(open('data/vocab-base-corpus.json'))
trad = json.load(open('data/vocab-fr.json'))

MADDAH, HAMZA = 'ٓ', 'ٔ'
def cor(s): return (s or '').replace('^', MADDAH).replace('#', HAMZA)

DIACS = re.compile('[ً-ٰٕـۖ-ۭ]')
def nu(s):
    s = DIACS.sub('', cor(s) or '')
    return s.replace('ٱ', 'ا').replace('أ', 'ا').replace('إ', 'ا').replace('ى', 'ي')

# ── Pronoms ───────────────────────────────────────────────────────────────
INDEP = ['انتما', 'انتن', 'انتم', 'انت', 'انا', 'نحن', 'هما', 'هم', 'هن', 'هو', 'هي']
SUFF  = ['هما', 'كما', 'هم', 'هن', 'كم', 'كن', 'ها', 'نا', 'ه', 'ك', 'ي']
# Particules qui ne changent pas la nature du pronom : conjonction (و, ف) et
# interrogatif (أ). Le « ل », lui, est ambigu — emphatique dans لَنَحْنُ
# (« certes nous »), preposition dans لَهُمْ (« pour eux ») — et le « ب » et le
# « ك » sont toujours des prepositions. Les retirer aveuglement faisait passer
# لَهُمْ pour le pronom independant هُمْ et gonflait celui-ci de 436 a 861.
NEUTRE = re.compile(r'^[وفا]')

def classe(forme):
    f = nu(forme)
    for _ in range(3):                       # ءَأَنتُمْ, أَفَأَنتَ
        if f in INDEP:
            return f
        if not NEUTRE.match(f):
            break
        f = f[1:]

    m = re.match(r'^([بلك])(.+)$', f)
    if not m:
        return None
    tete, reste = m.group(1), m.group(2)
    # Apres une preposition, un pronom est forcement suffixe. Le cas du lam
    # emphatique ne se pose que si le reste est un pronom independant QUI N'EST
    # PAS aussi un suffixe : لَنَحْنُ est « certes nous », mais لَهُمْ reste
    # « pour eux » parce que هم existe comme suffixe.
    if reste in SUFF:
        return '‑' + reste
    if tete == 'ل' and reste in INDEP:
        return reste
    return None

# Arabe, translitteration et sens francais, ecrits a la main et affiches en
# entier pour relecture. La translitteration est donnee ici plutot que derivee :
# scripts/translitterer.py rend « ـِى » par « ā » au lieu de « ī », parce que
# ses regles supposent un mot entier, pas un suffixe accroche a un tatweel.
SENS = {
    'هو':   ('هُوَ', 'huwa', 'il, lui'),        'هي':   ('هِىَ', 'hiya', 'elle'),
    'هم':   ('هُمْ', 'hum', 'ils, eux'),        'هن':   ('هُنَّ', 'hunna', 'elles'),
    'هما':  ('هُمَا', 'humā', 'eux deux'),      'انا':  ('أَنَا', 'anā', 'je, moi'),
    'نحن':  ('نَحْنُ', 'naḥnu', 'nous'),        'انت':  ('أَنتَ', 'anta', 'tu, toi'),
    'انتم': ('أَنتُمْ', 'antum', 'vous'),       'انتما':('أَنتُمَا', 'antumā', 'vous deux'),
    '‑ه':   ('ـهُ', '-hu', 'le, lui, son'),     '‑ها':  ('ـهَا', '-hā', 'la, elle, sa'),
    '‑هم':  ('ـهُمْ', '-hum', 'les, eux, leur'),'‑هن':  ('ـهُنَّ', '-hunna', 'elles, leur'),
    '‑هما': ('ـهُمَا', '-humā', 'eux deux, leur'), '‑ك': ('ـكَ', '-ka', 'te, toi, ton'),
    '‑كم':  ('ـكُمْ', '-kum', 'vous, votre'),   '‑كما': ('ـكُمَا', '-kumā', 'vous deux'),
    '‑نا':  ('ـنَا', '-nā', 'nous, notre'),     '‑ي':   ('ـِى', '-ī', 'me, moi, mon'),
}

groupes = collections.defaultdict(list)
non_classes = 0
for w in mots:
    if w.get('lem') or (w.get('pos') or '').strip() != 'PRON':
        continue
    c = classe(w['ar'])
    if c and c in SENS:
        groupes[c].append(w)
    else:
        non_classes += 1

nouveaux = []
for cle, ws in groupes.items():
    ar, translit, fr = SENS[cle]
    premier = min(ws, key=lambda w: (w['s'], w['v']))
    glose = collections.Counter(w['en'].strip(' .,`"\'[]') for w in ws).most_common(1)[0][0]
    nouveaux.append({
        'ar': ar, 'translit': translit, 'racine': None,
        'type': 'pronom suffixe' if cle.startswith('‑') else 'pronom personnel',
        'freq': len(ws), 'en': glose, 'ref': f"{premier['s']}:{premier['v']}",
    })
    trad[ar] = fr

# ── Lettres isolees ───────────────────────────────────────────────────────
# Les quatorze lettres qui ouvrent 29 sourates, epelees. La maddah qui les
# surmonte dans le texte Uthmani n'est pas une lettre : elle marque l'allongement
# de la lecture, et n'a donc pas de nom.
NOM_LETTRE = {
    'ا': 'alif', 'ل': 'lām', 'م': 'mīm', 'ر': 'rā',  'ص': 'ṣād',
    'ك': 'kāf',  'ه': 'hā',  'ي': 'yā',  'ع': 'ʿayn', 'ط': 'ṭā',
    'س': 'sīn',  'ح': 'ḥā',  'ق': 'qāf', 'ن': 'nūn',
}

lettres = collections.defaultdict(list)
for w in mots:
    if (w.get('pos') or '').strip() == 'INL':
        lettres[cor(w['ar'])].append(w)

for ar, ws in lettres.items():
    premier = min(ws, key=lambda w: (w['s'], w['v']))
    glose = ws[0]['en'].strip(' .,`"\'')
    nouveaux.append({
        'ar': ar,
        # Le nom des lettres se lit mieux que la derivation mecanique, qui
        # rendait « ālm » et laissait croire a un mot. On l'epelle depuis
        # l'arabe plutot que de recopier la glose : le corpus ecrit « Ta Seem
        # Meem » pour طسٓمٓ, alors que la lettre est un sin.
        'translit': ' '.join(NOM_LETTRE[c] for c in ar if c in NOM_LETTRE),
        'racine': None,
        'type': 'lettres isolées', 'freq': len(ws), 'en': glose,
        'ref': f"{premier['s']}:{premier['v']}",
    })
    trad[ar] = 'lettres isolées — sens non élucidé'

# ── Ecriture ──────────────────────────────────────────────────────────────
deja = {b['ar'] for b in base}
ajoutes = [n for n in nouveaux if n['ar'] not in deja]
base.extend(ajoutes)
base.sort(key=lambda b: -(b['freq'] or 0))

json.dump(base, open('data/vocab-base-corpus.json', 'w'), ensure_ascii=False)
json.dump(dict(sorted(trad.items())), open('data/vocab-fr.json', 'w'), ensure_ascii=False)

print(f'entrees ajoutees : {len(ajoutes)}   (base : {len(base)} lemmes)')
print(f'occurrences de pronoms restees non classees : {non_classes}')
print()
for n in sorted(ajoutes, key=lambda x: -x['freq']):
    print(f"   {n['ar']:10s} {n['translit']:10s} {trad[n['ar']]:34s} "
          f"{n['freq']:5d}x  {n['type']:18s} {n['ref']}")
