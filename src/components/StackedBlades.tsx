import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { bladeStackConfig, getBladeColor } from '../data/stages'

type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'

interface StackedBladesProps {
  onNavigateToStage: (stageIndex: number) => void
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  transitionPhase?: TransitionPhase
}

export function StackedBlades({
  onNavigateToStage,
  themeMode = 'light',
  transitionPhase = 'idle',
}: StackedBladesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Cursor spotlight for front blade
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const frontBladeRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!frontBladeRef.current) return
    const rect = frontBladeRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }, [])

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

  // Spotlight gradient for front blade border
  const getSpotlightBorder = () => {
    return `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 30%, rgba(255, 255, 255, 0.03) 60%, transparent 100%)`
  }

  const isExpanding = transitionPhase === 'expanding'
  const isCollapsing = transitionPhase === 'collapsing'
  const isAnimating = isExpanding || isCollapsing

  // Back blade (index 3) is now handled by StageBackdrop component
  // This component only handles the front 3 blades (indices 0, 1, 2)

  // Slide distance - full viewport height plus buffer to ensure cards clear the screen
  const slideDistance = window.innerHeight + 120

  // Animation for front blade (index 0) sliding down
  // Cards are full-height and positioned with negative translateY to show only the peek portion
  const frontBladeVariants = {
    idle: {
      y: 0,
      opacity: 1,
      scale: 1,
    },
    expanded: {
      y: slideDistance,
      opacity: 0,
      scale: 0.95, // Slight scale down as it exits for depth
    },
  }

  // Create variants for each middle blade with their specific positioning
  const getMiddleBladeVariants = (_bladeIndex: number) => {
    return {
      idle: {
        y: 0,
        opacity: 1,
        scale: 1,
      },
      expanded: {
        y: slideDistance,
        opacity: 0,
        scale: 0.95,
      },
    }
  }

  // Determine current animation state
  // - 'expanding': animate from idle to expanded
  // - 'collapsing': animate from expanded to idle (need to start at expanded)
  // - 'idle' or 'complete': stay at idle
  const getFrontBladeAnimate = () => {
    if (isExpanding) return 'expanded'
    return 'idle'
  }

  // Unified spring transition - Figma's elevated timing
  // All blades use the same physics for a cohesive, fluid motion
  const unifiedSpring = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 40,
    mass: 1,
  }

  // Minimal stagger for depth perception without feeling disjointed
  const getBladeTransition = (bladeIndex: number) => ({
    ...unifiedSpring,
    // Tiny stagger (20ms) just for visual depth, not enough to feel laggy
    delay: isExpanding ? bladeIndex * 0.02 : (2 - bladeIndex) * 0.02,
  })

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{
        overflow: 'hidden',
      }}
    >
      {/* Back blade (index 3) is now handled by StageBackground component */}

      {/* Middle blades (slide down on transition) */}
      {/* Each blade represents a stage: blade index = stage index */}
      {/* Render in order: index 1 (Spotify), then index 2 (Nike) */}
      {[1, 2].map((bladeIndex) => {
        const bladePadding = getBladeHorizontalPadding(bladeIndex)
        const middleBladeVariants = getMiddleBladeVariants(bladeIndex)
        const peekFromBottom = getBladeBottomOffset(bladeIndex)

        return (
          <motion.div
            key={`blade-${bladeIndex}`}
            className="absolute cursor-pointer pointer-events-auto"
            style={{
              left: bladePadding,
              right: bladePadding,
              // Full viewport height card
              height: '100vh',
              // Position so only peekFromBottom pixels are visible
              bottom: `calc(-100vh + ${peekFromBottom}px)`,
              backgroundColor: getBladeColor(bladeIndex),
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              // z-index: front blade (0) should be highest, back blade (3) lowest
              // For middle blades: index 1 -> z-index 3, index 2 -> z-index 2
              zIndex: numBlades - bladeIndex,
            }}
            initial={isCollapsing ? 'expanded' : 'idle'}
            animate={getFrontBladeAnimate()}
            variants={middleBladeVariants}
            transition={getBladeTransition(bladeIndex)}
            whileHover={!isAnimating ? { y: -6, scale: 1.001 } : undefined}
            onClick={!isAnimating ? () => onNavigateToStage(bladeIndex) : undefined}
          />
        )
      })}

      {/* Front blade - Stage 0 (MasterClass) with nav overlay */}
      <motion.div
        ref={frontBladeRef}
        className="absolute cursor-pointer pointer-events-auto"
        style={{
          left: horizontalPadding,
          right: horizontalPadding,
          // Full viewport height card
          height: '100vh',
          // Position so only frontBladePeek pixels are visible
          bottom: `calc(-100vh + ${frontBladePeek}px)`,
          backgroundColor: getBladeColor(0),
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          zIndex: numBlades,
          overflow: 'hidden',
        }}
        initial={isCollapsing ? 'expanded' : 'idle'}
        animate={getFrontBladeAnimate()}
        variants={frontBladeVariants}
        transition={getBladeTransition(0)}
        onMouseMove={handleMouseMove}
        whileHover={!isAnimating ? { y: -8 } : undefined}
        onClick={!isAnimating ? () => onNavigateToStage(0) : undefined}
      >
        {/* Spotlight border overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            background: getSpotlightBorder(),
            maskImage: 'linear-gradient(black 0%, black 1px, transparent 1px, transparent calc(100% - 1px), black calc(100% - 1px), black 100%), linear-gradient(to right, black 0%, black 1px, transparent 1px, transparent calc(100% - 1px), black calc(100% - 1px), black 100%)',
            maskComposite: 'intersect',
            WebkitMaskImage: 'linear-gradient(black 0%, black 1px, transparent 1px, transparent calc(100% - 1px), black calc(100% - 1px), black 100%), linear-gradient(to right, black 0%, black 1px, transparent 1px, transparent calc(100% - 1px), black calc(100% - 1px), black 100%)',
            WebkitMaskComposite: 'source-in',
          }}
        />

      </motion.div>

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
