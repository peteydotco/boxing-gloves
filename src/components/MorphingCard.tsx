import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { SlPlus, SlCheck, SlControlPlay } from 'react-icons/sl'
import { FiExternalLink, FiPlay, FiCalendar, FiMail } from 'react-icons/fi'
import React from 'react'

interface ExpandedContent {
  roleLabel: string
  dateRange: string
  description: React.ReactNode[]
  highlights?: {
    label: string
    image?: string
    href?: string
  }[]
  reflectionsCard?: {
    title: string
    image: string
    href: string
  }
  actions: {
    label: string
    icon?: 'external' | 'play' | 'calendar' | 'email'
    href?: string
    primary?: boolean
  }[]
}

interface CardData {
  id: string
  label: string
  title: string
  shortcut: string
  variant: 'blue' | 'white' | 'red' | 'cta'
  expandedContent: ExpandedContent
}

interface MorphingCardProps {
  card: CardData
  isExpanded: boolean
  expandedPosition: { x: number; y: number; width: number; height: number }
  collapsedPosition?: { top: number; left: number; width: number; height: number }
  onClick: () => void
  onClose: () => void
  onHighlightClick?: (label: string) => void
  hideShortcut?: boolean
  compactCta?: boolean
  mobileLabel?: string
  emailCopied?: boolean
  setEmailCopied?: (copied: boolean) => void
  themeMode?: 'light' | 'inverted' | 'dark'
  parallaxOffset?: number
}

// Variant styles shared between collapsed and expanded states
// Light/inverted theme styles
const variantStylesLight = {
  blue: {
    bg: 'rgba(22,115,255,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
    badgeBg: 'rgba(0,0,0,0.2)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: '#125CCC',
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
  },
  white: {
    bg: 'rgba(26,26,46,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
    badgeBg: 'rgba(0,0,0,0.2)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(255,255,255,0.15)',
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
  },
  red: {
    bg: 'rgba(239,68,68,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
    badgeBg: 'rgba(0,0,0,0.2)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(200,50,50,1)',
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
  },
  cta: {
    bg: '#F6F6F6',
    textColor: 'rgba(0,0,0,0.4)',
    secondaryText: 'rgba(0,0,0,0.6)',
    ctaTitleColor: 'rgba(0,0,0,0.6)',
    border: 'rgba(0,0,0,0.08)',
    expandedBorder: 'rgba(0,0,0,0.12)',
    badgeBg: 'rgba(0,0,0,0.1)',
    primaryButtonBg: 'rgba(0,0,0,0.87)',
    primaryButtonText: '#FFFFFF',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(0,0,0,0.08)',
    secondaryButtonText: 'rgba(0,0,0,0.87)',
    secondaryButtonBorder: 'rgba(0,0,0,0.1)',
    highlightBorder: 'rgba(0,0,0,0.2)',
    highlightShadow: 'rgba(0,0,0,0.1)',
    dividerColor: 'rgba(0,0,0,0.12)',
  },
}

// Dark theme styles - moderately darker backgrounds (split difference)
const variantStylesDark = {
  blue: {
    bg: 'rgba(17,92,207,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
    badgeBg: 'rgba(0,0,0,0.25)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: '#1050B5',
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
  },
  white: {
    bg: 'rgba(22,22,39,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
    badgeBg: 'rgba(0,0,0,0.25)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(255,255,255,0.12)',
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
  },
  red: {
    bg: 'rgba(200,56,56,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
    badgeBg: 'rgba(0,0,0,0.25)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(170,42,42,1)',
    secondaryButtonText: '#FFFFFF',
    secondaryButtonBorder: 'rgba(0,0,0,0.2)',
    highlightBorder: '#FFFFFF',
    highlightShadow: 'rgba(0,0,0,0.25)',
    dividerColor: 'rgba(255,255,255,0.3)',
  },
  cta: {
    bg: 'rgba(32,32,32,1)',
    textColor: 'rgba(255,255,255,0.3)',
    secondaryText: 'rgba(255,255,255,0.85)',
    ctaTitleColor: 'rgba(255,255,255,0.5)',
    border: 'rgba(255,255,255,0.1)',
    expandedBorder: 'rgba(255,255,255,0.2)',
    badgeBg: 'rgba(255,255,255,0.1)',
    primaryButtonBg: 'rgba(255,255,255,0.9)',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: 'rgba(255,255,255,0.1)',
    secondaryButtonText: 'rgba(255,255,255,0.9)',
    secondaryButtonBorder: 'rgba(255,255,255,0.15)',
    highlightBorder: 'rgba(255,255,255,0.3)',
    highlightShadow: 'rgba(0,0,0,0.2)',
    dividerColor: 'rgba(255,255,255,0.15)',
  },
}

