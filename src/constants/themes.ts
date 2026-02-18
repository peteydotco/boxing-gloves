import type { VariantStyles } from '../types'

// =============================================================================
// COLOR TOKENS - Mirrors CSS custom properties for JS access
// Hierarchy: Brand (L1) → UI Normalized (L2) → Surface Tint (L3) → Neutral (L4)
// =============================================================================
export const colorTokens = {
  // Brand (Level 1 — full saturation, hero/graphics only)
  brandMasterclass: '#EF4562',
  brandSquarespace: '#0064FF',
  brandApple: '#007AFF',
  brandShiphero: '#3C4569',

  // Legacy brand aliases
  blueBrand: 'rgba(0,100,255,1)',      // #0064FF
  blueBrandDark: 'rgba(0,80,210,1)',   // #0050D2
  redBrand: 'rgba(235,45,55,1)',       // #EB2D37
  redBrandDark: 'rgba(195,35,45,1)',   // #C3232D

  // UI Normalized (Level 2 — equal perceived weight, APCA Lc ~45)
  uiMasterclass: '#D44060',
  uiMasterclassHover: '#C23A56',
  uiMasterclassActive: '#B0344D',

  uiSquarespace: '#1A5FE0',
  uiSquarespaceHover: '#1553C8',
  uiSquarespaceActive: '#1048B0',

  uiApple: '#2070E0',
  uiAppleHover: '#1B63C8',
  uiAppleActive: '#1557B0',

  uiShiphero: '#3D4468',
  uiShipheroHover: '#353D5E',
  uiShipheroActive: '#2D3554',

  // Legacy UI aliases
  blueUi: 'rgba(0,88,224,1)',          // #0058E0
  blueUiDark: 'rgba(0,75,194,1)',      // #004BC2
  redUi: 'rgba(214,50,64,1)',          // #D63240
  redUiDark: 'rgba(181,40,51,1)',      // #B52833

  // Canvas (page background)
  canvas: '#FFFFFF',

  // Neutral (warm-biased dark tones for text & icons)
  neutralNearBlack: '#0E0E0E',
  neutralDarkGray: '#262626',

  // Blade Surfaces (0 = front, 3 = back)
  blade0: '#0e0e0e',
  blade1: '#EB2D37',
  blade2: '#0064FF',
  blade3: '#2e2f5a',

  // Ink (cool-biased dark neutrals)
  ink900: 'rgba(10,10,16,1)',          // #0A0A10
  ink850: 'rgba(14,14,22,1)',          // #0E0E16
  ink800: 'rgba(26,26,46,1)',          // #1A1A2E
  ink750: 'rgba(27,32,42,1)',          // #1B202A
  ink700: 'rgba(30,30,40,1)',          // #1E1E28
  ink600: '#252530',
} as const

// Light/inverted theme styles
export const variantStylesLight: VariantStyles = {
  blue: {
    bg: 'rgba(0,100,255,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,0.12)',
    badgeBg: 'rgba(0,0,0,0.2)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: colorTokens.blueUi,
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
    uiAccent: colorTokens.uiSquarespace,
    uiAccentHover: colorTokens.uiSquarespaceHover,
    uiAccentActive: colorTokens.uiSquarespaceActive,
  },
  white: {
    bg: 'rgba(26,26,46,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,0.12)',
    badgeBg: 'rgba(0,0,0,0.2)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(255,255,255,0.15)',
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
    uiAccent: colorTokens.uiShiphero,
    uiAccentHover: colorTokens.uiShipheroHover,
    uiAccentActive: colorTokens.uiShipheroActive,
  },
  red: {
    bg: 'rgba(235,45,55,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,0.12)',
    badgeBg: 'rgba(0,0,0,0.2)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: colorTokens.redUi,
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
    uiAccent: colorTokens.uiMasterclass,
    uiAccentHover: colorTokens.uiMasterclassHover,
    uiAccentActive: colorTokens.uiMasterclassActive,
  },
  cta: {
    bg: 'rgba(255,255,255,0.36)',
    textColor: '#8E8E8E',
    secondaryText: 'rgba(0,0,0,0.7)',
    ctaTitleColor: '#8E8E8E',
    border: '#CACACA',
    expandedBorder: 'rgba(0,0,0,0.05)',
    badgeBg: '#DDDDDD',
    primaryButtonBg: 'rgba(0,0,0,0.87)',
    primaryButtonText: '#FFFFFF',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(0,0,0,0.08)',
    secondaryButtonText: 'rgba(0,0,0,0.87)',
    secondaryButtonBorder: 'rgba(0,0,0,0.1)',
    highlightBorder: 'rgba(0,0,0,0.2)',
    highlightShadow: 'rgba(0,0,0,0.1)',
    dividerColor: 'rgba(0,0,0,0.12)',
  },
}

