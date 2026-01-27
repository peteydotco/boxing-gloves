import type { VariantStyles } from '../types'

// =============================================================================
// COLOR TOKENS - Mirrors CSS custom properties for JS access
// Brand: Full saturation for hero/graphics
// UI: Desaturated variants for pills/buttons/borders/accents
// =============================================================================
export const colorTokens = {
  // Brand (full saturation)
  blueBrand: 'rgba(0,100,255,1)',      // #0064FF
  blueBrandDark: 'rgba(0,80,210,1)',   // #0050D2
  redBrand: 'rgba(235,45,55,1)',       // #EB2D37
  redBrandDark: 'rgba(195,35,45,1)',   // #C3232D

  // UI (desaturated - for buttons/pills/borders)
  blueUi: 'rgba(0,88,224,1)',          // #0058E0
  blueUiDark: 'rgba(0,75,194,1)',      // #004BC2
  redUi: 'rgba(214,50,64,1)',          // #D63240
  redUiDark: 'rgba(181,40,51,1)',      // #B52833

  // Ink (cool-biased dark neutrals)
  ink900: 'rgba(10,10,16,1)',          // #0A0A10
  ink850: 'rgba(14,14,22,1)',          // #0E0E16
  ink800: 'rgba(26,26,46,1)',          // #1A1A2E
  ink750: 'rgba(27,32,42,1)',          // #1B202A
  ink700: 'rgba(30,30,40,1)',          // #1E1E28
} as const

// Light/inverted theme styles
export const variantStylesLight: VariantStyles = {
  blue: {
    bg: 'rgba(0,100,255,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
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
  },
  white: {
    bg: 'rgba(26,26,46,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
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
  },
  red: {
    bg: 'rgba(235,45,55,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
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
  },
  cta: {
    bg: '#F6F6F6',
    textColor: 'rgba(0,0,0,0.55)',
    secondaryText: 'rgba(0,0,0,0.7)',
    ctaTitleColor: 'rgba(0,0,0,0.75)',
    border: 'rgba(0,0,0,0.08)',
    expandedBorder: '#fdecec',
    badgeBg: 'rgba(0,0,0,0.12)',
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
    expandedBorder: 'rgba(255,255,255,1)',
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
  },
  red: {
    bg: 'rgba(195,35,45,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
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
  },
  cta: {
    bg: colorTokens.ink700,
    textColor: 'rgba(255,255,255,0.55)',
    secondaryText: 'rgba(255,255,255,0.85)',
    ctaTitleColor: 'rgba(255,255,255,0.75)',
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

// Backdrop colors for expanded card overlay
export const backdropColors = {
  light: {
    blue: 'rgba(0,100,255,0.48)',
    white: 'rgba(45,35,80,0.48)',
    red: 'rgba(235,45,55,0.48)',
    cta: 'rgba(0,0,0,0.48)',
  },
  dark: {
    blue: 'rgba(0,75,200,0.48)',
    white: 'rgba(200,200,210,0.48)', // Lighter backdrop for inverted white card
    red: 'rgba(185,35,45,0.48)',
    cta: 'rgba(35,35,35,0.48)',
  },
}

// Helper to get styles based on theme
export const getVariantStyles = (themeMode: 'light' | 'inverted' | 'dark' | 'darkInverted'): VariantStyles => {
  return (themeMode === 'dark' || themeMode === 'darkInverted') ? variantStylesDark : variantStylesLight
}