// Helper to get styles based on theme
const getVariantStyles = (themeMode: 'light' | 'inverted' | 'dark') => {
  return themeMode === 'dark' ? variantStylesDark : variantStylesLight
}

const iconMap = {
  external: FiExternalLink,
  play: FiPlay,
  calendar: FiCalendar,
  email: FiMail,
}

// Spring for card container position - smooth ease with subtle settle
const positionSpring = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 32,
  mass: 1,
}

// Faster critically damped spring for internal content (fonts, padding) - finishes before position
const contentSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}

// Tween for hover interactions - matches CSS transition timing
const hoverTransition = {
  type: 'tween' as const,
  duration: 0.25,
  ease: [0.33, 1, 0.68, 1] as [number, number, number, number], // easeOutCubic
}

// HighlightButton component with hover state
interface HighlightButtonProps {
  highlight: {
    label: string
    image?: string
    href?: string
  }
  styles: typeof variantStylesLight.blue
  onHighlightClick?: (label: string) => void
}

function HighlightButton({ highlight, styles, onHighlightClick }: HighlightButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation()
        if (highlight.href) {
          window.open(highlight.href, '_blank', 'noopener,noreferrer')
        }
        onHighlightClick?.(highlight.label)
      }}
      className="flex flex-col items-center gap-2 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        scale: isHovered ? 1.08 : 1,
      }}
      transition={hoverTransition}
    >
      <motion.div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden"
        style={{
          border: `3px solid ${styles.highlightBorder}`,
          boxShadow: `0 0 0 4px ${styles.highlightShadow}`,
          backgroundColor: highlight.image ? 'transparent' : 'rgba(255,255,255,0.1)',
        }}
        initial={false}
        animate={{
          boxShadow: isHovered
            ? `0 0 0 4px ${styles.highlightShadow}, 0 8px 24px rgba(0,0,0,0.25)`
            : `0 0 0 4px ${styles.highlightShadow}`,
        }}
        transition={hoverTransition}
      >
        {highlight.image ? (
          <img src={highlight.image} alt={highlight.label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] font-pressura-mono uppercase" style={{ color: styles.textColor }}>
            {highlight.label.slice(0, 4)}
          </span>
        )}
      </motion.div>
      <span
        className="font-pressura-mono leading-normal uppercase"
        style={{ fontSize: '14px', letterSpacing: '0.42px', color: styles.textColor }}
      >
        {highlight.label}
      </span>
    </motion.button>
  )
}

// ReflectionsCard component with hover state
interface ReflectionsCardProps {
  card: {
    title: string
    image: string
    href: string
  }
  styles: typeof variantStylesLight.blue
  themeMode?: 'light' | 'inverted' | 'dark'
  variant?: 'blue' | 'white' | 'red' | 'cta'
}

