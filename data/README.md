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

## Reconstruction du dictionnaire

`vocab-base-corpus.json` est la base vérifiée qui alimente
`public/quran_vocab.json`. Le corpus fournit tout sauf le français : sa glose
est en anglais, et c'est la seule chose que l'IA traduit.

État au 8 septembre 2026 : **4 117 des 4 817 lemmes portent un sens français**,
ce qui couvre **98 % des mots du Coran**. Les 700 restants gardent leur glose
anglaise et sont marqués `en_attente` : le dictionnaire les affiche, le quiz
les écarte pour ne poser que des questions en français. Il suffit de relancer
`/api/gen-vocab` quand le quota le permet — le mécanisme ne demande rien de plus.

### Ce que la reconstruction a corrigé

**Des lettres latines au milieu de l'arabe.** 247 lemmes portaient encore un
`^` ou un `#` : deux caractères de la translittération Buckwalter que la table
de conversion ne couvrait pas. Ce sont des marques combinantes — `^` = U+0653
(maddah), `#` = U+0654 (hamza suscrite). La correspondance n'a pas été devinée :
elle a été vérifiée en retrouvant 245 des 247 lemmes corrigés dans leur propre
verset. Le texte Uthmani n'utilise jamais U+0622 (آ) et écrit systématiquement
ا+maddah — 2 945 fois — ce qui confirme le choix.

**Le sens d'un verset attribué à un autre.** Le dictionnaire affiche un sens
*et* une référence, mais rien ne garantissait qu'ils viennent de la même
occurrence. `أَسْفَار` portait la glose « books » — le sens de 62:5, l'âne
chargé de livres — avec la référence 34:19, où le mot signifie « nos étapes ».
Le mot était juste, le verset était juste, le sens ne l'était pas.

903 références ont été réalignées sur un verset qui porte réellement le sens
stocké. **Aucun sens n'est resté sans appui textuel.** C'est une propriété
vérifiable, et `scripts/` garde de quoi la revérifier.

**Le balisage du corpus mot-à-mot.** 909 gloses portaient des astérisques, des
guillemets orphelins ou des parenthèses dépareillées (« of) night »), hérités
du découpage mot-à-mot. Elles sont nettoyées sans toucher au sens : une
parenthèse manquante est restituée, jamais le mot qu'elle encadre.

**Un lemme amputé de son article.** « maintenant » était stocké comme une hamza
combinante sans lettre porteuse, qui s'affichait en cercle pointillé. Le mot
n'apparaît jamais sans son article dans le Coran : on a repris la graphie
attestée en 72:9, qui écrit la hamza en lettre pleine.

### Ce qui reste imparfait

Un lemme n'a qu'un sens, alors que 2 277 d'entre eux en ont plusieurs attestés.
`أَسْفَار` veut dire « livres » en 62:5 et « étapes » en 34:19 ; le dictionnaire
ne montre que le premier, avec le verset qui lui correspond. C'est honnête mais
incomplet. Le jour où les sens multiples seront traduits, `sens` est déjà un
tableau, prêt à en recevoir plusieurs.

### Trois choses apprises

- **Lots de 10.** Au-delà, la réponse dépasse le budget de sortie et le JSON
  revient tronqué.
- **La translittération n'a pas besoin de l'IA** : elle se dérive de l'arabe par
  des règles (`scripts/translitterer.py`). La retirer de la demande économise
  environ un tiers des tokens et supprime les squelettes sans voyelles.
- **Choisir la glose la plus courte**, pas la plus fréquente : la forme la plus
  courante dans le texte porte souvent un possessif, d'où « leur richesse » au
  lieu de « richesse ».

La base est triée par fréquence décroissante : traduire dans l'ordre couvre le
texte très vite. 500 lemmes couvrent 81 % des mots du Coran, 1 000 en couvrent
89 %, 1 500 en couvrent 93 %.
