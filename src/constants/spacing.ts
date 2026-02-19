// =============================================================================
// SPACING SCALE — Consistent spacing values (in px) for gap, padding, margin
// Based on 4px grid: 4, 8, 12, 16, 24, 32, 48
// =============================================================================

export const SPACING = {
  /** 4px — tight: icon padding, micro gaps */
  xs: 4,
  /** 8px — compact: pill gaps, badge insets */
  sm: 8,
  /** 12px — default: card padding (mobile), site padding (narrow) */
  md: 12,
  /** 16px — comfortable: card gaps, section padding */
  lg: 16,
  /** 24px — spacious: section margins, site padding (wide) */
  xl: 24,
  /** 32px — generous: large section spacing */
  xxl: 32,
  /** 48px — layout: major section dividers */
  xxxl: 48,
} as const

// =============================================================================
// CARD LAYOUT CONSTANTS — Shared dimensions for card expand/collapse system
// These values participate in the portal handoff (collapse-transitions.md),
// so changes here must be mirrored in MorphingCard exit animations.
// =============================================================================

export const CARD_PADDING = {
  collapsed: {
    mobile: '18px 10px 19px 12px',
    desktop: '18px 10px 19px 20px',
  },
  expanded: {
    mobile: '24px 14px 16px 16px',
    tablet: '24px 24px 18px 24px',
    desktop: '24px 22px 24px 24px',
  },
} as const

export const CARD_BADGE_OFFSET = {
  mobile: 10,
  tablet: 14,
  desktop: 22,
} as const
