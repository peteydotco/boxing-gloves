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
      accolades: 'App of the Day, Webby Shortlist, 2 more...',
      agency: 'fantasy.co',
    },
    footer: 'DESIGNED & BUILT IN SAN FRANCISCO',
    logoSrc: '/images/stages/masterclass-logo.svg',
    logoBgColor: '#F75E7B', // Coral pink from the reference
    accentColor: '#F75E7B',
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
export const bladeStackConfig = {
  // Visible height of each blade when stacked (in px)
  bladeHeight: 56,
  // How much each blade peeks above the one in front
  stackOffset: 16,
  // Border radius for blades
  borderRadius: 24,
  // Horizontal padding from viewport edges
  horizontalPadding: 24,
  // Bottom padding from viewport edge
  bottomPadding: 0,
  // Colors for the 4 visible blades (front to back)
  // Front blade is dark/charcoal with nav links
  bladeColors: [
    'rgba(26, 26, 46, 1)',    // Front blade - dark charcoal (nav blade)
    'rgba(60, 90, 180, 0.9)', // Blue tint
    'rgba(90, 60, 120, 0.85)', // Purple tint
    'rgba(40, 40, 60, 0.8)',  // Dark back blade
  ],
}
