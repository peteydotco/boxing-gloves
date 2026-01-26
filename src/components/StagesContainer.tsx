import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Stage } from './Stage'
import { ProgressDots } from './ProgressDots'
import { stages } from '../data/stages'

interface StagesContainerProps {
  isVisible: boolean
  onNavigateToHero: () => void
  onThemeToggle: () => void
  logoFill?: string
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  isInitialEntry?: boolean
}

export function StagesContainer({
  isVisible,
  onNavigateToHero,
  isInitialEntry = false,
}: StagesContainerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Progress dots */}
          <ProgressDots
            stages={stages}
            activeIndex={activeIndex}
            onDotClick={handleDotClick}
          />

          {/* Stages */}
          {stages.map((stage, index) => (
            <Stage
              key={stage.id}
              stage={stage}
              isActive={index === activeIndex}
              onRequestCaseStudy={handleRequestCaseStudy}
              shouldAnimateIn={index === 0 && isInitialEntry && !hasAnimatedIn}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
