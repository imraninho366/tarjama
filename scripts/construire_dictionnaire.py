# -*- coding: utf-8 -*-
"""
Assemble public/quran_vocab.json depuis la base verifiee + les traductions.

Le mot arabe, sa racine, sa nature et sa frequence viennent du Quranic Arabic
Corpus et ne passent JAMAIS par un modele. Seul le sens francais est traduit,
a partir d'une glose anglaise elle-meme verifiee.

Les lemmes pas encore traduits sont conservés avec leur glose anglaise et
marqués `en_attente`. Les supprimer priverait l'utilisateur d'une entree dont
l'arabe, la racine et la frequence sont pourtant justes ; le quiz, lui, les
ecarte pour ne poser que des questions en francais.

Les sens francais vivent dans data/vocab-fr.json, dans le depot. Le
dictionnaire est donc reconstructible sans rien d'exterieur : c'etait la
derniere dependance a un fichier temporaire, et la perdre aurait coute une
journee de quota IA.

Usage : python3 scripts/construire_dictionnaire.py [autre-fichier-de-sens.json]
"""
import json, sys
sys.path.insert(0, 'scripts')
from translitterer import translitterer

base = json.load(open('data/vocab-base-corpus.json'))
trad = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'data/vocab-fr.json'))

def label(f):
    return 'très fréquent' if f >= 200 else 'fréquent' if f >= 50 else 'courant' if f >= 10 else 'rare'

mots, en_fr, en_attente = [], 0, 0
for b in base:
    fr = (trad.get(b['ar']) or '').strip()
    entree = {
        'ar': b['ar'],
        'translit': b['translit'] or translitterer(b['ar']),
        'racine': b['racine'],
        'sens': [fr or b['en']],
        'type': b['type'],
        'freq': b['freq'],
        'freq_label': label(b['freq']),
        'ref': b['ref'],
    }
    if fr: en_fr += 1
    else:
        entree['en_attente'] = True     # sens encore en anglais
        en_attente += 1
    mots.append(entree)

couv_fr = sum(m['freq'] for m in mots if not m.get('en_attente'))
total = sum(m['freq'] for m in mots)

json.dump({
    'version': '3.0',
    'source': "Quranic Arabic Corpus — arabe, racine, nature et frequence verifies ; sens francais traduits d'une glose anglaise verifiee",
    'total': len(mots),
    'traduits_fr': en_fr,
    'mots': mots,
}, open('public/quran_vocab.json', 'w'), ensure_ascii=False)

print(f"dictionnaire : {len(mots)} entrees")
print(f"  sens en francais : {en_fr}   ({couv_fr * 100 // total} % du texte coranique)")
print(f"  encore en anglais : {en_attente}")
