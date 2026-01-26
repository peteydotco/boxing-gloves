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
  onThemeToggle: () => void
}

export function PersistentNav({
  viewMode,
  transitionPhase,
  onNavigateToHero,
  onNavigateToStages,
  onThemeToggle,
}: PersistentNavProps) {
  const { bladeHeight } = bladeStackConfig

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
  const isCollapsing = transitionPhase === 'collapsing'

  // Spring transitions - iOS-like, elegant with minimal overshoot
  // Match the back blade's physics exactly so nav moves with the blade
  const getNavTransition = () => ({
    type: 'spring' as const,
    stiffness: 340,  // Match back blade
    damping: 34,     // Match back blade
    mass: 1,
    delay: isExpanding ? 0.045 : 0.06, // Match back blade delays
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

  // Calculate the center Y position of the front blade from the TOP of the viewport
  // Front blade: bottom=0, height=88px
  // Center of blade from bottom = 44px
  // Center of blade from top = 100vh - 44px = calc(100vh - 44px)
  // We'll use CSS calc for this
  const navIdleTop = `calc(100vh - ${bladeHeight / 2}px)` // calc(100vh - 44px)

  // Nav position variants
  // Hero idle: vertically centered within front blade using top + translateY(-50%)
  // Expanded: positioned at top of viewport (top: 24px)
  const navVariants = {
    idle: {
      top: navIdleTop,
      y: '-50%', // Center the element on this position
    },
    expanded: {
      top: 24,
      y: 0,
    },
  }

  // Determine which variant to animate to
  // - expanding: animate to expanded
  // - in stages view: stay expanded
  // - collapsing or hero idle: animate to idle
  const getNavAnimate = () => {
    if (isExpanding || isInStages) return 'expanded'
    return 'idle'
  }

  return (
    <>
      {/* Left link - SELECTED WORKS */}
      {/* Horizontal padding: ~13.7% (220px at 1605px viewport) scales proportionally */}
      <motion.span
        className="fixed z-[60]"
        style={{
          ...linkTextStyle,
          ...(shouldShowUnderline ? underlineStyle : {}),
          left: '13.7%',
        }}
        initial={isCollapsing ? 'expanded' : 'idle'}
        animate={getNavAnimate()}
        variants={navVariants}
        transition={getNavTransition()}
        whileHover={{ color: 'rgba(255, 255, 255, 1)' }}
        onClick={handleLeftClick}
      >
        SELECTED WORKS
      </motion.span>

      {/* Center logo */}
      <motion.div
        className="fixed z-[60]"
        style={{
          left: '50%',
          x: '-50%', // Use Framer Motion's x for horizontal centering
        }}
        initial={isCollapsing ? 'expanded' : 'idle'}
        animate={getNavAnimate()}
        variants={navVariants}
        transition={getNavTransition()}
      >
        {/* Always white since nav is always over dark background (MasterClass blade/stage is black) */}
        <PeteLogo onClick={onThemeToggle} fill="#FFFFFF" />
      </motion.div>

      {/* Right link - ABOUT PETEY */}
      {/* Horizontal padding: ~13.7% (220px at 1605px viewport) scales proportionally */}
      <motion.span
        className="fixed z-[60]"
        style={{
          ...linkTextStyle,
          ...(shouldShowUnderline ? underlineStyle : {}),
          right: '13.7%',
        }}
        initial={isCollapsing ? 'expanded' : 'idle'}
        animate={getNavAnimate()}
        variants={navVariants}
        transition={getNavTransition()}
        whileHover={{ color: 'rgba(255, 255, 255, 1)' }}
        onClick={handleRightClick}
      >
        ABOUT PETEY
      </motion.span>
    </>
  )
}
