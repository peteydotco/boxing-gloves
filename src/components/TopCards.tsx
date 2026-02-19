import * as React from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { MorphingCard } from './MorphingCard'
import { createPortal } from 'react-dom'
import { BREAKPOINTS, CAROUSEL_CONFIG, DURATION, WEIGHT, backdropColors, signatureSpring, ctaEntranceSpring, getVariantStyles, colorTokens, elevations, Z } from '../constants'
import { cards, stackedCardConfigs } from '../data/cards'
import { useReducedMotion } from '../hooks/useReducedMotion'

// Canonical card dimensions - the "ideal" size we design for
const CANONICAL_CARD_WIDTH = 500
const CANONICAL_CARD_HEIGHT = 880

// Responsive expanded card dimensions calculator
// Returns viewport-appropriate dimensions for expanded cards
// On shallow viewports, proportionally scales the card while maintaining aspect ratio
const getExpandedCardDimensions = () => {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080

  // Mobile: maximize card size, show small sliver of adjacent cards
  if (viewportWidth < 768) {
    const sliver = 8 // Visible portion of adjacent cards
    const gap = 12 // Gap between cards
    // Card width = viewport - sliver on each side - gap on each side
    const width = viewportWidth - (sliver * 2) - (gap * 2)
    // Maximize height - just small padding top/bottom
    const maxHeight = viewportHeight - 24 // 12px top + 12px bottom
    const height = maxHeight
    // Scale content proportionally when viewport is shorter than canonical card height
    const scale = Math.min(1, maxHeight / CANONICAL_CARD_HEIGHT)
    return { width, height, gap, scale }
  }

  // Tablet and Desktop: scale proportionally to fit viewport
  const verticalPadding = 48 // 24px top + 24px bottom
  const horizontalPadding = viewportWidth < BREAKPOINTS.desktop ? 48 : 64
  const maxAvailableHeight = viewportHeight - verticalPadding
  const maxAvailableWidth = viewportWidth - horizontalPadding

  // Calculate scale factor to fit within available space while maintaining aspect ratio
  const scaleByHeight = maxAvailableHeight / CANONICAL_CARD_HEIGHT
  const scaleByWidth = maxAvailableWidth / CANONICAL_CARD_WIDTH

  // Use the smaller scale to ensure card fits both dimensions
  // Cap at 1.0 so we never scale up beyond canonical size
  const scale = Math.min(1, scaleByHeight, scaleByWidth)

  // Apply scale to get final dimensions
  const width = Math.round(CANONICAL_CARD_WIDTH * scale)
  const height = Math.round(CANONICAL_CARD_HEIGHT * scale)
  const gap = 36

  return { width, height, gap, scale }
}

