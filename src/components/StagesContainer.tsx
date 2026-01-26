import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Stage } from './Stage'
import { ProgressDots } from './ProgressDots'
import { stages, getBladeColor } from '../data/stages'

type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'

interface StagesContainerProps {
  isVisible: boolean
  onNavigateToHero: () => void
  onThemeToggle: () => void
  logoFill?: string
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  isInitialEntry?: boolean
  initialStageIndex?: number
  onStageChange?: (index: number) => void
  transitionPhase?: TransitionPhase
  isZoomedNav?: boolean
  onExitZoomedNav?: () => void
}

export function StagesContainer({
  isVisible,
  onNavigateToHero,
  isInitialEntry = false,
  initialStageIndex = 0,
  onStageChange,
  transitionPhase = 'idle',
  isZoomedNav = false,
  onExitZoomedNav,
}: StagesContainerProps) {
  const [activeIndex, setActiveIndex] = useState(initialStageIndex)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track if we've completed the initial entry animation
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false)

  // Scroll/wheel navigation state
  const wheelState = useRef({
    lastDelta: 0,
    lastTime: 0,
    lastNavTime: 0,
    enteredAt: 0,
  })

  // Sync with parent's initialStageIndex when becoming visible
  useEffect(() => {
    if (isVisible) {
      setActiveIndex(initialStageIndex)
    }
  }, [isVisible, initialStageIndex])

  // Notify parent when active stage changes
  useEffect(() => {
    onStageChange?.(activeIndex)
  }, [activeIndex, onStageChange])

  // Reset wheel state and set entry time when stages become visible
  useEffect(() => {
    if (isVisible) {
      const now = Date.now()
      wheelState.current = {
        lastDelta: 0,
        lastTime: now,
        lastNavTime: now,
        enteredAt: now,
      }
      // Mark animation as complete after delay
      if (isInitialEntry && !hasAnimatedIn) {
        const timer = setTimeout(() => {
          setHasAnimatedIn(true)
        }, 700) // After card scale animation completes
        return () => clearTimeout(timer)
      }
    } else {
      // Reset when leaving stages
      setHasAnimatedIn(false)
    }
  }, [isVisible, isInitialEntry, hasAnimatedIn])

  // Handle wheel navigation between stages
  useEffect(() => {
    if (!isVisible) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const now = Date.now()
      const state = wheelState.current

      // Ignore all wheel events for 600ms after entering stages view
      // This prevents the scroll that triggered the transition from also navigating
      if (now - state.enteredAt < 600) {
        return
      }

      const timeSinceLastNav = now - state.lastNavTime

      // Require cooldown after navigation
      if (timeSinceLastNav < 500) {
        state.lastDelta = delta
        state.lastTime = now
        return
      }

      const timeSinceLast = now - state.lastTime
      const isNewGesture = timeSinceLast > 150

      // Ignore small deltas - increase threshold for better debouncing
      if (Math.abs(delta) < 25) return

      state.lastDelta = delta
      state.lastTime = now

      if (!isNewGesture) return

      state.lastNavTime = now

      if (delta > 0) {
        // Scroll down/right = next stage
        setActiveIndex((prev) => {
          if (prev >= stages.length - 1) return prev
          return prev + 1
        })
      } else {
        // Scroll up/left = previous stage or back to hero
        setActiveIndex((prev) => {
          if (prev <= 0) {
            onNavigateToHero()
            return prev
          }
          return prev - 1
        })
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [isVisible, onNavigateToHero])

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onNavigateToHero()
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, stages.length - 1))
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        setActiveIndex((prev) => {
          if (prev <= 0) {
            onNavigateToHero()
            return prev
          }
          return prev - 1
        })
      }

      // Number keys 1-4 for direct navigation
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= stages.length) {
        setActiveIndex(num - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onNavigateToHero])

  const handleDotClick = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const handleRequestCaseStudy = useCallback(() => {
    // Copy email to clipboard for now
    navigator.clipboard.writeText('hello@petey.co')
    console.log('Case study requested for:', stages[activeIndex].title)
  }, [activeIndex])

  // Calculate zoom transform for secondary nav mode
  // Stage width must match TopCards container width exactly
  const getZoomTransform = useCallback(() => {
    if (typeof window === 'undefined') return { scale: 1, y: 0 }

    const horizontalPadding = 48 // 24px * 2 (TopCards container padding)
    const topCardsHeight = 76 // Collapsed card height
    const topPadding = 24 // TopCards top padding
    const gapBelowTopCards = 24 // Equal spacing between TopCards and stage

    // Scale must match TopCards container width exactly
    // TopCards width = viewportWidth - 48px
    // Scaled stage width = viewportWidth * scale
    // We need: viewportWidth * scale = viewportWidth - 48
    // So: scale = (viewportWidth - 48) / viewportWidth
    const scale = (window.innerWidth - horizontalPadding) / window.innerWidth

    // Position the scaled stage so its top edge is at zoomedTop (124px from viewport top)
    // The stage scales from center, so we need to calculate the Y offset
    //
    // Original stage: top=0, center=viewportHeight/2, bottom=viewportHeight
    // Scaled stage: height = viewportHeight * scale
    // Scaled stage center relative to original center = 0 (scales from center)
    // Scaled stage top = center - (scaledHeight / 2) = viewportHeight/2 - (viewportHeight * scale / 2)
    //                  = viewportHeight/2 * (1 - scale)
    //
    // We want scaled stage top to be at zoomedTop
    // So we need to move the stage down by: zoomedTop - currentScaledTop
    // yOffset = zoomedTop - viewportHeight/2 * (1 - scale)
    const zoomedTop = topPadding + topCardsHeight + gapBelowTopCards // 124px from top
    const scaledTopBeforeOffset = (window.innerHeight / 2) * (1 - scale)
    const yOffset = zoomedTop - scaledTopBeforeOffset

    return { scale, y: yOffset }
  }, [])

  const zoomTransform = getZoomTransform()

  // Spring transition for zoom animation
  const zoomSpringTransition = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 40,
    mass: 1,
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50"
          style={{
            transformOrigin: 'center center',
            cursor: isZoomedNav ? 'pointer' : 'default',
            overflow: 'hidden',
          }}
          initial={{ opacity: 1, scale: 1, y: 0, borderRadius: 0 }}
          animate={{
            opacity: 1,
            scale: isZoomedNav ? zoomTransform.scale : 1,
            y: isZoomedNav ? zoomTransform.y : 0,
            borderRadius: isZoomedNav ? 24 : 0,
          }}
          exit={{ opacity: 0 }}
          transition={zoomSpringTransition}
          onClick={isZoomedNav ? onExitZoomedNav : undefined}
        >
          {/* Progress dots */}
          <ProgressDots
            stages={stages}
            activeIndex={activeIndex}
            onDotClick={handleDotClick}
            shouldAnimateIn={isInitialEntry && !hasAnimatedIn}
          />

          {/* Stages */}
          {/* Cards are part of the stage and expand naturally with the parent blade */}
          {/* Stage index maps to blade index in reverse: Stage 0 = Blade 3 (back), Stage 3 = Blade 0 (front) */}
          {stages.map((stage, stageIndex) => {
            // Convert stage index to blade index (reverse mapping)
            // Stage 0 → Blade 3 (masterclass/back), Stage 1 → Blade 2, Stage 2 → Blade 1, Stage 3 → Blade 0 (front)
            const bladeIndex = (stages.length - 1) - stageIndex
            return (
              <Stage
                key={stage.id}
                stage={stage}
                isActive={stageIndex === activeIndex}
                onRequestCaseStudy={handleRequestCaseStudy}
                isExpanding={transitionPhase === 'expanding'}
                backgroundColor={getBladeColor(bladeIndex)}
              />
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
