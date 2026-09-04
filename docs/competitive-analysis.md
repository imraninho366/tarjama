# Audit concurrentiel — Tarjama vs marché Quran apps

> **Date** : 14 mai 2026
> **Auteur** : Audit interne (méthodologie `ecc:market-research`)
> **Périmètre** : 3 concurrents (Mawaqit, Muslim Pro, Quran Majeed)
> **Objectif** : identifier 5 gaps stratégiques exploitables par Tarjama en 2026
> **Convention** : `[Fait]` = sourcé · `[Inf.]` = inférence · `[Reco]` = recommandation

---

## 1. Executive Summary

Tarjama (plateforme web FR d'apprentissage Quran : dico 3 836 mots · quiz · 99 noms d'Allah · alphabet arabe) opère dans un marché dominé par 3 acteurs orthogonaux :

- **Mawaqit** = utilitaire prière communautaire (mosquées), 100% gratuit, intouchable sur ce segment
- **Muslim Pro** = lifestyle musulman tout-en-un, 25M MAU, marqué par le scandale data 2020 (X-Mode / US military) et pubs intrusives
- **Quran Majeed** = lecteur Quran de référence (3 scripts, 45 langues, 30+ qaris), francophone secondaire, pub agressive

**Insight central** : aucun des 3 ne propose une **méthode d'apprentissage active francophone**. Tous sont des *utilitaires* ou *lecteurs passifs*. Le segment "apprendre l'arabe coranique en français, avec quiz, vocabulaire et progression" est **structurellement vide**.

**Recommandation** : ne pas attaquer frontalement (prière, Quran lecteur) — se positionner en **complément pédagogique francophone** avec 3 ancres : (1) **méthode active**, (2) **privacy vérifiable**, (3) **gamification sociale**.

---

## 2. Tableau comparatif

