import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MorphingCard } from './MorphingCard'
import { createPortal } from 'react-dom'
import { CAROUSEL_CONFIG, backdropColors } from '../constants'
import { cards, stackedCardConfigs } from '../data/cards'

// Responsive expanded card dimensions calculator
// Returns viewport-appropriate dimensions for expanded cards
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
    return { width, height, gap }
  }

  // Tablet: scale down if needed
  if (viewportWidth < 1024) {
    const padding = 24
    const maxWidth = Math.min(500, viewportWidth - (padding * 2))
    const maxHeight = viewportHeight - (padding * 2)
    const aspectRatio = 880 / 500
    const height = Math.min(maxWidth * aspectRatio, maxHeight)
    return { width: maxWidth, height, gap: 24 }
  }

  // Desktop: use original fixed dimensions
  return { width: 500, height: 880, gap: 32 }
}

export function TopCards({ cardIndices, themeMode = 'light' }: { cardIndices?: number[], themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted' } = {}) {
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
  // Track which card was expanded when closing (for exit animation)
  const closingCardIndex = React.useRef<number | null>(null)
  // Store exit positions for mobile cards (calculated at close time, before expandedIndex is cleared)
  const [mobileExitPositions, setMobileExitPositions] = React.useState<Map<string, { top: number; left: number; width: number; height: number }>>(new Map())


  // Track email copied toast state
  const [emailCopied, setEmailCopied] = React.useState(false)

  // Store card positions when expanding
  const [cardPositions, setCardPositions] = React.useState<Map<string, DOMRect>>(new Map())

  // Refs to track card elements
  const cardRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map())

  // Ref for horizontal scroll container (mobile)
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)
  // Store scroll position when expanding to restore on collapse
  const savedScrollPosition = React.useRef<number>(0)

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
    setExpandedIndex(index)
  }

  // Track if close has been triggered (to sequence exit positions before clearing expandedIndex)
  const [closeTriggered, setCloseTriggered] = React.useState(false)

  const handleCloseExpanded = () => {
    closingCardIndex.current = expandedIndex

    // Update saved scroll position to the current expanded card's position (for mobile)
    // so that when we collapse, we scroll to where the user navigated to
    if (isMobile && expandedIndex !== null) {
      const regularCardWidth = 243
      const ctaCardWidth = 115
      const gap = 8
      const containerPadding = 12
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375

      // Calculate the scroll position that will be restored
      // For CTA card (index 3), we need to scroll so it's visible at the right edge
      // For regular cards, scroll to show them at the left
      let targetScrollPosition: number
      if (expandedIndex === 3) {
        // CTA card: scroll so it's visible at the right side of viewport
        // CTA absolute position = containerPadding + (3 * (regularCardWidth + gap))
        // We want: ctaAbsoluteLeft - scrollPosition + ctaCardWidth = viewportWidth - containerPadding
        // So: scrollPosition = ctaAbsoluteLeft + ctaCardWidth - viewportWidth + containerPadding
        const ctaAbsoluteLeft = containerPadding + (3 * (regularCardWidth + gap))
        targetScrollPosition = ctaAbsoluteLeft + ctaCardWidth - viewportWidth + containerPadding
      } else {
        targetScrollPosition = expandedIndex * (regularCardWidth + gap)
      }
      savedScrollPosition.current = targetScrollPosition

      // Pre-calculate exit positions for all cards BEFORE clearing expandedIndex
      // Use the actual DOM positions captured at expand time, adjusted for scroll delta
      // This avoids pixel mismatches from mathematical calculations vs DOM layout
      const newExitPositions = new Map<string, { top: number; left: number; width: number; height: number }>()
      const currentScrollPosition = scrollContainerRef.current?.scrollLeft ?? 0
      const scrollDelta = currentScrollPosition - targetScrollPosition

      visibleCards.forEach((card) => {
        const cardIdx = cardsToShow.findIndex((c) => c.id === card.id)
        const isCtaCard = card.variant === 'cta'
        const collapsedPos = cardPositions.get(card.id)

        // Use actual captured DOM positions, adjusted for scroll change
        // The captured left was relative to viewport at capture time (with currentScrollPosition)
        // We need the position relative to viewport at targetScrollPosition
        const fallbackLeft = isCtaCard
          ? containerPadding + (3 * (regularCardWidth + gap))
          : containerPadding + (cardIdx * (regularCardWidth + gap))
        const fallbackWidth = isCtaCard ? ctaCardWidth : regularCardWidth

        // exitLeft = where the card should appear on screen after scroll restoration
        const exitLeft = (collapsedPos?.left ?? fallbackLeft) + scrollDelta
        const exitWidth = collapsedPos?.width ?? fallbackWidth
        const exitHeight = collapsedPos?.height ?? 91

        newExitPositions.set(card.id, {
          top: Math.round(collapsedPos?.top ?? 0),
          left: Math.round(exitLeft),
          width: Math.round(exitWidth),
          height: Math.round(exitHeight),
        })
      })
      setMobileExitPositions(newExitPositions)
      // Trigger close sequence - useEffect will clear expandedIndex after render
      setCloseTriggered(true)
    } else {
      // Desktop: just close immediately
      setIsClosing(true)
      setExpandedIndex(null)
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
          setTimeout(() => setEmailCopied(false), 2000)
        }
        return
      }

      // Number keys 1-4 to open/close/jump between cards
      const keyNum = parseInt(e.key, 10)
      if (keyNum >= 1 && keyNum <= cardsToShow.length) {
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
  }, [expandedIndex, cardsToShow.length])

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

  // Ref for the expanded drag container (for native touch event listeners)
  // Using state to trigger re-render when ref is set, ensuring useEffect runs after mount
  const [dragContainer, setDragContainer] = React.useState<HTMLDivElement | null>(null)

  // Animation frame for smooth velocity decay
  React.useEffect(() => {
    if (expandedIndex === null) {
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

    // If we were dragging at a boundary, apply spring-back impulse
    if (CAROUSEL_CONFIG.enableBoundarySpringBack && boundaryDragState.current.isDraggingAtBoundary && Math.abs(totalDrag) > 5) {
      // Spring impulse in opposite direction, proportional to drag distance
      const springImpulse = -totalDrag * CAROUSEL_CONFIG.springBackMultiplier
      velocityState.current.rawVelocity = springImpulse
      velocityState.current.smoothVelocity = 0
      boundaryDragState.current.isDraggingAtBoundary = false
      return // Don't navigate when springing back
    }

    // Apply momentum from drag velocity
    velocityState.current.rawVelocity += -state.dragVelocity * CAROUSEL_CONFIG.momentumMultiplier

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

      // Check for swipe-down-to-dismiss on mobile
      // Only dismiss if: downward movement, Y dominates X, and past threshold
      if (isMobile && totalDragY > SWIPE_DOWN_THRESHOLD && totalDragY > Math.abs(totalDragX)) {
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
  }, [expandedIndex, cardsToShow.length, dragContainer, isMobile, handleCloseExpanded])

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

  // Track a resize key to force re-render when viewport changes while expanded
  const [resizeKey, setResizeKey] = React.useState(0)

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
      setIsMobile(window.innerWidth < 768)
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
  // Mobile: show top 3 cards, then compact Add Role card last (matches larger breakpoints)
  // Tablet/Desktop: show only top 3 cards (CTA card is separate at bottom for tablet, inline for desktop)
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
    const { width, height, gap } = getExpandedCardDimensions()
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
    }
  }, [expandedIndex, resizeKey])

  // Cards to render in the main row
  // Mobile: compact Add Role card + top 3 cards
  // Tablet: only top 3 cards (CTA card is in fixed bottom position)
  // Desktop: top 3 cards + full CTA card inline
  const visibleCards = isMobile ? mobileCards : (isDesktop && ctaCard ? [...topThreeCards, ctaCard] : topThreeCards)

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
      <div className={isSplitMode ? "top-padding-responsive" : "horizontal-padding-responsive top-padding-responsive"} style={{ overflow: 'visible' }}>
        <div className="mx-auto" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
          {/* Cards row */}
          <div
            ref={scrollContainerRef}
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
                themeMode={themeMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expanded overlay - rendered in portal to escape stacking context */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence onExitComplete={() => {
            // Restore scroll position before showing cards to prevent shift
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollLeft = savedScrollPosition.current
            }
            closingCardIndex.current = null
            setIsClosing(false)
          }}>
          {isExpanded && (
            <>
              {/* Backdrop - samples bg color from focused card, smoothly transitions */}
              <motion.div
                className="fixed inset-0"
                style={{ zIndex: 9998, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                initial={{ opacity: 0, backgroundColor: backdropColors[themeMode === 'dark' || themeMode === 'darkInverted' ? 'dark' : 'light'][cardsToShow[expandedIndex!]?.variant || 'cta'] }}
                animate={{
                  opacity: 1,
                  backgroundColor: backdropColors[themeMode === 'dark' || themeMode === 'darkInverted' ? 'dark' : 'light'][cardsToShow[expandedIndex!]?.variant || 'cta'],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 0.2 },
                  backgroundColor: { duration: 0.5, ease: 'easeInOut' },
                }}
              />

              {/* Expanded cards - wrapped in drag container */}
              <div
                ref={setDragContainer}
                className="fixed inset-0 cursor-grab active:cursor-grabbing"
                style={{ zIndex: 9999, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
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
                  const isMobileCtaCard = isMobile && card.variant === 'cta'
                  const cardIndex = cardsToShow.findIndex((c) => c.id === card.id)
                  const collapsedPos = getCollapsedPosition(card.id)

                  // Get mobile exit position from pre-calculated values (stored in handleCloseExpanded)
                  // This ensures stable exit positions that don't change during the animation
                  const mobileExitPos = isMobile ? mobileExitPositions.get(card.id) : undefined
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
                    const { width, height } = getExpandedCardDimensions()
                    expandedPos = {
                      x: ctaPos.x + config.offsetX,
                      y: ctaPos.y + config.offsetY + 25,
                      width,
                      height,
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
                      onHighlightClick={(label) => console.log('Highlight clicked:', label)}
                      hideShortcut={isMobile}
                      compactCta={isMobileCtaCard}
                      mobileLabel={isMobileCtaCard ? 'ADD ROLE' : undefined}
                      emailCopied={emailCopied}
                      themeMode={themeMode}
                      parallaxOffset={cardParallaxOffset}
                      stackedRotation={stackedRotation}
                      stackedScale={stackedScale}
                      zIndexOverride={zIndexOverride}
                      useBouncyTransition={useBouncyTransition}
                    />
                  )
                })}
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
