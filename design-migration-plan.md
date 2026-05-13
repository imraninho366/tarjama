# Tarjama — Plan de Migration Design

Direction choisie : **"Riyad" — Le Jardin Numérique**

---

## 1. Architecture des Design Tokens

### Convention : `--tarjama-{category}-{name}`

```css
:root {
  /* Colors */
  --tarjama-color-gold: #B8932A;
  --tarjama-color-gold-light: #D4AF5C;
  --tarjama-color-gold-rgb: 184, 147, 42;
  --tarjama-color-surface: #FAF7F0;
  --tarjama-color-surface-elevated: #FFFFFF;
  --tarjama-color-background: #F5F1E8;
  --tarjama-color-text: #1A1714;
  --tarjama-color-text-secondary: #6B6560;
  --tarjama-color-text-muted: #A09890;
  --tarjama-color-border: #E8E2D8;
  --tarjama-color-green: #2D7A4F;
  --tarjama-color-green-light: #E8F5EC;
  --tarjama-color-red: #B84A4A;
  --tarjama-color-blue: #1E3A5F;

  /* Typography */
  --tarjama-font-display: 'Playfair Display', serif;
  --tarjama-font-body: 'Source Sans 3', sans-serif;
  --tarjama-font-arabic: 'Amiri', serif;
  --tarjama-font-arabic-display: 'Reem Kufi', sans-serif;

  /* Spacing (4px base) */
  --tarjama-space-1: 4px;   --tarjama-space-2: 8px;
  --tarjama-space-3: 12px;  --tarjama-space-4: 16px;
  --tarjama-space-6: 24px;  --tarjama-space-8: 32px;
  --tarjama-space-12: 48px; --tarjama-space-16: 64px;

  /* Radius */
  --tarjama-radius-sm: 6px;   --tarjama-radius-md: 10px;
  --tarjama-radius-lg: 16px;  --tarjama-radius-xl: 24px;

  /* Shadows */
  --tarjama-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --tarjama-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --tarjama-shadow-lg: 0 8px 24px rgba(0,0,0,0.12);

  /* Motion */
  --tarjama-duration-fast: 150ms;
  --tarjama-duration-normal: 300ms;
  --tarjama-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="dark"] {
  --tarjama-color-gold: #C9A84C;
  --tarjama-color-gold-light: #E8C97A;
  --tarjama-color-gold-rgb: 201, 168, 76;
  --tarjama-color-surface: #161622;
  --tarjama-color-background: #09090E;
  --tarjama-color-text: #EDE8D8;
  --tarjama-color-text-secondary: #9A9280;
  --tarjama-color-text-muted: #5A5448;
  --tarjama-color-border: rgba(201, 168, 76, 0.08);
}
```

**Portabilité :** consommable par Tailwind (CSS), NativeWind (React Native), exportable en JSON pour SwiftUI/Compose via `scripts/export-tokens.js`.

---

## 2. Ordre de migration

| Phase | Contenu | Sessions |
|-------|---------|----------|
| **1** | Installer Tailwind v4 + shadcn/ui. Réécrire globals.css tokens. Migrer Layout, Topbar, BottomNav, Sidebar | **2** |
| **2** | Migrer LandingPage + AuthScreen → shadcn Card/Tabs/Input | **1** |
| **3** | Migrer index.js (refactor 846 lignes → composants), quiz, dictionnaire, prieres | **2** |
| **4** | Migrer les 18 pages restantes (dhikr, duel, calligraphie, etc.) | **2** |
| **5** | Supprimer lib/theme.js, tous CSS modules, audit 0 inline styles | **1** |
| **Total** | | **8 sessions** |

---

## 3. Coexistence CSS Modules + Tailwind

```jsx
// NOUVEAU CODE → Tailwind pur
<div className="max-w-2xl mx-auto px-4 bg-surface">

// CODE MODIFIÉ (>50% touché) → migrer vers Tailwind
// CODE NON TOUCHÉ → garder CSS module jusqu'à Phase 5

// INTERDIT : mélanger G.xxx et Tailwind dans le même composant
```

---

## 4. Composants shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button card input tabs dialog badge progress sheet separator tooltip
```

**Composants custom à créer :**
- `QuranVerse` — cadre doré pour versets
- `DhikrCounter` — cercle SVG animé
- `PrayerCard` — carte horaire de prière
- `ArabicLetterCard` — lettre avec formes
- `BadgeCard` — badge avec icône SVG (pas emoji)

---

## 5. Risques RTL avec Tailwind v4

| Risque | Solution |
|--------|----------|
| `ml-4` ne miroir pas | `ms-4` (margin-start) |
| `text-left` fixe | `text-start` |
| `translate-x-4` | `ltr:translate-x-4 rtl:-translate-x-4` |
| `border-l` | `border-s` |
| `left-0` | `start-0` |

**Règle : logical properties exclusivement dans tout le nouveau code.**

---

## 6. Résumé

```
ÉTAT ACTUEL                    →    ÉTAT CIBLE
─────────────                       ──────────
CSS Modules (14 fichiers)      →    Tailwind CSS v4
591 inline styles              →    0 inline styles
G.xxx dark-only                →    --tarjama-* CSS vars (light/dark)
Emojis badges                  →    Lucide + SVG custom
9px nav labels                 →    12px min, Lucide icons
Amiri seule                    →    Amiri + Reem Kufi + Playfair + Source Sans
0 shadcn                       →    10 shadcn + 5 custom
```
