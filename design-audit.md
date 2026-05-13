# Tarjama — Design Audit & Directions Visuelles

---

## 1. AUDIT DU DESIGN ACTUEL

### Problèmes par impact

#### 🔴 CRITIQUE — Fait fuir les utilisateurs

**P1. Identité visuelle inexistante — l'app ressemble à un prototype**
591 inline `style={{}}` répartis sur 30 fichiers. Pages comme `/dhikr` (27 inline), `/calligraphie` (21), `/duel` (78) n'ont aucun CSS module. Résultat : inconsistance visuelle entre les pages, sensation de "projet étudiant".

**P2. Thème clair cassé — couleurs incorrectes sur la moitié des composants**
`lib/theme.js` exporte un objet `G` avec 15 couleurs hardcodées dark-only. 147 occurrences de `rgba(201,168,76,...)` dans le code. `G.gold` (#C9A84C) sur fond clair (#F2EFE8) = ratio de contraste 2.4:1 (WCAG AA exige 4.5:1). Le PremiumBanner a un backdrop `rgba(5,5,8,.85)` — noir opaque sur thème clair.

**P3. Typographie arabe traitée comme du texte normal**
Le texte coranique — contenu le plus sacré — est affiché dans la même taille et le même poids que le texte français. Amiri est correct mais sans hiérarchie typographique spécifique : un verset du Coran a le même traitement visuel qu'un label de bouton arabe.

**P4. Navigation mobile — 9px labels illisibles + icônes Unicode brutes**
`BottomNav.module.css` : `font-size: 9px`. Les icônes sont des caractères Unicode (`ت`, `ق`, `۩`) sans `aria-hidden` — annoncées aux lecteurs d'écran comme des lettres.

#### 🟡 MOYENNE — Dérange l'utilisateur attentif

**P5. Animations sans cohérence**
14 keyframes définis dans globals.css mais utilisés de manière disparate. Confetti couleurs hardcodées dark-only. BadgeUnlock a un spring animation mais aucun `role="alert"`.

**P6. 147 occurrences de `rgba(201,168,76,...)` hardcodées**
Le gold est éparpillé en rgba dans les CSS modules ET les inline styles, alors qu'un `--gold-glow` existe. En mode clair ces rgba gardent la valeur dark — décalage de saturation.

**P7. Espacement incohérent**
Tokens `--space-xs` à `--space-2xl` existent mais 50%+ des composants utilisent des px hardcodés.

**P8. RTL brisé en 5 endroits**
- Sidebar hover `translateX(4px)` → mauvais sens en RTL
- Sidebar active indicator `left: 0` → devrait être `inset-inline-start`
- Layout `margin-left: var(--sidebar-width)` → devrait être `margin-inline-start`
- Topbar `margin-left: auto` → `margin-inline-start`
- PremiumBanner `textAlign: 'left'` → `'start'`

#### 🟢 BASSE — Opportunités gâchées

**P9. Gold sous-exploité — pas de palette secondaire**
La palette se limite à gold + gris + couleurs sémantiques. Pas de couleur de soutien pour créer une identité distinctive.

**P10. Gamification cheap** — Emojis Unicode (`🌱`, `📖`, `🏆`) au lieu d'icônes dessinées.

**P11. Aucune image, aucune illustration** — L'app est 100% texte + boutons.

**P12. Zéro micro-interaction mémorable** — Le dhikr counter est un cercle statique de 200px sans animation de feedback satisfaisante.

---

## 2. DIRECTIONS VISUELLES — 3 PROPOSITIONS

---

### Direction A : "Riyad" — Le Jardin Numérique 🌿

**Mood :** Comme entrer dans un jardin paisible de méditation islamique. Espaces généreux, verdure subtile, lumière naturelle. L'arabe est calligraphié avec respect, le français est sobre et lisible. Chaque interaction donne une sensation de sérénité.

**Mots-clés :** Sérénité · Espace · Lumière · Calligraphie · Croissance

**Références :**
- [Headspace](https://www.headspace.com) — sérénité et illustrations
- [Quran.com](https://quran.com) — traitement respectueux du texte coranique
- [Brilliant.org](https://brilliant.org) — pédagogie interactive premium

**Palette :**
| Rôle | Couleur | Hex |
|------|---------|-----|
| Primary Gold | Or calligraphique | `#B8932A` |
| Primary Gold Light | Or clair (hover) | `#D4AF5C` |
| Surface | Parchemin chaud | `#FAF7F0` |
| Surface Elevated | Carte | `#FFFFFF` |
| Background | Fond crème | `#F5F1E8` |
| Text Primary | Encre profonde | `#1A1714` |
| Text Secondary | Gris chaud | `#6B6560` |
| Text Muted | Gris doux | `#A09890` |
| Accent Green | Vert jardin | `#2D7A4F` |
| Accent Green Light | Vert clair | `#E8F5EC` |
| Border | Bordure subtile | `#E8E2D8` |
| Dark Mode BG | Nuit profonde | `#0D0D12` |

**Typographie :**
- **Latin Display :** [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — serif élégant avec caractère
- **Latin Body :** [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) — humaniste, très lisible en petit
- **Arabe Corps :** [Amiri](https://fonts.google.com/specimen/Amiri) (conservé) — meilleur Naskh pour le Coran, excellent rendu tashkeel
- **Arabe Display :** [Reem Kufi](https://fonts.google.com/specimen/Reem+Kufi) — kufi moderne pour les headers, contraste avec Amiri

**Traitement de l'arabe :** Calligraphique sacré — le texte coranique dans un cadre visuel distinct (fond légèrement doré, padding généreux, taille 1.5x le français)

**Icônes :** [Lucide Icons](https://lucide.dev) — stroke léger, cohérent. Icônes custom SVG pour les badges (pas d'emoji).

**Micro-interactions :** Sobre/zen — transitions 300ms ease-out, pulse doux sur le dhikr, fade + scale sur les badges

**Composants shadcn/ui :** `Card`, `Button`, `Input`, `Tabs`, `Dialog`, `Badge`, `Progress`, `Sheet`
**Composants custom :** `QuranVerse`, `DhikrCounter`, `ArabicLetterCard`, `BadgeCard`, `PrayerTimeCard`

**Mockup Landing Page :**
```
┌─────────────────────────────────┐
│                                 │
│        ب                        │  ← Amiri, 48px, gold
│     TARJAMA                     │  ← Playfair Display, 32px
│   ترجمة · Traduction coranique  │  ← Reem Kufi + Source Sans
│                                 │
│  Apprends le Coran en traduisant│  ← Source Sans, 16px, gris chaud
│  verset par verset. Gratuit.    │
│                                 │
│  ┌─────────────────────────────┐│
│  │  Connexion  │  Inscription  ││  ← Tabs shadcn
│  ├─────────────────────────────┤│
│  │  Email      [____________] ││
│  │  Password   [____________] ││
│  │                             ││
│  │  [  Se connecter         ]  ││  ← Button gold, full width
│  └─────────────────────────────┘│
│                                 │
│  6 300+ mots · 114 sourates    │  ← Stats discret, Source Sans 12px
│                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ 📖   │  │ 🧠   │  │ 🕌   │  │  ← Feature cards Lucide icons
│  │Traduc│  │ Quiz │  │Prière│  │
│  │tion  │  │      │  │      │  │
│  └──────┘  └──────┘  └──────┘  │
│                                 │
│  ┌─ QuranVerse ────────────────┐│
│  │                             ││  ← fond #FAF3E0 (doré léger)
│  │  إِنَّا أَنزَلْنَاهُ قُرْآنًا    ││  ← Amiri, 26px
│  │  عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ     ││
│  │                             ││
│  │  « Nous l'avons fait        ││  ← Source Sans italic, 14px
│  │  descendre, un Coran en     ││
│  │  arabe... »  — Yusuf, 2     ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

### Direction B : "Khatt" — L'Atelier du Calligraphe ✒️

**Mood :** L'app comme un atelier d'artisan. Textures papier, encre visible, gestes précis. L'arabe est LE héros visuel — chaque lettre est traitée comme une œuvre.

**Mots-clés :** Artisanal · Encre · Asymétrie · Texture · Précision

**Références :**
- [Pitch.com](https://pitch.com) — mise en page éditoriale
- [Linear.app](https://linear.app) — précision et densité élégante
- [Insight Timer](https://insighttimer.com) — sacré dans le digital

**Palette :**
| Rôle | Couleur | Hex |
|------|---------|-----|
| Primary Ink | Encre dorée | `#9A7B2E` |
| Surface | Papier ancien | `#F8F4EB` |
| Background | Lin | `#F0EBE0` |
| Text Primary | Noir encre | `#1C1917` |
| Text Secondary | Sépia | `#78716C` |
| Accent Teal | Turquoise ottoman | `#0D7377` |
| Dark Mode BG | Encre nuit | `#0C0A09` |

**Typographie :**
- **Latin Display :** [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
- **Latin Body :** [Outfit](https://fonts.google.com/specimen/Outfit)
- **Arabe :** [Noto Naskh Arabic](https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic)
- **Arabe Display :** [Aref Ruqaa](https://fonts.google.com/specimen/Aref+Ruqaa) — ruq'a calligraphique

**Traitement de l'arabe :** Hybride — Noto Naskh soigné en corps, Aref Ruqaa en titres

**Micro-interactions :** Cinématique — ink-splash au tap dhikr, traces d'encre en calligraphie, staggered reveals dramatiques

---

### Direction C : "Nūr" — Lumière et Géométrie ✦

**Mood :** L'éclat à travers un moucharabieh. Géométrie islamique abstraite, blanc et or. Ultra-minimaliste.

**Mots-clés :** Lumière · Géométrie · Minimalisme · Contemplation · Pureté

**Références :**
- [Stripe.com](https://stripe.com) — minimalisme et gradients subtils
- [Things 3](https://culturedcode.com/things/) — interface ultra-propre iOS
- [Endel.io](https://endel.io) — atmosphère contemplative

**Palette :**
| Rôle | Couleur | Hex |
|------|---------|-----|
| Primary Gold | Or lumineux | `#C4992A` |
| Surface | Blanc pur | `#FFFFFF` |
| Background | Gris perle | `#F5F5F3` |
| Text Primary | Graphite | `#18181B` |
| Text Secondary | Gris moyen | `#52525B` |
| Accent Blue | Bleu nuit | `#1E3A5F` |
| Dark Mode BG | Noir absolu | `#09090B` |

**Typographie :**
- **Latin Display :** [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display)
- **Latin Body :** [DM Sans](https://fonts.google.com/specimen/DM+Sans)
- **Arabe :** [Noto Naskh Arabic](https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic)
- **Arabe Display :** [Reem Kufi](https://fonts.google.com/specimen/Reem+Kufi)

**Traitement de l'arabe :** Moderne épuré — grand (28-36px), centré, l'espace blanc EST le cadre

**Micro-interactions :** Sobre — 200ms, subtle glow, pas de confetti

---

## 3. RECOMMANDATION

### ✅ Direction A : "Riyad" — Le Jardin Numérique

**Pourquoi elle matche l'audience (musulmans francophones 15-35 ans, TikTok) :**
- La sérénité attire les 18-25 ans qui cherchent un ancrage spirituel dans un monde digital bruyant
- Le vert jardin + or crée une identité reconnaissable dans un feed TikTok
- L'approche "croissance" résonne avec la mentalité d'apprentissage sans être infantilisante

**Pourquoi elle se différencie :**
- Quran.com : fonctionnel mais froid, vert clinique. Riyad est chaleureux.
- Bayyinah : anglophone, vidéo-centric. Riyad est interactif et francophone.
- Apps coraniques arabes : souvent surchargées, dorées de manière ostentatoire. Riyad = gold avec retenue.

**Pourquoi elle survit à la conversion mobile :**
- Palette simple (3 principales + sémantiques) → traduit en NativeWind/StyleSheet
- Playfair Display + Source Sans disponibles via expo-fonts
- Composants (QuranVerse, DhikrCounter) ont des patterns natifs évidents
- Approche "sobre" évite les animations CSS qui ne portent pas en React Native Animated

**Pourquoi pas les 2 autres :**
- **B "Khatt"** : risquée — textures lourdes, ink-splash complexe, se porte mal en natif. Peut inspirer la page `/calligraphie` spécifiquement.
- **C "Nūr"** : trop froide pour du contenu spirituel. Le blanc pur évoque "médical" plus que "sacré". Ses principes de spacing peuvent informer Riyad.
