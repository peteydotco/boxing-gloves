import { motion } from 'framer-motion'
import type { StageData } from '../types'
import { hoverTransition } from '../constants/animation'

interface ProgressDotsProps {
  stages: StageData[]
  activeIndex: number
  onDotClick: (index: number) => void
}

export function ProgressDots({ stages, activeIndex, onDotClick }: ProgressDotsProps) {
  // Dot sizing based on distance from active
  // Active dot is largest, progressively smaller as distance increases
  const getDotSize = (index: number) => {
    const distance = Math.abs(index - activeIndex)
    // Base size 12px, decreases by 2px per step away, min 6px
    return Math.max(6, 12 - distance * 2)
  }

  // Dot opacity based on distance
  const getDotOpacity = (index: number) => {
    const distance = Math.abs(index - activeIndex)
    // Active is 1, decreases by 0.2 per step, min 0.3
    return Math.max(0.3, 1 - distance * 0.2)
  }

  return (
    <div
      className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3"
    >
      {stages.map((stage, index) => {
        const isActive = index === activeIndex
        const size = getDotSize(index)
        const opacity = getDotOpacity(index)

        return (
          <motion.button
            key={stage.id}
            className="relative flex items-center justify-center cursor-pointer"
            style={{
              width: 20,
              height: 20,
            }}
            onClick={() => onDotClick(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            transition={hoverTransition}
          >
            {/* Outer ring (visible on active) */}
            <motion.div
              className="absolute"
              style={{
                width: size + 6,
                height: size + 6,
                borderRadius: '50%',
                border: '1px solid',
                borderColor: isActive ? stage.accentColor : 'transparent',
              }}
              animate={{
                opacity: isActive ? 0.6 : 0,
                scale: isActive ? 1 : 0.8,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Main dot */}
            <motion.div
              style={{
                borderRadius: '50%',
                backgroundColor: stage.accentColor,
              }}
              animate={{
                width: size,
                height: size,
                opacity: opacity,
                boxShadow: isActive
                  ? `0 0 12px ${stage.accentColor}80, 0 0 4px ${stage.accentColor}`
                  : `0 0 0px transparent`,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Inner highlight (creates depth) */}
            <motion.div
              className="absolute"
              style={{
                width: size * 0.4,
                height: size * 0.4,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                top: '30%',
                left: '30%',
              }}
              animate={{
                opacity: isActive ? 1 : 0.5,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        )
      })}

      {/* Stage number indicator */}
      <motion.div
        className="mt-2"
        style={{
          fontFamily: 'GT Pressura Mono',
          fontSize: '10px',
          fontWeight: 400,
          letterSpacing: '0.3px',
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        {String(activeIndex + 1).padStart(2, '0')}/{String(stages.length).padStart(2, '0')}
      </motion.div>
    </div>
  )
}