function ReflectionsCard({ card, themeMode = 'light', variant }: ReflectionsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Determine background color based on variant and theme
  const getBackgroundColor = () => {
    if (variant === 'white') {
      // Squarespace card: swap the bg colors between themes
      return themeMode === 'dark' ? 'rgba(26,26,46,1)' : 'rgba(22,22,39,1)'
    }
    // SVA and other cards: use original blue colors
    return themeMode === 'dark' ? 'rgba(22,115,255,1)' : '#125CCC'
  }

  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation()
        window.open(card.href, '_blank', 'noopener,noreferrer')
      }}
      className="w-full rounded-[8px] overflow-hidden relative cursor-pointer"
      style={{
        backgroundColor: getBackgroundColor(),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        scale: isHovered ? 1.02 : 1,
        boxShadow: isHovered
          ? '0 2px 0 0 rgba(0,0,0,0.2), 0 12px 32px rgba(0,0,0,0.25)'
          : '0 2px 0 0 rgba(0,0,0,0.2)',
      }}
      transition={hoverTransition}
    >
      {/* Inner stroke overlay on video container */}
      <div
        className="absolute inset-0 rounded-[8px] pointer-events-none z-10"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      />
      {/* Preview image container */}
      <div
        className="overflow-hidden relative"
        style={{
          margin: '10px',
          marginBottom: '10px',
          width: 'calc(100% - 20px)',
          height: '234px',
          borderRadius: '4px',
        }}
      >
        <motion.img
          src={card.image}
          alt={card.title}
          className="w-full h-full object-cover"
          style={{ borderRadius: '4px' }}
          initial={false}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={hoverTransition}
        />
        {/* Inner stroke overlay on thumbnail */}
        <div
          className="absolute inset-0 rounded-[4px] pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        />
      </div>

      {/* Bottom bar with play icon and title */}
      <div
        className="flex items-center"
        style={{
          paddingTop: '4px',
          paddingBottom: '20px',
          paddingLeft: '10px',
          paddingRight: '10px',
        }}
      >
        {/* Play icon - aligned with thumbnail left edge */}
        <motion.div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '30px',
            height: '30px',
          }}
          initial={false}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={hoverTransition}
        >
          <SlControlPlay className="w-5 h-5" style={{ color: 'white' }} />
        </motion.div>

        {/* Title - matches Highlights on IG Stories text style */}
        <span
          className="font-pressura-ext flex-1 text-center"
          style={{
            fontWeight: 350,
            fontSize: '19px',
            lineHeight: '25px',
            color: '#FFFFFF',
          }}
        >
          {card.title}
        </span>

        {/* Spacer to balance the play icon for true center alignment */}
        <div className="shrink-0" style={{ width: '30px', height: '30px' }} />
      </div>
    </motion.button>
  )
}

