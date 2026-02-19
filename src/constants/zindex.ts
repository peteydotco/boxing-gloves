// =============================================================================
// Z-INDEX SCALE — Centralized stacking context for the entire app
// Values are spaced to allow insertion without renumbering.
// =============================================================================

export const Z = {
  /** Background decorations (graffiti SVG, gradient base) */
  background: 0,

  /** Exit gradient dome + spray paint zone */
  gradientDome: 20,
  sprayZone: 21,

  /** 3D canvas (sticky during scroll) */
  stickyCanvas: 30,

  /** Hero section content */
  hero: 40,

  /** Compact pill bar (fixed, top of viewport) */
  compactBar: 50,

  /** Expanded card portal (above everything except cursor) */
  expandedCard: 9999,

  /** Custom cursor (always on top) */
  cursor: 99998,

  /** Debug grid overlay (development only) */
  debugGrid: 99999,
} as const
