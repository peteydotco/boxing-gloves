// Font family strings for inline-style contexts (Framer Motion animate, GSAP tweens).
// For static rendering, prefer Tailwind classes: font-inter, font-dotgothic, font-fresh-marker

export const FONT = {
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  dotgothic: "'DotGothic16', ui-monospace, monospace",
  freshMarker: "'Fresh Marker', cursive",
} as const

// =============================================================================
// TYPE SCALE — Consistent font size + line-height pairings
// Sizes in px (used in inline styles); Tailwind classes preferred for static text.
// =============================================================================

export const TYPE_SCALE = {
  /** 11px / 1.2 — highlight labels, micro badges */
  xs: { size: 11, lineHeight: 1.2 },
  /** 12px / 1.33 — badge text, compact labels */
  sm: { size: 12, lineHeight: 1.33 },
  /** 14px / 1.5 — body text (mobile), descriptions */
  base: { size: 14, lineHeight: 1.5 },
  /** 16px / 1.5 — body text (desktop), pill labels */
  md: { size: 16, lineHeight: 1.5 },
  /** 18px / 1.4 — card titles, description text */
  lg: { size: 18, lineHeight: 1.4 },
  /** 20px / 1.3 — section labels */
  xl: { size: 20, lineHeight: 1.3 },
  /** 24px / 1.4 — bio text, large headings */
  '2xl': { size: 24, lineHeight: 1.4 },
  /** 28px / 1.3 — scaled title (mobile) */
  '3xl': { size: 28, lineHeight: 1.3 },
  /** 34px / 1.2 — scaled title (desktop) */
  '4xl': { size: 34, lineHeight: 1.2 },
} as const

// =============================================================================
// FONT WEIGHT — Semantic weight tokens
// =============================================================================

export const WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

// =============================================================================
// LETTER SPACING — Tracking scale
// =============================================================================

export const LETTER_SPACING = {
  /** -0.04em — tight tracking for large display text */
  tighter: '-0.04em',
  /** -0.02em — slightly tight for medium headings */
  tight: '-0.02em',
  /** -0.01em — card titles, body headers */
  snug: '-0.01em',
  /** 0em — default */
  normal: '0em',
  /** 0.01em — subtle wide for labels */
  wide: '0.01em',
  /** 0.08em — badges, compact shortcut text */
  wider: '0.08em',
  /** 0.12em — uppercase labels, highlight text */
  widest: '0.12em',
} as const