export function MorphingCard({
  card,
  isExpanded,
  expandedPosition,
  collapsedPosition,
  onClick,
  onClose,
  onHighlightClick,
  hideShortcut = false,
  compactCta = false,
  mobileLabel,
  emailCopied: emailCopiedProp,
  setEmailCopied: setEmailCopiedProp,
  themeMode = 'light',
  parallaxOffset = 0,
}: MorphingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [emailCopiedLocal, setEmailCopiedLocal] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Use prop if provided, otherwise use local state
  const emailCopied = emailCopiedProp ?? emailCopiedLocal
  const setEmailCopied = setEmailCopiedProp ?? setEmailCopiedLocal

  const styles = getVariantStyles(themeMode)[card.variant]
  const { expandedContent } = card

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x: xPercent, y: yPercent })
  }

  const handleCtaClick = () => {
    navigator.clipboard.writeText('hello@petey.co')
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 3000)
  }

  // Spotlight gradient for hover state (works for both collapsed and expanded)
  const defaultBorderColor = styles.border
  const spotlightGradient = isHovered
    ? card.variant === 'cta'
      ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 1) 0%, rgba(230, 230, 232, 0.6) 15%, ${defaultBorderColor} 35%, rgba(200, 200, 205, 0.15) 55%, rgba(195, 195, 200, 0.17) 100%)`
      : `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 1) 0%, rgba(200, 210, 230, 0.8) 15%, ${defaultBorderColor} 35%, rgba(140, 140, 150, 0.3) 55%, rgba(120, 120, 130, 0.35) 100%)`
    : 'none'

  const label = mobileLabel || card.label

  // If expanded with collapsedPosition, this is a portal card that animates from collapsed to expanded
  if (isExpanded && collapsedPosition) {
    return (
      <motion.div
        ref={cardRef}
        className="fixed overflow-hidden"
        style={{
          backgroundColor: styles.bg,
          color: styles.textColor,
          zIndex: 9999,
          pointerEvents: 'auto',
          // Parallax offset applied as transform for real-time velocity response
          transform: `translateX(${parallaxOffset}px)`,
        }}
        initial={{
          top: collapsedPosition.top,
          left: collapsedPosition.left,
          width: collapsedPosition.width,
          height: collapsedPosition.height,
          borderRadius: 14,
        }}
        animate={{
          top: expandedPosition.y,
          left: expandedPosition.x,
          width: expandedPosition.width,
          height: expandedPosition.height,
          borderRadius: 16,
        }}
        exit={{
          top: collapsedPosition.top,
          left: collapsedPosition.left,
          width: collapsedPosition.width,
          height: collapsedPosition.height,
          borderRadius: 14,
        }}
        transition={{
          // Position gets spring bounce
          top: positionSpring,
          left: positionSpring,
          // Size is critically damped - no bounce
          width: contentSpring,
          height: contentSpring,
          borderRadius: contentSpring,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Border - same subtle stroke as collapsed state */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: `1px solid ${styles.border}`,
          }}
          initial={{ borderRadius: 14 }}
          animate={{ borderRadius: 16 }}
          exit={{ borderRadius: 14 }}
          transition={contentSpring}
        />

        {/* Spotlight hover effects - reduced opacity for expanded cards */}
        {isHovered && (
          <>
            {/* Fill spotlight - subtle light following cursor */}
            <div
              className="absolute inset-0 rounded-[16px] pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 45%, transparent 80%)`,
              }}
            />
            {/* Border spotlight layer */}
            <div
              className="absolute inset-0 rounded-[16px] pointer-events-none"
              style={{
                background: spotlightGradient,
                mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor',
                padding: '1px',
                opacity: 0.6,
              }}
            />
          </>
        )}

        {/* Morphing text content - label and title scale proportionally with card */}
        <motion.div
          className="absolute inset-0 flex flex-col overflow-hidden"
          initial={{ padding: compactCta ? '12px 12px 20px 12px' : '12px 12px 20px 20px' }}
          animate={{ padding: '24px' }}
          exit={{ padding: compactCta ? '12px 12px 20px 12px' : '12px 12px 20px 20px' }}
          transition={contentSpring}
        >
          {/* Header row with morphing label - uses same copy as collapsed card */}
          <div className="flex items-start justify-between w-full">
            <motion.div
              className="font-pressura-mono leading-normal text-left uppercase"
              style={{ color: styles.textColor }}
              initial={{ fontSize: '13px', letterSpacing: '0.39px', marginTop: '0px' }}
              animate={{ fontSize: '14px', letterSpacing: '0.42px', marginTop: '1px' }}
              exit={{ fontSize: '13px', letterSpacing: '0.39px', marginTop: '0px' }}
              transition={contentSpring}
            >
              {label}
            </motion.div>

            {/* Shortcut badge - morphs between ESC (expanded) and shortcut key (collapsed) */}
            {/* Always render during exit animation to prevent blinking */}
            <motion.div
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="flex items-center justify-center rounded-[4px] shrink-0 cursor-pointer"
              style={{ backgroundColor: styles.badgeBg }}
              initial={{ paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px', opacity: hideShortcut ? 0 : 1 }}
              animate={{ paddingTop: '4px', paddingBottom: '4px', paddingLeft: card.variant === 'cta' ? '8px' : '16px', paddingRight: card.variant === 'cta' ? '8px' : '16px', opacity: hideShortcut ? 0 : 1 }}
              exit={{ paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px', opacity: 1 }}
              transition={contentSpring}
            >
              {/* Badge text - same size as collapsed card */}
              <div
                className="uppercase font-pressura-mono leading-[100%] relative text-[12px]"
                style={{ top: '-1px' }}
              >
                {/* ESC text - absolutely positioned, fades in when expanded */}
                <motion.span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ color: styles.textColor }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hideShortcut ? 0 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                >
                  ESC
                </motion.span>
                {/* Shortcut text - provides layout, fades out when expanded */}
                <motion.span
                  style={{ color: styles.textColor }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: hideShortcut ? 1 : 0 }}
                  exit={{ opacity: 1 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                >
                  {card.shortcut}
                </motion.span>
              </div>
            </motion.div>
          </div>

          {/* Morphing title - scales proportionally from collapsed to expanded */}
          <motion.h2
            className={`leading-normal text-left w-full uppercase ${card.variant === 'cta' ? 'font-pressura-light' : 'font-pressura'}`}
            style={{ color: card.variant === 'cta' ? (styles as typeof variantStylesLight.cta).ctaTitleColor : styles.textColor, transformOrigin: 'top left', letterSpacing: '-0.3px' }}
            initial={{ fontSize: '18px', marginTop: '0px' }}
            animate={{ fontSize: '32px', marginTop: '4px' }}
            exit={{ fontSize: '18px', marginTop: '0px' }}
            transition={contentSpring}
          >
            {card.variant === 'cta' ? (
              <span className="flex items-center gap-3">
                <motion.span
                  style={{ display: 'flex', alignItems: 'center' }}
                  initial={{ width: 20, height: 20 }}
                  animate={{ width: 28, height: 28 }}
                  exit={{ width: 20, height: 20 }}
                  transition={contentSpring}
                >
                  <SlPlus className="w-full h-full" style={{ position: 'relative', top: '1px' }} />
                </motion.span>
                {card.title}
              </span>
            ) : (
              card.title
            )}
          </motion.h2>

          {/* Date Range + Description - fades in */}
          <motion.div
            initial={{ marginTop: '0px', opacity: 0 }}
            animate={{ marginTop: '24px', opacity: 1 }}
            exit={{ marginTop: '0px', opacity: 0 }}
            transition={{
              marginTop: contentSpring,
              opacity: { duration: 0.15, ease: 'easeOut' },
            }}
          >
            {expandedContent.dateRange && (
              <div style={{ marginBottom: '32px' }}>
                <p
                  className="font-pressura-ext"
                  style={{
                    fontWeight: 350,
                    fontSize: '19px',
                    lineHeight: '25px',
                    color: styles.textColor,
                  }}
                >
                  {expandedContent.dateRange.includes('→') ? (
                    <>
                      {expandedContent.dateRange.split('→')[0]}
                      <span style={{ position: 'relative', top: '-1px' }}>→</span>
                      {expandedContent.dateRange.split('→')[1]}
                    </>
                  ) : (
                    expandedContent.dateRange
                  )}
                </p>
              </div>
            )}
            {expandedContent.description.map((paragraph, i) => (
              <p
                key={i}
                className="font-pressura-ext"
                style={{
                  fontWeight: 350,
                  fontSize: '19px',
                  lineHeight: '25px',
                  color: styles.textColor,
                  minWidth: '452px', // Fixed min-width to prevent text reflow during morph animation
                }}
              >
                {paragraph}
              </p>
            ))}
          </motion.div>

        </motion.div>

        {/* Expanded-only content - absolutely positioned at bottom, animates with card height */}
        <motion.div
          className="absolute"
          style={{
            left: '24px',
            right: '24px',
          }}
          initial={{
            bottom: 26 - (expandedPosition.height - collapsedPosition.height),
            opacity: 0,
          }}
          animate={{
            bottom: 26,
            opacity: 1,
          }}
          exit={{
            bottom: 26 - (expandedPosition.height - collapsedPosition.height),
            opacity: 0,
          }}
          transition={{
            bottom: contentSpring,
            opacity: { duration: 0.15, ease: 'easeOut' },
          }}
        >
            {/* Highlights Section */}
            {expandedContent.highlights && expandedContent.highlights.length > 0 && (
              <div
                style={{
                  marginBottom: '28px',
                }}
              >
                <p
                  className="font-pressura-ext"
                  style={{
                    fontWeight: 350,
                    fontSize: '19px',
                    lineHeight: '25px',
                    color: styles.textColor,
                    marginBottom: '20px',
                    textAlign: 'left',
                  }}
                >
                  Highlights on IG Stories –
                </p>
                <div className="flex gap-4 justify-start" style={{ paddingLeft: '4px' }}>
                  {expandedContent.highlights.map((highlight, i) => (
                    <HighlightButton
                      key={i}
                      highlight={highlight}
                      styles={styles}
                      onHighlightClick={onHighlightClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reflections Card */}
            {expandedContent.reflectionsCard && (
              <ReflectionsCard
                card={expandedContent.reflectionsCard}
                styles={styles}
                themeMode={themeMode}
                variant={card.variant}
              />
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto">
              {expandedContent.actions.map((action, i) => {
                const Icon = action.icon ? iconMap[action.icon] : null
                const isPrimary = action.primary

                return (
                  <button
                    key={i}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-3 rounded-[5px] relative overflow-hidden"
                    style={{
                      width: '100%',
                      height: '65px',
                      backgroundColor: isPrimary ? styles.primaryButtonBg : styles.secondaryButtonBg,
                      color: isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
                      borderBottom: `2px solid ${isPrimary ? styles.primaryButtonBorder : styles.secondaryButtonBorder}`,
                    }}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span className="text-[20px] font-pressura uppercase" style={{ letterSpacing: '-0.8px' }}>
                      {action.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
      </motion.div>
    )
  }

  // Collapsed card (normal flow)
  return (
    <motion.div
      ref={cardRef}
      className="rounded-[14px] overflow-hidden cursor-pointer relative"
      style={{
        backgroundColor: styles.bg,
        color: styles.textColor,
        width: '100%',
        height: 'auto',
      }}
      animate={{
        scale: isHovered ? 1.02 : 1,
        boxShadow: isHovered
          ? '0 12px 32px rgba(0,0,0,0.15)'
          : '0 4px 10px rgba(0,0,0,0)',
      }}
      transition={hoverTransition}
      onClick={card.variant === 'cta' ? handleCtaClick : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
    >
      {/* Border */}
      <div
        className="absolute inset-0 rounded-[14px] pointer-events-none"
        style={{
          border: `1px solid ${styles.border}`,
        }}
      />

      {/* Spotlight hover effects */}
      {isHovered && (
        <>
          <div
            className="absolute inset-0 rounded-[14px] pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%)`,
            }}
          />
          <div
            className="absolute inset-0 rounded-[14px] pointer-events-none"
            style={{
              background: spotlightGradient,
              mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
        </>
      )}

      {/* Collapsed content with hover slide effect */}
      <div
        className="overflow-hidden"
        style={{ padding: compactCta ? '12px 12px 20px 12px' : '12px 12px 20px 20px' }}
      >
        {compactCta ? (
          <div className="flex flex-col items-center justify-center gap-1 w-full" style={{ minHeight: '47px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={emailCopied ? 'copied' : 'add'}
                className="text-[12px] tracking-[0.36px] font-pressura-mono leading-normal text-center uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {emailCopied ? 'Email Copied' : 'Add Role'}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={emailCopied ? 'check' : 'plus'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {emailCopied ? (
                  <SlCheck className="w-5 h-5" style={{ color: styles.textColor }} />
                ) : (
                  <SlPlus className="w-5 h-5" style={{ color: styles.textColor }} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col gap-[0px] w-full relative">
            {/* Label row - slides up and fades on hover */}
            <div
              className="flex items-start justify-between w-full"
              style={{
                transform: (isHovered && !isExpanded) ? 'translateY(-20px)' : 'translateY(0)',
                opacity: (isHovered && !isExpanded) ? 0 : 1,
                transition: 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
              }}
            >
              <div className="text-[13px] tracking-[0.39px] font-pressura-mono leading-normal text-left uppercase">
                {label}
              </div>
              {!hideShortcut && (
                <div
                  className="flex items-center justify-center rounded-[4px] shrink-0"
                  style={{ padding: '4px 12px', backgroundColor: styles.badgeBg }}
                >
                  <div className="text-[12px] uppercase font-pressura-mono leading-[100%]" style={{ position: 'relative', top: '-1px' }}>
                    {card.shortcut}
                  </div>
                </div>
              )}
            </div>

            {/* Title - slides up to label position on hover */}
            <div
              className={`text-[18px] leading-normal text-left w-full uppercase ${card.variant === 'cta' ? 'font-pressura-light' : 'font-pressura'}`}
              style={{
                transform: (isHovered && !isExpanded) ? 'translateY(-20px)' : 'translateY(0)',
                transition: 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                color: card.variant === 'cta' ? (styles as typeof variantStylesLight.cta).ctaTitleColor : undefined,
                letterSpacing: '-0.3px',
              }}
            >
              {card.variant === 'cta' ? (
                <span className="flex items-center gap-3">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={emailCopied ? 'check' : 'plus'}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      {emailCopied ? (
                        <SlCheck className="w-5 h-5" style={{ color: (styles as typeof variantStylesLight.cta).ctaTitleColor, position: 'relative', top: '1px' }} />
                      ) : (
                        <SlPlus className="w-5 h-5" style={{ color: (styles as typeof variantStylesLight.cta).ctaTitleColor, position: 'relative', top: '1px' }} />
                      )}
                    </motion.span>
                  </AnimatePresence>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={emailCopied ? 'copied' : 'title'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {emailCopied ? 'Email Copied' : card.title}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ) : (
                card.title
              )}
            </div>

            {/* Date range - slides up from below on hover, hidden initially */}
            <div
              className="font-pressura-ext text-left absolute pointer-events-none"
              style={{
                bottom: -29,
                left: 0,
                fontWeight: 350,
                fontSize: '14px',
                lineHeight: '18px',
                letterSpacing: '-0.3px',
                transform: (isHovered && !isExpanded) ? 'translateY(-25px)' : 'translateY(0)',
                opacity: (isHovered && !isExpanded) ? 1 : 0,
                transition: 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                color: card.variant === 'cta' ? styles.textColor : undefined,
              }}
            >
              {card.variant === 'cta' ? 'Copy email to clipboard' : (
                expandedContent.dateRange.includes('→') ? (
                  <>
                    {expandedContent.dateRange.split('→')[0]}
                    <span style={{ position: 'relative', top: '-1px' }}>→</span>
                    {expandedContent.dateRange.split('→')[1]}
                  </>
                ) : (
                  expandedContent.dateRange
                )
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
