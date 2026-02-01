import type { CardData } from '../types'

export const cards: CardData[] = [
  {
    id: 'sva',
    label: 'ADJUNCT IXD PROFESSOR',
    title: 'SCHOOL OF VISUAL ARTS',
    shortcut: '1',
    variant: 'blue',
    expandedContent: {
      roleLabel: 'IXD PROFESSOR AT',
      dateRange: '2021 → Present',
      description: [
        <>I teach an accelerated interaction design course, where students create portfolio-ready soft products for the web, native apps, and beyond. Curriculum covers vibe coding, motion principles, and hi-fi builds. <a href="https://sva.edu/academics/undergraduate/bfa-design" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>SVA BFA Design</a>{' ↗'}</>,
      ],
      highlights: [
        { label: "SVA'26", href: 'https://www.instagram.com/stories/highlights/18062055449168032/', image: '/images/highlights/sva-26.png' },
        { label: "SVA'25", href: 'https://www.instagram.com/stories/highlights/18033770825071666/', image: '/images/highlights/sva-25.png' },
        { label: "SVA'23", href: 'https://www.instagram.com/stories/highlights/17981520386115052/', image: '/images/highlights/sva-23.png' },
        { label: "SVA'22", href: 'https://www.instagram.com/stories/highlights/17901005006461090/', image: '/images/highlights/sva-22.png' },
      ],
      reflectionsCard: {
        title: 'Reflecting on 4 years at SVA',
        image: '/images/sva-frame-1.jpg',
        href: 'https://www.figma.com/deck/sFOBagRUK2l9waMlT6zexC/PD-Share---Prof-Pete-at-SVA?node-id=1-22&viewport=-145%2C-68%2C0.67&t=m1Mn8tfrLRHBYgSH-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1',
        previewFrames: [
          '/images/sva-frame-1.jpg',
          '/images/sva-frame-2.jpg',
          '/images/sva-frame-3.jpg',
          '/images/sva-frame-4.jpg',
          '/images/sva-frame-5.jpg',
        ],
      },
      actions: [],
    },
  },
  {
    id: 'squarespace',
    label: 'SR STAFF DESIGNER',
    title: 'SQUARESPACE',
    shortcut: '2',
    variant: 'white',
    expandedContent: {
      roleLabel: 'PRODUCT DESIGNER AT',
      dateRange: '2019 → Present',
      description: [
        <>For six years, I've elevated the vision and craft of our core product. Nowadays I'm designing powerful new site tools that elevate DIYers and keep up with Pros. See our <a href="https://www.squarespace.com/refresh" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>FW2025 release</a>{' ↗'}</>,
      ],
      highlights: [
        { label: 'SQSP IV', href: 'https://www.instagram.com/stories/highlights/18306770473162196/', image: '/images/highlights/sqsp-iv.png' },
        { label: 'SQSP III', href: 'https://www.instagram.com/stories/highlights/17986731617286794/', image: '/images/highlights/sqsp-iii.png' },
        { label: 'SQSP II', href: 'https://www.instagram.com/stories/highlights/17926855298693100/', image: '/images/highlights/sqsp-ii.png' },
        { label: 'SQSP I', href: 'https://www.instagram.com/stories/highlights/17907270110479298/', image: '/images/highlights/sqsp-i.png' },
      ],
      reflectionsCard: {
        title: 'Pro Product Reveal + Demo',
        image: 'https://img.youtube.com/vi/rJKduGHwvHk/maxresdefault.jpg',
        href: 'https://youtu.be/rJKduGHwvHk?si=mcBfPuZCJBRC10b6',
        previewVideo: '/images/vid-sqsp-thumb.webm',
      },
      actions: [],
    },
  },
  {
    id: 'rio',
    label: 'JUNIOR DAD',
    title: 'RIO RUI RODRIGUEZ',
    shortcut: '3',
    variant: 'red',
    expandedContent: {
      roleLabel: 'NEW DAD TO',
      dateRange: '2023 → Present',
      description: [
        'Full-time dad duties: snacks, adventures, and answering "why?" approximately 400 times per day. Currently leveling up in LEGO engineering, bedtime story voice acting, and playground diplomacy.',
      ],
      nowPlayingCard: {
        label: 'Last listened to...',
        songTitle: 'Un Poco Loco',
        artist: 'Anthony Gonzalez, Gael García Bernal',
        albumArt: '/images/coco-album.jpg',
        href: 'https://music.apple.com/us/album/un-poco-loco/1442277063?i=1442277221',
      },
      reflectionsCard: {
        title: "Cookie Monster's Favorite Shape",
        image: '/images/rio-video-preview.jpg',
        href: 'https://www.youtube.com/watch?v=gfNalVIrdOw',
        previewVideo: '/images/vid-rio-thumb.webm',
      },
      actions: [],
    },
  },
  {
    id: 'cta',
    label: '- EMPTY SLOT -',
    title: 'ADD NEW ROLE',
    shortcut: '⌘ C',
    variant: 'cta',
    expandedContent: {
      roleLabel: 'ADD NEW ROLE',
      dateRange: '1989 → Infinity',
      description: [
        "One of the greatest privileges of working in this space has been the incredible talent and personalities I've gotten to meet and, if I'm lucky, collab with.",
        "\u00A0",
        "So let's connect.",
      ],
      actions: [
        { label: 'SCHEDULE A CALL', icon: 'calendar', primary: true },
        { label: 'SEND AN EMAIL', icon: 'email' },
      ],
    },
  },
]

// Stacked cards configuration - rotations and offsets for "roles under my belt" effect
export const stackedCardConfigs = [
  { rotation: -6, offsetX: -20, offsetY: 15, scale: 0.88 },   // First card (SVA) - tilted left, furthest back
  { rotation: 4, offsetX: 15, offsetY: 8, scale: 0.92 },      // Second card (Squarespace) - slight right tilt
  { rotation: -2, offsetX: -8, offsetY: 2, scale: 0.96 },     // Third card (Rio) - nearly straight, closest to CTA
]