| Dimension | **Mawaqit** | **Muslim Pro** | **Quran Majeed** | **Tarjama (positionnement cible)** |
|---|---|---|---|---|
| **Positionnement** | Utilitaire prière + CMS mosquées | Lifestyle musulman tout-en-un | Lecteur Quran de référence | **Méthode d'apprentissage Quran/arabe** |
| **Modèle économique** | 100% gratuit (waqf/don, HelloAsso) | Freemium agressif (34,99 $/an) | Freemium pub-lourd (~$20-30/an Pro) | Freemium honnête (quiz 10/j gratuit) |
| **Audience revendiquée** | ~3M utilisateurs, 4,8M downloads | 150M+ downloads, 25M MAU | 85M+ Android, 100M+ cumul | < 10K (à confirmer) |
| **Cœur géographique** | France 52%, DACH, Benelux, Maghreb | SEA (Indo, Malaisie), Golfe, US | Pakistan, Inde, MENA, US/UK | **France + francophonie sous-servie** |
| **Communauté** | Network effect mosquées (7 200+ FR) | Solo (zéro social) | Solo (zéro social) | Duels (table `duels` existante) |
| **Pédagogie active** | Aucune | Aucune (Quran = lecture passive) | Aucune (Hifz = enregistreur, pas méthode) | **Dico 3 836 mots + quiz + alphabet + 99 noms** |
| **Privacy** | Firebase + Sentry (malgré discours "no tracking") | Scandale X-Mode 2020 — pas de certif. publique 2025 | Google Analytics + cookies tracking | **À auditer + page /privacy transparente** |
| **Pubs** | Aucune | Très agressives (même Premium) | Très agressives (même Pro) | Aucune (en l'état) |
| **Localisation FR** | Native (siège Paris) | Traduite, marketing non-priorisé | 1 langue sur 45, Hamidullah brut | **Native, ton "apprenant" FR moderne** |
| **SEO/ASO FR** | #1 "horaire prière paris" — pas de SEO pédagogique | Domine "muslim app" EN — silence FR | Quasi-absent du SERP FR | **Terrain libre : "apprendre arabe coranique"** |
| **UX 2025** | Bugs notifications, widget bloqué | Force-close, pubs même en Premium | UI datée, playback cassé | À auditer (déjà refonte design tokens en cours) |
| **Web vs Mobile** | App-first, web léger | App-first | App-first (read.quranmajeed.com secondaire) | **Web-first (Next.js) — angle desktop d'étude** |

**Lecture du tableau** : la dernière colonne montre que Tarjama est **différencié sur 8 dimensions sur 12**. Le risque est l'audience (< 10K) — d'où l'urgence de l'angle SEO et du positionnement clair.

---

## 3. Synthèse par concurrent

### 3.1 Mawaqit — intouchable sur la prière, vide sur l'apprentissage

**Forces** : `[Fait]` Network effect ~7 200 mosquées FR ; gratuité crédible (statut waqf, association 1901 SIRET 917 868 135) ; marque devenue mot commun en France ; trafic SimilarWeb 4M/mois (mais **-33,76% MoM** sept. 2025 — signal de saturation).

**Faiblesses exploitables** :
- `[Fait]` **Discours privacy partiellement faux** : rapport Exodus Privacy (18 fév. 2026) détecte Firebase Analytics + Sentry + 30 permissions Android, alors que le marketing officiel affirme *"without any ads or user tracking"*.
- `[Fait]` **Zéro pédagogie** : le Coran in-app est un lecteur. Pas de dico, pas de quiz, pas de vocabulaire.
- `[Fait]` **Engagement web superficiel** : bounce 73,45%, 1m21 par visite — comportement transactionnel "regarder l'heure et partir".
- `[Fait]` **SEO éditorial vide** : aucun blog/guide pédagogique. Terrain libre sur "apprendre l'arabe coranique", "comprendre Al-Fatiha", "99 noms expliqués".

**À ne pas attaquer** : gratuité, network mosquées, fiabilité horaires.

### 3.2 Muslim Pro — géant marqué par la défiance et les pubs

**Forces** : `[Fait]` Domination ASO mondiale ("muslim", "prayer times", "quran") ; 150M+ downloads ; 20M $ levés en Série A (déc. 2023, Gobi/CMIA/Bintang) ; suite multi-features (adhan + Qibla + Quran + Qalbox streaming).

**Faiblesses exploitables** :
- `[Fait]` **Scandale X-Mode 2020 toujours référence vive** dans la communauté privacy musulmane (Forward Together, Privacy Guides, DeenHub, Pillars). Réponse CEO avr. 2025 *déclarative* mais **aucune certification GDPR/SOC 2/ISO 27701 publique**.
- `[Fait]` **Pubs intrusives** : plainte n°1 sur Trustpilot 2024-2025, certains utilisateurs **Premium** rapportent voir encore des pubs.
- `[Fait]` **Quran = lecture passive** : pas de spaced repetition, pas de quiz, pas de progression. Qalbox = vidéo passive, pas curriculum.
- `[Inf.]` **France marché secondaire** : Bitsmedia priorise SEA + Golfe ; aucun marketing/contenu FR dédié identifié.

**À ne pas attaquer** : ASO mondial, network effect, capital, multi-features bundle.

### 3.3 Quran Majeed — lecteur de référence, francophone négligé

**Forces** : `[Fait]` Richesse textuelle imbattable (3 scripts Mushaf, 30+ qaris, 45 langues, tafsir multi-langues, équipe scholar dédiée Dr Wasie Fasih Butt) ; 15 ans d'accumulation (PDMS fondé 1978).

**Faiblesses exploitables** :
- `[Fait]` **Plainte n°1 = pubs intrusives même en Pro** (Trustpilot, JustUseApp 2025) — un reviewer rapporte un trojan installé via redirection ad.
- `[Fait]` **Zéro pédagogie active** : badges 2025 = engagement de lecture, pas d'apprentissage. Hifz = enregistreur audio (vs Tarteel qui fait speech-to-text temps réel).
- `[Inf. forte]` **Français = Hamidullah brut** (révision Roi Fahd contestée par Hamidullah lui-même) — archaïque, peu accessible aux apprenants modernes.
- `[Fait]` **Quasi-absent du SERP FR** : les comparatifs francophones 2024-2025 (razva, kuttab, htpratique) ne le citent que marginalement.
- `[Fait]` **UI datée** : héritage 2010 visible, pas de refonte radicale depuis 2023.

**À ne pas attaquer** : richesse textuelle (3 scripts, 30+ qaris) — perdu d'avance.

---

## 4. Les 5 gaps stratégiques priorisés

### Matrice impact × facilité

```
       FACILITÉ →
    ┌─────────────────────────────────────────┐
  ↑ │           ●5 SEO       ●1 Pédagogie    │
  I │              (9,9)        (10,9)        │
  M │                                          │
  P │  ●2 FR moderne                           │
  A │     (9,7)               ●4 Gamification │
  C │                            (8,8)         │
  T │                                          │
    │              ●3 Privacy zéro-tracker     │
    │                  (7,8)                   │
    └─────────────────────────────────────────┘
```

> Notation **(impact / 10, facilité / 10)** — scoring interne basé sur la convergence des 3 audits.

### Gap #1 — Méthode pédagogique active vs lecteur passif `(10 / 9)`

**Constat** : convergence des 3 audits — aucun des concurrents n'enseigne. Mawaqit est utilitaire prière, Muslim Pro est lifestyle, Quran Majeed est lecteur. Le marché des apps pédagogiques actives (Quranly, Quran IQ, Tarteel) est anglo-centré.

**Levier Tarjama** : **briques déjà en production** — dico 3 836 mots, quiz, 99 noms d'Allah, alphabet arabe. Il manque le *positionnement* et la *narration produit*.

**Faisabilité** : très haute — pas de chantier technique majeur. C'est un travail de marketing et de copy.

**Risque** : être perçu comme "encore une app Quran". À éviter par un slogan différenciant : *"Tarjama vous fait **comprendre** le Coran, pas seulement le lire."*

### Gap #2 — Francophone-first authentique (langue + traduction) `(9 / 7)`

**Constat** : Quran Majeed embarque le FR comme 45ème langue (Hamidullah brut). Muslim Pro est traduit mais non-marketé en FR. Mawaqit est FR-natif mais sans pédagogie. **Marché de ~6M musulmans francophones sous-servi en outils d'apprentissage**.

**Levier Tarjama** : ton apprenant français moderne, références culturelles France/Maghreb/Afrique de l'Ouest, accompagnement contextuel (glose mot-à-mot).

**Faisabilité** : moyenne — nécessite un effort éditorial pour proposer une traduction moderne sur les sourates clés (au-delà d'Hamidullah). Pas un chantier technique mais un chantier de contenu (probablement avec validation scholar).

**Risque** : sensibilité doctrinale sur la traduction. `[Reco]` : commencer par les 30 sourates les plus étudiées (Al-Fatiha, Juz 'Amma) + glose pédagogique, pas une nouvelle traduction complète.

### Gap #3 — Privacy "zéro tracker" vérifiable `(7 / 8)`

**Constat** : Muslim Pro reste marqué par le scandale X-Mode 2020 sans certification publique 2025. Mawaqit ment partiellement (Firebase + Sentry malgré discours). Quran Majeed utilise Google Analytics. **Aucun acteur ne peut afficher un audit privacy crédible.**

**Levier Tarjama** : page `/privacy` transparente listant tous les SDKs, hébergement UE (Vercel EU si possible), conformité RGPD by design, ouvrir au monitoring Exodus Privacy.

**Faisabilité** : haute — chantier essentiellement technique (audit interne des SDKs + rédaction). Côté Tarjama (Supabase + Vercel), à auditer pour confirmer "zéro tracker tiers" si vrai.

**Risque** : l'audience qui valorise privacy est minoritaire (geek/militant). Ne pas en faire l'axe #1 — c'est un *différenciant secondaire* qui renforce la confiance.

### Gap #4 — Gamification sociale (duels, streaks, leaderboards) `(8 / 8)`

**Constat** : convergence des 3 audits — tous solos. Quran Majeed ajoute timidement des badges en 2025, c'est tout. **L'apprentissage actif sans rétention émotionnelle = churn**.

**Levier Tarjama** : table `duels` déjà en place. À amplifier : streaks quotidiens, leaderboards hebdomadaires (par sourate, par niveau, global), badges pédagogiques (alphabet maîtrisé, 100 mots dico, premier sourate complet).

**Faisabilité** : haute — schéma Supabase à étendre, composants React à construire. Pas de friction technique majeure.

**Risque** : la gamification mal calibrée peut sembler "irrespectueuse" pour un sujet sacré. `[Reco]` : ton sobre, badges nommés en arabe coranique (`Mujtahid`, `Talib`, `Mu'allim`), pas de skins ou d'emojis enfantins.

### Gap #5 — SEO éditorial pédagogique francophone `(9 / 9)`

**Constat** : Mawaqit a 0 contenu pédagogique, Muslim Pro silence FR, Quran Majeed absent du SERP FR. **Les requêtes "apprendre arabe coranique", "comprendre Al-Fatiha", "99 noms expliqués", "alphabet arabe débutant"** sont en quasi-jachère côté apps. Les sites positionnés sont des blogs amateurs ou Wikipédia.

**Levier Tarjama** : produire 30-50 articles SEO de fond sur 6 mois (cluster pédagogique), chacun lié à une feature du produit (lecture article → CTA quiz/dico). C'est le **canal d'acquisition organique le moins cher et le plus durable**.

**Faisabilité** : très haute — pas de chantier technique. Écriture éditoriale + cocon sémantique.

**Risque** : délai SEO (3-6 mois avant trafic significatif). À démarrer immédiatement.

---

## 5. Plan d'action 90 jours

### Phase 1 — Jours 0-30 : Foundation positionnement

| # | Action | Gap | Owner | Livrable |
|---|--------|-----|-------|----------|
| 1.1 | Audit interne SDKs/trackers du site + page `/privacy` transparente | #3 | Dev | Page publique listant 100% des SDKs |
| 1.2 | Refonte page d'accueil : message "méthode vs lecteur" | #1 | Design + Copy | Nouvelle landing + 3 CTA (quiz / dico / alphabet) |
| 1.3 | Manifeste produit "Pourquoi Tarjama" (1 page) | #1, #2 | Copy | Page `/manifeste` ou `/about` |
| 1.4 | Cluster SEO #1 : 8 articles "apprendre arabe coranique" | #5 | Contenu | 8 articles publiés (1 200-2 000 mots) |
| 1.5 | Setup analytics minimaliste (Plausible/Umami self-hosted, pas GA) | #3 | Dev | Tracking respectueux en place |

**Métriques de fin de phase 1** : page `/privacy` live · 8 articles SEO indexés · landing refondue · 100 MAU.

### Phase 2 — Jours 31-60 : Rétention & gamification

| # | Action | Gap | Owner | Livrable |
|---|--------|-----|-------|----------|
| 2.1 | Streaks quotidiens (colonnes `current_streak`, `longest_streak` dans `profiles`) | #4 | Dev | Composant streak visible sur dashboard |
| 2.2 | Leaderboard hebdomadaire (global + par sourate) | #4 | Dev | Page `/leaderboard` + reset cron lundi |
| 2.3 | Système badges pédagogiques (10 badges au lancement) | #4 | Dev + Design | Table `badges` + page `/profil` enrichie |
| 2.4 | Notifications email hebdo "Ton récap de la semaine" | #4 | Dev | Job Supabase + template email |
| 2.5 | Cluster SEO #2 : 10 articles "99 noms expliqués" | #5 | Contenu | 10 articles + cross-link vers feature 99 noms |

**Métriques de fin de phase 2** : streak D7 > 30% · sessions/utilisateur ↑ 50% · 18 articles indexés · 250 MAU.

### Phase 3 — Jours 61-90 : Différenciation contenu + premium

| # | Action | Gap | Owner | Livrable |
|---|--------|-----|-------|----------|
| 3.1 | Traduction française "moderne" sur 30 sourates clés (Al-Fatiha + Juz 'Amma) | #2 | Contenu + validation | Toggle "Traduction Tarjama" vs Hamidullah |
| 3.2 | Module "Mot du jour" avec spaced repetition (SM-2 simplifié) | #1, #4 | Dev | Composant home + notification opt-in |
| 3.3 | Cluster SEO #3 : 12 articles "comprendre les sourates clés" | #5 | Contenu | 12 articles longue traîne |
| 3.4 | Audit Exodus Privacy public + comm sociale "0 tracker" | #3 | Dev + Comms | Rapport public + 1 post LinkedIn/Twitter |
| 3.5 | Outreach partenariat exploratoire Mawaqit ("Apprendre l'arabe → Tarjama") | #1 | Bizdev | 1 contact qualifié + meeting |

**Métriques de fin de phase 3** : 30 sourates avec traduction moderne · 40 articles indexés · 500 MAU · 1 partenariat exploratoire engagé.

### KPIs cibles à J90

| KPI | Baseline (J0) | Cible (J90) |
|---|---|---|
| MAU | ~50 (estimé) | **500** |
| Articles SEO indexés | 0 | **30+** |
| Streak D7 | N/A | **30%** |
| Temps moyen / session | ~2 min (estimé) | **8 min** |
| Trafic organique SEO | < 100/mois | **2 000/mois** |
| Score privacy public | N/A | **Audit Exodus publié** |

---

## 6. Risques & contre-arguments honnêtes

**Là où ce plan peut échouer** :

1. **Mawaqit pourrait ajouter de la pédagogie** — peu probable (vision = prière + mosquées) mais possible si pression interne. Mitigation : avance produit + écosystème éditorial difficile à rattraper.
2. **Muslim Pro pourrait localiser sérieusement le FR** — peu probable (priorisation SEA), mais 20M $ de Série A donnent du muscle. Mitigation : focalisation niche apprentissage > eux qui restent lifestyle.
3. **SEO long à fructifier** — 3-6 mois minimum. Mitigation : commencer dès J1, doubler par community-building (Discord/forums) en parallèle.
4. **Traduction française moderne = sensibilité doctrinale** — un mauvais choix scholar peut tuer la crédibilité. Mitigation : `[Reco]` validation par 2 scholars indépendants + transparence sur la méthode (vs Hamidullah brut).
5. **Tarjama bootstrap vs concurrents bien capitalisés** — pas de bataille frontale. Mitigation : occuper la niche pédagogique francophone, pas le marché global.

**Là où je peux me tromper** :
- L'audience francophone musulmane est-elle aussi sous-servie qu'estimée ? `[Inf.]` basée sur l'analyse des comparatifs FR 2024-2025 — à valider par sondage/interview de 20 utilisateurs cibles avant J30.
- Le segment "apprenant" vs "pratiquant" est-il assez large ? Hypothèse à tester : 6M musulmans francophones × 10-15% intéressés par apprentissage = 600-900K cible — à raffiner.

---

## 7. Sources principales

**Mawaqit**
- [mawaqit.net](https://mawaqit.net/fr/) — site officiel
- [Rapport Exodus Privacy](https://reports.exodus-privacy.eu.org/en/reports/com.kanout.mawaqit/latest/) (18 fév. 2026)
- [SimilarWeb mawaqit.net](https://www.similarweb.com/website/mawaqit.net/) (sept. 2025)
- [Pappers — Association Mawaqit](https://www.pappers.fr/entreprise/mawaqit-917868135)

**Muslim Pro**
- [Vice/Motherboard — Muslim Pro & X-Mode (nov. 2020)](https://www.vice.com/en/article/muslim-pro-location-data-military-xmode/)
- [FinChannel — CEO statement (avr. 2025)](https://finchannel.com/muslim-pro-app-ceo-addresses-data-privacy-concerns-and-outlines-enhanced-security-measures/125035/people/2025/04/)
- [TNGlobal — Bitsmedia $20M Series A (déc. 2023)](https://technode.global/2023/12/07/singapores-bitsmedia-raises-20m-in-series-a-funding-led-by-cmia-capital-partners-gobi-partners-bintang-capital-partners/)
- [Privacy Guides — alternatives Muslim Pro](https://discuss.privacyguides.net/t/muslims-recommend-privacy-friendly-muslim-apps-azan-quran-athkar-etc/30714)

**Quran Majeed**
- App Store / Play Store listings (id 365557665)
- [Trustpilot quranmajeed.com](https://www.trustpilot.com/review/quranmajeed.com)
- [mobilemasr.com comparatif 2025](https://mobilemasr.com/en/blogs/best-quran-app-for-android)
- [tarteel.ai/blog comparatifs](https://www.tarteel.ai/blog)

**Méthodologie**
- Skill `ecc:market-research` (standards de sourcing, fait/inférence/recommandation)
- 3 audits indépendants menés en parallèle (general-purpose agents) le 14 mai 2026

---

## 8. Prochaine étape recommandée

`[Reco]` Valider avec l'équipe / le décideur la priorisation des 5 gaps (peut-être pondérer différemment) avant de démarrer la Phase 1. Si validé, démarrer en parallèle les actions **1.1 (audit privacy)**, **1.2 (refonte landing)** et **1.4 (cluster SEO #1)** dès J0 — elles sont indépendantes et chacune débloque de la valeur même isolément.
