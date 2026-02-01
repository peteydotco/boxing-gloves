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
  heroBgColor?: string
  activeStageIndex?: number
  isBlade0Hovered?: boolean
  onNavHoverChange?: (isHovered: boolean) => void
}

// Stage description card colors - matches Stage.tsx stageSurface
const stageDescriptionCardColors: Record<number, string> = {
  0: '#E9D7DA', // MasterClass - blush/salmon
  1: '#E9D7DA', // Placeholder - same as MasterClass for now
  2: '#E9D7DA', // Placeholder
  3: '#E9D7DA', // Placeholder
}

export function PersistentNav({
  viewMode,
  transitionPhase,
  onNavigateToHero,
  onNavigateToStages,
  onLogoClick,
  isZoomedNav = false,
  heroBgColor = '#FFFFFF',
  activeStageIndex = 0,
  isBlade0Hovered = false,
  onNavHoverChange,
}: PersistentNavProps) {
  const { frontBladePeek } = bladeStackConfig

  // Refs to measure nav item dimensions (for width/height only)
  const selectedWorksRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)

  // Track hover states manually to prevent stuck hover during transitions
  const [hoveredItem, setHoveredItem] = useState<'selectedWorks' | 'logo' | 'about' | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle nav item hover with delayed reset
  // This prevents blade 0 from losing its hover state when mouse moves from nav item back to blade surface
  const handleNavItemHover = (item: 'selectedWorks' | 'logo' | 'about' | null) => {
    // Clear any pending timeout when entering a new item
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    if (item !== null) {
      // Entering a nav item - set immediately
      setHoveredItem(item)
    } else {
      // Leaving a nav item - delay the reset to allow blade's onHoverStart to fire
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredItem(null)
        hoverTimeoutRef.current = null
      }, 100) // 100ms delay gives time for blade hover to register
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Track nav item dimensions and window size together for consistent positioning
  const [measurements, setMeasurements] = useState<{
    selectedWorks: { width: number; height: number }
    logo: { width: number; height: number }
    viewport: { width: number; height: number }
  }>({
    selectedWorks: { width: 0, height: 0 },
    logo: { width: 0, height: 0 },
    viewport: { width: 0, height: 0 },
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

  // Notify parent when nav items are hovered (only in hero mode)
  useEffect(() => {
    const isNavHoveredInHero = hoveredItem !== null && !isInStages
    onNavHoverChange?.(isNavHoveredInHero)
  }, [hoveredItem, isInStages, onNavHoverChange])

  // Measure nav item dimensions and viewport
  useEffect(() => {
    const measure = () => {
      if (selectedWorksRef.current && logoRef.current) {
        setMeasurements({
          selectedWorks: {
            width: selectedWorksRef.current.offsetWidth,
            height: selectedWorksRef.current.offsetHeight,
          },
          logo: {
            width: logoRef.current.offsetWidth,
            height: logoRef.current.offsetHeight,
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        })
      }
    }

    // Wait for fonts to load before measuring
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure)
    } else {
      // Fallback: measure after a brief delay
      requestAnimationFrame(measure)
    }

    // Re-measure on resize
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Determine nav text/border color based on view mode
  // - Hero view: sample hero bg color (must contrast with dark blade surface)
  // - Stages view: sample description card bg color for current stage
  //
  // In dark themes, the hero bg is near-black — same as the blade surface,
  // making nav text invisible. Detect dark hero bg and flip to white.
  const getNavColor = () => {
    if (isInStages || isExpanding) {
      return stageDescriptionCardColors[activeStageIndex] || '#E9D7DA'
    }
    // Parse heroBgColor luminance: if dark, use white to contrast with dark blade
    const hex = heroBgColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5 ? '#FFFFFF' : heroBgColor
  }

  const navColor = getNavColor()

  // Text styling for nav links - uses GT Pressura (same as card titles) at 24px
  const linkTextStyle: React.CSSProperties = {
    fontFamily: 'GT Pressura, sans-serif',
    fontSize: '24px',
    fontWeight: 400,
    letterSpacing: '-0.3px',
    textTransform: 'uppercase',
    color: navColor,
    cursor: 'pointer',
    transition: 'color 0.3s ease',
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

  // Hover offset - nav items slide up when blade 0 is hovered (matches blade hover offset)
  // Also apply offset when hovering nav items themselves (they're on blade 0)
  const bladeHoverOffset = 3 // Matches StageBackground whileHover y offset
  const isNavHovered = hoveredItem !== null && !isInStages // Only in hero mode
  const shouldApplyHoverOffset = isBlade0Hovered || isNavHovered

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
      return { width: 1000, height: 800, top: 124, left: 24 }
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
    const dims = activeNavItem === 'selectedWorks' ? measurements.selectedWorks : measurements.logo
    const { viewport } = measurements

    if (activeNavItem === 'selectedWorks') {
      // SELECTED WORKS position: left 13.7% with x transform
      // In expanded state: top 24, x = -expandedSpreadAmount
      // The element's left edge is at 13.7% of viewport, then shifted by x transform
      const baseLeft = viewport.width * 0.137

      if (isZoomedNav) {
        // Zoomed state: positioned at stage left + 40
        return {
          left: zoomDimensions.left + 40,
          top: zoomedNavPos.top,
          width: dims.width,
          height: dims.height,
        }
      }

      // Apply hover offset when blade 0 is hovered (idle state only)
      const hoverOffset = !isExpanded && shouldApplyHoverOffset ? bladeHoverOffset : 0
      return {
        left: baseLeft + (isExpanded ? -expandedSpreadAmount : 0),
        top: isExpanded ? 24 : (viewport.height - frontBladePeek / 2 - dims.height / 2 - hoverOffset),
        width: dims.width,
        height: dims.height,
      }
    } else {
      // PETEY.CO logo position: centered at 50%
      if (isZoomedNav) {
        return {
          left: viewport.width / 2 - dims.width / 2,
          top: zoomedNavPos.top,
          width: dims.width,
          height: dims.height,
        }
      }

      // Apply hover offset when blade 0 is hovered (idle state only)
      const hoverOffset = !isExpanded && shouldApplyHoverOffset ? bladeHoverOffset : 0
      return {
        left: viewport.width / 2 - dims.width / 2,
        top: isExpanded ? 24 : (viewport.height - frontBladePeek / 2 - dims.height / 2 - hoverOffset),
        width: dims.width,
        height: dims.height,
      }
    }
  }

  const borderPosition = getBorderPosition()

  // Only show border once all measurements are ready to prevent positioning issues
  const hasMeasuredDimensions = measurements.logo.width > 0 && measurements.selectedWorks.width > 0 && measurements.viewport.width > 0

  // Border width constant - used to offset position since border draws outside content
  const borderWidth = 3

  // Border hover expansion - grows when active nav item is hovered
  const borderHoverExpansion = 2 // px to expand on each side
  const isActiveBorderHovered = (activeNavItem === 'selectedWorks' && hoveredItem === 'selectedWorks') ||
                                 (activeNavItem === 'logo' && hoveredItem === 'logo')

  return (
    <>
      {/* Sliding active border - moves between nav items */}
      {/* Only render after measurements are ready to prevent animation from 0,0 */}
      {hasMeasuredDimensions && (
        <motion.div
          className="fixed z-[59] pointer-events-none"
          style={{
            border: `${borderWidth}px solid ${navColor}`,
            borderRadius: 14,
            transition: 'border-color 0.3s ease',
          }}
          initial={{
            left: borderPosition.left,
            top: borderPosition.top,
            width: borderPosition.width,
            height: borderPosition.height,
          }}
          animate={{
            // When hovered, expand border outward (grow size and offset position)
            left: borderPosition.left - (isActiveBorderHovered ? borderHoverExpansion : 0),
            top: borderPosition.top - (isActiveBorderHovered ? borderHoverExpansion : 0),
            width: borderPosition.width + (isActiveBorderHovered ? borderHoverExpansion * 2 : 0),
            height: borderPosition.height + (isActiveBorderHovered ? borderHoverExpansion * 2 : 0),
          }}
          transition={isActiveBorderHovered ? { type: 'spring', stiffness: 400, damping: 25 } : getNavTransition()}
        />
      )}

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
          // In idle state: center vertically (-50%) plus hover offset when blade 0 is hovered
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : `calc(-50% - ${shouldApplyHoverOffset ? bladeHoverOffset : 0}px)`),
          scale: 1,
        }}
        transition={shouldApplyHoverOffset && getNavAnimate() !== 'expanded' ? { type: 'spring', stiffness: 400, damping: 30 } : getNavTransition()}
        onClick={!isZoomedNav ? handleLeftClick : undefined}
      >
        {/* Container with invisible border for spacing (real border is the sliding one) */}
        <motion.div
          ref={selectedWorksRef}
          style={{
            borderRadius: 14,
            padding: '5px 8px 8px 8px',
          }}
          animate={{
            backgroundColor: (!isZoomedNav && hoveredItem === 'selectedWorks' && activeNavItem !== 'selectedWorks')
              ? `${navColor}33` // 20% opacity
              : `${navColor}00`, // transparent
            scale: (!isZoomedNav && hoveredItem === 'selectedWorks' && activeNavItem !== 'selectedWorks') ? 1.04 : 1,
          }}
          initial={{ backgroundColor: `${navColor}00`, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onMouseEnter={() => handleNavItemHover('selectedWorks')}
          onMouseLeave={() => handleNavItemHover(null)}
        >
          <motion.span
            style={{ ...linkTextStyle, display: 'block', lineHeight: 1 }}
            animate={{
              scale: (!isZoomedNav && hoveredItem === 'selectedWorks' && activeNavItem !== 'selectedWorks') ? 1 / 1.04 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            SELECTED WORKS
          </motion.span>
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
          // In idle state: center vertically (-50%) plus hover offset when blade 0 is hovered
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : `calc(-50% - ${shouldApplyHoverOffset ? bladeHoverOffset : 0}px)`),
          scale: 1, // No scaling needed - stage resizes, content reflows
        }}
        transition={shouldApplyHoverOffset && getNavAnimate() !== 'expanded' ? { type: 'spring', stiffness: 400, damping: 30 } : getNavTransition()}
        onClick={!isZoomedNav ? onLogoClick : undefined}
      >
        {/* Container measured for sliding border dimensions */}
        <motion.div
          ref={logoRef}
          style={{
            borderRadius: 14,
            padding: '5px 8px 8px 8px',
          }}
          animate={{
            backgroundColor: (!isZoomedNav && hoveredItem === 'logo' && activeNavItem !== 'logo')
              ? `${navColor}33` // 20% opacity
              : `${navColor}00`, // transparent
            scale: (!isZoomedNav && hoveredItem === 'logo' && activeNavItem !== 'logo') ? 1.04 : 1,
          }}
          initial={{ backgroundColor: `${navColor}00`, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onMouseEnter={() => handleNavItemHover('logo')}
          onMouseLeave={() => handleNavItemHover(null)}
        >
          <motion.span
            style={{
              ...linkTextStyle,
              fontSize: '26px',
              fontWeight: 500, // Pressura Medium
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
            animate={{
              scale: (!isZoomedNav && hoveredItem === 'logo' && activeNavItem !== 'logo') ? 1 / 1.04 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            PETEY.CO
          </motion.span>
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
          // In idle state: center vertically (-50%) plus hover offset when blade 0 is hovered
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : `calc(-50% - ${shouldApplyHoverOffset ? bladeHoverOffset : 0}px)`),
          scale: 1,
        }}
        transition={shouldApplyHoverOffset && getNavAnimate() !== 'expanded' ? { type: 'spring', stiffness: 400, damping: 30 } : getNavTransition()}
        onClick={!isZoomedNav ? handleRightClick : undefined}
      >
        {/* Container with invisible border for spacing (sliding border will target this when About is active) */}
        <motion.div
          ref={aboutRef}
          style={{
            borderRadius: 14,
            padding: '5px 8px 8px 8px',
          }}
          animate={{
            backgroundColor: (!isZoomedNav && hoveredItem === 'about')
              ? `${navColor}33` // 20% opacity
              : `${navColor}00`, // transparent
            scale: (!isZoomedNav && hoveredItem === 'about') ? 1.04 : 1,
          }}
          initial={{ backgroundColor: `${navColor}00`, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onMouseEnter={() => handleNavItemHover('about')}
          onMouseLeave={() => handleNavItemHover(null)}
        >
          <motion.span
            style={{ ...linkTextStyle, display: 'block', lineHeight: 1 }}
            animate={{
              scale: (!isZoomedNav && hoveredItem === 'about') ? 1 / 1.04 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            UNSELECTED WORKS
          </motion.span>
        </motion.div>
      </motion.div>
    </>
  )
}
