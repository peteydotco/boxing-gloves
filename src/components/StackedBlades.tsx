import { useRef } from 'react'
import { motion, useTransform, motionValue, type MotionValue } from 'framer-motion'
import { bladeStackConfig, getBladeColor } from '../data/stages'

type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'
type ViewMode = 'hero' | 'stages'

interface StackedBladesProps {
  onNavigateToStage: (stageIndex: number) => void
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  transitionPhase?: TransitionPhase
  viewMode?: ViewMode
  nycTime?: string
  colonVisible?: boolean
  isDaylight?: boolean
  tugOffset?: MotionValue<number>
  isZoomedNav?: boolean
}

// Stable fallback MotionValue (never changes, always 0)
const ZERO_MV = motionValue(0)

export function StackedBlades({
  onNavigateToStage,
  themeMode = 'light',
  transitionPhase = 'idle',
  viewMode = 'hero',
  nycTime = '',
  colonVisible = true,
  isDaylight = true,
  tugOffset,
  isZoomedNav = false,
}: StackedBladesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mv = tugOffset ?? ZERO_MV

  const { borderRadius, horizontalPadding, frontBladePeek, stackOffset, widthStagger } = bladeStackConfig

  // Calculate total visible stack height (what peeks above bottom edge)
  const numBlades = 4
  const totalVisibleHeight = frontBladePeek + (numBlades - 1) * stackOffset

  // Calculate horizontal padding for each blade (increases as blades go further back)
  const getBladeHorizontalPadding = (bladeIndex: number) => {
    return horizontalPadding + (bladeIndex * widthStagger)
  }

  // Calculate the bottom offset for each blade
  const getBladeBottomOffset = (bladeIndex: number) => {
    return frontBladePeek + (bladeIndex * stackOffset)
  }

  const isExpanding = transitionPhase === 'expanding'
  const isCollapsing = transitionPhase === 'collapsing'
  const isAnimating = isExpanding || isCollapsing

  // Calculate slide distance - back blades travel slightly MORE than blade 0
  const getSlideDistance = (bladeIndex: number) => {
    const viewportHeight = window.innerHeight
    const extraDistance = bladeIndex * 8
    return viewportHeight + extraDistance
  }

  const getBladeExpansion = (bladeIndex: number) => {
    const currentPadding = getBladeHorizontalPadding(bladeIndex)
    return -currentPadding
  }

  // Tug stagger multiplier — back blades tug more for depth effect
  const getTugMultiplier = (bladeIndex: number): number => {
    return 0.7 + (bladeIndex * 0.233)
  }

  // Derive per-blade tug y values from the shared MotionValue
  // These update the DOM directly at 60fps with zero React re-renders
  const blade1TugY = useTransform(mv, (v: number) => -(v * getTugMultiplier(1)))
  const blade2TugY = useTransform(mv, (v: number) => -(v * getTugMultiplier(2)))
  const blade3TugY = useTransform(mv, (v: number) => -(v * getTugMultiplier(3)))
  const bladeTugYs = [null, blade1TugY, blade2TugY, blade3TugY]

  // Calculate zoomed stage position (matches StagesContainer getZoomDimensions)
  const getZoomedStageTop = () => {
    if (typeof window === 'undefined') return 124
    const topPadding = 24
    const topCardsHeight = 76
    const gapBelowTopCards = 24
    return topPadding + topCardsHeight + gapBelowTopCards // 124px
  }

  // Variants — y handles expand/collapse only. Tug y is on the wrapper.
  const getBladeVariants = (bladeIndex: number) => {
    const slideDistance = getSlideDistance(bladeIndex)
    const paddingReduction = getBladeExpansion(bladeIndex)

    // Zoomed variant: blades sit just above the zoomed stage container
    // Position them so they peek from the top of the zoomed stage area
    const zoomedTop = getZoomedStageTop()
    // Blades need to slide up enough to sit behind the zoomed stage
    // The zoomed stage top is ~124px from viewport top
    // We want back blades stacked just above that, tucked behind blade 0
    const zoomedSlideDistance = window.innerHeight - zoomedTop + (bladeIndex * stackOffset)

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
        y: -slideDistance,
        marginLeft: paddingReduction,
        marginRight: paddingReduction,
        opacity: 1,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      zoomed: {
        y: -zoomedSlideDistance,
        marginLeft: paddingReduction,
        marginRight: paddingReduction,
        opacity: 1,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
    }
  }

  const getBladeAnimate = () => {
    if (isExpanding) return 'expanded'
    if (viewMode === 'stages' && isZoomedNav) return 'zoomed'
    if (viewMode === 'stages') return 'expanded'
    return 'idle'
  }

  // Transitions — expand/collapse springs only
  const getBladeTransition = (bladeIndex: number) => {
    if (isExpanding) {
      const stiffnessIncrease = bladeIndex * 15
      const delayMs = bladeIndex === 3 ? 0 : (4 - bladeIndex) * 13 / 1000
      return {
        type: 'spring' as const,
        stiffness: 300 + stiffnessIncrease,
        damping: 35,
        mass: 1,
        delay: delayMs,
      }
    } else if (isCollapsing) {
      const delayMs = bladeIndex * 20 / 1000
      return {
        type: 'tween' as const,
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1] as const,
        delay: delayMs,
      }
    }
    // In stages view: use zoom spring to match StagesContainer timing
    // This keeps blades in lockstep when entering/exiting zoomed nav
    if (viewMode === 'stages') {
      return {
        type: 'spring' as const,
        stiffness: 320,
        damping: 40,
        mass: 1,
      }
    }
    // Idle settle — quick tween (tug y is live on the wrapper, not spring-animated)
    return { type: 'tween' as const, duration: 0 }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{ overflow: 'hidden' }}
    >
      {[1, 2, 3].map((bladeIndex) => {
        const bladePadding = getBladeHorizontalPadding(bladeIndex)
        const bladeVariants = getBladeVariants(bladeIndex)
        const peekFromBottom = getBladeBottomOffset(bladeIndex)
        const tugY = bladeTugYs[bladeIndex]!

        return (
          // Outer wrapper: tug offset + z-index for correct stacking order
          <motion.div
            key={`blade-${bladeIndex}`}
            className="absolute pointer-events-none"
            style={{
              inset: 0,
              y: tugY,
              zIndex: numBlades - bladeIndex,
            }}
          >
            {/* Inner: expand/collapse via variants + hover */}
            <motion.div
              className="absolute cursor-pointer pointer-events-auto"
              style={{
                left: bladePadding,
                right: bladePadding,
                height: '200vh',
                bottom: `calc(-200vh + ${peekFromBottom}px)`,
                backgroundColor: getBladeColor(bladeIndex),
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
              initial={isCollapsing ? 'expanded' : 'idle'}
              animate={getBladeAnimate()}
              variants={bladeVariants}
              transition={getBladeTransition(bladeIndex)}
              whileHover={!isAnimating ? { y: -3, scale: 1.001 } : undefined}
              onClick={!isAnimating ? () => onNavigateToStage(bladeIndex) : undefined}
            />
          </motion.div>
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
              fontSize: '12px',
              fontWeight: 400,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              color: themeMode === 'dark' || themeMode === 'darkInverted'
                ? 'rgba(255, 255, 255, 0.55)'
                : 'rgba(0, 0, 0, 0.55)',
            }}
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {nycTime ? (
              <>
                {(() => {
                  const colonIndex = nycTime.indexOf(':')
                  if (colonIndex === -1) return nycTime
                  const before = nycTime.slice(0, colonIndex)
                  const after = nycTime.slice(colonIndex + 1)
                  return <>{before}<span style={{ opacity: colonVisible ? 1 : 0 }}>:</span>{after}</>
                })()}
                {' '}{isDaylight ? '☀︎' : '⏾'} BROOKLYN, NY
              </>
            ) : 'SCROLL TO BEGIN'}
          </motion.p>
        </div>
      )}
    </div>
  )
}
