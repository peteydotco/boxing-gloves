import { motion } from 'framer-motion'
import { PeteLogo } from './PeteLogo'
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

export function PersistentNav({
  viewMode,
  transitionPhase,
  onNavigateToHero,
  onNavigateToStages,
  onLogoClick,
  isZoomedNav = false,
}: PersistentNavProps) {
  const { frontBladePeek } = bladeStackConfig

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

  // Underline styling for stages view
  const underlineStyle: React.CSSProperties = {
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    textDecorationColor: 'rgba(255, 255, 255, 0.3)',
  }

  const isExpanding = transitionPhase === 'expanding'

  // Unified spring transition - Figma's elevated timing
  const getNavTransition = () => ({
    type: 'spring' as const,
    stiffness: 320,
    damping: 40,
    mass: 1,
  })

  // Determine current state
  const isInStages = viewMode === 'stages'

  // Apply underline when in stages or transitioning to stages
  const shouldShowUnderline = isInStages || transitionPhase !== 'idle'

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

  // Calculate zoom transform to match StagesContainer scaling (center origin)
  const getZoomTransform = () => {
    if (typeof window === 'undefined') return { scale: 0.97, yOffset: 0 }

    const horizontalPadding = 48 // 24px * 2 (TopCards container padding)
    const topCardsHeight = 76 // Collapsed card height
    const topPadding = 24 // TopCards top padding
    const gapBelowTopCards = 24 // Equal spacing between TopCards and stage

    // Scale must match TopCards container width exactly
    const scale = (window.innerWidth - horizontalPadding) / window.innerWidth

    // Position the scaled stage so its top edge is at zoomedTop (124px from viewport top)
    // The stage scales from center, so we need to calculate the Y offset
    // Scaled stage top before offset = viewportHeight/2 * (1 - scale)
    // We want it at zoomedTop, so: yOffset = zoomedTop - scaledTopBeforeOffset
    const zoomedTop = topPadding + topCardsHeight + gapBelowTopCards
    const scaledTopBeforeOffset = (window.innerHeight / 2) * (1 - scale)
    const yOffset = zoomedTop - scaledTopBeforeOffset

    return { scale, yOffset }
  }

  const zoomTransform = getZoomTransform()

  // When zoomed, nav items need to stay proportionally positioned within the scaled stage
  // The stage scales from center, which means:
  // - Center X stays at viewport center
  // - Center Y moves by yOffset
  // - All points move toward the center and scale proportionally
  //
  // For a point at (x, y) in the original stage:
  // - New X = centerX + (x - centerX) * scale
  // - New Y = centerY + yOffset + (y - centerY) * scale
  //
  // The nav items are at top: 24px (expanded position)
  // Left link is at left: 13.7% - 140px (expanded x offset)
  // Right link is at right: 13.7% + 140px (expanded x offset)
  // Logo is at left: 50% (centered)

  const getZoomedPosition = (originalTop: number, originalLeftPercent: number, xOffset: number = 0) => {
    if (typeof window === 'undefined') return { top: originalTop, left: originalLeftPercent, xOffset }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    const { scale, yOffset } = zoomTransform

    // Convert percentage left to pixels, then apply x offset
    const originalLeftPx = (originalLeftPercent / 100) * viewportWidth + xOffset

    // Calculate new position after scaling from center
    // X: moves toward horizontal center
    const newLeftPx = centerX + (originalLeftPx - centerX) * scale

    // Y: scales from vertical center, then offset
    const newTop = centerY + yOffset + (originalTop - centerY) * scale

    return {
      left: (newLeftPx / viewportWidth) * 100,
      top: newTop,
      // X offset is now baked into the left percentage
      xOffset: 0,
    }
  }

  // Calculate zoomed positions for each nav item
  // Left link: starts at 13.7% left, moves -140px (left) when expanded
  const leftZoomedPos = getZoomedPosition(24, 13.7, -expandedSpreadAmount)
  // Logo: stays at 50% (center)
  const logoZoomedPos = getZoomedPosition(24, 50, 0)
  // Right link: starts at 86.3% left (100 - 13.7), moves +140px (right) when expanded
  const rightZoomedPos = getZoomedPosition(24, 86.3, expandedSpreadAmount)

  return (
    <>
      {/* Left link - SELECTED WORKS */}
      <motion.span
        className="fixed z-[60]"
        style={{
          ...linkTextStyle,
          ...(shouldShowUnderline ? underlineStyle : {}),
          transformOrigin: 'left center',
        }}
        initial={{
          top: navIdleTop,
          left: '13.7%',
          x: 0,
          y: '-50%',
          scale: 1,
        }}
        animate={{
          top: isZoomedNav ? leftZoomedPos.top : (getNavAnimate() === 'expanded' ? 24 : navIdleTop),
          left: isZoomedNav ? `${leftZoomedPos.left}%` : '13.7%',
          x: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? -expandedSpreadAmount : 0),
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : '-50%'),
          scale: isZoomedNav ? zoomTransform.scale : 1,
        }}
        transition={getNavTransition()}
        whileHover={!isZoomedNav ? { color: 'rgba(255, 255, 255, 1)' } : undefined}
        onClick={!isZoomedNav ? handleLeftClick : undefined}
      >
        SELECTED WORKS
      </motion.span>

      {/* Center logo - stays centered, only moves vertically */}
      <motion.div
        className="fixed z-[60]"
        style={{
          transformOrigin: 'center center',
        }}
        initial={{
          top: navIdleTop,
          left: '50%',
          x: '-50%',
          y: '-50%',
          scale: 1,
        }}
        animate={{
          top: isZoomedNav ? logoZoomedPos.top : (getNavAnimate() === 'expanded' ? 24 : navIdleTop),
          left: '50%',
          x: '-50%',
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : '-50%'),
          scale: isZoomedNav ? zoomTransform.scale : 1,
        }}
        transition={getNavTransition()}
      >
        {/* Always white since nav is always over dark background (MasterClass blade/stage is black) */}
        <PeteLogo onClick={!isZoomedNav ? onLogoClick : undefined} fill="#FFFFFF" />
      </motion.div>

      {/* Right link - MORE ABOUT ME */}
      <motion.span
        className="fixed z-[60]"
        style={{
          ...linkTextStyle,
          ...(shouldShowUnderline ? underlineStyle : {}),
          transformOrigin: 'right center',
        }}
        initial={{
          top: navIdleTop,
          right: '13.7%',
          x: 0,
          y: '-50%',
          scale: 1,
        }}
        animate={{
          top: isZoomedNav ? rightZoomedPos.top : (getNavAnimate() === 'expanded' ? 24 : navIdleTop),
          right: isZoomedNav ? `${100 - rightZoomedPos.left}%` : '13.7%',
          x: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? expandedSpreadAmount : 0),
          y: isZoomedNav ? 0 : (getNavAnimate() === 'expanded' ? 0 : '-50%'),
          scale: isZoomedNav ? zoomTransform.scale : 1,
        }}
        transition={getNavTransition()}
        whileHover={!isZoomedNav ? { color: 'rgba(255, 255, 255, 1)' } : undefined}
        onClick={!isZoomedNav ? handleRightClick : undefined}
      >
        MORE ABOUT ME
      </motion.span>
    </>
  )
}
