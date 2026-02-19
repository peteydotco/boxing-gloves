// =============================================================================
// ELEVATION TOKENS — Consistent shadow system
// Figma 5-step shadows are intentionally complex (designer-specified).
// Semantic aliases (sm/md/lg) for general-purpose use.
// =============================================================================

export const elevations = {
  /** Subtle lift — chips, badges, small cards */
  sm: '0 2px 4px rgba(0,0,0,0.08)',

  /** Medium lift — dropdowns, popovers */
  md: '0 4px 12px rgba(0,0,0,0.10)',

  /** High lift — modals, expanded cards */
  lg: '0 8px 24px rgba(0,0,0,0.12)',

  /**
   * Figma-matched 5-step shadow — used on glass pill container, BottomBar,
   * and project cards. Mimics natural light diffusion with progressive blur.
   * Do NOT simplify — these values are pixel-matched to Figma specs.
   */
  figma5Step: '0px 216px 60px 0px rgba(0,0,0,0), 0px 138px 55px 0px rgba(0,0,0,0.01), 0px 78px 47px 0px rgba(0,0,0,0.05), 0px 35px 35px 0px rgba(0,0,0,0.09), 0px 9px 19px 0px rgba(0,0,0,0.1)',

  /** Figma 5-step variant with larger spread — used on action buttons on hover */
  figma5StepLg: '0 1070px 250px 0 rgba(0,0,0,0.00), 0 685px 250px 0 rgba(0,0,0,0.02), 0 385px 231px 0 rgba(0,0,0,0.08), 0 171px 171px 0 rgba(0,0,0,0.14), 0 43px 94px 0 rgba(0,0,0,0.16)',

  /** Project card shadow (from CSS custom property --shadow-project-card) */
  projectCard: '0 409px 115px 0 rgba(0,0,0,0), 0 262px 105px 0 rgba(0,0,0,0.01), 0 147px 88px 0 rgba(0,0,0,0.05), 0 65px 65px 0 rgba(0,0,0,0.09), 0 16px 36px 0 rgba(0,0,0,0.1)',
} as const
