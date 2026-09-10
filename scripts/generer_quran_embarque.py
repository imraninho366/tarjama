"""
Genere lib/quran.js — les sourates courtes embarquees dans la page d'accueil —
a partir de data/quran-ar.json, la source verifiee du texte coranique.

POURQUOI UN SCRIPT
lib/quran.js etait ecrit a la main, dans une autre orthographe que le reste de
l'application : ecriture simplifiee (الإنسان, مَالِكِ) la ou tout Tarjama affiche
l'Uthmani verifie (الإنسٰن, مَٰلِكِ). Le texte etait correct — verification lettre a
lettre faite le 10 septembre 2026, aucun ecart hors alifs et hamzas — mais le
meme verset apparaissait sous deux graphies selon la page, et le projet avait
DEUX sources de texte coranique alors que sa regle en impose une seule.

Le fichier est desormais un derive : on ne le modifie plus, on relance ce script.
"""
import json

# Les sourates courtes les plus ouvertes : leur texte part avec la page, pour
# qu'elles s'affichent sans attendre le reseau.
SOURATES = [1, 97, 99, 103, 108, 109, 110, 112, 113, 114]

ref = json.load(open('data/quran-ar.json', encoding='utf-8'))

lignes = [
    "// Genere par scripts/generer_quran_embarque.py depuis data/quran-ar.json.",
    "// NE PAS MODIFIER A LA MAIN : c'est un derive de la source verifiee.",
    "export const QURAN = {",
]
for n in SOURATES:
    versets = ref[str(n)]['verses']
    lignes.append(f"  {n}: {{")
    lignes.append("    verses: [")
    for v in versets:
        lignes.append(f"      {{ n: {v['n']}, ar: {json.dumps(v['t'], ensure_ascii=False)} }},")
    lignes.append("    ],")
    lignes.append("  },")
lignes.append("}")

open('lib/quran.js', 'w', encoding='utf-8').write("\n".join(lignes) + "\n")
print(f"lib/quran.js : {len(SOURATES)} sourates, {sum(len(ref[str(n)]['verses']) for n in SOURATES)} versets")
