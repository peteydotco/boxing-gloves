import { useRef } from 'react'
import { motion } from 'framer-motion'
import { bladeStackConfig, getBladeColor } from '../data/stages'

type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'
type ViewMode = 'hero' | 'stages'

interface StackedBladesProps {
  onNavigateToStage: (stageIndex: number) => void
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  transitionPhase?: TransitionPhase
  viewMode?: ViewMode
}

export function StackedBlades({
  onNavigateToStage,
  themeMode = 'light',
  transitionPhase = 'idle',
  viewMode = 'hero',
}: StackedBladesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { borderRadius, horizontalPadding, frontBladePeek, stackOffset, widthStagger } = bladeStackConfig

  // Calculate total visible stack height (what peeks above bottom edge)
  const numBlades = 4
  const totalVisibleHeight = frontBladePeek + (numBlades - 1) * stackOffset

  // Calculate horizontal padding for each blade (increases as blades go further back)
  const getBladeHorizontalPadding = (bladeIndex: number) => {
    // bladeIndex 0 = front, 3 = back (MasterClass)
    // Each blade further back has more horizontal padding (narrower)
    return horizontalPadding + (bladeIndex * widthStagger)
  }

  // Calculate the bottom offset for each blade (how far above the viewport bottom it sits)
  // Front blade (0) peeks 88px, each subsequent blade peeks stackOffset more
  const getBladeBottomOffset = (bladeIndex: number) => {
    // For a full-height card, bottom: X means the bottom edge is X px above viewport bottom
    // We want the TOP of the visible portion to be at:
    // - Front blade (0): 88px from bottom
    // - Blade 1: 88 + 16 = 104px from bottom
    // - Blade 2: 88 + 32 = 120px from bottom
    // - Blade 3: 88 + 48 = 136px from bottom (handled by StageBackground)
    // Since card is 100vh tall, bottom offset = -(100vh - peekAmount)
    // Using calc: bottom = -(100vh - (frontBladePeek + bladeIndex * stackOffset))
    return frontBladePeek + (bladeIndex * stackOffset)
  }

  const isExpanding = transitionPhase === 'expanding'
  const isCollapsing = transitionPhase === 'collapsing'
  const isAnimating = isExpanding || isCollapsing

  // Front blade (index 0) is handled by StageBackground component (it expands to fullscreen)
  // This component handles blades 1, 2, 3 which slide UP and stack at the top quarter
  // Each blade eclipses the one behind it: blade 1 covers blade 2, blade 2 covers blade 3

  // Calculate slide distance - back blades travel slightly MORE than blade 0
  // Creates subtle parallax as they slide up ahead of blade 0
  const getSlideDistance = (bladeIndex: number) => {
    const viewportHeight = window.innerHeight
    // Blade 0 travels full viewport to expand to fullscreen
    // Back blades travel just slightly more for parallax peek effect
    // Blade 1: +8px ahead of blade 0
    // Blade 2: +16px ahead of blade 0
    // Blade 3: +24px ahead of blade 0
    const extraDistance = bladeIndex * 8
    return viewportHeight + extraDistance
  }

  // Get the horizontal padding reduction needed to reach full width
  // Each blade starts with different padding (narrower = more padding)
  // and needs to expand to 0 padding (full viewport width)
  const getBladeExpansion = (bladeIndex: number) => {
    const currentPadding = getBladeHorizontalPadding(bladeIndex)
    // Return the padding that needs to be removed (negative = expand outward)
    return -currentPadding
  }

  // Create variants for each blade - slide UP and expand to full width
  // Opacity stays at 1 throughout - no fading
  // Border radius animates smoothly from 24px to 0
  const getBladeVariants = (bladeIndex: number) => {
    const slideDistance = getSlideDistance(bladeIndex)
    const paddingReduction = getBladeExpansion(bladeIndex)

    return {
      idle: {
        y: 0,
        marginLeft: 0,
        marginRight: 0,
        opacity: 1,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
      },
      expanded: {
        y: -slideDistance, // Slide UP
        marginLeft: paddingReduction, // Expand left edge outward
        marginRight: paddingReduction, // Expand right edge outward
        opacity: 1, // Stay fully visible - no fade
        borderTopLeftRadius: 0, // Animate to 0
        borderTopRightRadius: 0, // Animate to 0
      },
    }
  }

  // Determine current animation state based on view mode and transition phase
  // Blades should be 'expanded' (off-screen above) whenever we're in stages view
  // and only return to 'idle' (stacked at bottom) when collapsing back to hero
  const getBladeAnimate = () => {
    // In stages view or transitioning to stages: blades should be expanded (off-screen)
    if (viewMode === 'stages' || isExpanding) return 'expanded'
    // In hero view (including when collapsing): blades should be at idle (stacked)
    return 'idle'
  }

  // Back blades fly out slightly faster than blade 0 for subtle parallax peek
  // The cascade effect mirrors between expanding and collapsing:
  //
  // EXPANDING (back blades lead, blade 0 chases):
  // - Blade 3: 0ms delay, stiffness 230 (fastest, starts first)
  // - Blade 2: 20ms delay, stiffness 220
  // - Blade 1: 40ms delay, stiffness 210
  // - Blade 0: 60ms delay, stiffness 200 (slowest, chases the pack)
  //
  // COLLAPSING (blade 0 leads, back blades chase):
  // - Blade 0: 0ms delay, stiffness 200 (starts first)
  // - Blade 1: 20ms delay, stiffness 210
  // - Blade 2: 40ms delay, stiffness 220
  // - Blade 3: 60ms delay, stiffness 230 (fastest, catches up)
  //
  const getBladeTransition = (bladeIndex: number) => {
    if (isExpanding) {
      // Expanding: snappy spring animation with back blades starting first
      // Blade 3: 0ms, Blade 2: 13ms, Blade 1: 26ms (blade 0 at 40ms in StageBackground)
      const stiffnessIncrease = bladeIndex * 15
      const delayMs = bladeIndex === 3 ? 0 : (4 - bladeIndex) * 13 / 1000
      return {
        type: 'spring' as const,
        stiffness: 300 + stiffnessIncrease,
        damping: 35,
        mass: 1,
        delay: delayMs,
      }
    } else {
      // Collapsing: smooth ease-out for precise, bounce-free settling
      // Front blades start first, back blades delayed
      // Blade 0: 0ms (StageBackground), Blade 1: 20ms, Blade 2: 40ms, Blade 3: 60ms
      const delayMs = bladeIndex * 20 / 1000
      return {
        type: 'tween' as const,
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1] as const, // Custom ease-out curve
        delay: delayMs,
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{
        overflow: 'hidden',
      }}
    >
      {/* Front blade (index 0) is handled by StageBackground - it expands to fullscreen */}

      {/* Back blades slide UP and stack at top quarter of viewport */}
      {/* Eclipse cascade: blade 1 overtakes blade 2 overtakes blade 3 */}
      {/* Blade 0 (StageBackground) then expands over all of them */}
      {[1, 2, 3].map((bladeIndex) => {
        const bladePadding = getBladeHorizontalPadding(bladeIndex)
        const bladeVariants = getBladeVariants(bladeIndex)
        const peekFromBottom = getBladeBottomOffset(bladeIndex)

        return (
          <motion.div
            key={`blade-${bladeIndex}`}
            className="absolute cursor-pointer pointer-events-auto"
            style={{
              left: bladePadding,
              right: bladePadding,
              // Extra tall card (200vh) so it covers viewport even when sliding up
              height: '200vh',
              // Position so only peekFromBottom pixels are visible initially
              bottom: `calc(-200vh + ${peekFromBottom}px)`,
              backgroundColor: getBladeColor(bladeIndex),
              // Bottom corners always 0, top corners animated via variants
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              // z-index: front blade (0) should be highest, back blade (3) lowest
              // For back blades: index 1 -> z-index 3, index 2 -> z-index 2, index 3 -> z-index 1
              zIndex: numBlades - bladeIndex,
            }}
            initial={isCollapsing ? 'expanded' : 'idle'}
            animate={getBladeAnimate()}
            variants={bladeVariants}
            transition={getBladeTransition(bladeIndex)}
            whileHover={!isAnimating ? { y: -6, scale: 1.001 } : undefined}
            onClick={!isAnimating ? () => onNavigateToStage(bladeIndex) : undefined}
          />
        )
      })}

      {/* Scroll indicator - hide during transition */}
      {!isAnimating && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: totalVisibleHeight + 16,
            zIndex: numBlades + 1,
          }}
        >
          <motion.p
            style={{
              fontFamily: 'GT Pressura Mono',
              fontSize: '10px',
              fontWeight: 400,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              color: themeMode === 'dark' || themeMode === 'darkInverted'
                ? 'rgba(255, 255, 255, 0.4)'
                : 'rgba(0, 0, 0, 0.35)',
            }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            SCROLL TO BEGIN
          </motion.p>
        </div>
      )}
    </div>
  )
}
