import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import { SlPlus } from 'react-icons/sl'

interface CardProps {
  id: string
  label: string
  title: string
  shortcut: string
  variant: 'blue' | 'white' | 'red' | 'cta'
  onClick?: () => void
  isBottomFixed?: boolean
  isFlexible?: boolean
  layoutId?: string
  hideShortcut?: boolean
  compactCta?: boolean // Mobile-only: narrow CTA card with stacked label + icon, no title
  themeMode?: 'light' | 'inverted' | 'dark'
}

// Light/inverted theme styles
const variantStylesLight = {
  blue: {
    bg: 'rgba(22,115,255,1)',
    textColor: 'rgba(255,255,255,1)', // white
    border: 'border-[rgba(255,255,255,0.12)]',
  },
  white: {
    bg: 'rgba(26,26,46,1)',
    textColor: 'rgba(255,255,255,1)', // white
    border: 'border-[rgba(255,255,255,0.12)]',
  },
  red: {
    bg: 'rgba(239,68,68,1)',
    textColor: 'rgba(255,255,255,1)', // white
    border: 'border-[rgba(255,255,255,0.12)]',
  },
  cta: {
    bg: '#F6F6F6',
    textColor: 'rgba(0,0,0,0.48)', // black at 48% opacity
    border: 'border-gray-300',
  },
}

// Dark theme styles - moderately darker backgrounds (split difference)
const variantStylesDark = {
  blue: {
    bg: 'rgba(17,92,207,1)',
    textColor: 'rgba(255,255,255,1)',
    border: 'border-[rgba(255,255,255,0.12)]',
  },
  white: {
    bg: 'rgba(22,22,39,1)',
    textColor: 'rgba(255,255,255,1)',
    border: 'border-[rgba(255,255,255,0.12)]',
  },
  red: {
    bg: 'rgba(200,56,56,1)',
    textColor: 'rgba(255,255,255,1)',
    border: 'border-[rgba(255,255,255,0.12)]',
  },
  cta: {
    bg: 'rgba(32,32,32,1)',
    textColor: 'rgba(255,255,255,0.3)',
    border: 'border-[rgba(255,255,255,0.1)]',
  },
}

// Helper to get styles based on theme
const getVariantStyles = (themeMode: 'light' | 'inverted' | 'dark') => {
  return themeMode === 'dark' ? variantStylesDark : variantStylesLight
}

const shortcutBadgeStylesLight = {
  blue: 'rgba(0,0,0,0.2)',
  white: 'rgba(0,0,0,0.2)',
  red: 'rgba(0,0,0,0.2)',
  cta: 'rgba(0,0,0,0.1)',
}

const shortcutBadgeStylesDark = {
  blue: 'rgba(0,0,0,0.3)',
  white: 'rgba(0,0,0,0.3)',
  red: 'rgba(0,0,0,0.3)',
  cta: 'rgba(255,255,255,0.1)',
}

const getShortcutBadgeStyles = (themeMode: 'light' | 'inverted' | 'dark') => {
  return themeMode === 'dark' ? shortcutBadgeStylesDark : shortcutBadgeStylesLight
}


