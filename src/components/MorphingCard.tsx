import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { SlPlus, SlCheck, SlControlPlay, SlSocialInstagram } from 'react-icons/sl'
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
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  parallaxOffset?: number
  isStackedBehind?: boolean // When true, card is displayed as stacked paper behind CTA
  stackedRotation?: number // Rotation when stacked behind CTA
  stackedScale?: number // Scale when stacked behind CTA
  zIndexOverride?: number // Override z-index for stacking order
  useBouncyTransition?: boolean // When true, use bouncy springs for carousel navigation (not expand/collapse)
}

// Variant styles shared between collapsed and expanded states
// Light/inverted theme styles
const variantStylesLight = {
  blue: {
    bg: 'rgba(0,100,255,1)',
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
    bg: 'rgba(235,45,55,1)',
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
    bg: 'rgba(0,80,210,1)',
    textColor: '#FFFFFF',
    secondaryText: 'rgba(255,255,255,0.85)',
    border: 'rgba(255,255,255,0.12)',
    expandedBorder: 'rgba(255,255,255,1)',
    badgeBg: 'rgba(0,0,0,0.25)',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#000000',
    primaryButtonBorder: 'rgba(0,0,0,0.2)',
    secondaryButtonBg: '#0050B5',
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
    bg: 'rgba(195,35,45,1)',
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
const getVariantStyles = (themeMode: 'light' | 'inverted' | 'dark' | 'darkInverted') => {
  return (themeMode === 'dark' || themeMode === 'darkInverted') ? variantStylesDark : variantStylesLight
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

// Bouncier spring for stacked cards' rotation - subtle overshoot
const stackedRotationSpring = {
  type: 'spring' as const,
  stiffness: 250,
  damping: 22,
  mass: 1,
}

// Subtle spring for CTA card when navigating to it - minimal overshoot
const ctaEntranceSpring = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 26,
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
        className="font-pressura-mono uppercase"
        style={{ fontSize: '12px', lineHeight: '100%', color: styles.textColor }}
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
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  variant?: 'blue' | 'white' | 'red' | 'cta'
}

function ReflectionsCard({ card, themeMode = 'light', variant }: ReflectionsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Determine background color based on variant and theme
  // Uses darker tints than topCard bg for visual hierarchy
  const getBackgroundColor = () => {
    const isDark = themeMode === 'dark' || themeMode === 'darkInverted'
    if (variant === 'white') {
      // Squarespace card: darker tints
      return isDark ? 'rgba(18,18,32,1)' : 'rgba(22,22,39,1)'
    }
    // SVA and other cards: darker blue tints
    return isDark ? 'rgba(0,60,170,1)' : 'rgba(0,80,210,1)'
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
          boxShadow: variant === 'white'
            ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
            : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      />

      {/* Top bar with play icon and title */}
      <div
        className="flex items-center"
        style={{
          paddingTop: '10px',
          paddingBottom: '0px',
          paddingLeft: '14px',
          paddingRight: '14px',
        }}
      >
        {/* Play icon - aligned with content left edge */}
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
          {variant === 'blue' ? (
            <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '2px' }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M21.6667 4.79171H8.33333V7.70837H21.6667V4.79171ZM23.125 4.79171V7.70837H26.0417V5.52087C26.0417 5.32749 25.9648 5.14202 25.8281 5.00528C25.6914 4.86853 25.5059 4.79171 25.3125 4.79171H23.125ZM4.6875 4.79171H6.875V7.70837H3.95833V5.52087C3.95833 5.32749 4.03516 5.14202 4.1719 5.00528C4.30865 4.86853 4.49411 4.79171 4.6875 4.79171ZM26.0417 9.16671H3.95833V24.4792C3.95833 24.6726 4.03516 24.8581 4.1719 24.9948C4.30865 25.1316 4.49411 25.2084 4.6875 25.2084H25.3125C25.5059 25.2084 25.6914 25.1316 25.8281 24.9948C25.9648 24.8581 26.0417 24.6726 26.0417 24.4792V9.16671ZM4.6875 3.33337C4.10734 3.33337 3.55094 3.56384 3.1407 3.97408C2.73047 4.38431 2.5 4.94071 2.5 5.52087V24.4792C2.5 25.0594 2.73047 25.6158 3.1407 26.026C3.55094 26.4362 4.10734 26.6667 4.6875 26.6667H25.3125C25.8927 26.6667 26.4491 26.4362 26.8593 26.026C27.2695 25.6158 27.5 25.0594 27.5 24.4792V5.52087C27.5 4.94071 27.2695 4.38431 26.8593 3.97408C26.4491 3.56384 25.8927 3.33337 25.3125 3.33337H4.6875ZM17.2765 18.0436L17.5171 17.8934L18.1515 17.4967C18.2039 17.4639 18.2471 17.4184 18.2771 17.3643C18.3071 17.3102 18.3228 17.2494 18.3228 17.1875C18.3228 17.1257 18.3071 17.0649 18.2771 17.0108C18.2471 16.9567 18.2039 16.9111 18.1515 16.8784L17.5171 16.4817L17.2765 16.3315L17.2706 16.3271L14.2708 14.4532L14.246 14.4386L13.8654 14.1994L13.3696 13.8903C13.3144 13.8559 13.2511 13.837 13.1861 13.8354C13.1212 13.8338 13.057 13.8496 13.0002 13.8811C12.9434 13.9126 12.896 13.9587 12.863 14.0147C12.83 14.0707 12.8126 14.1344 12.8125 14.1994V20.1757C12.8124 20.2409 12.8298 20.3049 12.8629 20.3611C12.896 20.4172 12.9435 20.4635 13.0005 20.4951C13.0576 20.5267 13.122 20.5424 13.1872 20.5406C13.2523 20.5388 13.3158 20.5195 13.371 20.4848L13.8654 20.1757L14.2446 19.938L14.2708 19.9219L17.2706 18.048L17.2765 18.0436ZM18.9244 15.6417L14.1425 12.6536C13.8666 12.4813 13.5496 12.386 13.2244 12.3776C12.8992 12.3691 12.5777 12.4478 12.2932 12.6056C12.0087 12.7633 11.7716 12.9943 11.6065 13.2745C11.4414 13.5548 11.3542 13.8741 11.3542 14.1994V20.1757C11.3542 20.501 11.4414 20.8203 11.6065 21.1006C11.7716 21.3808 12.0087 21.6118 12.2932 21.7695C12.5777 21.9272 12.8992 22.006 13.2244 21.9975C13.5496 21.9891 13.8666 21.8938 14.1425 21.7215L18.9244 18.7334C19.1866 18.5695 19.4028 18.3417 19.5526 18.0712C19.7025 17.8008 19.7812 17.4967 19.7812 17.1875C19.7812 16.8784 19.7025 16.5743 19.5526 16.3038C19.4028 16.0334 19.1866 15.8056 18.9244 15.6417Z" fill="white"/>
            </svg>
          ) : (
            <SlControlPlay className="w-4 h-4" style={{ color: 'white' }} />
          )}
        </motion.div>

        {/* Title - center aligned */}
        <span
          className="font-pressura-ext flex-1 text-center"
          style={{
            fontWeight: 350,
            fontSize: '17px',
            lineHeight: '23px',
            color: '#FFFFFF',
          }}
        >
          {card.title}
        </span>

        {/* Spacer to balance the play icon for true center alignment */}
        <div className="shrink-0" style={{ width: '30px', height: '30px' }} />
      </div>

      {/* Preview image container */}
      <div
        className="overflow-hidden relative"
        style={{
          margin: '8px',
          marginTop: '10px',
          width: 'calc(100% - 16px)',
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
            scale: isHovered ? 1.02 : 1,
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
    </motion.button>
  )
}

// HighlightsContainer component - styled like ReflectionsCard
interface HighlightsContainerProps {
  highlights: {
    label: string
    image?: string
    href?: string
  }[]
  styles: typeof variantStylesLight.blue
  onHighlightClick?: (label: string) => void
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  variant?: 'blue' | 'white' | 'red' | 'cta'
}

function HighlightsContainer({ highlights, styles, onHighlightClick, themeMode = 'light', variant }: HighlightsContainerProps) {
  // Determine background color based on variant and theme
  // Uses darker tints than topCard bg for visual hierarchy
  const getBackgroundColor = () => {
    const isDark = themeMode === 'dark' || themeMode === 'darkInverted'
    if (variant === 'white') {
      // Squarespace card: darker tints
      return isDark ? 'rgba(18,18,32,1)' : 'rgba(22,22,39,1)'
    }
    if (variant === 'red') {
      // Rio Rui card: darker red tints
      return isDark ? 'rgba(160,30,40,1)' : 'rgba(195,35,45,1)'
    }
    // SVA and other cards: darker blue tints
    return isDark ? 'rgba(0,60,170,1)' : 'rgba(0,80,210,1)'
  }

  return (
    <div
      className="w-full rounded-[8px] overflow-hidden relative"
      style={{
        backgroundColor: getBackgroundColor(),
        marginBottom: '16px',
        boxShadow: '0 2px 0 0 rgba(0,0,0,0.2)',
      }}
    >
      {/* Inner stroke overlay on container */}
      <div
        className="absolute inset-0 rounded-[8px] pointer-events-none z-10"
        style={{
          boxShadow: variant === 'white'
            ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
            : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      />

      {/* Top bar with Instagram icon and title */}
      <div
        className="flex items-center"
        style={{
          paddingTop: '10px',
          paddingBottom: '0px',
          paddingLeft: '14px',
          paddingRight: '14px',
        }}
      >
        {/* Instagram icon - aligned with content left edge */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '30px',
            height: '30px',
          }}
        >
          <SlSocialInstagram className="w-5 h-5" style={{ color: 'white' }} />
        </div>

        {/* Title - center aligned */}
        <span
          className="font-pressura-ext flex-1 text-center"
          style={{
            fontWeight: 350,
            fontSize: '17px',
            lineHeight: '23px',
            color: '#FFFFFF',
          }}
        >
          Highlights on IG
        </span>

        {/* Spacer to balance the icon for true center alignment */}
        <div className="shrink-0" style={{ width: '30px', height: '30px' }} />
      </div>

      {/* Highlights content area */}
      <div
        className="overflow-hidden relative"
        style={{
          margin: '8px',
          marginTop: '4px',
          width: 'calc(100% - 16px)',
          borderRadius: '4px',
          padding: '10px 14px',
        }}
      >
        <div className="flex gap-4 justify-center">
          {highlights.map((highlight, i) => (
            <HighlightButton
              key={i}
              highlight={highlight}
              styles={styles}
              onHighlightClick={onHighlightClick}
            />
          ))}
        </div>
      </div>
    </div>
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
  themeMode = 'light',
  parallaxOffset = 0,
  isStackedBehind = false,
  stackedRotation = 0,
  stackedScale = 1,
  zIndexOverride,
  useBouncyTransition = false,
}: MorphingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const cardRef = useRef<HTMLDivElement>(null)

  // emailCopied state is managed by parent (TopCards)
  const emailCopied = emailCopiedProp ?? false

  const styles = getVariantStyles(themeMode)[card.variant]
  const { expandedContent } = card

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x: xPercent, y: yPercent })
  }

  // Spotlight gradient for hover state (works for both collapsed and expanded)
  const defaultBorderColor = styles.border
  const spotlightGradient = isHovered
    ? card.variant === 'cta'
      ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 1) 0%, rgba(230, 230, 232, 0.6) 15%, ${defaultBorderColor} 35%, rgba(200, 200, 205, 0.15) 55%, rgba(195, 195, 200, 0.17) 100%)`
      : `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 1) 0%, rgba(200, 210, 230, 0.8) 15%, ${defaultBorderColor} 35%, rgba(140, 140, 150, 0.3) 55%, rgba(120, 120, 130, 0.35) 100%)`
    : 'none'

  const label = mobileLabel || card.label

  // Stacked card behind CTA - render as a static expanded-size card with collapsed appearance
  if (isStackedBehind) {
    return (
      <div
        className="w-full h-full overflow-hidden"
        style={{
          backgroundColor: styles.bg,
          color: styles.textColor,
          borderRadius: 16,
          border: `1px solid ${styles.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* Collapsed-style header content */}
        <div className="flex items-center justify-between p-4" style={{ padding: '16px 20px' }}>
          <div className="flex flex-col gap-1">
            <span
              className="font-pressura-mono uppercase tracking-wider"
              style={{ fontSize: '12px', letterSpacing: '0.36px', color: styles.secondaryText }}
            >
              {card.label}
            </span>
            <span
              className="font-pressura-mono uppercase tracking-wide"
              style={{ fontSize: '22px', fontWeight: 400, letterSpacing: '0.44px', color: styles.textColor }}
            >
              {card.title}
            </span>
          </div>
          <span
            className="font-pressura-mono uppercase"
            style={{
              fontSize: '14px',
              letterSpacing: '0.42px',
              color: styles.secondaryText,
              padding: '4px 8px',
              backgroundColor: styles.badgeBg,
              borderRadius: 4,
            }}
          >
            {card.shortcut}
          </span>
        </div>
      </div>
    )
  }

  // Determine if this card is stacked (has rotation/scale applied)
  const isStacked = stackedRotation !== 0 || stackedScale !== 1

  // If expanded with collapsedPosition, this is a portal card that animates from collapsed to expanded
  if (isExpanded && collapsedPosition) {
    return (
      <motion.div
        ref={cardRef}
        className="fixed overflow-hidden"
        style={{
          backgroundColor: styles.bg,
          color: styles.textColor,
          zIndex: zIndexOverride ?? 9999,
          pointerEvents: isStacked ? 'none' : 'auto',
          // Parallax offset applied via Framer Motion's x property for real-time velocity response
          x: parallaxOffset,
          transformOrigin: 'center center',
        }}
        initial={{
          top: collapsedPosition.top,
          left: collapsedPosition.left,
          width: collapsedPosition.width,
          height: collapsedPosition.height,
          borderRadius: 14,
          rotate: 0,
          scale: 1,
        }}
        animate={{
          top: expandedPosition.y,
          left: expandedPosition.x,
          width: expandedPosition.width,
          height: expandedPosition.height,
          borderRadius: 16,
          rotate: stackedRotation,
          scale: stackedScale,
        }}
        exit={{
          top: collapsedPosition.top,
          left: collapsedPosition.left,
          width: collapsedPosition.width,
          height: collapsedPosition.height,
          borderRadius: 14,
          rotate: 0,
          scale: 1,
        }}
        transition={{
          // Position - use bouncy spring only during carousel navigation, not expand/collapse
          top: useBouncyTransition ? ctaEntranceSpring : positionSpring,
          left: useBouncyTransition ? ctaEntranceSpring : positionSpring,
          // Size is critically damped - no bounce
          width: contentSpring,
          height: contentSpring,
          borderRadius: contentSpring,
          // Rotation/scale - bouncy for stacked cards during carousel nav, normal otherwise
          rotate: (isStacked && useBouncyTransition) ? stackedRotationSpring : positionSpring,
          scale: (isStacked && useBouncyTransition) ? stackedRotationSpring : positionSpring,
          // No transition on x - it should update instantly for real-time parallax
          x: { duration: 0 },
        }}
        onClick={(e) => {
          // Stop propagation to prevent the backdrop click handler from closing the card
          e.stopPropagation()
        }}
        onMouseEnter={() => !isStacked && setIsHovered(true)}
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
            {/* Highlights Section (IG Stories) */}
            {expandedContent.highlights && expandedContent.highlights.length > 0 && (
              <HighlightsContainer
                highlights={expandedContent.highlights}
                styles={styles}
                onHighlightClick={onHighlightClick}
                themeMode={themeMode}
                variant={card.variant}
              />
            )}

            {/* Reflections Card (Video) */}
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
      onClick={onClick}
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
                card.variant === 'cta' ? (
                  // CTA badge with animated width for email copied toast
                  <motion.div
                    className="flex items-center justify-center rounded-[4px] shrink-0 overflow-hidden"
                    style={{ backgroundColor: styles.badgeBg, padding: '4px 0' }}
                    initial={false}
                    animate={{
                      width: emailCopied ? 108 : 44,
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  >
                    <div
                      className="text-[12px] uppercase font-pressura-mono leading-[100%] whitespace-nowrap flex items-center justify-center gap-1"
                      style={{ position: 'relative', top: '-1px' }}
                    >
                      {emailCopied ? (
                        <>
                          <SlCheck className="w-3 h-3" style={{ position: 'relative', top: '0.5px' }} />
                          <span>Email Copied</span>
                        </>
                      ) : (
                        card.shortcut
                      )}
                    </div>
                  </motion.div>
                ) : (
                  // Regular badge with padding-based sizing
                  <div
                    className="flex items-center justify-center rounded-[4px] shrink-0"
                    style={{ padding: '4px 12px', backgroundColor: styles.badgeBg }}
                  >
                    <div className="text-[12px] uppercase font-pressura-mono leading-[100%]" style={{ position: 'relative', top: '-1px' }}>
                      {card.shortcut}
                    </div>
                  </div>
                )
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
                  <SlPlus className="w-5 h-5" style={{ color: (styles as typeof variantStylesLight.cta).ctaTitleColor, position: 'relative', top: '1px' }} />
                  {card.title}
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
{expandedContent.dateRange.includes('→') ? (
                <>
                  {expandedContent.dateRange.split('→')[0]}
                  <span style={{ position: 'relative', top: '-1px' }}>→</span>
                  {expandedContent.dateRange.split('→')[1]}
                </>
              ) : (
                expandedContent.dateRange
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
