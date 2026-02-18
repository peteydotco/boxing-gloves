// @ts-nocheck — orphaned component, not currently imported
import { motion } from 'framer-motion'
import type { StageData } from '../types'
import { hoverTransition } from '../constants/animation'

// Stage card color (blush-200) for active dot
const ACTIVE_DOT_COLOR = '#E9D7DA'
// Inactive dots: white at 20% opacity
const INACTIVE_DOT_COLOR = 'rgba(255, 255, 255, 0.2)'

// Base dot size
const BASE_DOT_SIZE = 10

interface ProgressDotsProps {
  stages: StageData[]
  activeIndex: number
  onDotClick: (index: number) => void
  shouldAnimateIn?: boolean
  isHidden?: boolean
}

export function ProgressDots({ stages, activeIndex, onDotClick, shouldAnimateIn = false, isHidden = false }: ProgressDotsProps) {
  // Dot scale based on distance from active
  // Active = 100%, distance 1 = 75%, distance 2 = 50%, distance 3+ = 25%
  const getDotScale = (index: number) => {
    const distance = Math.abs(index - activeIndex)
    if (distance === 0) return 1
    if (distance === 1) return 0.75
    if (distance === 2) return 0.5
    return 0.25
  }

  return (
    <motion.div
      className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1"
      initial={shouldAnimateIn ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
      animate={{ opacity: isHidden ? 0 : 1, x: isHidden ? -20 : 0 }}
      transition={{
        duration: 0.3,
        delay: shouldAnimateIn ? 0.5 : 0,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{ pointerEvents: isHidden ? 'none' : 'auto' }}
    >
      {stages.map((stage, index) => {
        const isActive = index === activeIndex
        const scale = getDotScale(index)
        const size = BASE_DOT_SIZE * scale

        return (
          <motion.button
            key={stage.id}
            className="relative flex items-center justify-center cursor-pointer"
            style={{
              width: 16,
              height: 16,
            }}
            onClick={() => onDotClick(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            transition={hoverTransition}
          >
            {/* Dot */}
            <motion.div
              style={{
                borderRadius: '50%',
                backgroundColor: isActive ? ACTIVE_DOT_COLOR : INACTIVE_DOT_COLOR,
              }}
              animate={{
                width: size,
                height: size,
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </motion.button>
        )
      })}
    </motion.div>
  )
}
