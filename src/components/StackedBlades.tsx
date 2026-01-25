import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PeteLogo } from './PeteLogo'
import { bladeStackConfig } from '../data/stages'
import { hoverTransition } from '../constants/animation'

interface StackedBladesProps {
  onNavigateToStages: () => void
  onThemeToggle: () => void
  logoFill?: string
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
}

export function StackedBlades({
  onNavigateToStages,
  onThemeToggle,
  logoFill = '#FFFFFF',
  themeMode = 'light',
}: StackedBladesProps) {
  const [hoveredBlade, setHoveredBlade] = useState<number | null>(null)
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

  const { borderRadius, horizontalPadding, bottomPadding, bladeHeight, stackOffset, bladeColors } = bladeStackConfig

  // Calculate total stack height
  const numBlades = 4
  const totalStackHeight = bladeHeight + (numBlades - 1) * stackOffset

  // Text styling for links
  const linkTextStyle: React.CSSProperties = {
    fontFamily: 'GT Pressura Mono',
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '0.36px',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  }

  // Spotlight gradient for front blade border
  const getSpotlightBorder = () => {
    return `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 30%, rgba(255, 255, 255, 0.03) 60%, transparent 100%)`
  }

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 z-40"
      style={{
        bottom: bottomPadding,
        height: `${totalStackHeight}px`,
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
      }}
    >
      {/* Background blades (3 behind front blade) */}
      {[...Array(numBlades - 1)].map((_, i) => {
        const bladeIndex = numBlades - 1 - i // Reverse order: 3, 2, 1
        const offsetFromBottom = (numBlades - 1 - bladeIndex) * stackOffset
        const isHovered = hoveredBlade === bladeIndex

        return (
          <motion.div
            key={`blade-${bladeIndex}`}
            className="absolute left-0 right-0 cursor-pointer"
            style={{
              bottom: offsetFromBottom,
              left: horizontalPadding,
              right: horizontalPadding,
              height: bladeHeight,
              backgroundColor: bladeColors[bladeIndex],
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              zIndex: bladeIndex,
            }}
            animate={{
              y: isHovered ? -4 : 0,
              scale: isHovered ? 1.005 : 1,
            }}
            transition={hoverTransition}
            onMouseEnter={() => setHoveredBlade(bladeIndex)}
            onMouseLeave={() => setHoveredBlade(null)}
            onClick={onNavigateToStages}
          />
        )
      })}

      {/* Front blade with navigation */}
      <motion.div
        ref={frontBladeRef}
        className="absolute left-0 right-0"
        style={{
          bottom: 0,
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
        onMouseMove={handleMouseMove}
        animate={{
          y: hoveredBlade === 0 ? -2 : 0,
        }}
        transition={hoverTransition}
        onMouseEnter={() => setHoveredBlade(0)}
        onMouseLeave={() => setHoveredBlade(null)}
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

        {/* Inner content with nav links */}
        <div className="w-full h-full flex items-center justify-between px-8">
          {/* Left link - Selected Work */}
          <motion.span
            style={linkTextStyle}
            whileHover={{ color: 'rgba(255, 255, 255, 1)' }}
            onClick={(e) => {
              e.stopPropagation()
              onNavigateToStages()
            }}
          >
            SELECTED WORK
          </motion.span>

          {/* Center logo */}
          <div className="flex items-center justify-center">
            <PeteLogo onClick={onThemeToggle} fill={logoFill} />
          </div>

          {/* Right link - About Petey */}
          <motion.span
            style={linkTextStyle}
            whileHover={{ color: 'rgba(255, 255, 255, 1)' }}
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Navigate to About section
              console.log('About Petey clicked')
            }}
          >
            ABOUT PETEY
          </motion.span>
        </div>
      </motion.div>

      {/* Scroll indicator */}
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
    </div>
  )
}
