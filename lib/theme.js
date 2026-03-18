// ══════════════════════════════════════════════════════════════
// TARJAMA — Design Tokens (source unique)
// ══════════════════════════════════════════════════════════════

export const G = {
  // Backgrounds
  abyss:    '#050508',
  dark:     '#09090E',
  dark2:    '#0F0F18',
  dark3:    '#161622',
  dark4:    '#1D1D2C',

  // Gold
  goldDim:    '#6B5210',
  goldDark:   '#8B6914',
  gold:       '#C9A84C',
  goldLight:  '#E8C97A',
  goldBright: '#F5DFA0',

  // Text
  text:      '#EDE8D8',
  textDim:   '#9A9280',
  textMuted: '#5A5448',

  // Semantic
  green:  '#4CAF7D',
  blue:   '#5B9BD5',
  red:    '#C96B6B',
  orange: '#D4874C',
  purple: '#9B7FD4',
}

// Avatar colors
export const AVATAR_COLORS = ['#C9A84C', '#4CAF7D', '#5B9BD5', '#9B7FD4', '#D4874C', '#C96B6B']

// Niveau feedback colors
export const nvlColor = {
  excellent: G.green,
  good:      G.gold,
  partial:   G.orange,
  wrong:     G.red,
  skipped:   G.textMuted,
}

export const nvlBg = {
  excellent: 'rgba(76,175,125,.08)',
  good:      'rgba(201,168,76,.07)',
  partial:   'rgba(212,135,76,.07)',
  wrong:     'rgba(201,107,107,.07)',
  skipped:   'rgba(90,84,72,.07)',
}

export const nvlBorder = {
  excellent: 'rgba(76,175,125,.22)',
  good:      'rgba(201,168,76,.18)',
  partial:   'rgba(212,135,76,.2)',
  wrong:     'rgba(201,107,107,.18)',
  skipped:   'rgba(90,84,72,.18)',
}

// Type grammatical colors
export const TYPE_COLORS = {
  nom:         { bg: 'rgba(91,155,213,.1)',  color: G.blue },
  verbe:       { bg: 'rgba(76,175,125,.1)',  color: G.green },
  adjectif:    { bg: 'rgba(155,127,212,.1)', color: G.purple },
  particule:   { bg: 'rgba(201,168,76,.1)',  color: G.gold },
  pronom:      { bg: 'rgba(212,135,76,.1)',  color: G.orange },
  préposition: { bg: 'rgba(201,168,76,.1)',  color: G.gold },
  expression:  { bg: 'rgba(232,201,122,.1)', color: G.goldLight },
}

// Frequency colors
export const FREQ_COLORS = {
  'très fréquent': G.gold,
  'fréquent':      G.green,
  'courant':       G.blue,
  'rare':          G.textMuted,
}
