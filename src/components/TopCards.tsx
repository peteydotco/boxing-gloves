import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MorphingCard } from './MorphingCard'
import { createPortal } from 'react-dom'

// Backdrop colors that sample from each card variant's bg
// Light/inverted themes use brighter versions, dark theme uses darker shades
const backdropColors = {
  light: {
    blue: 'rgba(22,115,255,0.6)',
    white: 'rgba(26,26,46,0.6)',
    red: 'rgba(239,68,68,0.6)',
    cta: 'rgba(0,0,0,0.6)',
  },
  dark: {
    blue: 'rgba(15,85,185,0.7)',
    white: 'rgba(19,19,35,0.7)',
    red: 'rgba(180,50,50,0.7)',
    cta: 'rgba(35,35,35,0.75)',
  },
}

interface ExpandedContent {
  roleLabel: string
  dateRange: string
  description: React.ReactNode[]
  highlights?: {
    label: string
    image?: string
    href?: string
  }[]
  reflectionsCard?: {
    title: string
    image: string
    href: string
  }
  actions: {
    label: string
    icon?: 'external' | 'play' | 'calendar' | 'email'
    href?: string
    primary?: boolean
  }[]
}

interface CardData {
  id: string
  label: string
  title: string
  shortcut: string
  variant: 'blue' | 'white' | 'red' | 'cta'
  expandedContent: ExpandedContent
}

const cards: CardData[] = [
  {
    id: 'sva',
    label: 'ADJUNCT IXD PROFESSOR',
    title: 'SCHOOL OF VISUAL ARTS',
    shortcut: '1',
    variant: 'blue',
    expandedContent: {
      roleLabel: 'IXD PROFESSOR AT',
      dateRange: '2020 → Present',
      description: [
        <>I teach an accelerated interaction design course, where students create portfolio-ready soft products for the web, native apps, and beyond. Curriculum covers design systems, motion principles, and hands-on builds. <a href="https://sva.edu/academics/undergraduate/bfa-design" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Register</a></>,
      ],
      highlights: [
        { label: "SVA'26", href: 'https://www.instagram.com/stories/highlights/18062055449168032/', image: '/images/highlights/sva-26.png' },
        { label: "SVA'25", href: 'https://www.instagram.com/stories/highlights/18033770825071666/', image: '/images/highlights/sva-25.png' },
        { label: "SVA'23", href: 'https://www.instagram.com/stories/highlights/17981520386115052/', image: '/images/highlights/sva-23.png' },
        { label: "SVA'22", href: 'https://www.instagram.com/stories/highlights/17901005006461090/', image: '/images/highlights/sva-22.png' },
      ],
      reflectionsCard: {
        title: 'Reflecting on 4 years at SVA',
        image: '/images/sva-reflections-preview.png',
        href: 'https://www.figma.com/deck/sFOBagRUK2l9waMlT6zexC/PD-Share---Prof-Pete-at-SVA?node-id=1-22&viewport=-145%2C-68%2C0.67&t=m1Mn8tfrLRHBYgSH-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1',
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
        'Leading design for pro-tier creative tools, helping professionals build and scale their online presence.',
        'Focus on design systems, component architecture, and bridging the gap between design and engineering.',
      ],
      highlights: [
        { label: 'SQSP IV' },
        { label: 'SQSP III' },
        { label: 'SQSP II' },
        { label: 'SQSP I' },
      ],
      actions: [
        { label: 'NEW PRO TOOLS REVEAL', icon: 'play', primary: true },
      ],
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
        'Full-time dad duties: snacks, adventures, and answering "why?" approximately 400 times per day.',
        'Currently leveling up in LEGO engineering, bedtime story voice acting, and playground diplomacy.',
      ],
      highlights: [
        { label: 'Year 4' },
        { label: 'Year 3' },
        { label: 'Year 2' },
        { label: 'Year 1' },
      ],
      actions: [
        { label: 'VIEW GALLERY', icon: 'external', primary: true },
      ],
    },
  },
  {
    id: 'cta',
    label: 'ADD NEW ROLE',
    title: '《 EMPTY SLOT 》',
    shortcut: '⌘ C',
    variant: 'cta',
    expandedContent: {
      roleLabel: 'ADD NEW ROLE',
      dateRange: '',
      description: [
        "This slot is reserved for your next collaboration. Let's build something together.",
      ],
      actions: [
        { label: 'SCHEDULE A CALL', icon: 'calendar', primary: true },
        { label: 'SEND AN EMAIL', icon: 'email' },
      ],
    },
  },
]

// Expanded card dimensions (in pixels)
const EXPANDED_CARD_WIDTH = 500
const EXPANDED_CARD_HEIGHT = 880
const EXPANDED_CARD_GAP = 32