export function TopCards({ cardIndices, themeMode = 'light', introStagger = false }: { cardIndices?: number[], themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted', introStagger?: boolean } = {}) {
  const reduced = useReducedMotion()

  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.desktop : true
  })

  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.mobile : false
  })

  const [isTablet, setIsTablet] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.mobile && window.innerWidth < BREAKPOINTS.desktop : false
  })

  // Track viewport width for computing animated pill widths in compact bar
  const [viewportWidth, setViewportWidth] = React.useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1440
  })

  // Compute which cards to show based on cardIndices prop
  const cardsToShow = cardIndices ? cardIndices.map(i => cards[i]).filter(Boolean) : cards

  // Expanded state - which card index is active (null = none expanded)
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)

  // Track if we're in the middle of closing animation
  const [isClosing, setIsClosing] = React.useState(false)
  // Track which card was expanded when closing (for exit animation)
  const closingCardIndex = React.useRef<number | null>(null)
  // Store exit positions for mobile cards (calculated at close time, before expandedIndex is cleared)
  const [mobileExitPositions, setMobileExitPositions] = React.useState<Map<string, { top: number; left: number; width: number; height: number }>>(new Map())


  // Store card positions when expanding.
  // Kept as a ref (not state) so the captured positions survive React StrictMode's
  // unmount→remount cycle. A setState Map gets reset to the initial empty Map on
  // the second render pass, causing the expanded portal to hit the {0,0} fallback
  // and stack all cards at top-left on the first open after page load.
  const cardPositionsRef = React.useRef<Map<string, DOMRect>>(new Map())
  // Bump a counter to force re-render after updating the ref
  const [, forcePositionRender] = React.useState(0)
  const setCardPositions = React.useCallback((positions: Map<string, DOMRect>) => {
    cardPositionsRef.current = positions
    forcePositionRender(c => c + 1)
  }, [])
  const cardPositions = cardPositionsRef.current

  // Refs to track card elements
  const cardRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map())

  // Ref for horizontal scroll container (mobile)
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)
  // Store scroll position when expanding to restore on collapse
  const savedScrollPosition = React.useRef<number>(0)

  // Compact sticky state — three tiers:
  //   'hidden'  → default cards visible, no sticky bar
  //   'mini'    → tiny colored pills fixed at top center (collapsed tray)
  //   'expanded'→ full compact bar with labels (on hover over mini tray)
  type CompactState = 'hidden' | 'mini' | 'expanded'
  const [compactState, setCompactState] = React.useState<CompactState>('hidden')
  // Track whether we've scrolled past the video section — drives which
  // compact variant renders (mini/expanded morph vs default card row).
  const [isPastVideo, setIsPastVideo] = React.useState(() => {
    if (typeof document === 'undefined') return false
    // Check the body attribute (set by ScrollTrigger in App.tsx).
    // On initial page load this is the only synchronous signal available —
    // the video section DOM element may not exist yet during TopCards' render
    // phase since VideoMorphSection is a later sibling in App's tree.
    return document.body.hasAttribute('data-past-video')
  })
  const isCompact = compactState !== 'hidden' // derived for existing code compatibility
  const isMiniTray = compactState === 'mini'
  const isCompactExpanded = compactState === 'expanded'
  const [isOverDark, setIsOverDark] = React.useState(false)
  const topCardsWrapperRef = React.useRef<HTMLDivElement>(null)
  const compactCardRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map())
  // Separate refs for the post-video bar cards. The pre-video compact bar and
  // post-video bar share an AnimatePresence — when the user scrolls past the video,
  // the pre-video bar exit-animates while the post-video bar mounts. The delayed
  // unmount of the pre-video bar fires ref callbacks with `null`, overwriting any
  // shared ref map. Keeping them separate prevents the race condition.
  const postVideoCardRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map())
  const compactScrollRef = React.useRef<HTMLDivElement | null>(null)
  const savedCompactScrollPosition = React.useRef<number>(0)
  // Shared horizontal scroll position — kept in sync between the default card row
  // and the compact bar so that switching between states preserves x-scroll alignment.
  const sharedScrollLeft = React.useRef<number>(0)
  const expandedFromCompact = React.useRef(false)
  const justClosedFromCompact = React.useRef(false)
  // When closing from compact, onExitComplete handles overflow restoration via rAF.
  // This flag prevents the generic overflow useEffect from racing ahead and restoring
  // overflow (scrollbar) before the compact bar has painted.
  const deferOverflowRestore = React.useRef(false)

  // ── Pill morph style debugger ──
  // 1: Stagger only — pills expand outward from center with 40ms stagger
  // 2: Bouncy spring — ctaEntranceSpring (playful springback) on all pills
  // 3: Scale overshoot — pills overshoot scaleY to 1.06 during height morph
  // 4: Combined — stagger + bouncy spring + glass dissolves ahead as anticipation
  const morphStyle: number = 4

  // ── Mini tray magnetic attraction ──
  // Self-contained spring system: cursor offset → clamped displacement → sprung motion values
  // Three layers at different multipliers create depth parallax (glass < container < pills)
  const miniMagX = useMotionValue(0)
  const miniMagY = useMotionValue(0)
  const springMagX = useSpring(miniMagX, { stiffness: 300, damping: 25, mass: 0.5 })
  const springMagY = useSpring(miniMagY, { stiffness: 300, damping: 25, mass: 0.5 })
  // Children inherit the container's displacement. These are RELATIVE corrections:
  // glass: undo 50% of parent → net 50% of cursor pull (lags behind)
  // pills: add 40% on top of parent → net 140% of cursor pull (leads ahead)
  const glassMagX = useTransform(springMagX, v => v * -0.5)
  const glassMagY = useTransform(springMagY, v => v * -0.5)
  const pillMagX = useTransform(springMagX, v => v * 0.4)
  const pillMagY = useTransform(springMagY, v => v * 0.4)

  // Hover intent timeouts for mini tray ↔ expanded transition
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const BUFFER = 20
    let currentCompact = false
    let currentDark = false
    let currentPastVideo = false
    const handleScroll = () => {
      const wrapper = topCardsWrapperRef.current
      if (!wrapper) return

      const rect = wrapper.getBoundingClientRect()
      if (!currentCompact && rect.bottom < -BUFFER) {
        currentCompact = true
        if (scrollContainerRef.current) {
          sharedScrollLeft.current = scrollContainerRef.current.scrollLeft
        }
        setCompactState(prev => {
          if (prev !== 'hidden') return prev
          return 'mini'
        })
      }
      else if (currentCompact && rect.bottom > BUFFER) {
        currentCompact = false
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = sharedScrollLeft.current
        }
        setCompactState('hidden')
        if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null }
        if (leaveTimeoutRef.current) { clearTimeout(leaveTimeoutRef.current); leaveTimeoutRef.current = null }
      }

      // Detect video section position for dark overlay + past-video state.
      // The video section query is already needed for CTA pill color swap;
      // piggyback on it to also detect past-video so the scroll handler and
      // isPastVideo stay in sync without a separate listener.
      const videoSection = document.querySelector('[data-section="video-morph"]') as HTMLElement | null
      if (videoSection) {
        const vRect = videoSection.getBoundingClientRect()
        const sectionH = videoSection.offsetHeight
        const viewH = window.innerHeight
        const progress = (-vRect.top + viewH) / (sectionH + viewH)
        const nowDark = progress > 0.175 && progress < 0.83
        if (nowDark !== currentDark) {
          currentDark = nowDark
          setIsOverDark(nowDark)
        }
        // Past-video: section bottom is above viewport top
        const nowPast = vRect.bottom < 0
        if (nowPast !== currentPastVideo) {
          currentPastVideo = nowPast
          setIsPastVideo(nowPast)
        }
      } else if (currentDark) {
        currentDark = false
        setIsOverDark(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Run once on mount to handle page-refresh with restored scroll position.
    // At this point the DOM is fully painted (useEffect fires post-paint),
    // so the video section element exists and getBoundingClientRect is valid.
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // When video section is passed/re-entered, track state for compact variant selection.
  // Also performs a one-shot mount check: on page refresh the browser restores scroll
  // before App.tsx's ScrollTrigger fires, so the `data-past-video` attribute may not
  // exist at useState-init time. Once mounted, the video section DOM is available and
  // we can check its position directly.
  React.useEffect(() => {
    // Mount-time detection: if the video section's bottom is above the viewport,
    // we're past video and should render the post-video default card row.
    if (!isPastVideo) {
      const videoSection = document.querySelector('[data-section="video-morph"]') as HTMLElement | null
      if (videoSection) {
        const rect = videoSection.getBoundingClientRect()
        if (rect.bottom < 0) {
          setIsPastVideo(true)
        }
      }
    }

    const handler = (e: Event) => {
      setIsPastVideo(!!(e as CustomEvent).detail)
    }
    window.addEventListener('past-video-change', handler)
    return () => window.removeEventListener('past-video-change', handler)
  }, [])

  // --- Mini tray ↔ expanded compact bar hover handlers ---
  const handleMiniTrayEnter = React.useCallback(() => {
    if (leaveTimeoutRef.current) { clearTimeout(leaveTimeoutRef.current); leaveTimeoutRef.current = null }
    hoverTimeoutRef.current = setTimeout(() => {
      // Reset magnetic displacement — springs animate back during morph ("settling" feel)
      miniMagX.set(0)
      miniMagY.set(0)
      setCompactState('expanded')
    }, 80) // brief hover-intent delay
  }, [miniMagX, miniMagY])

  const handleCompactBarEnter = React.useCallback(() => {
    // Re-entering expanded bar cancels any pending collapse
    if (leaveTimeoutRef.current) { clearTimeout(leaveTimeoutRef.current); leaveTimeoutRef.current = null }
  }, [])

  const handleCompactBarLeave = React.useCallback(() => {
    if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null }
    leaveTimeoutRef.current = setTimeout(() => {
      setCompactState(prev => prev === 'expanded' ? 'mini' : prev)
    }, 450) // forgiving leave delay
  }, [])

  // Touch/mobile: tap mini tray to expand immediately
  const handleMiniTrayClick = React.useCallback(() => {
    if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null }
    setCompactState('expanded')
  }, [])

  // Mini tray magnetic attraction: cursor pulls the tray toward it.
  // The hit zone extends beyond the tray (~60px padding) so the pull starts
  // as the cursor approaches. Strength attenuates with distance from center.
  const MINI_MAG_STRENGTH = 0.18  // stronger than cards (0.08) since target is smaller
  const MINI_MAG_MAX = 5          // max 5px displacement (vs 3px for cards)
  const MINI_MAG_RADIUS = 160     // distance (px) at which attraction drops to zero
  const morphContainerRef = React.useRef<HTMLDivElement>(null)
  const handleMiniTrayMouseMove = React.useCallback((e: React.MouseEvent) => {
    // Skip magnetic parallax when user prefers reduced motion
    if (reduced) return
    // Always compute offset from the actual morphing container's center,
    // even when the event fires on the larger hit zone.
    const el = morphContainerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    // Attenuate pull based on distance — full strength at center, zero at MINI_MAG_RADIUS
    const dist = Math.sqrt(dx * dx + dy * dy)
    const falloff = Math.max(0, 1 - dist / MINI_MAG_RADIUS)
    const strength = MINI_MAG_STRENGTH * falloff
    const tx = Math.max(-MINI_MAG_MAX, Math.min(MINI_MAG_MAX, dx * strength))
    const ty = Math.max(-MINI_MAG_MAX, Math.min(MINI_MAG_MAX, dy * strength))
    miniMagX.set(tx)
    miniMagY.set(ty)
  }, [miniMagX, miniMagY])
  const handleMiniTrayHitZoneLeave = React.useCallback(() => {
    miniMagX.set(0)
    miniMagY.set(0)
  }, [miniMagX, miniMagY])

  // Clean up hover timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
    }
  }, [])

  // Capture compact card positions and expand
  const captureCompactPositionsAndExpand = (index: number) => {
    // Save compact bar scroll position to restore on close
    if (compactScrollRef.current) {
      savedCompactScrollPosition.current = compactScrollRef.current.scrollLeft
    }
    const positions = new Map<string, DOMRect>()

    // getBoundingClientRect() includes in-flight CSS transforms (whileTap scale
    // spring still releasing when onClick fires) AND CSS `translate` from the
    // soft-magnetic cursor effect. Use the BRCT center (transform-invariant for
    // center-origin scales) with offsetWidth/offsetHeight (layout dimensions,
    // immune to transforms), then subtract any active magnetic displacement.
    // Read from the correct ref map — post-video bar has its own refs to avoid
    // the pre-video bar's delayed AnimatePresence unmount nullifying them.
    const activeRefs = isPastVideo ? postVideoCardRefs.current : compactCardRefs.current
    activeRefs.forEach((el, id) => {
      if (el) {
        const width = el.offsetWidth
        const height = el.offsetHeight
        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        // Subtract soft-magnetic CSS translate displacement (--magnetic-x/y on
        // [data-cursor-morphed] elements). BRCT includes this shift but the rest
        // position doesn't — failing to subtract causes 1-3px landing mismatch.
        const style = getComputedStyle(el)
        const magneticX = parseFloat(style.getPropertyValue('--magnetic-x')) || 0
        const magneticY = parseFloat(style.getPropertyValue('--magnetic-y')) || 0
        const left = centerX - width / 2 - magneticX
        const top = centerY - height / 2 - magneticY
        positions.set(id, { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect)
      }
    })
    setCardPositions(positions)
    expandedFromCompact.current = true
    // Two-phase expand: don't call setExpandedIndex yet. First, trigger a re-render
    // so the compact bar's exit prop picks up expandedFromCompact.current = true
    // (AnimatePresence caches exit from the last render where the component was present).
    // Phase 2 useEffect then calls setExpandedIndex to actually remove the compact bar.
    pendingExpandIndex.current = index
    setExpandFromCompactTriggered(true)
  }

  // Capture all card positions before expanding
  const capturePositionsAndExpand = (index: number) => {
    // Save scroll position before expanding (for mobile)
    if (scrollContainerRef.current) {
      savedScrollPosition.current = scrollContainerRef.current.scrollLeft
    }
    const positions = new Map<string, DOMRect>()
    cardRefs.current.forEach((el, id) => {
      if (el) {
        positions.set(id, el.getBoundingClientRect())
      }
    })
    setCardPositions(positions)
    expandedFromCompact.current = false
    setExpandedIndex(index)
  }

  // Track if close has been triggered (to sequence exit positions before clearing expandedIndex)
  const [closeTriggered, setCloseTriggered] = React.useState(false)
  // Two-phase expand from compact: phase 1 sets expandedFromCompact ref and triggers
  // re-render so AnimatePresence caches the correct exit prop ({ opacity: 0 } not slide).
  // Phase 2 (useEffect) then sets expandedIndex to actually remove the compact bar.
  const [expandFromCompactTriggered, setExpandFromCompactTriggered] = React.useState(false)
  const pendingExpandIndex = React.useRef<number | null>(null)

  const handleCloseExpanded = () => {
    closingCardIndex.current = expandedIndex
    if (expandedIndex === null) return

    // ── Closing back to compact bar ──
    if (expandedFromCompact.current) {
      if (isPastVideo) {
        // Post-video: exit targets are the full-size card positions captured at
        // expand time (collapsedPosition fallback). Clear any stale mini positions.
        setMobileExitPositions(new Map())
      } else {
        // Pre-video: target mini tray positions (tiny 28×8px pills, centered at top).
        const newExitPositions = new Map<string, { top: number; left: number; width: number; height: number }>()
        const vw = window.innerWidth
        const miniPillW = 28
        const miniPillH = 8
        const miniGap = 4
        const miniTrayW = numPills * miniPillW + (numPills - 1) * miniGap
        const miniTrayLeft = (vw - miniTrayW) / 2
        const miniMarginTop = vw < BREAKPOINTS.mobile ? 32 : 40

        visibleCards.forEach((card, idx) => {
          newExitPositions.set(card.id, {
            top: miniMarginTop,
            left: miniTrayLeft + idx * (miniPillW + miniGap),
            width: miniPillW,
            height: miniPillH,
          })
        })
        setMobileExitPositions(newExitPositions)
      }
      // Defer overflow restoration: the cleanup of the overflow useEffect will fire
      // when expandedIndex goes null, but we need overflow to stay 'hidden' during
      // the entire exit animation so the scrollbar doesn't reappear and shift positions.
      // onExitComplete's rAF will clear this flag and restore overflow after paint.
      deferOverflowRestore.current = true
      setCloseTriggered(true)
      return
    }

    // ── Closing back to default card row ──
    // Read actual DOM positions from the hidden-but-laid-out card elements.
    // Cards have `visibility: hidden` but are still in flow, so
    // getBoundingClientRect() returns correct layout positions.

    const container = scrollContainerRef.current
    const hasOverflow = container ? container.scrollWidth > container.clientWidth : false

    if (hasOverflow && container) {
      // Mobile & narrow tablet: cards overflow and scroll.
      // Compute a target scroll position that shows the closing card,
      // then adjust all exit positions for that scroll state.
      const containerRect = container.getBoundingClientRect()
      const currentScrollLeft = container.scrollLeft

      const closingCard = visibleCards[expandedIndex]
      const closingCardEl = closingCard ? cardRefs.current.get(closingCard.id) : null

      if (closingCardEl) {
        const cardRect = closingCardEl.getBoundingClientRect()
        // Card's left edge relative to the scroll content (not viewport)
        const cardContentLeft = cardRect.left - containerRect.left + currentScrollLeft
        const cardWidth = cardRect.width
        const containerVisibleWidth = container.clientWidth
        const bleedPadding = 12 // 0.75rem

        let targetScrollPosition: number
        if (expandedIndex === visibleCards.length - 1) {
          // Last card: align to right edge
          targetScrollPosition = cardContentLeft + cardWidth - containerVisibleWidth + bleedPadding
        } else {
          // Other cards: align to left edge
          targetScrollPosition = Math.max(0, cardContentLeft - bleedPadding)
        }
        // Clamp to valid scroll range
        const maxScroll = container.scrollWidth - container.clientWidth
        savedScrollPosition.current = Math.max(0, Math.min(targetScrollPosition, maxScroll))
      }

      // Compute exit positions adjusted for the scroll delta
      const scrollDelta = currentScrollLeft - savedScrollPosition.current

      const newExitPositions = new Map<string, { top: number; left: number; width: number; height: number }>()
      visibleCards.forEach((card) => {
        const el = cardRefs.current.get(card.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          newExitPositions.set(card.id, {
            top: rect.top,
            left: rect.left + scrollDelta,
            width: rect.width,
            height: rect.height,
          })
        }
      })
      setMobileExitPositions(newExitPositions)
      setCloseTriggered(true)
    } else {
      // Desktop & wide tablet: cards don't scroll (no overflow).
      // Clear stale exit positions and use the two-phase close (closeTriggered → useEffect)
      // so the empty map renders before AnimatePresence captures exit props.
      // Without this, stale compact pill positions from a previous close cycle leak through.
      setMobileExitPositions(new Map())
      setCloseTriggered(true)
    }
  }

  // Effect to clear expandedIndex AFTER exit positions have been rendered
  // This ensures Framer Motion captures the correct exit position props
  React.useEffect(() => {
    if (closeTriggered) {
      setCloseTriggered(false)
      setIsClosing(true)
      setExpandedIndex(null)
    }
  }, [closeTriggered])

  // Two-phase expand from compact — phase 2: the re-render from phase 1 has baked
  // expandedFromCompact.current=true into the compact bar's exit prop cache.
  // Now safe to set expandedIndex, which removes the compact bar with the correct exit (fade, not slide).
  React.useEffect(() => {
    if (expandFromCompactTriggered) {
      setExpandFromCompactTriggered(false)
      setExpandedIndex(pendingExpandIndex.current!)
      pendingExpandIndex.current = null
    }
  }, [expandFromCompactTriggered])

  // Handle ESC key, arrow keys for navigation, and number keys to open cards
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable ALL card shortcuts when compact bar is showing (mini or expanded).
      // The default cards are off-screen so shortcuts would look broken.
      if (isCompact && expandedIndex === null) return

      // Number keys 1-4 to open/close/jump between cards
      const keyNum = parseInt(e.key, 10)
      if (keyNum >= 1 && keyNum <= cardsToShow.length) {
        e.preventDefault() // Stop the digit from landing in the Add-a-role input
        const targetIndex = keyNum - 1
        if (expandedIndex === null) {
          // Not expanded - open the card
          capturePositionsAndExpand(targetIndex)
        } else if (expandedIndex === targetIndex) {
          // Same card - close it
          handleCloseExpanded()
        } else {
          // Different card - jump to it with bouncy transition
                    setExpandedIndex(targetIndex)
        }
        return
      }

      // ESC and arrow keys only work when expanded
      if (expandedIndex === null) return

      if (e.key === 'Escape') {
        handleCloseExpanded()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const atEnd = expandedIndex === cardsToShow.length - 1
        // Apply tug effect - much stronger at boundary for dramatic rubber band
        const tugStrength = atEnd ? 70 : 25
        velocityState.current.rawVelocity += tugStrength

        if (!atEnd) {
          setExpandedIndex((prev) =>
            prev !== null ? Math.min(prev + 1, cardsToShow.length - 1) : 0
          )
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const atStart = expandedIndex === 0
        // Apply tug effect - much stronger at boundary for dramatic rubber band
        const tugStrength = atStart ? -70 : -25
        velocityState.current.rawVelocity += tugStrength

        if (!atStart) {
          setExpandedIndex((prev) =>
            prev !== null ? Math.max(prev - 1, 0) : 0
          )
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandedIndex, cardsToShow.length, isCompact])

  // Parallax velocity state - smoothed scroll velocity for parallax effect
  const [parallaxOffset, setParallaxOffset] = React.useState(0)
  const velocityState = React.useRef({
    rawVelocity: 0,
    smoothVelocity: 0,
    lastTime: performance.now(),
  })

  // Drag state for pointer-based navigation
  const dragState = React.useRef({
    isDragging: false,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    dragVelocity: 0,
    totalDragDistance: 0,
  })

  // Tracks whether the last pointer interaction was a drag (suppresses click on links/buttons)
  const wasDragged = React.useRef(false)

  // Ref for the expanded drag container (for native touch event listeners)
  // Using state to trigger re-render when ref is set, ensuring useEffect runs after mount
  const [dragContainer, setDragContainer] = React.useState<HTMLDivElement | null>(null)

  // Animation frame for smooth velocity decay
  React.useEffect(() => {
    if (expandedIndex === null || reduced) {
      setParallaxOffset(0)
      return
    }

    let animationId: number
    const animate = () => {
      const now = performance.now()
      const state = velocityState.current
      const deltaTime = (now - state.lastTime) / 1000 // Convert to seconds
      state.lastTime = now

      // Damp the smooth velocity towards raw velocity, then decay raw
      // Using exponential decay for frame-rate independent smoothing
      const dampFactor = 1 - Math.exp(-25 * deltaTime) // ~25 = instant response for sharp tug
      state.smoothVelocity += (state.rawVelocity - state.smoothVelocity) * dampFactor

      // Decay raw velocity - configurable decay for different feels
      state.rawVelocity *= Math.pow(CAROUSEL_CONFIG.velocityDecay, deltaTime * 60)

      // Apply parallax offset based on smoothed velocity
      setParallaxOffset(state.smoothVelocity * CAROUSEL_CONFIG.parallaxMultiplier)

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [expandedIndex, CAROUSEL_CONFIG.velocityDecay, CAROUSEL_CONFIG.parallaxMultiplier])

  // Wheel navigation when expanded - one card per scroll gesture
  const wheelState = React.useRef({ lastDelta: 0, lastTime: 0, lastNavTime: 0 })
  React.useEffect(() => {
    if (expandedIndex === null) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Use deltaX for horizontal scrolling (trackpad swipe), fall back to deltaY for vertical
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY

      const atStart = expandedIndex === 0
      const atEnd = expandedIndex === cardsToShow.length - 1
      const goingNext = delta > 0
      const goingPrev = delta < 0

      // Rubber band at boundaries - apply tug but don't navigate
      const hitBoundary = (atStart && goingPrev) || (atEnd && goingNext)

      // Feed velocity into parallax system (configurable boundary strength)
      const velocityScale = hitBoundary ? CAROUSEL_CONFIG.boundaryVelocityScale : CAROUSEL_CONFIG.normalVelocityScale
      velocityState.current.rawVelocity += -delta * velocityScale

      // If at boundary, just apply the tug effect without navigation
      if (hitBoundary) return

      const now = Date.now()
      const state = wheelState.current
      const timeSinceLastNav = now - state.lastNavTime

      // Require cooldown after navigation before allowing another
      // This prevents trackpad momentum from triggering multiple navigations
      if (timeSinceLastNav < 220) {
        state.lastDelta = delta
        state.lastTime = now
        return
      }

      const timeSinceLast = now - state.lastTime
      const direction = Math.sign(delta)
      const lastDirection = Math.sign(state.lastDelta)

      // Ignore small deltas (trackpad noise/oscillation)
      const minDelta = 8
      if (Math.abs(delta) < minDelta) {
        return
      }

      // Detect new gesture: requires time gap (direction change alone isn't enough
      // as trackpad momentum can oscillate)
      const isNewGesture = timeSinceLast > 80

      // If direction changed, require longer gap to prevent oscillation-triggered navigation
      const directionChanged = direction !== lastDirection && lastDirection !== 0
      if (directionChanged && timeSinceLast < 150) {
        state.lastDelta = delta
        state.lastTime = now
        return
      }

      state.lastDelta = delta
      state.lastTime = now

      // Only navigate on new gestures
      if (!isNewGesture) return

      // Record navigation time to enforce cooldown
      state.lastNavTime = now

      if (delta > 0) {
        setExpandedIndex((prev) =>
          prev !== null ? Math.min(prev + 1, cardsToShow.length - 1) : 0
        )
      } else if (delta < 0) {
        setExpandedIndex((prev) =>
          prev !== null ? Math.max(prev - 1, 0) : 0
        )
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [expandedIndex, cardsToShow.length, CAROUSEL_CONFIG.boundaryVelocityScale, CAROUSEL_CONFIG.normalVelocityScale])

  // Drag state for tracking boundary drags
  const boundaryDragState = React.useRef({
    isDraggingAtBoundary: false,
  })

  // Drag navigation handlers for expanded cards
  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    if (expandedIndex === null) return

    // Prevent default to stop mobile browsers from intercepting touch
    e.preventDefault()

    const state = dragState.current
    state.isDragging = true
    state.startX = e.clientX
    state.lastX = e.clientX
    state.lastTime = performance.now()
    state.dragVelocity = 0
    state.totalDragDistance = 0
    wasDragged.current = false
    boundaryDragState.current.isDraggingAtBoundary = false

    // Capture pointer for reliable tracking outside element
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture may fail on some mobile browsers, continue without it
    }
  }, [expandedIndex])

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    const state = dragState.current
    if (!state.isDragging || expandedIndex === null) return

    // Prevent default to stop mobile browsers from scrolling/navigating
    e.preventDefault()

    const now = performance.now()
    const deltaX = e.clientX - state.lastX
    const deltaTime = now - state.lastTime

    // Track instantaneous velocity for momentum on release
    if (deltaTime > 0) {
      state.dragVelocity = deltaX / deltaTime * 16 // Normalize to ~60fps
    }

    state.totalDragDistance += deltaX
    state.lastX = e.clientX
    state.lastTime = now

    // Check boundaries for spring effect
    const atStart = expandedIndex === 0
    const atEnd = expandedIndex === cardsToShow.length - 1
    const draggingLeft = deltaX < 0
    const draggingRight = deltaX > 0

    // At boundaries dragging "outward" (first card right, last card left), spring in drag direction
    const draggingOutward = (atStart && draggingRight) || (atEnd && draggingLeft)

    // Track if we're dragging at a boundary for spring-back on release
    if (draggingOutward) {
      boundaryDragState.current.isDraggingAtBoundary = true
    }

    if (draggingOutward) {
      // Rubber band at boundaries - configurable drag distance
      velocityState.current.rawVelocity += deltaX * CAROUSEL_CONFIG.boundaryDragMultiplier
    } else {
      // Normal navigation: swipe left = next card, swipe right = previous card
      velocityState.current.rawVelocity += -deltaX * CAROUSEL_CONFIG.normalDragMultiplier
    }
  }, [expandedIndex, cardsToShow.length, CAROUSEL_CONFIG.boundaryDragMultiplier, CAROUSEL_CONFIG.normalDragMultiplier])

  const handlePointerUp = React.useCallback((e: React.PointerEvent) => {
    const state = dragState.current
    if (!state.isDragging || expandedIndex === null) {
      state.isDragging = false
      return
    }

    state.isDragging = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Pointer capture release may fail if capture wasn't set
    }

    const totalDrag = state.totalDragDistance

    // Mark as dragged if movement exceeded a small threshold — this suppresses
    // click events on links/buttons inside the card via the capture-phase handler
    if (Math.abs(totalDrag) > 5) {
      wasDragged.current = true
    }

    // If we were dragging at a boundary, apply spring-back impulse
    if (CAROUSEL_CONFIG.enableBoundarySpringBack && boundaryDragState.current.isDraggingAtBoundary && Math.abs(totalDrag) > 5) {
      // Spring impulse in opposite direction, proportional to drag distance
      const springImpulse = -totalDrag * CAROUSEL_CONFIG.springBackMultiplier
      velocityState.current.rawVelocity = springImpulse
      velocityState.current.smoothVelocity = 0
      boundaryDragState.current.isDraggingAtBoundary = false
      return // Don't navigate when springing back
    }

    // Apply momentum from drag velocity — skip at boundaries to avoid double bounce
    if (!boundaryDragState.current.isDraggingAtBoundary) {
      velocityState.current.rawVelocity += -state.dragVelocity * CAROUSEL_CONFIG.momentumMultiplier
    }
    boundaryDragState.current.isDraggingAtBoundary = false

    // Navigate one card at a time if drag exceeded threshold
    // Swipe left = next card, swipe right = previous card
    if (Math.abs(totalDrag) >= CAROUSEL_CONFIG.dragThreshold) {
      if (totalDrag < 0) {
        // Swiped left -> go to next card
        setExpandedIndex((prev) => prev !== null ? Math.min(prev + 1, cardsToShow.length - 1) : 0)
      } else {
        // Swiped right -> go to previous card
        setExpandedIndex((prev) => prev !== null ? Math.max(prev - 1, 0) : 0)
      }
    }
  }, [expandedIndex, cardsToShow.length, CAROUSEL_CONFIG.dragThreshold, CAROUSEL_CONFIG.momentumMultiplier, CAROUSEL_CONFIG.enableBoundarySpringBack, CAROUSEL_CONFIG.springBackMultiplier])

  // Native touch event handlers for mobile browsers
  // Required because React's synthetic events don't allow { passive: false }
  React.useEffect(() => {
    const container = dragContainer
    if (!container || expandedIndex === null) return

    // Local Y tracking for swipe-to-dismiss (mobile only)
    let startY = 0
    let totalDragY = 0
    const SWIPE_DOWN_THRESHOLD = 100 // px to dismiss

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return

      const touch = e.touches[0]
      const state = dragState.current
      state.isDragging = true
      state.startX = touch.clientX
      state.lastX = touch.clientX
      state.lastTime = performance.now()
      state.dragVelocity = 0
      state.totalDragDistance = 0
      wasDragged.current = false
      boundaryDragState.current.isDraggingAtBoundary = false

      // Track Y for swipe-to-dismiss
      startY = touch.clientY
      totalDragY = 0
    }

    const handleTouchMove = (e: TouchEvent) => {
      const state = dragState.current
      if (!state.isDragging || e.touches.length !== 1) return

      const touch = e.touches[0]
      const now = performance.now()
      const deltaX = touch.clientX - state.lastX
      const deltaTime = now - state.lastTime

      // Prevent default to stop browser from scrolling/navigating
      e.preventDefault()

      if (deltaTime > 0) {
        state.dragVelocity = deltaX / deltaTime * 16
      }

      state.totalDragDistance += deltaX
      state.lastX = touch.clientX
      state.lastTime = now

      // Track Y movement
      totalDragY = touch.clientY - startY

      const atStart = expandedIndex === 0
      const atEnd = expandedIndex === cardsToShow.length - 1
      const draggingLeft = deltaX < 0
      const draggingRight = deltaX > 0
      const draggingOutward = (atStart && draggingRight) || (atEnd && draggingLeft)

      if (draggingOutward) {
        boundaryDragState.current.isDraggingAtBoundary = true
        velocityState.current.rawVelocity += deltaX * CAROUSEL_CONFIG.boundaryDragMultiplier
      } else {
        velocityState.current.rawVelocity += -deltaX * CAROUSEL_CONFIG.normalDragMultiplier
      }
    }

    const handleTouchEnd = () => {
      const state = dragState.current
      if (!state.isDragging) return

      state.isDragging = false
      const totalDragX = state.totalDragDistance

      // Mark as dragged to suppress tap→click on links/buttons (mirrors pointer handler)
      if (Math.abs(totalDragX) > 5) {
        wasDragged.current = true
      }

      // Check for swipe-down-to-dismiss on mobile & tablet
      // Only dismiss if: downward movement, Y dominates X, and past threshold
      if (!isDesktop && totalDragY > SWIPE_DOWN_THRESHOLD && totalDragY > Math.abs(totalDragX)) {
        handleCloseExpanded()
        return
      }

      if (CAROUSEL_CONFIG.enableBoundarySpringBack && boundaryDragState.current.isDraggingAtBoundary && Math.abs(totalDragX) > 5) {
        const springImpulse = -totalDragX * CAROUSEL_CONFIG.springBackMultiplier
        velocityState.current.rawVelocity = springImpulse
        velocityState.current.smoothVelocity = 0
        boundaryDragState.current.isDraggingAtBoundary = false
        return
      }

      velocityState.current.rawVelocity += -state.dragVelocity * CAROUSEL_CONFIG.momentumMultiplier

      if (Math.abs(totalDragX) >= CAROUSEL_CONFIG.dragThreshold) {
        if (totalDragX < 0) {
          setExpandedIndex((prev) => prev !== null ? Math.min(prev + 1, cardsToShow.length - 1) : 0)
        } else {
          setExpandedIndex((prev) => prev !== null ? Math.max(prev - 1, 0) : 0)
        }
      }
    }

    // Add listeners with { passive: false } to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [expandedIndex, cardsToShow.length, dragContainer, isDesktop, handleCloseExpanded])

  // Lock all site scrolling when expanded
  // This prevents body scroll, wheel events, and touch scrolling
  // When closing from compact, keep overflow hidden during the exit animation so the scrollbar
  // doesn't reappear and shift the viewport (which would cause a width mismatch between the
  // portal card's exit position and the real compact bar). onExitComplete restores overflow.
  React.useEffect(() => {
    if (expandedIndex !== null) {
      // Lock body scroll
      document.body.style.overflow = 'hidden'
      // Add data attribute so other components know TopCards are expanded
      document.documentElement.setAttribute('data-topcards-expanded', 'true')
    } else if (!isClosing && !deferOverflowRestore.current) {
      // Only restore overflow if we're not in the middle of an exit animation
      // and not deferring to onExitComplete's rAF (closing-from-compact case)
      document.body.style.overflow = ''
      document.documentElement.removeAttribute('data-topcards-expanded')
    }
    return () => {
      // Don't restore overflow in cleanup if we're deferring to onExitComplete's rAF
      // (closing-from-compact case). The cleanup fires on every dependency change,
      // including the expandedIndex→null transition that starts the exit animation.
      if (!deferOverflowRestore.current) {
        document.body.style.overflow = ''
        document.documentElement.removeAttribute('data-topcards-expanded')
      }
    }
  }, [expandedIndex, isClosing])

  // Track a resize key to force re-render when viewport changes while expanded
  const [resizeKey, setResizeKey] = React.useState(0)

  React.useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setIsDesktop(w >= BREAKPOINTS.desktop)
      setIsMobile(w < BREAKPOINTS.mobile)
      setIsTablet(w >= BREAKPOINTS.mobile && w < BREAKPOINTS.desktop)
      setViewportWidth(w)
      // Force re-render to recalculate expanded positions if a card is expanded
      if (expandedIndex !== null) {
        setResizeKey(prev => prev + 1)
      }
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [expandedIndex])

  const topThreeCards = cardsToShow.slice(0, 3)
  const ctaCard = cardsToShow.length > 3 ? cardsToShow[3] : undefined
  // Mobile & Tablet: all 4 cards in horizontal scroll (CTA is compact)
  // Desktop: all 4 cards inline, full-width
  const mobileCards = ctaCard ? [...topThreeCards, ctaCard] : topThreeCards
  const isSplitMode = cardIndices && cardIndices.length < cards.length

  const isExpanded = expandedIndex !== null

  // Restore scroll position when cards become visible again
  React.useLayoutEffect(() => {
    if (!isExpanded && !isClosing && scrollContainerRef.current && savedScrollPosition.current > 0) {
      scrollContainerRef.current.scrollLeft = savedScrollPosition.current
    }
  }, [isExpanded, isClosing])

  // Calculate expanded position for a card in the carousel
  // Uses resizeKey dependency to recalculate when viewport changes while expanded
  const getExpandedPosition = React.useCallback((cardIndex: number) => {
    // resizeKey ensures this recalculates on viewport resize
    void resizeKey
    const { width, height, gap, scale } = getExpandedCardDimensions()
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080

    // Center position for the active card
    const centerX = (viewportWidth - width) / 2
    const centerY = (viewportHeight - height) / 2

    // Offset from the active card
    const activeIdx = expandedIndex ?? 0
    const offsetFromActive = cardIndex - activeIdx
    const xOffset = offsetFromActive * (width + gap)

    return {
      x: centerX + xOffset,
      y: Math.max(16, centerY), // Ensure minimum top padding
      width,
      height,
      scale,
    }
  }, [expandedIndex, resizeKey])

  // Cards to render in the main row
  // Mobile & Tablet: all 4 cards in horizontal scroll
  // Desktop: top 3 cards + full CTA card inline (no scroll)
  const visibleCards = isDesktop ? (ctaCard ? [...topThreeCards, ctaCard] : topThreeCards) : mobileCards

  // Compute explicit expanded pill width for smooth Framer Motion interpolation.
  // `flex` shorthand can't be animated, so we compute the final width value
  // that the flex layout would produce and animate `width` directly.
  const numPills = visibleCards.length
  const expandedPillWidth = React.useMemo(() => {
    // Site padding: 24px each side for wide viewports (≥ tabletWide), 12px otherwise.
    // On desktop, morphing container handles it; on non-desktop, inner flex handles it.
    // Either way, the pill content area = viewportWidth - sitePad*2.
    const sitePad = viewportWidth >= BREAKPOINTS.tabletWide ? 24 : 12
    const gapSize = isMobile ? 8 : 16
    const totalGaps = (numPills - 1) * gapSize
    const available = viewportWidth - sitePad * 2 - totalGaps
    const dynamicWidth = Math.floor(available / numPills)

    // If the dynamic width is large enough (≥ 260px), use it so pills fill
    // the available space. Otherwise fall back to 260px fixed (will scroll).
    if (dynamicWidth >= 260) {
      return dynamicWidth
    }
    return 260
  }, [viewportWidth, numPills, isMobile])

  // Whether the expanded pills need horizontal scrolling (total pill+gap > available space).
  // Drives overflow, justifyContent, and container padding decisions.
  const pillsWillScroll = expandedPillWidth === 260 && (() => {
    const sitePad = viewportWidth >= BREAKPOINTS.tabletWide ? 24 : 12
    const gapSize = isMobile ? 8 : 16
    const total = numPills * 260 + (numPills - 1) * gapSize
    return total > viewportWidth - sitePad * 2
  })()

  // Get collapsed position for a card (used for initial/opening animation)
  // Exit position is calculated separately and passed via exitPosition prop
  const getCollapsedPosition = (cardId: string) => {
    const rect = cardPositions.get(cardId)
    if (rect) {
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    }
    return { top: 0, left: 0, width: 300, height: 76 }
  }

  return (
    <>
      <div ref={topCardsWrapperRef} className={isSplitMode ? "top-padding-responsive" : "horizontal-padding-responsive top-padding-responsive"} style={{ overflow: 'visible' }}>
        <div className="mx-auto" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
          {/* Cards row */}
          <div
            ref={scrollContainerRef}
            onScroll={(e) => {
              // Keep shared scroll position in sync when user scrolls the default card row
              if (!isCompact && !isExpanded) {
                sharedScrollLeft.current = (e.target as HTMLDivElement).scrollLeft
              }
            }}
            className="flex scrollbar-hide"
            style={{
              perspective: '1000px',
              gap: isMobile ? '0.5rem' : '1rem',
              justifyContent: isDesktop ? 'center' : 'flex-start',
              overflowX: isMobile ? 'auto' : isTablet ? 'auto' : 'visible',
              overflowY: 'visible',
              transition: 'gap 0.3s ease, justify-content 0.3s ease, margin 0.3s ease, padding 0.3s ease, opacity 0.3s ease',
              pointerEvents: isCompact ? 'none' : 'auto',
              opacity: isCompact ? 0 : 1,
              // Mobile & Tablet: bleed scroll container to viewport edges so
              // first/last cards aren't clipped when overflowing
              ...(!isDesktop && {
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
            {visibleCards.map((card, vi) => {
              const cardIndex = cardsToShow.findIndex((c) => c.id === card.id)

              // Use desktop treatment (label + title) for CTA card on all breakpoints
              const isCompactCtaCard = false

              return (
                <motion.div
                  key={card.id}
                  ref={(el) => { cardRefs.current.set(card.id, el) }}
                  initial={introStagger ? { y: -30, opacity: 0 } : false}
                  animate={{ y: 0, opacity: 1 }}
                  transition={introStagger ? (reduced ? { duration: 0.01 } : {
                    ...signatureSpring,
                    delay: 0.45 + vi * 0.08,
                  }) : { duration: 0 }}
                  style={{
                    // Desktop: flex cards that share space equally
                    // Tablet: flex cards that grow to fill but never shrink below 260px (scrolls when they can't fit)
                    // Mobile: fixed-width cards in horizontal scroll
                    ...(isDesktop
                      ? {
                          flex: '1 1 0%',
                          minWidth: 0,
                        }
                      : isTablet
                      ? {
                          flex: '1 0 260px',
                        }
                      : {
                          flex: '0 0 auto',
                          minWidth: isCompactCtaCard ? '115px' : '243px',
                          maxWidth: isCompactCtaCard ? '115px' : '243px',
                          width: isCompactCtaCard ? '115px' : '243px',
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
                    onHighlightClick={() => {}}
                    hideShortcut={isMobile}
                    compactCta={isCompactCtaCard}
                    mobileLabel={isCompactCtaCard ? 'ADD ROLE' : undefined}

                    themeMode={themeMode}
                  />
                </motion.div>
              )
            })}
          </div>

        </div>
      </div>

      {/* Expanded overlay - rendered in portal to escape stacking context */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence onExitComplete={() => {
            // Restore scroll position before showing cards to prevent shift
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollLeft = savedScrollPosition.current
            }
            const wasFromCompact = expandedFromCompact.current
            expandedFromCompact.current = false
            closingCardIndex.current = null
            // deferOverflowRestore was already set in handleCloseExpanded (line 374)
            // to prevent the overflow useEffect cleanup from restoring overflow early.
            // It stays true here; onExitComplete's rAF below will clear it after paint.
            setIsClosing(false)
            if (wasFromCompact) {
              justClosedFromCompact.current = true
              setCompactState('mini')
              requestAnimationFrame(() => {
                justClosedFromCompact.current = false
                deferOverflowRestore.current = false
                document.body.style.overflow = ''
                document.documentElement.removeAttribute('data-topcards-expanded')
              })
            }
          }}>
          {isExpanded && (
            <>
              {/* Backdrop - samples bg color from focused card, smoothly transitions */}
              <motion.div
                className="fixed inset-0"
                style={{ zIndex: Z.expandedCard - 1, mixBlendMode: 'multiply' }}
                initial={{ opacity: 0, backgroundColor: backdropColors[themeMode === 'dark' || themeMode === 'darkInverted' ? 'dark' : 'light'][cardsToShow[expandedIndex!]?.variant || 'cta'] }}
                animate={{
                  opacity: 1,
                  backgroundColor: backdropColors[themeMode === 'dark' || themeMode === 'darkInverted' ? 'dark' : 'light'][cardsToShow[expandedIndex!]?.variant || 'cta'],
                }}
                exit={{ opacity: 0 }}
                transition={reduced ? { duration: 0.01 } : {
                  opacity: { duration: 0.2 },
                  backgroundColor: { duration: 0.5, ease: 'easeInOut' },
                }}
              />

              {/* Expanded cards - wrapped in drag container */}
              <div
                ref={setDragContainer}
                className="fixed inset-0 cursor-grab active:cursor-grabbing"
                style={{ zIndex: Z.expandedCard, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                onClickCapture={(e) => {
                  // Suppress ALL click events (links, buttons) if the pointer interaction was a drag.
                  // This fires in the capture phase — before any child onClick handlers.
                  if (wasDragged.current) {
                    e.stopPropagation()
                    e.preventDefault()
                    wasDragged.current = false
                    return
                  }
                }}
                onClick={() => {
                  // Only close if it wasn't a drag (minimal movement)
                  if (Math.abs(dragState.current.totalDragDistance) < 10) {
                    handleCloseExpanded()
                  }
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {visibleCards.map((card) => {
                  // Use desktop treatment (label + title) for CTA card on all breakpoints
                  const isCompactCtaCard = false
                  const cardIndex = cardsToShow.findIndex((c) => c.id === card.id)
                  const collapsedPos = getCollapsedPosition(card.id)

                  // Get exit position from pre-calculated values (stored in handleCloseExpanded)
                  // This ensures stable exit positions that don't change during the animation
                  // Used for mobile, tablet, and compact-close on all breakpoints
                  const mobileExitPos = mobileExitPositions.get(card.id)
                  // For stacking logic, use the closing card index during exit animation
                  const focusIndex = expandedIndex ?? closingCardIndex.current
                  const isCtaFocused = focusIndex === cardsToShow.length - 1
                  const isOneOfFirstThree = cardIndex < 3 && cardsToShow.length > 3

                  // When CTA is focused, first 3 cards stack behind it
                  let expandedPos = getExpandedPosition(cardIndex)
                  let stackedRotation = 0
                  let stackedScale = 1
                  let zIndexOverride: number | undefined

                  if (isCtaFocused && isOneOfFirstThree) {
                    const config = stackedCardConfigs[cardIndex]
                    const ctaPos = getExpandedPosition(cardsToShow.length - 1)
                    const { width, height, scale } = getExpandedCardDimensions()
                    expandedPos = {
                      x: ctaPos.x + config.offsetX,
                      y: ctaPos.y + config.offsetY + 25,
                      width,
                      height,
                      scale,
                    }
                    stackedRotation = config.rotation
                    stackedScale = config.scale
                    // Stack order: first card at bottom (9996), third at top (9998), CTA at 9999
                    zIndexOverride = 9996 + cardIndex
                  }

                  // Cascading parallax: cards further from focus move more
                  // When stacked behind CTA, use a special staggered parallax based on stack position
                  let cardParallaxOffset = 0
                  if (isCtaFocused && isOneOfFirstThree) {
                    // Stacked cards get inverse cascade - deeper cards (lower index) move more
                    // This creates a nice "shuffling" feel when scrolling
                    const stackDepth = 2 - cardIndex // 2, 1, 0 for cards 0, 1, 2
                    const stackMultiplier = 0.6 + stackDepth * 0.25
                    cardParallaxOffset = parallaxOffset * stackMultiplier
                  } else {
                    const distanceFromFocus = cardIndex - (focusIndex ?? 0)
                    // Multiplier increases with distance, creating staggered/cascading effect
                    const cascadeMultiplier = 1 + Math.abs(distanceFromFocus) * 0.7
                    cardParallaxOffset = parallaxOffset * cascadeMultiplier
                  }

                  // Always use bouncy transitions for all cards
                  // This gives a satisfying spring effect on both navigation and close
                  const useBouncyTransition = true

                  return (
                    <MorphingCard
                      key={`expanded-${card.id}`}
                      card={card}
                      isExpanded={true}
                      collapsedPosition={collapsedPos}
                      exitPosition={mobileExitPos}
                      expandedPosition={expandedPos}
                      onClick={() => {}}
                      onClose={handleCloseExpanded}
                      onHighlightClick={() => {}}
                      hideShortcut={isMobile}
                      compactCta={isCompactCtaCard}
                      mobileLabel={isCompactCtaCard ? 'ADD ROLE' : undefined}
  
                      themeMode={themeMode}
                      parallaxOffset={cardParallaxOffset}
                      stackedRotation={stackedRotation}
                      stackedScale={stackedScale}
                      zIndexOverride={zIndexOverride}
                      useBouncyTransition={useBouncyTransition}
                      isFocused={cardIndex === expandedIndex}
                      initialBorderRadius={(expandedFromCompact.current && !isPastVideo) ? 44 : 16}
                      expandedFromCompact={expandedFromCompact.current && !isPastVideo}
                      isOverDark={isOverDark}
                    />
                  )
                })}
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Compact sticky bar — two variants:
            1. Pre-video: mini tray ↔ expanded morph bar (hover-driven)
            2. Post-video: default card row fixed at top (no morph) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {/* ── Post-video: default card row ── */}
          {isPastVideo && isCompact && !isExpanded && !isClosing && (
            <motion.div
              key="post-video-bar"
              data-compact-bar
              className="fixed top-0 left-0 right-0 horizontal-padding-responsive"
              style={{
                zIndex: Z.compactBar,
                paddingTop: isMobile ? 12 : 20,
                paddingBottom: isMobile ? 12 : 20,
                overflow: 'visible',
              }}
              initial={justClosedFromCompact.current ? { y: 0 } : { y: '-100%' }}
              animate={{ y: 0, transition: justClosedFromCompact.current
                ? { duration: 0 }
                : { duration: 0.6, ease: [0.33, 1, 0.68, 1] }
              }}
              exit={expandedFromCompact.current
                ? { y: 0, transition: { duration: 0 } }
                : { y: '-100%', opacity: 0, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] } }
              }
            >
              <div
                className="flex scrollbar-hide"
                style={{
                  gap: isMobile ? '0.5rem' : '1rem',
                  justifyContent: isDesktop ? 'center' : 'flex-start',
                  overflowX: isMobile ? 'auto' : isTablet ? 'auto' : 'visible',
                  overflowY: 'visible',
                  // Extra padding so hover scale (1.03×) doesn't clip at viewport edges
                  padding: 6,
                  margin: -6,
                  ...(!isDesktop && {
                    marginLeft: '-0.75rem',
                    marginRight: '-0.75rem',
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem',
                  }),
                }}
              >
                {visibleCards.map((card) => {
                  const cardIndex = cardsToShow.findIndex((c) => c.id === card.id)
                  const isCompactCtaCard = false

                  return (
                    <div
                      key={card.id}
                      ref={(el) => { postVideoCardRefs.current.set(card.id, el) }}
                      style={{
                        overflow: 'visible',
                        ...(isDesktop
                          ? { flex: '1 1 0%', minWidth: 0 }
                          : isTablet
                          ? { flex: '1 0 260px' }
                          : {
                              flex: '0 0 auto',
                              minWidth: isCompactCtaCard ? '115px' : '243px',
                              maxWidth: isCompactCtaCard ? '115px' : '243px',
                              width: isCompactCtaCard ? '115px' : '243px',
                            }),
                      }}
                    >
                      <MorphingCard
                        card={card}
                        isExpanded={false}
                        expandedPosition={getExpandedPosition(cardIndex)}
                        onClick={() => captureCompactPositionsAndExpand(cardIndex)}
                        onClose={handleCloseExpanded}
                        onHighlightClick={() => {}}
                        hideShortcut={isMobile}
                        compactCta={isCompactCtaCard}
                        mobileLabel={isCompactCtaCard ? 'ADD ROLE' : undefined}
    
                        themeMode={themeMode}
                      />
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Pre-video: mini tray ↔ expanded morph bar ── */}
          {!isPastVideo && isCompact && !isExpanded && !isClosing && (
            <motion.div
              key="compact-bar"
              data-compact-bar
              className="fixed top-0 left-0 right-0"
              style={{
                zIndex: Z.compactBar,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none', // Let children handle pointer events
                overflow: 'visible',
              }}
              initial={justClosedFromCompact.current
                ? { y: 0 }
                : { y: '-100%' }
              }
              animate={{ y: 0, transition: justClosedFromCompact.current
                ? { duration: 0 }
                : { duration: 0.6, ease: [0.33, 1, 0.68, 1] }  // ease-out: decelerates in
              }}
              exit={expandedFromCompact.current
                ? { y: 0, transition: { duration: 0 } }
                : { y: '-100%', opacity: 0, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] } }  // ease-out: fast start, decelerates off
              }
            >
              {/* Magnetic hit zone — invisible area around the mini tray that captures
                  mouse movement for the magnetic attraction effect. Extends ~60px beyond
                  the tray so the pull starts as the cursor approaches. Only rendered in
                  mini state; the morphing container handles its own events when expanded. */}
              {isMiniTray && (() => {
                const hitPad = 80 // px beyond tray in each direction
                const trayW = numPills * 28 + (numPills - 1) * 4
                const trayMarginTop = isMobile ? 32 : 40
                return (
                  <div
                    onMouseMove={handleMiniTrayMouseMove}
                    onMouseLeave={handleMiniTrayHitZoneLeave}
                    style={{
                      position: 'absolute',
                      // Center on the mini tray's actual position
                      top: Math.max(0, trayMarginTop - hitPad),
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: trayW + hitPad * 2,
                      height: 8 + hitPad * 2 + Math.min(hitPad, trayMarginTop), // 8px tray height + padding
                      pointerEvents: 'auto',
                      zIndex: 0,
                    }}
                  />
                )
              })()}

              {/* Morphing container — pills live here, glass floats independently.
                  Width animates between mini (pills + gaps) and expanded (viewport).
                  Must be numeric px values for Framer Motion to interpolate smoothly. */}
              <motion.div
                ref={morphContainerRef}
                onMouseEnter={isMiniTray ? handleMiniTrayEnter : handleCompactBarEnter}
                onMouseLeave={handleCompactBarLeave}
                onClick={isMiniTray ? handleMiniTrayClick : undefined}
                data-cursor={isMiniTray ? 'grow' : undefined}
                style={{
                  pointerEvents: 'auto',
                  display: 'flex',
                  // No alignItems: 'center' — padding controls vertical positioning.
                  // Using center causes Y-drift during morph due to asymmetric padding.
                  position: 'relative',
                  overflow: 'visible',
                  cursor: isMiniTray ? 'pointer' : 'default',
                  // Magnetic attraction: container follows cursor via sprung motion values.
                  // In expanded state, reset to 0 (spring animates back during morph).
                  x: isMiniTray ? springMagX : 0,
                  y: isMiniTray ? springMagY : 0,
                  zIndex: 1,
                }}
                // When remounting, start at the return-target values so the morphing
                // container doesn't spring from 0 (collapse-transitions.md §7).
                {...(justClosedFromCompact.current && {
                  initial: {
                    width: numPills * 28 + (numPills - 1) * 4,
                    marginTop: isMobile ? 32 : 40,
                    paddingLeft: 0,
                    paddingRight: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                })}
                animate={{
                  width: isMiniTray
                    ? numPills * 28 + (numPills - 1) * 4
                    : viewportWidth,
                  // Mini tray's vertical center must match the expanded pills' vertical
                  // center so the morph animation fans out purely horizontally.
                  // Expanded center = paddingTop + pillHeight/2 = 20+24 (desktop) or 12+24 (mobile) = 44 or 36
                  // Mini center = marginTop + miniHeight/2 → marginTop = expandedCenter - 4
                  marginTop: isMiniTray ? (isMobile ? 32 : 40) : 0,
                  // When pills scroll, zero out horizontal padding so the scroll
                  // container extends to the viewport edges (site padding is
                  // handled by the inner flex's clip-extension padding instead).
                  // When pills fit, apply site padding normally.
                  paddingLeft: isMiniTray ? 0 : (pillsWillScroll ? 0 : (viewportWidth >= BREAKPOINTS.tabletWide ? 24 : 12)),
                  paddingRight: isMiniTray ? 0 : (pillsWillScroll ? 0 : (viewportWidth >= BREAKPOINTS.tabletWide ? 24 : 12)),
                  // Symmetric vertical padding — prevents Y-drift during morph.
                  // Both top and bottom use the same value per breakpoint.
                  paddingTop: isMiniTray ? 0 : (isMobile ? 12 : 20),
                  paddingBottom: isMiniTray ? 0 : (isMobile ? 12 : 20),
                }}
                transition={reduced ? { duration: 0.01 } : ((morphStyle === 2 || morphStyle === 4) ? ctaEntranceSpring : signatureSpring)}
              >
                {/* Frosted glass pill — fixed 148×28 capsule, never resizes.
                    Centered over the pill content, simply dissolves on expand/collapse. */}
                <motion.div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 148,
                    height: 28,
                    // Use CSS translate for centering (separate from Framer Motion's x/y transform)
                    translate: '-50% -50%',
                    borderRadius: 22,
                    pointerEvents: 'none',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    backgroundColor: isOverDark ? 'rgba(50,50,60,0.55)' : 'rgba(255,255,255,0.8)',
                    boxShadow: elevations.figma5Step,
                    transition: `background-color ${DURATION.slow}s ease`,
                    // Magnetic: glass lags behind container (counter-displacement)
                    x: glassMagX,
                    y: glassMagY,
                  }}
                  // Start hidden when remounting so the glass dissolves in via the
                  // existing transition instead of popping in at full opacity.
                  {...(justClosedFromCompact.current && { initial: { opacity: 0 } })}
                  animate={{ opacity: isMiniTray ? 1 : 0 }}
                  transition={reduced ? { duration: 0.01 } : (morphStyle === 4
                    ? { duration: 0.18, ease: 'easeOut' }  // faster dissolve = anticipation
                    : { duration: 0.3, ease: 'easeOut' }
                  )}
                />

                {/* Inner flex container — handles scroll on tablet/mobile when expanded */}
                <div
                  ref={(el) => {
                    compactScrollRef.current = el
                    if (el && isCompactExpanded) {
                      if (justClosedFromCompact.current) {
                        el.scrollLeft = savedCompactScrollPosition.current
                      } else {
                        el.scrollLeft = sharedScrollLeft.current
                      }
                    }
                  }}
                  onScroll={(e) => {
                    if (isCompactExpanded) {
                      sharedScrollLeft.current = (e.target as HTMLDivElement).scrollLeft
                    }
                  }}
                  className="flex scrollbar-hide"
                  style={{
                    // Width compensates for clip-extension negative margin (8px each side).
                    // The negative margin extends the scroll/clip region; the matching
                    // portion of padding pushes content back in. Site padding is also
                    // included in the padding (non-desktop) so pills start at the correct inset.
                    width: isMiniTray ? '100%' : 'calc(100% + 16px)',
                    position: 'relative',
                    zIndex: 1,
                    justifyContent: isMiniTray ? 'center' : (pillsWillScroll ? 'flex-start' : 'center'),
                    overflowX: isMiniTray ? 'visible' : (pillsWillScroll ? 'auto' : 'visible'),
                    overflowY: 'visible',
                    // Negative margin + matching padding extends the clip/scroll region
                    // beyond the pills (collapse-transitions.md §11).
                    // Negative margin = clip extension only (8px each side).
                    // Padding = clip extension + site padding (non-desktop), so pills
                    // start at the correct site-padding inset while the scroll container
                    // bleeds to the viewport edges.
                    ...(isMiniTray ? {} : (() => {
                      const clip = 8 // base clip extension for CTA border + magnetic cursor
                      // When pills scroll, morphing container has 0 horizontal padding,
                      // so inner flex handles the site padding inset via its own padding.
                      const sitePad = pillsWillScroll ? (viewportWidth >= BREAKPOINTS.tabletWide ? 24 : 12) : 0
                      return {
                        marginTop: -clip,
                        marginBottom: -clip,
                        marginLeft: -clip,
                        marginRight: -clip,
                        paddingTop: clip,
                        paddingBottom: clip,
                        paddingLeft: clip + sitePad,
                        paddingRight: clip + sitePad,
                      }
                    })()),
                  }}
                >
                  {visibleCards.map((card, pillIdx) => {
                    const cardIndex = cardsToShow.findIndex(c => c.id === card.id)
                    const styles = getVariantStyles(themeMode)[card.variant]
                    const isCta = card.variant === 'cta'
                    const isLastPill = pillIdx === visibleCards.length - 1
                    const pillGap = isMiniTray ? 4 : (isMobile ? 8 : 16)

                    // Stagger: pills expand outward from center. Inner pills first.
                    const center = (visibleCards.length - 1) / 2
                    const distFromCenter = Math.abs(pillIdx - center)
                    const staggerDelay = distFromCenter * 0.055 // 55ms per step from center

                    // Per-morph-style spring + delay
                    const useBouncy = morphStyle === 2 || morphStyle === 4
                    const useStagger = morphStyle === 1 || morphStyle === 4
                    const useOvershoot = morphStyle === 3 || morphStyle === 4
                    const baseSpring = useBouncy ? ctaEntranceSpring : signatureSpring
                    const delay = useStagger && !isMiniTray ? staggerDelay : 0
                    // Height + width get underdamped springs for visible elastic overshoot
                    const overshootSpring = { type: 'spring' as const, stiffness: 400, damping: 22, mass: 0.7 }
                    const pillTransition = reduced ? { duration: 0.01 } : {
                      ...baseSpring,
                      delay,
                      height: { ...(useOvershoot ? overshootSpring : baseSpring), delay },
                      width: { ...(useOvershoot ? { ...overshootSpring, damping: 26 } : baseSpring), delay },
                    }

                    // Mini tray pill colors (from Figma)
                    const miniColors: Record<string, string> = {
                      blue: colorTokens.brandSquarespace,
                      white: colorTokens.ink800,
                      red: colorTokens.redBrand,
                      cta: isOverDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.36)',
                    }

                    // CTA colors adapt when scrolling over dark video section
                    const ctaTextColor = isOverDark ? 'rgba(255,255,255,0.7)' : '#8E8E8E'
                    const ctaBorderColor = isOverDark ? 'rgba(255,255,255,0.4)' : styles.border
                    const ctaBg = isOverDark ? 'rgba(255,255,255,0.08)' : styles.bg

                    return (
                      <motion.div
                        key={card.id}
                        ref={(el) => { compactCardRefs.current.set(card.id, el) }}
                        data-cursor={isMiniTray ? undefined : 'morph-only'}
                        data-cursor-radius={isMiniTray ? undefined : '44'}
                        className={`relative ${isMiniTray ? '' : 'cursor-pointer'}`}
                        style={{
                          position: 'relative',
                          overflow: 'visible',
                          // No flex shorthand — width is animated explicitly by Framer Motion
                          flexShrink: 0,
                          flexGrow: 0,
                          display: 'flex',
                          alignItems: 'center',
                          // Magnetic parallax: pills lead ahead of container (floating layer)
                          x: pillMagX,
                          y: pillMagY,
                          backdropFilter: (!isMiniTray && isCta) ? 'blur(8px)' : undefined,
                          WebkitBackdropFilter: (!isMiniTray && isCta) ? 'blur(8px)' : undefined,
                          // Mini pill outer stroke — subtle ring to separate pills from glass container bg.
                          // Uses outline (not border) to avoid layout shift. Not Framer-animated, so safe for transitions.
                          outline: (isMiniTray && !isCta)
                            ? `1px solid ${isOverDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)'}`
                            : '1px solid transparent',
                          outlineOffset: -1,
                          transition: `background-color ${DURATION.slow}s ease, outline-color ${DURATION.fast}s ease`,
                        }}
                        initial={{
                          width: 28,
                          height: 8,
                          borderRadius: 44,
                          backgroundColor: miniColors[card.variant] || miniColors.blue,
                          paddingLeft: 0,
                          paddingRight: 0,
                          marginRight: isLastPill ? 0 : 4,
                        }}
                        animate={{
                          width: isMiniTray ? 28 : expandedPillWidth,
                          height: isMiniTray ? 8 : 48,
                          borderRadius: 44,
                          backgroundColor: isMiniTray
                            ? miniColors[card.variant] || miniColors.blue
                            : (isCta ? ctaBg : styles.bg),
                          paddingLeft: isMiniTray ? 0 : 25,
                          paddingRight: isMiniTray ? 0 : 19,
                          marginRight: isLastPill ? 0 : pillGap,
                        }}
                        transition={pillTransition}
                        whileHover={reduced ? undefined : (isMiniTray ? {} : { scale: 1.02 })}
                        whileTap={reduced ? undefined : (isMiniTray ? {} : { scale: 0.97 })}
                        onMouseMove={(e) => {
                          if (isMiniTray) return
                          const el = e.currentTarget
                          const rect = el.getBoundingClientRect()
                          el.style.setProperty('--spot-x', `${((e.clientX - rect.left) / rect.width * 100).toFixed(1)}%`)
                          el.style.setProperty('--spot-y', `${((e.clientY - rect.top) / rect.height * 100).toFixed(1)}%`)
                          el.style.setProperty('--spot-opacity', '1')
                        }}
                        onMouseLeave={(e) => {
                          if (isMiniTray) return
                          e.currentTarget.style.setProperty('--spot-opacity', '0')
                        }}
                        onClick={(e) => {
                          if (isMiniTray) return // mini tray click is handled on container
                          e.stopPropagation()
                          captureCompactPositionsAndExpand(cardIndex)
                        }}
                      >
                        {/* Non-CTA border — only when expanded */}
                        {!isCta && (
                          <motion.div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              borderRadius: 'inherit',
                              border: `1px solid ${styles.border}`,
                              pointerEvents: 'none',
                            }}
                            animate={{ opacity: isMiniTray ? 0 : 1 }}
                            transition={reduced ? { duration: 0.01 } : { duration: 0.15 }}
                          />
                        )}

                        {/* CTA dashed border — only visible when expanded */}
                        {isCta && !isMiniTray && (
                          <motion.svg
                            className="absolute pointer-events-none"
                            style={{ inset: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'visible' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={reduced ? { duration: 0.01 } : { delay: 0.1, duration: 0.2 }}
                          >
                            <rect
                              x="0" y="0" width="100%" height="100%"
                              rx="24" ry="24"
                              fill="none"
                              stroke={ctaBorderColor}
                              strokeWidth="2.5"
                              strokeDasharray="12 8"
                              strokeLinecap="round"
                              style={{ transition: `stroke ${DURATION.slow}s ease` }}
                            />
                          </motion.svg>
                        )}

                        {/* CTA mini tray dashed border — only visible in mini state */}
                        {isCta && isMiniTray && (
                          <svg
                            className="absolute pointer-events-none"
                            style={{ inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
                          >
                            <rect
                              x="0" y="0" width="100%" height="100%"
                              rx="4" ry="4"
                              fill="none"
                              stroke={isOverDark ? 'rgba(255,255,255,0.4)' : '#cacaca'}
                              strokeWidth="1.5"
                              strokeDasharray="3 2.5"
                              strokeLinecap="round"
                              style={{ transition: `stroke ${DURATION.slow}s ease` }}
                            />
                          </svg>
                        )}

                        {/* Spotlight hover effects — only when expanded */}
                        {!isMiniTray && <div className="compact-pill-spot" />}
                        {!isMiniTray && !isCta && <div className="compact-pill-border-spot" />}

                        {/* Label text — fades in behind the pill morph */}
                        <motion.span
                          data-cursor-parallax=""
                          className="flex-1 truncate font-inter"
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            fontWeight: 500,
                            fontSize: '16px',
                            letterSpacing: '-0.01em',
                            lineHeight: '22px',
                            color: isCta ? ctaTextColor : '#FFFFFF',
                            transition: isCta ? `color ${DURATION.slow}s ease` : undefined,
                            whiteSpace: 'nowrap',
                            pointerEvents: isMiniTray ? 'none' : 'auto',
                          }}
                          // Start hidden when remounting to prevent label flash
                          {...(justClosedFromCompact.current && {
                            initial: { opacity: 0 },
                          })}
                          animate={{
                            opacity: isMiniTray ? 0 : 1,
                          }}
                          transition={reduced ? { duration: 0.01 } : {
                            opacity: {
                              duration: isMiniTray ? 0.1 : 0.25,
                              delay: isMiniTray ? 0 : 0.08,
                              ease: 'easeInOut',
                            },
                          }}
                        >
                          {card.compactLabel || card.label}
                        </motion.span>

                        {/* Shortcut badge — fades in behind pill morph */}
                        <motion.div
                          style={{
                            pointerEvents: isMiniTray ? 'none' : 'auto',
                            position: 'relative',
                            zIndex: 1,
                          }}
                          // Start hidden when remounting to prevent badge flash
                          {...(justClosedFromCompact.current && {
                            initial: { opacity: 0 },
                          })}
                          animate={{
                            opacity: isMiniTray ? 0 : 1,
                          }}
                          transition={reduced ? { duration: 0.01 } : {
                            opacity: {
                              duration: isMiniTray ? 0.1 : 0.25,
                              delay: isMiniTray ? 0 : 0.08,
                              ease: 'easeInOut',
                            },
                          }}
                        >
                          {isCta ? (
                            <div
                              className="flex items-center justify-center shrink-0 rounded-full"
                              style={{
                                backgroundColor: isOverDark ? 'rgba(255,255,255,0.15)' : '#DDDDDD',
                                transition: `background-color ${DURATION.slow}s ease`,
                                padding: '4px 8px',
                                minWidth: 18.66,
                                height: 18.66,
                              }}
                            >
                              <span
                                className="text-[12px] uppercase leading-[100%] font-inter"
                                style={{
                                  fontWeight: WEIGHT.medium,
                                  letterSpacing: '0.08em',
                                  color: ctaTextColor,
                                  transition: `color ${DURATION.slow}s ease`,
                                }}
                              >
                                {card.shortcut}
                              </span>
                            </div>
                          ) : (
                            <div
                              className="flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                borderRadius: 20,
                                padding: '4px 8px',
                                minWidth: 18.66,
                                height: 18.66,
                              }}
                            >
                              <span
                                className="text-[12px] uppercase leading-[100%] font-inter"
                                style={{
                                  fontWeight: WEIGHT.medium,
                                  letterSpacing: '0.08em',
                                  color: styles.textColor,
                                }}
                              >
                                {card.shortcut}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
