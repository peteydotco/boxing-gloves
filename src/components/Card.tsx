import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
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
}

// Original colored styles (shown on hover for first 3 cards)
const variantStyles = {
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
    bg: 'rgba(255,255,255,0)',
    textColor: 'rgba(17,24,39,1)', // gray-900
    border: 'border-gray-300',
  },
}

const shortcutBadgeStyles = {
  blue: 'rgba(0,0,0,0.2)',
  white: 'rgba(0,0,0,0.2)',
  red: 'rgba(0,0,0,0.2)',
  cta: 'rgba(243,244,246,1)', // gray-100
}

// Tilt angles for each card variant
const tiltAngles = {
  blue: 0,
  white: 0,
  red: 0,
  cta: 0,
}

export function Card({ id, label, title, shortcut, variant, onClick, isBottomFixed: _isBottomFixed = false, isFlexible: _isFlexible = false, layoutId, hideShortcut = false, compactCta = false }: CardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }) // Percentage position for gradient
  const cardRef = useRef<HTMLButtonElement>(null)

  // Delay the tilt animation until gloves have dropped (~600ms after page load)
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInitialized(true)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  // Mouse follow effect - only on exit
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 12 })
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 12 })
  const lastMousePos = useRef({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    // Track mouse position relative to center for exit direction
    lastMousePos.current = {
      x: e.clientX - centerX,
      y: e.clientY - centerY
    }
    // Track mouse position as percentage for spotlight gradient
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x: xPercent, y: yPercent })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    // Apply magnetic follow in exit direction, then spring back
    const exitRotateX = (-lastMousePos.current.y / rect.height) * 15
    const exitRotateY = (lastMousePos.current.x / rect.width) * 15
    rotateX.set(exitRotateX)
    rotateY.set(exitRotateY)
    // Spring back to 0 after a brief moment
    setTimeout(() => {
      rotateX.set(0)
      rotateY.set(0)
    }, 100)
  }

  const styles = variantStyles[variant]
  const tiltAngle = tiltAngles[variant]

  // First 3 cards: always show full color
  // CTA card: transparent bg by default, white bg on hover
  const isCta = variant === 'cta'
  const bgColor = isCta
    ? (isHovered ? 'rgba(255,255,255,1)' : styles.bg)
    : styles.bg
  const textColor = styles.textColor
  const badgeStyle = shortcutBadgeStyles[variant]

  // Border colors that sample from each card's bg with opacity
  const borderColors = {
    blue: 'rgba(22, 115, 255, 0.6)',      // Blue card border
    white: 'rgba(26, 26, 46, 0.6)',       // Dark card border
    red: 'rgba(239, 68, 68, 0.6)',        // Red card border
    cta: 'rgba(120, 120, 130, 0.5)',      // CTA neutral border
  }

  const defaultBorderColor = borderColors[variant]

  // Spotlight border gradient - light near cursor, subtle dark far from cursor
  const spotlightGradient = isHovered
    ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 1) 0%, rgba(200, 210, 230, 0.8) 15%, ${defaultBorderColor} 35%, rgba(140, 140, 150, 0.3) 55%, rgba(120, 120, 130, 0.35) 100%)`
    : 'none'

  // Border width for the inner stroke effect
  const borderWidth = 1

  return (
    <motion.div
      layoutId={layoutId || `card-${id}`}
      className="relative rounded-[12px]"
      style={{
        width: '100%',
        maxWidth: '100%',
        rotateX: springRotateX,
        rotateY: springRotateY,
      }}
      initial={{ rotate: 0, scale: 1 }}
      animate={{
        rotate: isHovered ? 0 : (hasInitialized ? tiltAngle : 0),
        scale: isHovered ? 1.02 : 1,
      }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      <button
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex items-start w-full rounded-[12px] relative cursor-pointer"
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
              className="absolute inset-0 rounded-[12px] pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%)`,
              }}
            />
            {/* Border spotlight layer */}
            <div
              className="absolute inset-0 rounded-[12px] pointer-events-none"
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
              className="absolute inset-0 rounded-[12px] pointer-events-none"
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
              className="absolute inset-0 rounded-[12px] pointer-events-none"
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
          <SlPlus className="w-6 h-6" style={{ color: textColor }} />
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
                  padding: '4px 8px',
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
                <SlPlus className="w-6 h-6" style={{ color: textColor }} />
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
