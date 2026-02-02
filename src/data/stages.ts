import type { StageData } from '../types'

// Stage data for the "Selected Work" section
// Each stage represents a full-screen portfolio piece
export const stages: StageData[] = [
  {
    id: 'squarespace',
    title: 'SQUARESPACE CMS & EDITOR',
    role: 'SR STAFF PRODUCT DESIGNER',
    description: 'I\'ve introduced novel ways for DIYers and Pros alike to directly interface with their sites \u2013 by simplifying complexity, flattening modalities, yet always letting users consent into complexity.',
    metadata: {
      platforms: '',
      accolades: '',
      agency: '',
      customRows: [
        { label: 'TEAMS', value: 'Websites, SQSP app, Unfold app' },
        { label: 'KPI\'S', value: 'Retention, Trial-to-Sub, QoL' },
        { label: 'RECENTLY\nSHIPPED', value: 'SQSP for Pros, Video tools for Unfold, Seller-centric CMS' },
      ],
    },
    footer: 'DESIGNED & BUILT IN NEW YORK CITY',
    logoSrc: '/images/stages/spotify-logo.svg',
    logoBgColor: '#FFFFFF', // Squarespace white
    accentColor: '#0064FF',
    backgroundMedia: {
      type: 'video',
      src: '/images/vid-sqspintelligence.webm',
    },
    surfaceColors: {
      primary: '#F2F2F2',
      secondary: '#E8E8E8',
      hover: '#F5F5F5',
      text: '#1B202A',
    },
  },
  {
    id: 'masterclass',
    title: 'MASTERCLASS MVP APP',
    role: 'EXPERIENCE DESIGN LEAD',
    description: 'We delivered on the startup\'s desire to ship an MVP that was both proof of concept and a celebration of their concept \u2013 both product and product marketing.',
    metadata: {
      platforms: 'iOS, iPadOS, Android OS',
      accolades: 'App of the Day, Webby Shortlist, Featured @WWDC \'18',
      agency: 'fantasy.co',
    },
    footer: 'DESIGNED & BUILT IN SAN FRANCISCO',
    logoSrc: '/images/stages/masterclass-logo.svg',
    logoBgColor: '#EF4562', // MasterClass coral
    accentColor: '#EF4562',
    backgroundMedia: {
      type: 'video',
      src: '/images/vid-masterclass.webm',
    },
  },
  {
    id: 'apple',
    title: 'APPLE ONLINE STORE',
    role: 'LEAD UX DESIGNER',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
    metadata: {
      platforms: '',
      accolades: '',
      agency: '',
      customRows: [
        { label: 'AUDIENCE', value: 'Americas, China, Europe, India' },
        { label: 'KPI\'S', value: 'Increases # of items per cart, store pickups' },
        { label: 'AGENCY', value: 'criticalmass.com' },
      ],
    },
    footer: 'DESIGNED & BUILT IN CUPERTINO',
    logoSrc: '',
    logoBgColor: '#007AFF', // Apple blue
    accentColor: '#007AFF',
    backgroundMedia: {
      type: 'image',
      src: '/images/apple-bg_map.png',
    },
    surfaceColors: {
      primary: '#D8EAFF',
      secondary: '#B5DAFF',
      hover: '#E0EEFF',
      text: '#1B202A',
    },
  },
  {
    id: 'shiphero',
    title: 'SHIPHERO MVP APP',
    role: 'PRODUCT DESIGNER',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
    metadata: {
      platforms: '',
      accolades: '',
      agency: '',
    },
    footer: 'DESIGNED & BUILT IN NEW YORK CITY',
    logoSrc: '',
    logoBgColor: '#F34242', // ShipHero red
    accentColor: '#1B202A',
    backgroundMedia: {
      type: 'image',
      src: '/images/shiphero-stagebg.gif',
    },
    surfaceColors: {
      primary: '#FDECEC',
      secondary: '#FDD4D4',
      hover: '#FEF0F0',
      text: '#1B202A',
    },
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
    bladeColor: '#2e2f5a',
    stageColor: '#1B202A',
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    bladeColor: '#0064FF',
    stageColor: '#f5f5f7',
  },
  squarespace: {
    id: 'squarespace',
    name: 'Squarespace',
    bladeColor: '#EF4562',
    stageColor: '#0e0e0e',
  },
  masterclass: {
    id: 'masterclass',
    name: 'MasterClass',
    bladeColor: '#0e0e0e',
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
