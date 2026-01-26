import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { bladeStackConfig } from '../data/stages'

type ViewMode = 'hero' | 'stages'
type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'

interface PersistentNavProps {
  viewMode: ViewMode
  transitionPhase: TransitionPhase
  onNavigateToHero: () => void
  onNavigateToStages: () => void
  onLogoClick: () => void
  isZoomedNav?: boolean
}

// Nav item dimensions for the sliding border
interface NavItemRect {
  left: number
  top: number
  width: number
  height: number
}

export function PersistentNav({
  viewMode,
  transitionPhase,
  onNavigateToHero,
  onNavigateToStages,
  onLogoClick,
  isZoomedNav = false,
}: PersistentNavProps) {
  const { frontBladePeek } = bladeStackConfig

  // Refs to measure nav item dimensions (for width/height only)
  const selectedWorksRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)

  // Track hover states manually to prevent stuck hover during transitions
  const [hoveredItem, setHoveredItem] = useState<'selectedWorks' | 'logo' | 'about' | null>(null)

  // Track nav item dimensions (not positions - positions are calculated)
  const [itemDimensions, setItemDimensions] = useState<{
    selectedWorks: { width: number; height: number }
    logo: { width: number; height: number }
  }>({
    selectedWorks: { width: 0, height: 0 },
    logo: { width: 0, height: 0 },
  })

  // Determine which nav item is active
  // IMPORTANT: Border should move simultaneously with nav items during transitions
  // - Expanding: move to selectedWorks immediately when expansion starts
  // - Collapsing: move to logo immediately when collapse starts (don't wait for viewMode change)
  // - Zoomed nav: move to logo (PETEY.CO becomes selected in zoomed view)
  const isInStages = viewMode === 'stages'
  const isExpanding = transitionPhase === 'expanding'
  const isCollapsing = transitionPhase === 'collapsing'

  // When zoomed nav or collapsing, border moves to logo (PETEY.CO)
  // When expanding or in stages (not zoomed), border is on selectedWorks
  const activeNavItem = (isZoomedNav || isCollapsing) ? 'logo' : ((isInStages || isExpanding) ? 'selectedWorks' : 'logo')

  // Clear hover state when transitions happen to prevent stuck hover UI
  useEffect(() => {
    setHoveredItem(null)
  }, [isZoomedNav, transitionPhase, viewMode])

  // Measure nav item dimensions on mount and resize
  useEffect(() => {
    const measureDimensions = () => {
      if (selectedWorksRef.current && logoRef.current) {
        setItemDimensions({
          selectedWorks: {
            width: selectedWorksRef.current.offsetWidth,
            height: selectedWorksRef.current.offsetHeight,
          },
          logo: {
            width: logoRef.current.offsetWidth,
            height: logoRef.current.offsetHeight,
          },
        })
      }
    }

    // Initial measurement
    measureDimensions()

    // Re-measure on resize
    window.addEventListener('resize', measureDimensions)
    return () => window.removeEventListener('resize', measureDimensions)
  }, [])

  // Text styling for nav links - uses GT Pressura (same as card titles) at 24px
  const linkTextStyle: React.CSSProperties = {
    fontFamily: 'GT Pressura, sans-serif',
    fontSize: '24px',
    fontWeight: 400,
    letterSpacing: '-0.3px',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  }

  // Nav transition matches blade 0 timing for harmonious movement
  // - Expanding: snappy spring with 40ms delay
  // - Collapsing: smooth ease-out for precise settling (no bounce)
  const getNavTransition = () => isExpanding
    ? {
        type: 'spring' as const,
        stiffness: 300,
        damping: 35,
        mass: 1,
        delay: 0.04,
      }
    : {
        type: 'tween' as const,
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1] as const, // Custom ease-out curve
        delay: 0,
      }

  // Handle link clicks based on current view
  const handleLeftClick = () => {
    if (isInStages) {
      onNavigateToHero()
    } else {
      onNavigateToStages()
    }
  }

  const handleRightClick = () => {
    // TODO: Navigate to About section
    console.log('About Petey clicked')
  }

  // Calculate the center Y position of the front blade peek from the TOP of the viewport
  // Front blade peeks 88px from the bottom
  // Center of visible peek from bottom = 44px
  // Center of peek from top = 100vh - 44px = calc(100vh - 44px)
  const navIdleTop = `calc(100vh - ${frontBladePeek / 2}px)` // calc(100vh - 44px)

  // Horizontal positioning:
  // - Idle (on blade): Links stay at proportional position within blade (~13.7% from edge)
  // - Expanded (fullscreen): Links spread outward to double the stage's padding (40px * 2 = 80px)
  //
  // Use x transform for horizontal movement to avoid interpolation issues between % and px
  // Calculate how much to shift: we want to end up at 80px from edge
  // Current position is 13.7% from edge, which varies with viewport width
  // At 1605px viewport: 13.7% = ~220px, so shift = 220 - 80 = 140px outward
  // We'll use a reasonable fixed shift that works across common viewport sizes
  const expandedSpreadAmount = 140 // Shift outward to align with ~80px from edge at typical viewport

  // Determine which variant to animate to
  // - expanding: animate to expanded
  // - in stages view: stay expanded
  // - collapsing or hero idle: animate to idle
  const getNavAnimate = () => {
    if (isExpanding || isInStages) return 'expanded'
    return 'idle'
  }

  // Calculate zoomed stage dimensions (matches StagesContainer)
  const getZoomDimensions = () => {
    if (typeof window === 'undefined') {
      return { width: window?.innerWidth || 1000, height: window?.innerHeight || 800, top: 124, left: 24 }
    }

    const horizontalPadding = 48 // 24px * 2 (TopCards container padding)
    const topCardsHeight = 76 // Collapsed card height
    const topPadding = 24 // TopCards top padding
    const gapBelowTopCards = 24 // Equal spacing between TopCards and stage

    const zoomedTop = topPadding + topCardsHeight + gapBelowTopCards // 124px from top

    return {
      top: zoomedTop,
      left: horizontalPadding / 2, // 24px from left
    }
  }

  const zoomDimensions = getZoomDimensions()

  // When zoomed, nav items position relative to the zoomed stage container
  // The stage container is positioned at (left: 24, top: 124)
  // Nav items should be at their normal positions within that container
  // Normal expanded position: top 24px from stage top, left/right positions relative to stage width

  // Calculate zoomed positions for each nav item
  // In zoomed state, items are positioned relative to viewport but need to align with zoomed stage
  const getZoomedNavPosition = () => {
    if (typeof window === 'undefined') return { leftX: 0, rightX: 0, top: 124 }

    // Nav top position: stage top (124px) + nav padding within stage (24px)
    const navTop = zoomDimensions.top + 24

    // Stage left edge is at 24px, so nav items need to be offset from that
    // Left nav: 24px (stage left) + some internal padding
    // Right nav: viewport - 24px (stage right) - some internal padding
    // For now, just use fixed padding from stage edges

    return { top: navTop }
  }

  const zoomedNavPos = getZoomedNavPosition()

  // Calculate border position based on active nav item
  // This mirrors the nav item positioning logic so border animates with them
  const getBorderPosition = () => {
    const isExpanded = getNavAnimate() === 'expanded'
    const dims = activeNavItem === 'selectedWorks' ? itemDimensions.selectedWorks : itemDimensions.logo

    if (activeNavItem === 'selectedWorks') {
      // SELECTED WORKS position: left 13.7% with x transform
      // In expanded state: top 24, x = -expandedSpreadAmount
      // The element's left edge is at 13.7% of viewport, then shifted by x transform
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000
      const baseLeft = viewportWidth * 0.137

      if (isZoomedNav) {
        // Zoomed state: positioned at stage left + 40
        return {
          left: zoomDimensions.left + 40,
          top: zoomedNavPos.top,
          width: dims.width,
          height: dims.height,
        }
      }

      return {
        left: baseLeft + (isExpanded ? -expandedSpreadAmount : 0),
        top: isExpanded ? 24 : (typeof window !== 'undefined' ? window.innerHeight - frontBladePeek / 2 - dims.height / 2 : 0),
        width: dims.width,
        height: dims.height,
      }
    } else {
      // PETEY.CO logo position: centered at 50%
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000

      if (isZoomedNav) {
        return {
          left: viewportWidth / 2 - dims.width / 2,
          top: zoomedNavPos.top,
          width: dims.width,
          height: dims.height,
        }
      }

      return {
        left: viewportWidth / 2 - dims.width / 2,
        top: isExpanded ? 24 : (typeof window !== 'undefined' ? window.innerHeight - frontBladePeek / 2 - dims.height / 2 : 0),
        width: dims.width,
        height: dims.height,
      }
    }
  }

  const borderPosition = getBorderPosition()

  return (
    <>
      {/* Sliding active border - moves between nav items */}
      <motion.div
        className="fixed z-[59] pointer-events-none"
        style={{
          border: '3px solid rgba(255, 255, 255, 0.8)',
          borderRadius: 14,
        }}
        animate={{
          left: borderPosition.left,
          top: borderPosition.top,
          width: borderPosition.width,
          height: borderPosition.height,
        }}
        transition={getNavTransition()}
      />

      {/* Left link - SELECTED WORKS */}
      <motion.div
        className="fixed z-[60]"
        style={{
          transformOrigin: 'left center',
          cursor: !isZoomedNav ? 'pointer' : 'default',
        }}
        initial={{
          top: navIdleTop,
          left: '13.7%',
          x: 0,
          y: '-50%',
          scale: 1,
        }}
        animate={{
          top: isZoomedNav ? zoomedNavPos.top : (getNavAnimate() === 'expanded' ? 24 : navIdleTop),
          // Keep left at 13.7% always for smooth interpolation, use x for all horizontal movement
          left: '13.7%',
          // In zoomed: calculate x offset to position at stage left + 40px
          // 13.7% of viewport - expandedSpread = expanded position
          // We need x offset to land at zoomDimensions.left + 40
          x: isZoomedNav
            ? (zoomDimensions.left + 40) - (typeof window !== 'undefined' ? window.innerWidth * 0.137 : 0)
            : (getNavAnimate() === 'expanded' ? -expandedSpreadAmount : 0),
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : '-50%'),
          scale: 1,
        }}
        transition={getNavTransition()}
        onClick={!isZoomedNav ? handleLeftClick : undefined}
      >
        {/* Container with invisible border for spacing (real border is the sliding one) */}
        <motion.div
          ref={selectedWorksRef}
          style={{
            borderRadius: 14,
            padding: '5px 7px 6px 7px',
          }}
          animate={{
            borderColor: (!isZoomedNav && !isInStages && hoveredItem === 'selectedWorks')
              ? 'rgba(255, 255, 255, 0.5)'
              : 'rgba(255, 255, 255, 0)',
          }}
          initial={{ borderColor: 'rgba(255, 255, 255, 0)' }}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => setHoveredItem('selectedWorks')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span style={{ ...linkTextStyle, display: 'block', lineHeight: 1, border: '3px solid transparent' }}>
            SELECTED WORKS
          </span>
        </motion.div>
      </motion.div>

      {/* Center logo - text version with border, stays centered, only moves vertically */}
      <motion.div
        className="fixed z-[60]"
        style={{
          transformOrigin: 'center center',
          cursor: !isZoomedNav ? 'pointer' : 'default',
        }}
        initial={{
          top: navIdleTop,
          left: '50%',
          x: '-50%',
          y: '-50%',
          scale: 1,
        }}
        animate={{
          top: isZoomedNav ? zoomedNavPos.top : (getNavAnimate() === 'expanded' ? 24 : navIdleTop),
          left: '50%',
          x: '-50%',
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : '-50%'),
          scale: 1, // No scaling needed - stage resizes, content reflows
        }}
        transition={getNavTransition()}
        onClick={!isZoomedNav ? onLogoClick : undefined}
      >
        {/* Container with invisible border for spacing (real border is the sliding one) */}
        <motion.div
          ref={logoRef}
          style={{
            borderRadius: 14,
            padding: '5px 7px 6px 7px',
          }}
          animate={{
            borderColor: (!isZoomedNav && isInStages && !isExpanding && hoveredItem === 'logo')
              ? 'rgba(255, 255, 255, 0.5)'
              : 'rgba(255, 255, 255, 0)',
          }}
          initial={{ borderColor: 'rgba(255, 255, 255, 0)' }}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => setHoveredItem('logo')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span
            style={{
              ...linkTextStyle,
              fontWeight: 500, // Pressura Medium
              letterSpacing: '-0.02em',
              display: 'block',
              lineHeight: 1,
              border: '3px solid transparent',
            }}
          >
            PETEY.CO
          </span>
        </motion.div>
      </motion.div>

      {/* Right link - MORE ABOUT ME */}
      <motion.div
        className="fixed z-[60]"
        style={{
          transformOrigin: 'right center',
          cursor: !isZoomedNav ? 'pointer' : 'default',
        }}
        initial={{
          top: navIdleTop,
          right: '13.7%',
          x: 0,
          y: '-50%',
          scale: 1,
        }}
        animate={{
          top: isZoomedNav ? zoomedNavPos.top : (getNavAnimate() === 'expanded' ? 24 : navIdleTop),
          // Keep right at 13.7% always for smooth interpolation, use x for all horizontal movement
          right: '13.7%',
          // In zoomed: calculate x offset to position at viewport right - stage right - 40px
          // right: 13.7% means element's right edge is at 13.7% from viewport right
          // We need x offset to land at zoomDimensions.left + 40 from viewport right
          // Since right positioning works opposite to left, positive x moves LEFT
          x: isZoomedNav
            ? (typeof window !== 'undefined' ? window.innerWidth * 0.137 : 0) - (zoomDimensions.left + 40)
            : (getNavAnimate() === 'expanded' ? expandedSpreadAmount : 0),
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : '-50%'),
          scale: 1,
        }}
        transition={getNavTransition()}
        onClick={!isZoomedNav ? handleRightClick : undefined}
      >
        {/* Container with invisible border for spacing (sliding border will target this when About is active) */}
        <motion.div
          ref={aboutRef}
          style={{
            borderRadius: 14,
            padding: '5px 7px 6px 7px',
          }}
          animate={{
            borderColor: (!isZoomedNav && hoveredItem === 'about')
              ? 'rgba(255, 255, 255, 0.5)'
              : 'rgba(255, 255, 255, 0)',
          }}
          initial={{ borderColor: 'rgba(255, 255, 255, 0)' }}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => setHoveredItem('about')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <span style={{ ...linkTextStyle, display: 'block', lineHeight: 1, border: '3px solid transparent' }}>
            MORE ABOUT ME
          </span>
        </motion.div>
      </motion.div>
    </>
  )
}