export function TopCards({ cardIndices, themeMode = 'light' }: { cardIndices?: number[], themeMode?: 'light' | 'inverted' | 'dark' } = {}) {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  })

  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false
  })

  // Compute which cards to show based on cardIndices prop
  const cardsToShow = cardIndices ? cardIndices.map(i => cards[i]).filter(Boolean) : cards

  // Expanded state - which card index is active (null = none expanded)
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)

  // Track if we're in the middle of closing animation
  const [isClosing, setIsClosing] = React.useState(false)

  // Track email copied toast state
  const [emailCopied, setEmailCopied] = React.useState(false)

  // Store card positions when expanding
  const [cardPositions, setCardPositions] = React.useState<Map<string, DOMRect>>(new Map())

  // Refs to track card elements
  const cardRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map())

  // Capture all card positions before expanding
  const capturePositionsAndExpand = (index: number) => {
    const positions = new Map<string, DOMRect>()
    cardRefs.current.forEach((el, id) => {
      if (el) {
        positions.set(id, el.getBoundingClientRect())
      }
    })
    setCardPositions(positions)
    setExpandedIndex(index)
  }

  const handleCloseExpanded = () => {
    setIsClosing(true)
    setExpandedIndex(null)
  }

  // Handle ESC key, arrow keys for navigation, number keys to open cards, and ⌘+C to copy email
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘+C to copy email address
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        // Only intercept if no text is selected
        const selection = window.getSelection()
        if (!selection || selection.toString().length === 0) {
          e.preventDefault()
          navigator.clipboard.writeText('hello@petey.co')
          setEmailCopied(true)
          setTimeout(() => setEmailCopied(false), 3000)
        }
        return
      }

      // Number keys 1-4 to open cards (when not expanded)
      if (expandedIndex === null) {
        const keyNum = parseInt(e.key, 10)
        if (keyNum >= 1 && keyNum <= cardsToShow.length) {
          capturePositionsAndExpand(keyNum - 1)
          return
        }
      }

      // ESC and arrow keys only work when expanded
      if (expandedIndex === null) return

      if (e.key === 'Escape') {
        handleCloseExpanded()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setExpandedIndex((prev) =>
          prev !== null ? Math.min(prev + 1, cardsToShow.length - 1) : 0
        )
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setExpandedIndex((prev) =>
          prev !== null ? Math.max(prev - 1, 0) : 0
        )
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedIndex, cardsToShow.length])

  // Lock body scroll when expanded
  React.useEffect(() => {
    if (expandedIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [expandedIndex])

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const topThreeCards = cardsToShow.slice(0, 3)
  const ctaCard = cardsToShow.length > 3 ? cardsToShow[3] : undefined
  // Mobile: show compact Add Role card first, then top 3 cards
  // Tablet/Desktop: show only top 3 cards (CTA card is separate at bottom for tablet, inline for desktop)
  const mobileCards = ctaCard ? [ctaCard, ...topThreeCards] : topThreeCards
  const isSplitMode = cardIndices && cardIndices.length < cards.length

  const isExpanded = expandedIndex !== null

  // Calculate expanded position for a card in the carousel
  const getExpandedPosition = (cardIndex: number) => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080

    // Center position for the active card
    const centerX = (viewportWidth - EXPANDED_CARD_WIDTH) / 2
    const centerY = (viewportHeight - EXPANDED_CARD_HEIGHT) / 2

    // Offset from the active card
    const activeIdx = expandedIndex ?? 0
    const offsetFromActive = cardIndex - activeIdx
    const xOffset = offsetFromActive * (EXPANDED_CARD_WIDTH + EXPANDED_CARD_GAP)

    return {
      x: centerX + xOffset,
      y: centerY,
      width: EXPANDED_CARD_WIDTH,
      height: EXPANDED_CARD_HEIGHT,
    }
  }

  // Cards to render in the main row
  // Mobile: compact Add Role card + top 3 cards
  // Tablet: only top 3 cards (CTA card is in fixed bottom position)
  // Desktop: top 3 cards + full CTA card inline
  const visibleCards = isMobile ? mobileCards : (isDesktop && ctaCard ? [...topThreeCards, ctaCard] : topThreeCards)

  // Get collapsed position for a card
  const getCollapsedPosition = (cardId: string) => {
    const rect = cardPositions.get(cardId)
    if (rect) {
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    }
    return { top: 0, left: 0, width: 300, height: 76 }
  }

  return (
    <>
      <div className={isSplitMode ? "top-padding-responsive" : "horizontal-padding-responsive top-padding-responsive"} style={{ overflow: 'visible' }}>
        <div className="mx-auto" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
          {/* Cards row */}
          <div
            className="flex scrollbar-hide"
            style={{
              perspective: '1000px',
              gap: isDesktop ? '1rem' : '0.5rem',
              justifyContent: isMobile ? 'flex-start' : 'center',
              overflowX: isMobile ? 'auto' : 'visible',
              overflowY: 'visible',
              transition: 'gap 0.3s ease, justify-content 0.3s ease, margin 0.3s ease, padding 0.3s ease',
              pointerEvents: 'auto',
              ...(isMobile && {
                marginLeft: '-0.75rem',
                marginRight: '-0.75rem',
                marginTop: '-20px',
                marginBottom: '-40px',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                paddingTop: '20px',
                paddingBottom: '40px',
              }),
            }}
          >
            {visibleCards.map((card) => {
              const isCtaCard = card.variant === 'cta'
              const isMobileCtaCard = isMobile && isCtaCard
              const cardIndex = cardsToShow.findIndex((c) => c.id === card.id)

              return (
                <div
                  key={card.id}
                  ref={(el) => { cardRefs.current.set(card.id, el) }}
                  style={{
                    ...(isMobile
                      ? {
                          flex: '0 0 auto',
                          minWidth: isMobileCtaCard ? '115px' : '243px',
                          maxWidth: isMobileCtaCard ? '115px' : '243px',
                          width: isMobileCtaCard ? '115px' : '243px',
                        }
                      : {
                          flex: '1 1 0%',
                          minWidth: 0,
                        }),
                    // Hide when expanded or closing (cards are rendered in portal)
                    visibility: (isExpanded || isClosing) ? 'hidden' : 'visible',
                  }}
                >
                  <MorphingCard
                    card={card}
                    isExpanded={false}
                    expandedPosition={getExpandedPosition(cardIndex)}
                    onClick={() => capturePositionsAndExpand(cardIndex)}
                    onClose={handleCloseExpanded}
                    onHighlightClick={(label) => console.log('Highlight clicked:', label)}
                    hideShortcut={isMobile}
                    compactCta={isMobileCtaCard}
                    mobileLabel={isMobileCtaCard ? 'ADD ROLE' : undefined}
                    emailCopied={emailCopied}
                    setEmailCopied={setEmailCopied}
                    themeMode={themeMode}
                  />
                </div>
              )
            })}
          </div>

          {/* CTA card - Tablet only: fixed bottom */}
          {!isDesktop && !isMobile && ctaCard && !isExpanded && (
            <div
              ref={(el) => { cardRefs.current.set(ctaCard.id, el) }}
              className="fixed bottom-0 left-0 right-0 padding-responsive z-20"
              style={{ perspective: '1000px' }}
            >
              <MorphingCard
                card={ctaCard}
                isExpanded={false}
                expandedPosition={getExpandedPosition(cardsToShow.length - 1)}
                onClick={() => capturePositionsAndExpand(cardsToShow.length - 1)}
                onClose={handleCloseExpanded}
                onHighlightClick={(label) => console.log('Highlight clicked:', label)}
                emailCopied={emailCopied}
                setEmailCopied={setEmailCopied}
                themeMode={themeMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expanded overlay - rendered in portal to escape stacking context */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence onExitComplete={() => setIsClosing(false)}>
          {isExpanded && (
            <>
              {/* Backdrop - samples bg color from focused card, smoothly transitions */}
              <motion.div
                className="fixed inset-0 backdrop-blur-md"
                style={{ zIndex: 9998 }}
                onClick={handleCloseExpanded}
                initial={{ opacity: 0, backgroundColor: backdropColors[themeMode === 'dark' ? 'dark' : 'light'][cardsToShow[expandedIndex!]?.variant || 'cta'] }}
                animate={{
                  opacity: 1,
                  backgroundColor: backdropColors[themeMode === 'dark' ? 'dark' : 'light'][cardsToShow[expandedIndex!]?.variant || 'cta'],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 0.2 },
                  backgroundColor: { duration: 0.5, ease: 'easeInOut' },
                }}
              />

              {/* Expanded cards */}
              {visibleCards.map((card) => {
                const isMobileCtaCard = isMobile && card.variant === 'cta'
                const cardIndex = cardsToShow.findIndex((c) => c.id === card.id)
                const collapsedPos = getCollapsedPosition(card.id)
                const expandedPos = getExpandedPosition(cardIndex)

                return (
                  <MorphingCard
                    key={`expanded-${card.id}`}
                    card={card}
                    isExpanded={true}
                    collapsedPosition={collapsedPos}
                    expandedPosition={expandedPos}
                    onClick={() => {}}
                    onClose={handleCloseExpanded}
                    onHighlightClick={(label) => console.log('Highlight clicked:', label)}
                    hideShortcut={isMobile}
                    compactCta={isMobileCtaCard}
                    mobileLabel={isMobileCtaCard ? 'ADD ROLE' : undefined}
                    emailCopied={emailCopied}
                    setEmailCopied={setEmailCopied}
                    themeMode={themeMode}
                  />
                )
              })}
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
