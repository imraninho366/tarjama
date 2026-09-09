# -*- coding: utf-8 -*-
"""Controle d'integrite du dictionnaire, a partir des seules donnees du depot.

Ne verifie pas que les sens sont bons — cela demande le corpus mot-a-mot et un
oeil humain. Verifie les proprietes mecaniques qui, quand elles cassent,
produisent une erreur visible par l'utilisateur :

  1. l'arabe ne contient que de l'arabe (les residus Buckwalter ^ et # ont
     laisse 247 lemmes affiches avec une lettre latine au milieu du mot) ;
  2. aucun lemme ne commence par une marque combinante, qui s'afficherait
     en cercle pointille faute de lettre porteuse ;
  3. la reference existe reellement dans le texte ;
  4. rien de vide : ni sens, ni translitteration.

Usage : python3 scripts/verifier_dictionnaire.py
Sort en code 1 des qu'une propriete est violee, pour servir de garde-fou.
"""
import json, re, sys, unicodedata

dico = json.load(open('public/quran_vocab.json'))
texte = json.load(open('data/quran-ar.json'))

ARABE = re.compile(r'^[؀-ۿݐ-ݿ ]+$')
DIACS = re.compile('[ً-ٰؕۖ-ۭـ]')

INFINITIF = re.compile(r'(er|ir|re|oir)$')
REFLECHI = ('se', 'te', 'me', 'nous', 'vous')

def est_infinitif(sens):
    """Le sens est-il une locution verbale a l'infinitif ?

    Accepte « chercher », « se repentir », « ne pas opprimer », « demander
    pardon » : dans une locution francaise c'est le PREMIER mot qui porte le
    verbe, et le pronom reflechi fait partie du verbe. Un test sur le dernier
    mot signalait a tort 68 entrees correctes.
    """
    mots = sens.split(',')[0].split()
    if not mots:
        return False
    # Le verbe peut etre precede d'un adverbe (« bien faire »), d'un pronom
    # reflechi (« se repentir ») ou d'une negation en deux mots
    # (« ne pas opprimer »). Il suffit donc qu'un des trois premiers mots soit
    # un infinitif — au-dela, ce n'est plus une locution verbale.
    return any(INFINITIF.search(m) for m in mots[:3])

def squelette(s):
    s = DIACS.sub('', s)
    s = re.sub('[آأإٱاءؤئ]', 'ا', s)
    s = re.sub('[ىي]', 'ي', s)
    return s.replace('ة', 'ه').replace(' ', '')

pb = []
sans_ref = hors_verset = 0
for m in dico['mots']:
    a = m['ar']
    if not a or not ARABE.match(a):
        pb.append(('caractere non arabe', a))
    elif unicodedata.combining(a[0]):
        pb.append(('commence par une marque combinante', a))
    if not (m.get('translit') or '').strip():
        pb.append(('translitteration vide', a))
    if not m.get('sens') or not m['sens'][0].strip():
        pb.append(('sens vide', a))

    # Un verbe doit se traduire par un verbe, a l'infinitif. La glose anglaise
    # ne dit pas de quoi il s'agit : « fear » a donne « peur » pour خَافَ
    # (craindre), « wills » a donne « volontés » pour شَآءَ (vouloir). 848
    # verbes sur 1474 portaient ainsi un nom, un adjectif ou une conjugaison.
    if m.get('type') == 'verbe' and not est_infinitif(m['sens'][0]):
        pb.append(('verbe traduit par autre chose qu un infinitif',
                   f"{a} -> {m['sens'][0]}"))

    ref = m.get('ref')
    if not ref:
        sans_ref += 1
        continue
    s, v = ref.split(':')
    bloc = texte.get(s)
    ayah = next((x for x in bloc['verses'] if x['n'] == int(v)), None) if bloc else None
    if not ayah:
        pb.append(('reference inexistante', f'{a} -> {ref}'))
        continue
    cible = squelette(a)
    if not any(cible in squelette(mot) or squelette(mot) in cible
               for mot in ayah['t'].split()):
        hors_verset += 1

print(f"entrees                       : {len(dico['mots'])}")
print(f"sens en francais              : {dico['traduits_fr']}")
print(f"sans reference                : {sans_ref}")
# Informatif, pas un defaut : un lemme est une forme de citation, le verset
# porte une forme flechie. « qala » se lit « yaqulu », « zalim » s'ecrit avec
# un alef suscrit. Le squelette ne les rapproche pas, et c'est normal.
print(f"lemmes non retrouves tels quels dans leur verset (flexion) : {hors_verset}")
print(f"anomalies bloquantes          : {len(pb)}")
for t, a in pb[:20]:
    print('   ', t, ':', repr(a))
sys.exit(1 if pb else 0)
