# Données vérifiées

Ces fichiers ne sont **jamais produits par une IA**. Ils viennent de sources
alignées sur le texte coranique, et c'est leur seule raison d'être.

## Le contexte

Le 6 septembre 2026, l'application a affiché sous la référence At-Talaq 65:2 un
verset qui n'existe pas : un collage d'Ash-Sharh 94:7 et d'Al-Kawthar 108:2.
Le lendemain, l'audit du dictionnaire a montré que 92 % des fréquences étaient
fabriquées et que des mots portaient le sens d'un autre — قلب, دين et ولي
partageaient tous « naître/enfant ».

La cause était la même dans les deux cas : on demandait à un modèle de langue
de **se souvenir** d'un texte sacré ou du sens d'un mot. Il ne s'en souvient
pas, il reconstitue.

## Les fichiers

| Fichier | Contenu | Source |
|---|---|---|
| `quran-ar.json` | 114 sourates, 6236 versets, texte Uthmani vocalisé | alquran.cloud, édition `quran-uthmani` |
| `quran-fr.json` | Même découpage, traduction française | alquran.cloud, édition `fr.hamidullah` |
| `vocab-base-corpus.json` | 4817 lemmes : arabe, racine, nature, fréquence réelle, glose anglaise | Quranic Arabic Corpus (`quran-corpus-qd`) |

`quran-ar.json` a déjà la Basmala retirée du verset 1 des 112 sourates qui la
portent — jamais de la sourate 1, où elle **est** le verset 1, ni de la 9, qui
n'en a pas. Les numéros de verset viennent du fichier, jamais d'un compteur.

## Règles

**Ne jamais faire écrire du texte coranique par une IA.** Elle peut choisir
quel verset citer ; le texte vient de `lib/quranSource.js`, qui lit ces
fichiers. Une référence invalide est refusée, jamais rattrapée.

**Ne jamais importer ces fichiers depuis une page.** Ils pèsent 2,4 Mo :
Next.js les enverrait au navigateur de chaque visiteur. Seules les routes API
doivent les importer, ce qui les garde dans les fonctions serveur.

## Reconstruction du dictionnaire — travail en cours

`vocab-base-corpus.json` est la base vérifiée destinée à remplacer
`public/quran_vocab.json`. Il n'y manque que le français : la glose du corpus
est en anglais.

État au 7 septembre 2026 : les fréquences de `quran_vocab.json` ont été
remplacées par les décomptes réels, mais **les sens restent ceux, souvent
faux, produits par l'ancienne génération**.

La suite consiste à traduire les gloses via `/api/gen-vocab`, qui ne fait plus
que traduire un couple (mot, glose anglaise) déjà vérifié et refuse tout lot
dont un mot ne correspond pas. Trois points appris à la première tentative :

- **Lots de 10.** Au-delà, la réponse dépasse le budget de sortie et le JSON
  revient tronqué.
- **La translittération n'a pas besoin de l'IA** : elle se dérive de l'arabe
  par des règles. La retirer de la demande économise environ un tiers des
  tokens.
- **Choisir la glose la plus courte**, pas la plus fréquente : la forme la plus
  courante dans le texte porte souvent un possessif, d'où « leur richesse »
  au lieu de « richesse ».

La base est triée par fréquence décroissante, donc traduire dans l'ordre couvre
le texte très vite : 500 lemmes couvrent 81 % des mots du Coran, 1000 en
couvrent 89 %, 1500 en couvrent 93 %.