export function Card({ id, label, title, shortcut, variant, onClick, isBottomFixed: _isBottomFixed = false, isFlexible: _isFlexible = false, layoutId, hideShortcut = false, compactCta = false, themeMode = 'light' }: CardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }) // Percentage position for gradient
  const cardRef = useRef<HTMLButtonElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    // Track mouse position as percentage for spotlight gradient
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x: xPercent, y: yPercent })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const styles = getVariantStyles(themeMode)[variant]

  // All cards: always show full color
  const bgColor = styles.bg
  const textColor = styles.textColor
  const badgeStyle = getShortcutBadgeStyles(themeMode)[variant]

  // Border colors - white at 12% for colored cards, black at 8% for CTA
  const borderColors = {
    blue: 'rgba(255, 255, 255, 0.12)',
    white: 'rgba(255, 255, 255, 0.12)',
    red: 'rgba(255, 255, 255, 0.12)',
    cta: 'rgba(0, 0, 0, 0.08)',
  }

  const defaultBorderColor = borderColors[variant]

  // Spotlight border gradient - light near cursor, subtle dark far from cursor
  // CTA card uses softer darker tones since it sits on a light background
  const spotlightGradient = isHovered
    ? variant === 'cta'
      ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 1) 0%, rgba(230, 230, 232, 0.6) 15%, ${defaultBorderColor} 35%, rgba(200, 200, 205, 0.15) 55%, rgba(195, 195, 200, 0.17) 100%)`
      : `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 1) 0%, rgba(200, 210, 230, 0.8) 15%, ${defaultBorderColor} 35%, rgba(140, 140, 150, 0.3) 55%, rgba(120, 120, 130, 0.35) 100%)`
    : 'none'

  // Border width for the inner stroke effect
  const borderWidth = 1

  // Tuned for smaller cards: subtler scale, gentler spring with less overshoot
  const springTransition = {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
    mass: 0.8,
  }

  return (
    <motion.div
      layout
      layoutId={layoutId || `card-${id}`}
      className="relative rounded-[14px]"
      style={{
        width: '100%',
        maxWidth: '100%',
        transformOrigin: 'center center',
        filter: isHovered ? 'drop-shadow(0px 12px 31px rgba(0,0,0,0.12))' : 'drop-shadow(0px 0px 0px rgba(0,0,0,0))',
        transition: 'filter 0.3s ease',
      }}
      animate={{
        scale: isHovered ? 1.015 : 1,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        layout: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        },
        ...springTransition,
      }}
    >
      <button
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex items-start w-full rounded-[14px] relative cursor-pointer"
        style={{
          padding: compactCta ? '12px 12px 20px 12px' : '12px 12px 20px 20px',
          backgroundColor: bgColor,
          color: textColor,
          pointerEvents: 'auto',
          transition: 'background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
          boxShadow: `inset 0 0 0 ${borderWidth}px ${defaultBorderColor}`,
        }}
      >
        {/* Spotlight effects on hover */}
        {isHovered && (
          <>
            {/* Fill spotlight - subtle light following cursor */}
            <div
              className="absolute inset-0 rounded-[14px] pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%)`,
              }}
            />
            {/* Border spotlight layer */}
            <div
              className="absolute inset-0 rounded-[14px] pointer-events-none"
              style={{
                background: spotlightGradient,
                mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor',
                padding: `${borderWidth}px`,
              }}
            />
            {/* Darken layer for depth */}
            <div
              className="absolute inset-0 rounded-[14px] pointer-events-none"
              style={{
                background: spotlightGradient,
                mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor',
                padding: `${borderWidth}px`,
                mixBlendMode: 'darken',
                opacity: 0.48,
              }}
            />
            {/* Multiply layer for depth */}
            <div
              className="absolute inset-0 rounded-[14px] pointer-events-none"
              style={{
                background: spotlightGradient,
                mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor',
                padding: `${borderWidth}px`,
                mixBlendMode: 'multiply',
                opacity: 0.48,
              }}
            />
          </>
        )}

      {/* Content wrapper - vertical stack */}
      {compactCta ? (
        /* Compact CTA layout for mobile: stacked label + icon, centered */
        <div className="flex flex-col items-center justify-center gap-1 w-full relative z-10">
          <div className="text-[12px] tracking-[0.36px] font-pressura-mono leading-normal text-center uppercase">
            {label}
          </div>
          <SlPlus className="w-5 h-5" style={{ color: textColor }} />
        </div>
      ) : (
        /* Standard layout */
        <div className="flex flex-col gap-[0px] relative z-10 w-full">
          {/* First row: Label and Shortcut badge */}
          <div className="flex items-start justify-between relative w-full">
            {/* Label */}
            <div className="text-[12px] tracking-[0.36px] font-pressura-mono leading-normal text-left uppercase">
              {label}
            </div>

            {/* Shortcut badge - hidden on mobile */}
            {!hideShortcut && (
              <div
                className="flex items-center justify-center rounded-[4px] shrink-0"
                style={{
                  padding: '4px 12px',
                  backgroundColor: badgeStyle,
                  transition: 'background-color 0.3s ease',
                }}
              >
                <div className="text-[12px] uppercase font-pressura-mono leading-[100%]" style={{ position: 'relative', top: '-1px' }}>
                  {shortcut}
                </div>
              </div>
            )}
          </div>

          {/* Second row: Title - full width */}
          <div className="text-[18px] tracking-[-0.015em] font-pressura font-medium leading-normal text-left w-full uppercase">
            {variant === 'cta' ? (
              <span className="flex items-center gap-3">
                <SlPlus className="w-5 h-5" style={{ color: textColor }} />
                {title}
              </span>
            ) : (
              title
            )}
          </div>
        </div>
      )}
      </button>
    </motion.div>
  )
}
