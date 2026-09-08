# -*- coding: utf-8 -*-
"""
Translitteration arabe -> latin, par regles.

Ecrit apres avoir constate que 666 entrees du dictionnaire portaient une
translitteration produite par IA reduite au squelette consonantique : « rswl »
pour رسول, « 'lmyn » pour عالمين. Un modele n'a pas besoin d'etre consulte pour
cela : la voyellisation est deja dans le texte arabe, il suffit de la lire.

PIEGE UNICODE. La normalisation NFC reordonne les signes diacritiques par
classe combinatoire : la fatha (30) passe AVANT la chadda (33). Chercher la
chadda immediatement apres la consonne echoue donc systematiquement, et
جَنَّة ressortait « janaa » au lieu de « janna ». On lit ici TOUS les signes qui
suivent une consonne, sans presumer de leur ordre.
"""
import re, unicodedata

CONSONNES = {
    'ء':"ʾ", 'ا':'ā', 'آ':'ā', 'أ':"ʾ", 'إ':"ʾ", 'ٱ':'', 'ب':'b', 'ت':'t', 'ة':'a',
    'ث':'th', 'ج':'j', 'ح':'ḥ', 'خ':'kh', 'د':'d', 'ذ':'dh', 'ر':'r', 'ز':'z',
    'س':'s', 'ش':'sh', 'ص':'ṣ', 'ض':'ḍ', 'ط':'ṭ', 'ظ':'ẓ', 'ع':"ʿ", 'غ':'gh',
    'ف':'f', 'ق':'q', 'ك':'k', 'ل':'l', 'م':'m', 'ن':'n', 'ه':'h', 'و':'w',
    'ي':'y', 'ى':'ā', 'ؤ':"ʾ", 'ئ':"ʾ",
}
FATHA, DAMMA, KASRA, SUKUN, SHADDA, ALEF_SUP = 'َ', 'ُ', 'ِ', 'ْ', 'ّ', 'ٰ'
TANWIN = {'ً':'an', 'ٌ':'un', 'ٍ':'in'}
SIGNES = set([FATHA, DAMMA, KASRA, SUKUN, SHADDA, ALEF_SUP]) | set(TANWIN)

def translitterer(mot):
    s = unicodedata.normalize('NFC', mot or '').replace('ـ', '')
    out, i, n = [], 0, len(s)
    while i < n:
        c = s[i]
        if c in SIGNES or c not in CONSONNES:
            i += 1
            continue
        base = CONSONNES[c]
        # lire tous les signes qui suivent, quel que soit leur ordre
        j, marques = i + 1, set()
        while j < n and s[j] in SIGNES:
            marques.add(s[j]); j += 1

        if SHADDA in marques and base:
            base = base * 2
        voyelle = ''
        if ALEF_SUP in marques: voyelle = 'ā'
        elif FATHA in marques: voyelle = 'a'
        elif DAMMA in marques: voyelle = 'u'
        elif KASRA in marques: voyelle = 'i'
        for t, v in TANWIN.items():
            if t in marques: voyelle = v

        courant = ''.join(out)
        # و et ي sans voyelle propre allongent la voyelle precedente
        if base in ('w', 'y') and not voyelle:
            if courant.endswith('u') and base == 'w': out[-1] = out[-1][:-1] + 'ū'; i = j; continue
            if courant.endswith('i') and base == 'y': out[-1] = out[-1][:-1] + 'ī'; i = j; continue
        # ا / ى apres une breve : allongement, pas une lettre de plus
        if base == 'ā':
            if courant.endswith('a'): out[-1] = out[-1][:-1] + 'ā'; i = j; continue
            if courant.endswith('i'): out[-1] = out[-1][:-1] + 'ī'; i = j; continue
            if courant.endswith(('ā', 'ī', 'ū')): i = j; continue

        out.append(base + voyelle)
        i = j

    r = ''.join(out)
    # ة finale apres une voyelle : elle porte le « a », ne le redouble pas
    r = re.sub(r'aa+$', 'a', r)
    r = re.sub(r'([āīū])a$', r'\1', r)   # ة apres une longue : muette
    if s[:1] == 'ٱ' and not r.startswith('a'):
        r = 'a' + r                        # alef wasla initial : « a » de l'article
    r = re.sub(r'aā', 'ā', r)
    r = re.sub(r'([āīū])\1+', r'\1', r)
    r = re.sub(r'^ʾ', '', r)
    # le nom divin s'ecrit par convention « allāh », quelle que soit la graphie
    if re.fullmatch(r'a?l+[aā]h', r): r = 'allāh'
    return re.sub(r'\s+', ' ', r).strip()
