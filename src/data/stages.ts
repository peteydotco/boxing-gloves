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
export const bladeStackConfig = {
  // Visible height of front blade when stacked (in px)
  bladeHeight: 88,
  // How much each blade peeks above the one in front (16px visible per blade)
  stackOffset: 16,
  // Border radius for blades
  borderRadius: 24,
  // Horizontal padding from viewport edges for front blade
  horizontalPadding: 24,
  // Additional horizontal inset per blade to create depth (each blade narrower than the one in front)
  // Based on design: front=1558px, 2nd=1476px, 3rd=1386px, back=1306px in 1605px viewport
  // This means ~40-42px additional padding per blade on each side
  widthStagger: 41,
  // Bottom padding from viewport edge
  bottomPadding: 0,
  // Colors for the 4 visible blades (front to back)
  // Index 0 = front nav blade, Index 3 = MasterClass (furthest back)
  bladeColors: [
    '#1a1a2e',  // Front blade - dark charcoal (nav blade)
    '#2d2d41',  // Second blade - slightly lighter
    '#3c3746',  // Third blade
    '#000000',  // Back blade - MasterClass black (matches stage background)
  ],
}
