import type { StageData } from '../types'

// Stage data for the "Selected Work" section
// Each stage represents a full-screen portfolio piece
export const stages: StageData[] = [
  {
    id: 'masterclass',
    title: 'MASTERCLASS MVP APP',
    role: 'PRODUCT DESIGN LEAD',
    description: 'Designed in 2017, it addressed the startup\'s desire to ship an MVP that was both proof of concepts and a celebration of their concept – both a product and product marketing.',
    metadata: {
      platforms: 'iOS, iPadOS, Android OS',
      accolades: 'App of the Day, Webby Shortlist, Featured @WWDC \'18',
      agency: 'fantasy.co',
    },
    footer: 'DESIGNED & BUILT IN SAN FRANCISCO',
    logoSrc: '/images/stages/masterclass-logo.svg',
    logoBgColor: '#EF4562', // MasterClass coral
    accentColor: '#EF4562',
  },
  {
    id: 'spotify',
    title: 'SPOTIFY REDESIGN',
    role: 'SENIOR PRODUCT DESIGNER',
    description: 'A conceptual reimagining of Spotify\'s mobile experience, focusing on discovery and social features that bring listeners together.',
    metadata: {
      platforms: 'iOS, Android',
      accolades: 'Featured on Dribbble, Behance',
      agency: 'Personal Project',
    },
    footer: 'DESIGNED IN BROOKLYN, NY',
    logoSrc: '/images/stages/spotify-logo.svg',
    logoBgColor: '#1DB954', // Spotify green
    accentColor: '#1DB954',
  },
  {
    id: 'nike',
    title: 'NIKE TRAINING CLUB',
    role: 'LEAD INTERACTION DESIGNER',
    description: 'Crafted micro-interactions and workout flow experiences that make fitness feel achievable, one rep at a time.',
    metadata: {
      platforms: 'iOS, Android, Web',
      accolades: 'Apple Design Award Finalist',
      agency: 'R/GA',
    },
    footer: 'DESIGNED IN NEW YORK CITY',
    logoSrc: '/images/stages/nike-logo.svg',
    logoBgColor: '#000000', // Nike black
    accentColor: '#FF6B35',
  },
  {
    id: 'airbnb',
    title: 'AIRBNB EXPERIENCES',
    role: 'PRODUCT DESIGNER',
    description: 'Helped launch the Experiences vertical, designing booking flows that connect travelers with local hosts and unforgettable activities.',
    metadata: {
      platforms: 'iOS, Android, Web',
      accolades: 'Fast Company Innovation Award',
      agency: 'Airbnb Design',
    },
    footer: 'DESIGNED IN SAN FRANCISCO',
    logoSrc: '/images/stages/airbnb-logo.svg',
    logoBgColor: '#FF5A5F', // Airbnb coral
    accentColor: '#FF5A5F',
  },
]

// Configuration for stacked blade preview at bottom of hero
// Blades are full-height cards positioned to peek from the bottom
export const bladeStackConfig = {
  // Full card height (viewport height)
  cardHeight: '100vh',
  // How much of the front blade peeks above the bottom edge
  frontBladePeek: 88,
  // How much each subsequent blade peeks above the one in front (16px visible per blade)
  stackOffset: 16,
  // Border radius for blades
  borderRadius: 24,
  // Horizontal padding from viewport edges for front blade
  horizontalPadding: 24,
  // Additional horizontal inset per blade to create depth (each blade narrower than the one in front)
  // Based on design: front=1558px, 2nd=1476px, 3rd=1386px, back=1306px in 1605px viewport
  // This means ~40-42px additional padding per blade on each side
  widthStagger: 41,
  // Bottom padding from viewport edge (blades touch bottom)
  bottomPadding: 0,
}

// =============================================================================
// BLADE CONFIGURATION - Easily re-sortable
// =============================================================================
// Each blade definition contains its collapsed (preview) and expanded (stage) colors.
// To reorder blades, simply rearrange the items in the bladeOrder array.

interface BladeConfig {
  id: string
  name: string
  bladeColor: string      // Color when collapsed (stacked preview)
  stageColor: string      // Color when expanded (fullscreen stage)
}

// Define all available blades with their colors
const bladeDefinitions: Record<string, BladeConfig> = {
  shiphero: {
    id: 'shiphero',
    name: 'ShipHero',
    bladeColor: '#1B202A',
    stageColor: '#1B202A',
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    bladeColor: '#E6E6E6',
    stageColor: '#f5f5f7',
  },
  squarespace: {
    id: 'squarespace',
    name: 'Squarespace',
    bladeColor: '#0064FF', // Unified with brand-blue
    stageColor: '#000000',
  },
  masterclass: {
    id: 'masterclass',
    name: 'MasterClass',
    bladeColor: '#0A0A10', // ink-900 (subtle cool bias)
    stageColor: '#0A0A10',
  },
}

// =============================================================================
// BLADE ORDER - Change this array to reorder blades
// =============================================================================
// Index 0 = front blade (topmost, what users see first)
// Index 3 = back blade (furthest back)
const bladeOrder: string[] = [
  'masterclass',  // Front blade (index 0) - expands to Section 1
  'squarespace',  // Second blade (index 1)
  'apple',        // Third blade (index 2)
  'shiphero',     // Back blade (index 3)
]

// Get the blade config for a given blade position (0 = front, 3 = back)
const getBladeConfig = (bladeIndex: number): BladeConfig => {
  const bladeId = bladeOrder[bladeIndex]
  return bladeDefinitions[bladeId] ?? bladeDefinitions.masterclass
}

// Get blade color for a blade position (collapsed/stacked preview)
export const getBladeColor = (bladeIndex: number): string => {
  return getBladeConfig(bladeIndex).bladeColor
}

// Get stage background color for a blade position (expanded fullscreen view)
export const getStageBackgroundColor = (bladeIndex: number): string => {
  return getBladeConfig(bladeIndex).stageColor
}

// Export blade order for potential use elsewhere
export const getBladeOrder = (): string[] => [...bladeOrder]
export const getBladeCount = (): number => bladeOrder.length