// Dark theme styles - moderately darker backgrounds
export const variantStylesDark: VariantStyles = {
  blue: {
    bg: 'rgba(0,80,210,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,0.12)',
    badgeBg: 'rgba(0,0,0,0.25)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: colorTokens.blueUiDark,
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
    uiAccent: colorTokens.uiSquarespaceHover,
    uiAccentHover: colorTokens.uiSquarespaceActive,
    uiAccentActive: colorTokens.uiSquarespaceActive,
  },
  white: {
    bg: 'rgba(230,230,235,1)', // Slightly gray off-white background
    textColor: 'rgba(26,26,46,1)', // Dark blue/gray text
    secondaryText: 'rgba(26,26,46,0.7)',
    border: 'rgba(0,0,0,0.06)',
    expandedBorder: 'rgba(26,26,46,0.15)',
    badgeBg: 'rgba(0,0,0,0.06)',
    primaryButtonBg: 'rgba(26,26,46,1)', // Dark button
    primaryButtonText: '#FFFFFF',
    primaryButtonBorder: 'rgba(0,0,0,0.1)',
    secondaryButtonBg: 'rgba(26,26,46,0.06)',
    secondaryButtonText: 'rgba(26,26,46,1)',
    secondaryButtonBorder: 'rgba(26,26,46,0.12)',
    highlightBorder: 'rgba(26,26,46,0.15)',
    highlightShadow: 'rgba(0,0,0,0.08)',
    dividerColor: 'rgba(26,26,46,0.12)',
    uiAccent: colorTokens.uiShipheroHover,
    uiAccentHover: colorTokens.uiShipheroActive,
    uiAccentActive: colorTokens.uiShipheroActive,
  },
  red: {
    bg: 'rgba(195,35,45,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,0.12)',
    badgeBg: 'rgba(0,0,0,0.25)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: colorTokens.redUiDark,
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
    uiAccent: colorTokens.uiMasterclassHover,
    uiAccentHover: colorTokens.uiMasterclassActive,
    uiAccentActive: colorTokens.uiMasterclassActive,
  },
  cta: {
    bg: colorTokens.ink700,
    textColor: 'rgba(255,255,255,0.55)',
    secondaryText: 'rgba(255,255,255,0.85)',
    ctaTitleColor: 'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.1)',
    expandedBorder: 'rgba(255,255,255,0.2)',
    badgeBg: 'rgba(255,255,255,0.12)',
    primaryButtonBg: 'rgba(255,255,255,0.9)',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(255,255,255,0.1)',
    secondaryButtonText: 'rgba(255,255,255,0.9)',
    secondaryButtonBorder: 'rgba(255,255,255,0.15)',
    highlightBorder: 'rgba(255,255,255,0.3)',
    highlightShadow: 'rgba(0,0,0,0.2)',
    dividerColor: 'rgba(255,255,255,0.15)',
  },
}

// Backdrop colors for expanded card overlay (multiply blend mode)
export const backdropColors = {
  light: {
    blue: 'rgba(0,20,80,0.92)',
    white: 'rgba(18,18,32,0.92)',
    red: 'rgba(80,10,15,0.92)',
    cta: 'rgba(12,12,12,0.92)',
  },
  dark: {
    blue: 'rgba(0,15,60,0.92)',
    white: 'rgba(40,40,50,0.92)',
    red: 'rgba(60,8,12,0.92)',
    cta: 'rgba(8,8,10,0.92)',
  },
}

// Helper to get styles based on theme
export const getVariantStyles = (themeMode: 'light' | 'inverted' | 'dark' | 'darkInverted'): VariantStyles => {
  return (themeMode === 'dark' || themeMode === 'darkInverted') ? variantStylesDark : variantStylesLight
}
