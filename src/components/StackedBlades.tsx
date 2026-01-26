import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { bladeStackConfig } from '../data/stages'

type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'

interface StackedBladesProps {
  onNavigateToStages: () => void
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  transitionPhase?: TransitionPhase
}

export function StackedBlades({
  onNavigateToStages,
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

  const { borderRadius, horizontalPadding, bottomPadding, bladeHeight, stackOffset, bladeColors, widthStagger } = bladeStackConfig

  // Calculate total stack height
  const numBlades = 4
  const totalStackHeight = bladeHeight + (numBlades - 1) * stackOffset

  // Calculate horizontal padding for each blade (increases as blades go further back)
  const getBladeHorizontalPadding = (bladeIndex: number) => {
    // bladeIndex 0 = front, 3 = back (MasterClass)
    // Each blade further back has more horizontal padding (narrower)
    return horizontalPadding + (bladeIndex * widthStagger)
  }

  // Spotlight gradient for front blade border
  const getSpotlightBorder = () => {
    return `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 30%, rgba(255, 255, 255, 0.03) 60%, transparent 100%)`
  }

  const isExpanding = transitionPhase === 'expanding'
  const isCollapsing = transitionPhase === 'collapsing'
  const isAnimating = isExpanding || isCollapsing

  // Animation variants for the back blade (MasterClass) expanding to fullscreen
  // Back blade index is 3 (furthest back, most narrow in idle state)
  const backBladePadding = getBladeHorizontalPadding(3)
  const backBladeVariants = {
    idle: {
      bottom: (numBlades - 1) * stackOffset,
      left: backBladePadding,
      right: backBladePadding,
      height: bladeHeight,
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    expanded: {
      bottom: 0,
      left: 0,
      right: 0,
      height: '100vh',
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
  }

  // Animation for front blade (index 0) sliding down
  const frontBladeVariants = {
    idle: {
      bottom: 0,
      opacity: 1,
    },
    expanded: {
      bottom: -window.innerHeight, // Slide down off screen (negative because bottom positioning)
      opacity: 0,
    },
  }

  // Create variants for each middle blade with their specific bottom offset
  const getMiddleBladeVariants = (bladeIndex: number) => {
    const bladeOffsetFromBottom = bladeIndex * stackOffset
    return {
      idle: {
        bottom: bladeOffsetFromBottom,
        opacity: 1,
      },
      expanded: {
        bottom: bladeOffsetFromBottom - window.innerHeight, // Slide down off screen
        opacity: 0,
      },
    }
  }

  // Determine current animation state
  // - 'expanding': animate from idle to expanded
  // - 'collapsing': animate from expanded to idle (need to start at expanded)
  // - 'idle' or 'complete': stay at idle
  const getBackBladeAnimate = () => {
    if (isExpanding) return 'expanded'
    return 'idle'
  }

  const getFrontBladeAnimate = () => {
    if (isExpanding) return 'expanded'
    return 'idle'
  }

  // Spring transitions - iOS-like, elegant with cascading effect
  // When expanding: front blades slide down slower (lower stiffness) and with delay
  // When collapsing: front blades return first (no delay), back blade last

  // Front blade (index 0) - slowest to slide down, first to return
  const getFrontBladeTransition = () => ({
    type: 'spring' as const,
    stiffness: isExpanding ? 280 : 400,  // Slower when expanding
    damping: isExpanding ? 28 : 40,
    mass: 1,
    delay: isExpanding ? 0.12 : 0,  // Delay when expanding for cascade
  })

  // Middle blade 1 (index 1)
  const getMiddleBlade1Transition = () => ({
    type: 'spring' as const,
    stiffness: isExpanding ? 300 : 380,
    damping: isExpanding ? 30 : 38,
    mass: 1,
    delay: isExpanding ? 0.08 : 0.02,
  })

  // Middle blade 2 (index 2)
  const getMiddleBlade2Transition = () => ({
    type: 'spring' as const,
    stiffness: isExpanding ? 320 : 360,
    damping: isExpanding ? 32 : 36,
    mass: 1,
    delay: isExpanding ? 0.04 : 0.04,
  })

  // Back blade (MasterClass, index 3) - fastest to expand, last to return
  const getBackBladeTransition = () => ({
    type: 'spring' as const,
    stiffness: 340,
    damping: 34,
    mass: 1,
    delay: isExpanding ? 0 : 0.06,  // No delay when expanding, delayed when collapsing
  })

  // Get transition for middle blades by index
  const getMiddleBladeTransition = (bladeIndex: number) => {
    return bladeIndex === 1 ? getMiddleBlade1Transition() : getMiddleBlade2Transition()
  }

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 z-40"
      style={{
        bottom: bottomPadding,
        height: isAnimating ? '100vh' : `${totalStackHeight}px`,
      }}
    >
      {/* Back blade - MasterClass (expands to fullscreen) */}
      <motion.div
        className="absolute cursor-pointer"
        style={{
          backgroundColor: bladeColors[3], // MasterClass black (matches stage background)
          zIndex: 1,
        }}
        initial={isCollapsing ? 'expanded' : 'idle'}
        animate={getBackBladeAnimate()}
        variants={backBladeVariants}
        transition={getBackBladeTransition()}
        onClick={!isAnimating ? onNavigateToStages : undefined}
      />

      {/* Middle blades (slide down on transition) */}
      {/* Render in order: index 1 (second from front), then index 2 (third from front) */}
      {[1, 2].map((bladeIndex) => {
        const bladePadding = getBladeHorizontalPadding(bladeIndex)
        const middleBladeVariants = getMiddleBladeVariants(bladeIndex)

        return (
          <motion.div
            key={`blade-${bladeIndex}`}
            className="absolute cursor-pointer"
            style={{
              left: bladePadding,
              right: bladePadding,
              height: bladeHeight,
              backgroundColor: bladeColors[bladeIndex],
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
            transition={getMiddleBladeTransition(bladeIndex)}
            whileHover={!isAnimating ? { y: -4, scale: 1.005 } : undefined}
            onClick={!isAnimating ? onNavigateToStages : undefined}
          />
        )
      })}

      {/* Front blade with navigation (slides down on transition) */}
      <motion.div
        ref={frontBladeRef}
        className="absolute"
        style={{
          left: horizontalPadding,
          right: horizontalPadding,
          height: bladeHeight,
          backgroundColor: bladeColors[0],
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
        transition={getFrontBladeTransition()}
        onMouseMove={handleMouseMove}
        whileHover={!isAnimating ? { y: -2 } : undefined}
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
            bottom: totalStackHeight + 16,
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
