import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { RiPushpinLine } from 'react-icons/ri'
import { CiPlay1 } from 'react-icons/ci'
import { FiExternalLink, FiPlay, FiCalendar, FiMail } from 'react-icons/fi'
import { SiApplemusic } from 'react-icons/si'
import { IoMdArrowForward } from 'react-icons/io'
import React from 'react'
import type { CardData, VariantStyle, ThemeMode } from '../types'
import { variantStylesLight, getVariantStyles } from '../constants/themes'
import { BREAKPOINTS } from '../constants/breakpoints'
import { AddNewRoleContent } from './AddNewRoleContent'
import {
  signatureSpring,
  positionSpring,
  stackedRotationSpring,
  ctaEntranceSpring,
  mobileCollapseSpring,
  contentSpring,
  hoverTransition,
} from '../constants/animation'

interface MorphingCardProps {
  card: CardData
  isExpanded: boolean
  expandedPosition: { x: number; y: number; width: number; height: number; scale?: number }
  collapsedPosition?: { top: number; left: number; width: number; height: number }
  exitPosition?: { top: number; left: number; width: number; height: number }
  onClick: () => void
  onClose: () => void
  onHighlightClick?: (label: string) => void
  hideShortcut?: boolean
  compactCta?: boolean
  mobileLabel?: string

  themeMode?: ThemeMode
  parallaxOffset?: number
  isStackedBehind?: boolean
  stackedRotation?: number
  stackedScale?: number
  zIndexOverride?: number
  useBouncyTransition?: boolean
  isFocused?: boolean // True when this card is the currently focused card in the carousel
  initialBorderRadius?: number // 44 from compact pill, 16 from normal collapsed
  expandedFromCompact?: boolean // True when card was opened from compact pill bar
  isOverDark?: boolean // True when compact bar is over the dark video section (CTA colors flip)
}

const iconMap = {
  external: FiExternalLink,
  play: FiPlay,
  calendar: FiCalendar,
  email: FiMail,
}

// HighlightButton component with hover state
interface HighlightButtonProps {
  highlight: {
    label: string
    image?: string
    href?: string
  }
  styles: VariantStyle
  onHighlightClick?: (label: string) => void
  isMobile?: boolean
  contentScale?: number // Scale factor for tablet/shallow viewports
}

function HighlightButton({ highlight, styles, onHighlightClick, isMobile = false, contentScale = 1 }: HighlightButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Mobile: fixed 48px, Desktop/Tablet: scale from canonical 68px
  const circleSize = isMobile ? 48 : Math.round(68 * contentScale)
  const borderWidth = isMobile ? 3 : Math.max(2, Math.round(3 * contentScale))
  const shadowSize = isMobile ? 3 : Math.round(4 * contentScale)
  const labelSize = isMobile ? '11px' : `${Math.round(11 * contentScale)}px`

  // On hover, thumbnail+white stroke scales to cover the dark outer stroke
  // Scale factor: (circleSize + shadowSize*2) / circleSize
  const hoverScale = (circleSize + shadowSize * 2) / circleSize

  return (
    <button
      data-cursor="morph"
      data-cursor-radius={isMobile ? '24' : `${Math.round(34 * contentScale)}`}
      onClick={(e) => {
        e.stopPropagation()
        if (highlight.href) {
          window.open(highlight.href, '_blank', 'noopener,noreferrer')
        }
        onHighlightClick?.(highlight.label)
      }}
      className="flex flex-col items-center cursor-pointer"
      style={{ gap: isMobile ? '6px' : `${Math.round(8 * contentScale)}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wrapper keeps original layout size via negative margin trick */}
      <div
        style={{
          width: circleSize,
          height: circleSize,
          position: 'relative',
        }}
      >
        {/* Dark ring - static, doesn't scale */}
        <div
          className="rounded-full absolute"
          style={{
            width: circleSize + shadowSize * 2,
            height: circleSize + shadowSize * 2,
            top: -shadowSize,
            left: -shadowSize,
            backgroundColor: styles.highlightShadow,
          }}
        />
        {/* Inner circle with white border - scales on hover to cover shadow */}
        <motion.div
          className="rounded-full flex items-center justify-center overflow-hidden absolute"
          style={{
            width: circleSize,
            height: circleSize,
            top: 0,
            left: 0,
            border: `${borderWidth}px solid ${styles.highlightBorder}`,
            backgroundColor: highlight.image ? 'transparent' : 'rgba(255,255,255,0.1)',
            transformOrigin: 'center center',
          }}
          initial={false}
          animate={{
            scale: isHovered ? hoverScale : 1,
          }}
          transition={hoverTransition}
        >
          {highlight.image ? (
            <img src={highlight.image} alt={highlight.label} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[11px] uppercase font-inter" style={{ fontWeight: 500, color: styles.textColor }}>
              {highlight.label.slice(0, 4)}
            </span>
          )}
        </motion.div>
      </div>
      <span
        className="uppercase font-dotgothic"
        style={{ fontWeight: 400, fontSize: labelSize, lineHeight: '100%', letterSpacing: '0.12em', color: styles.textColor }}
      >
        {highlight.label}
      </span>
    </button>
  )
}

// ReflectionsCard component with hover state
interface ReflectionsCardProps {
  card: {
    title: string
    image: string
    href: string
  }
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  variant?: 'blue' | 'white' | 'red' | 'cta'
  isMobile?: boolean
  chip?: {
    icon: 'play' | 'slides'
    text: string
  }
  previewFrames?: string[] // Array of preview frame images for slideshow
  previewVideo?: string // Video file for autoplay thumbnail (webm/mp4)
  isActive?: boolean // Only run slideshow when card is focused/expanded
  contentScale?: number // Scale factor for tablet/shallow viewports
}

function ReflectionsCard({ card, themeMode = 'light', variant, isMobile = false, chip, previewFrames, previewVideo, isActive = true, contentScale = 1 }: ReflectionsCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isDark = themeMode === 'dark' || themeMode === 'darkInverted'

  // Autoplay slideshow effect - cycle through preview frames only when active
  // Reset to first frame when navigating away
  // First transition fires after 1.5s (user already saw frame 1 as thumbnail),
  // then subsequent frames hold for 3s each
  useEffect(() => {
    if (!previewFrames || previewFrames.length <= 1 || !isActive) {
      setCurrentFrameIndex(0)
      return
    }

    let interval: ReturnType<typeof setInterval>
    const initialTimeout = setTimeout(() => {
      setCurrentFrameIndex(prev => (prev + 1) % previewFrames.length)
      interval = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % previewFrames.length)
      }, 3000)
    }, 1500)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [previewFrames, isActive])

  // State for mobile auto-play after delay
  const [mobileVideoActive, setMobileVideoActive] = useState(false)

  // Mobile: auto-play video after 5 seconds when card is active
  useEffect(() => {
    if (!isMobile || !previewVideo || !isActive) {
      setMobileVideoActive(false)
      return
    }

    const timer = setTimeout(() => {
      setMobileVideoActive(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [isMobile, previewVideo, isActive])

  // Control video playback - autoplay on desktop when focused, timer on mobile
  const shouldShowVideo = isMobile ? mobileVideoActive : isActive

  useEffect(() => {
    if (!videoRef.current || !previewVideo) return

    if (shouldShowVideo && isActive) {
      // Set src lazily — only fetch video when actually needed
      if (!videoRef.current.src || videoRef.current.src !== previewVideo) {
        videoRef.current.src = previewVideo
      }
      videoRef.current.currentTime = 0 // Reset to start
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, that's ok
      })
    } else {
      videoRef.current.pause()
    }
  }, [shouldShowVideo, isActive, previewVideo])
  // White variant in dark theme has light bg, needs dark text
  const isInvertedWhite = variant === 'white' && isDark

  // Determine background color based on variant and theme
  // Uses darker tints than topCard bg for visual hierarchy
  const getBackgroundColor = () => {
    if (variant === 'white') {
      // Squarespace card: darker tints of the card bg
      return isDark ? 'rgba(210,210,218,1)' : 'rgba(22,22,39,1)'
    }
    if (variant === 'red') {
      // Rio card: darker red tints (matching NowPlayingCard)
      return isDark ? 'rgba(160,30,40,1)' : 'rgba(195,35,45,1)'
    }
    if (variant === 'cta') {
      return isDark ? 'rgba(40,40,40,1)' : 'rgba(230,230,230,1)'
    }
    // SVA and other cards: darker blue tints
    return isDark ? 'rgba(0,60,170,1)' : 'rgba(0,80,210,1)'
  }

  return (
    <button
      data-cursor="play"
      onClick={(e) => {
        e.stopPropagation()
        window.open(card.href, '_blank', 'noopener,noreferrer')
      }}
      className="w-full rounded-[10px] overflow-hidden relative cursor-pointer"
      style={{
        backgroundColor: getBackgroundColor(),
        boxShadow: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Inner stroke overlay on video container */}
      <div
        className="absolute inset-0 rounded-[10px] pointer-events-none z-10"
        style={{
          boxShadow: isInvertedWhite
            ? 'inset 0 0 0 1px rgba(0,0,0,0.06)'
            : (variant === 'white')
              ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
              : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      />

      {/* Preview image container with static noise overlay that clears */}
      <motion.div
        className="overflow-hidden relative"
        style={{
          marginLeft: isMobile ? '10px' : `${Math.round(14 * contentScale)}px`,
          marginRight: isMobile ? '10px' : `${Math.round(14 * contentScale)}px`,
          marginTop: isMobile ? '10px' : `${Math.round(14 * contentScale)}px`,
          marginBottom: isMobile ? '10px' : `${Math.round(14 * contentScale)}px`,
          width: isMobile ? 'calc(100% - 20px)' : `calc(100% - ${Math.round(28 * contentScale)}px)`,
          borderRadius: `${Math.round(6 * contentScale)}px`,
          transformOrigin: 'center center',
          border: `${isMobile ? 3 : Math.max(2, Math.round(3 * contentScale))}px solid rgba(255,255,255,0.9)`,
        }}
        initial={isMobile ? false : { scale: 0.25, opacity: 0 }}
        animate={{
          scale: isHovered ? 1.03 : 1,
          opacity: 1,
          transition: isMobile ? hoverTransition : {
            scale: signatureSpring,
            opacity: { duration: 0.2, ease: 'easeOut' }
          }
        }}
        whileHover={{ scale: 1.03 }}
        transition={hoverTransition}
      >
        {/* Preview container - video on hover, or static image/slideshow */}
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          {previewVideo ? (
            // Video mode - show thumbnail by default, video on hover (desktop) or after 5s (mobile)
            <>
              {/* Static thumbnail - visible by default */}
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: shouldShowVideo ? 0 : 1,
                  transition: 'opacity 0.3s ease-in-out',
                }}
              />
              {/* Video - visible on hover (desktop) or after 5s delay (mobile) */}
              <video
                ref={videoRef}
                preload="none"
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: shouldShowVideo ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                }}
              />
            </>
          ) : previewFrames && previewFrames.length > 1 ? (
            // Slideshow mode - show all frames stacked with opacity transitions
            previewFrames.map((frame, index) => (
              <img
                key={index}
                src={frame}
                alt={`${card.title} preview ${index + 1}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: index === currentFrameIndex ? 1 : 0,
                  transition: isActive ? 'opacity 1.2s ease-in-out' : 'none',
                }}
              />
            ))
          ) : (
            // Single image mode - fallback to card.image
            <img
              src={card.image}
              alt={card.title}
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
            />
          )}
        </div>
        {/* Chip badge - bottom left */}
        {chip && (
          <div
            className="absolute pointer-events-none flex items-center rounded-[6px]"
            style={{
              bottom: isMobile ? '8px' : `${Math.round(10 * contentScale)}px`,
              left: isMobile ? '8px' : `${Math.round(10 * contentScale)}px`,
              gap: isMobile ? '6px' : `${Math.round(7 * contentScale)}px`,
              backgroundColor: 'rgba(255,255,255,0.95)',
              paddingTop: isMobile ? '4px' : `${Math.round(5 * contentScale)}px`,
              paddingBottom: isMobile ? '4px' : `${Math.round(5 * contentScale)}px`,
              paddingLeft: isMobile ? '8px' : `${Math.round(10 * contentScale)}px`,
              paddingRight: isMobile ? '10px' : `${Math.round(12 * contentScale)}px`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {chip.icon === 'slides' ? (
              <svg width={isMobile ? 14 : Math.round(16 * contentScale)} height={isMobile ? 14 : Math.round(16 * contentScale)} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M21.6667 4.79171H8.33333V7.70837H21.6667V4.79171ZM23.125 4.79171V7.70837H26.0417V5.52087C26.0417 5.32749 25.9648 5.14202 25.8281 5.00528C25.6914 4.86853 25.5059 4.79171 25.3125 4.79171H23.125ZM4.6875 4.79171H6.875V7.70837H3.95833V5.52087C3.95833 5.32749 4.03516 5.14202 4.1719 5.00528C4.30865 4.86853 4.49411 4.79171 4.6875 4.79171ZM26.0417 9.16671H3.95833V24.4792C3.95833 24.6726 4.03516 24.8581 4.1719 24.9948C4.30865 25.1316 4.49411 25.2084 4.6875 25.2084H25.3125C25.5059 25.2084 25.6914 25.1316 25.8281 24.9948C25.9648 24.8581 26.0417 24.6726 26.0417 24.4792V9.16671ZM4.6875 3.33337C4.10734 3.33337 3.55094 3.56384 3.1407 3.97408C2.73047 4.38431 2.5 4.94071 2.5 5.52087V24.4792C2.5 25.0594 2.73047 25.6158 3.1407 26.026C3.55094 26.4362 4.10734 26.6667 4.6875 26.6667H25.3125C25.8927 26.6667 26.4491 26.4362 26.8593 26.026C27.2695 25.6158 27.5 25.0594 27.5 24.4792V5.52087C27.5 4.94071 27.2695 4.38431 26.8593 3.97408C26.4491 3.56384 25.8927 3.33337 25.3125 3.33337H4.6875ZM17.2765 18.0436L17.5171 17.8934L18.1515 17.4967C18.2039 17.4639 18.2471 17.4184 18.2771 17.3643C18.3071 17.3102 18.3228 17.2494 18.3228 17.1875C18.3228 17.1257 18.3071 17.0649 18.2771 17.0108C18.2471 16.9567 18.2039 16.9111 18.1515 16.8784L17.5171 16.4817L17.2765 16.3315L17.2706 16.3271L14.2708 14.4532L14.246 14.4386L13.8654 14.1994L13.3696 13.8903C13.3144 13.8559 13.2511 13.837 13.1861 13.8354C13.1212 13.8338 13.057 13.8496 13.0002 13.8811C12.9434 13.9126 12.896 13.9587 12.863 14.0147C12.83 14.0707 12.8126 14.1344 12.8125 14.1994V20.1757C12.8124 20.2409 12.8298 20.3049 12.8629 20.3611C12.896 20.4172 12.9435 20.4635 13.0005 20.4951C13.0576 20.5267 13.122 20.5424 13.1872 20.5406C13.2523 20.5388 13.3158 20.5195 13.371 20.4848L13.8654 20.1757L14.2446 19.938L14.2708 19.9219L17.2706 18.048L17.2765 18.0436ZM18.9244 15.6417L14.1425 12.6536C13.8666 12.4813 13.5496 12.386 13.2244 12.3776C12.8992 12.3691 12.5777 12.4478 12.2932 12.6056C12.0087 12.7633 11.7716 12.9943 11.6065 13.2745C11.4414 13.5548 11.3542 13.8741 11.3542 14.1994V20.1757C11.3542 20.501 11.4414 20.8203 11.6065 21.1006C11.7716 21.3808 12.0087 21.6118 12.2932 21.7695C12.5777 21.9272 12.8992 22.006 13.2244 21.9975C13.5496 21.9891 13.8666 21.8938 14.1425 21.7215L18.9244 18.7334C19.1866 18.5695 19.4028 18.3417 19.5526 18.0712C19.7025 17.8008 19.7812 17.4967 19.7812 17.1875C19.7812 16.8784 19.7025 16.5743 19.5526 16.3038C19.4028 16.0334 19.1866 15.8056 18.9244 15.6417Z" fill="#000000"/>
              </svg>
            ) : (
              <CiPlay1 style={{ width: isMobile ? '14px' : `${Math.round(16 * contentScale)}px`, height: isMobile ? '14px' : `${Math.round(16 * contentScale)}px`, color: '#000000' }} />
            )}
            <span
              className="uppercase leading-[100%] font-inter"
              style={{
                fontWeight: 500,
                color: '#000000',
                fontSize: isMobile ? '11px' : `${Math.round(12 * contentScale)}px`,
              }}
            >
              {chip.text}
            </span>
          </div>
        )}
        {/* Outer stroke overlay on thumbnail */}
        <div
          className="absolute inset-0 rounded-[6px] pointer-events-none"
          style={{
            boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
          }}
        />
      </motion.div>
    </button>
  )
}

// NowPlayingCard component - "Last listened to" style card for Rio
interface NowPlayingCardProps {
  card: {
    label: string
    songTitle: string
    artist: string
    albumArt: string
    href: string
  }
  styles: typeof variantStylesLight.blue
  themeMode?: 'light' | 'inverted' | 'dark' | 'darkInverted'
  variant?: 'blue' | 'white' | 'red' | 'cta'
  isMobile?: boolean
  contentScale?: number // Scale factor for tablet/shallow viewports
}

function NowPlayingCard({ card, themeMode = 'light', variant, isMobile = false, contentScale = 1 }: NowPlayingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isDark = themeMode === 'dark' || themeMode === 'darkInverted'
  // White variant in dark theme has light bg, needs dark text
  const isInvertedWhite = variant === 'white' && isDark

  // Determine background color based on variant and theme
  const getBackgroundColor = () => {
    if (variant === 'white') {
      // Squarespace card: darker tint of the light gray card bg
      return isDark ? 'rgba(210,210,218,1)' : 'rgba(22,22,39,1)'
    }
    if (variant === 'red') {
      return isDark ? 'rgba(160,30,40,1)' : 'rgba(195,35,45,1)'
    }
    if (variant === 'cta') {
      return isDark ? 'rgba(40,40,40,1)' : 'rgba(230,230,230,1)'
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
      className="w-full rounded-[10px] overflow-hidden relative cursor-pointer"
      style={{
        backgroundColor: getBackgroundColor(),
        boxShadow: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
    >
      {/* Inner stroke overlay */}
      <div
        className="absolute inset-0 rounded-[10px] pointer-events-none z-10"
        style={{
          boxShadow: (variant === 'white' && (themeMode === 'dark' || themeMode === 'darkInverted'))
            ? 'inset 0 0 0 1px rgba(0,0,0,0.06)'
            : (variant === 'white' || variant === 'cta')
              ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
              : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      />

      {/* Content area - match Highlights container height */}
      <div
        data-cursor-parallax=""
        className="relative flex items-center gap-3"
        style={{
          paddingLeft: isMobile ? '10px' : `${Math.round(14 * contentScale)}px`,
          paddingRight: isMobile ? '10px' : `${Math.round(14 * contentScale)}px`,
          paddingTop: isMobile ? '14px' : `${Math.round(14 * contentScale)}px`,
          paddingBottom: isMobile ? '12px' : `${Math.round(14 * contentScale)}px`,
          minHeight: isMobile ? 'auto' : `${Math.round(140 * contentScale)}px`,
        }}
      >
        {/* Apple Music icon - top right */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: isMobile ? '10px' : `${Math.round(12 * contentScale)}px`,
            right: isMobile ? '10px' : `${Math.round(12 * contentScale)}px`,
            width: isMobile ? '22px' : `${Math.round(28 * contentScale)}px`,
            height: isMobile ? '22px' : `${Math.round(28 * contentScale)}px`,
          }}
        >
          <SiApplemusic
            size={isMobile ? 20 : Math.round(24 * contentScale)}
            color={isInvertedWhite ? 'rgba(26,26,46,0.6)' : 'rgba(255,255,255,0.6)'}
          />
        </div>

        {/* Album art - larger size to match Highlights section height */}
        <motion.div
          data-cursor="play-circle"
          className="shrink-0 rounded-[6px] overflow-hidden relative"
          style={{
            width: isMobile ? '65px' : `${Math.round(112 * contentScale)}px`,
            height: isMobile ? '65px' : `${Math.round(112 * contentScale)}px`,
          }}
          initial={isMobile ? false : { scale: 0.25, opacity: 0 }}
          animate={{
            scale: isHovered ? 1.03 : 1,
            opacity: 1,
            transition: isMobile ? hoverTransition : {
              scale: signatureSpring,
              opacity: { duration: 0.2, ease: 'easeOut' }
            }
          }}
          whileHover={{ scale: 1.03 }}
          transition={hoverTransition}
        >
          <img
            src={card.albumArt}
            alt={`${card.songTitle} album art`}
            className="w-full h-full object-cover"
          />
          {/* Center stroke on album art */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: '-1.5px',
              border: '3px solid rgba(255,255,255,0.9)',
              borderRadius: '7.5px',
            }}
          />
        </motion.div>

        {/* Song info */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          {/* Label */}
          <span
            className="uppercase font-inter"
            style={{
              fontWeight: 500,
              fontSize: isMobile ? '10px' : `${Math.round(11 * contentScale)}px`,
              letterSpacing: '0.33px',
              color: isInvertedWhite ? 'rgba(26,26,46,0.6)' : 'rgba(255,255,255,0.6)',
              lineHeight: '1.2',
            }}
          >
            {card.label}
          </span>
          {/* Song title */}
          <span
            className="truncate w-full text-left font-inter"
            style={{
              fontWeight: 500,
              fontSize: isMobile ? '14px' : `${Math.round(19 * contentScale)}px`,
              color: isInvertedWhite ? 'rgba(26,26,46,1)' : '#FFFFFF',
              lineHeight: '1.3',
              marginTop: isMobile ? '2px' : `${Math.round(4 * contentScale)}px`,
            }}
          >
            {card.songTitle}
          </span>
          {/* Artist */}
          <span
            className="truncate w-full text-left font-inter"
            style={{
              fontWeight: 400,
              fontSize: isMobile ? '12px' : `${Math.round(15 * contentScale)}px`,
              color: isInvertedWhite ? 'rgba(26,26,46,0.7)' : 'rgba(255,255,255,0.75)',
              lineHeight: '1.3',
              marginTop: isMobile ? '1px' : `${Math.round(2 * contentScale)}px`,
            }}
          >
            {card.artist}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

// HighlightsContainer component - simple container for highlight buttons
interface HighlightsContainerProps {
  highlights: {
    label: string
    image?: string
    href?: string
  }[]
  styles: typeof variantStylesLight.blue
  onHighlightClick?: (label: string) => void
  isMobile?: boolean
  contentScale?: number // Scale factor for tablet/shallow viewports
}

function HighlightsContainer({ highlights, styles, onHighlightClick, isMobile = false, contentScale = 1 }: HighlightsContainerProps) {
  // Calculate the stacked offset for each item - they start collapsed at x=0 with slight stagger
  const stackOffset = 8 // Each item offset by 8px when stacked
  // Spacing value used for stacked animation calculation (items slide in from stacked position)
  const animationSpacing = isMobile ? 12 : Math.round(16 * contentScale)

  return (
    <div
      className="w-full rounded-[10px] overflow-hidden relative"
      style={{
        backgroundColor: styles.highlightShadow,
        boxShadow: 'none',
      }}
    >
      {/* Inner stroke overlay */}
      <div
        className="absolute inset-0 rounded-[10px] pointer-events-none z-10"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      />

      {/* Highlights content area - items fan out from stacked position */}
      {/* 5 items: use justify-evenly for uniform spacing */}
      {/* 4 or fewer items: use gap + center for tighter grouping */}
      <div
        className={`flex ${highlights.length >= 5 ? 'justify-evenly' : 'justify-center'}`}
        style={{
          gap: highlights.length >= 5 ? undefined : (isMobile ? 12 : Math.round(16 * contentScale)),
          paddingTop: isMobile ? '14px' : `${Math.round(28 * contentScale)}px`,
          paddingBottom: isMobile ? '12px' : `${Math.round(24 * contentScale)}px`,
        }}
      >
        {highlights.map((highlight, i) => {
          // Calculate how far left each item needs to move to reach its stacked position
          // Item 0 stays at 0, item 1 moves left by (1 * gap - 1 * stackOffset), etc.
          // This creates a stacked effect where items overlap but are slightly offset
          const stackedX = -(i * animationSpacing) + (i * stackOffset)
          // Base delay so fan-out starts after the section is visible, plus stagger per item
          const baseDelay = 0.2
          const itemDelay = baseDelay + i * 0.04

          // Desktop: fade + scale up animation (center-aligned items)
          // Mobile: cascade from left animation (left-aligned items)
          return (
            <motion.div
              key={i}
              initial={isMobile ? { x: stackedX, opacity: 0 } : { scale: 0.25, opacity: 0 }}
              animate={isMobile ? {
                x: 0,
                opacity: 1,
                transition: {
                  x: { ...signatureSpring, delay: itemDelay },
                  opacity: { duration: 0.15, ease: 'easeOut', delay: itemDelay }
                }
              } : {
                scale: 1,
                opacity: 1,
                transition: {
                  scale: { ...signatureSpring, delay: itemDelay },
                  opacity: { duration: 0.2, ease: 'easeOut', delay: itemDelay }
                }
              }}
              exit={isMobile ? {
                x: stackedX,
                opacity: 0,
                transition: {
                  x: contentSpring,
                  opacity: { duration: 0.1, ease: 'easeIn' }
                }
              } : {
                scale: 0.25,
                opacity: 0,
                transition: {
                  scale: contentSpring,
                  opacity: { duration: 0.1, ease: 'easeIn' }
                }
              }}
            >
              <HighlightButton
                highlight={highlight}
                styles={styles}
                onHighlightClick={onHighlightClick}
                isMobile={isMobile}
                contentScale={contentScale}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// DescriptionContainer component - simple text container for description paragraphs
interface DescriptionContainerProps {
  description: React.ReactNode[]
  styles: typeof variantStylesLight.blue
  isMobile?: boolean
  contentScale?: number // Scale factor for shallow viewports (1 = canonical size)
}

function DescriptionContainer({ description, styles, isMobile = false, contentScale = 1 }: DescriptionContainerProps) {
  // Canonical width at scale 1: 500px card - 48px padding = 452px
  const canonicalWidth = 452
  const scaledWidth = Math.round(canonicalWidth * contentScale)
  // Scale font sizes proportionally
  const fontSize = isMobile ? 14 : Math.round(18 * contentScale)
  const lineHeight = isMobile ? 20 : Math.round(26 * contentScale)

  return (
    <div
      style={{
        // Mobile: fill available width (container handles padding)
        // Desktop: scale width proportionally with card
        width: isMobile ? '100%' : `${scaledWidth}px`,
      }}
    >
      {description.map((paragraph, i) => (
        <p
          key={i}
          className="font-inter"
          style={{
            fontWeight: 300,
            fontSize: `${fontSize}px`,
            lineHeight: `${lineHeight}px`,
            letterSpacing: '0',
            color: styles.textColor,
          }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  )
}

export function MorphingCard({
  card,
  isExpanded,
  expandedPosition,
  collapsedPosition,
  exitPosition,
  onClick,
  onClose,
  onHighlightClick,
  hideShortcut = false,
  compactCta = false,
  mobileLabel,

  themeMode = 'light',
  parallaxOffset = 0,
  isStackedBehind = false,
  stackedRotation = 0,
  stackedScale = 1,
  zIndexOverride,
  useBouncyTransition = false,
  isFocused = true,
  initialBorderRadius = 16,
  expandedFromCompact = false,
  isOverDark = false,
}: MorphingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [swipeDownOffset, setSwipeDownOffset] = useState(0)
  const [isSwipingDown, setIsSwipingDown] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const styles = getVariantStyles(themeMode)[card.variant]
  const { expandedContent } = card

  // Disable spotlight on touch devices — only a desktop mouse moment
  const hasPointer = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasPointer || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x: xPercent, y: yPercent })
  }

  // Spotlight gradient for hover state (desktop only)
  const defaultBorderColor = styles.border
  const spotlightGradient = (isHovered && hasPointer)
    ? card.variant === 'cta'
      ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(230, 230, 232, 0.35) 15%, ${defaultBorderColor} 35%, rgba(200, 200, 205, 0.15) 55%, rgba(195, 195, 200, 0.17) 100%)`
      : `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(200, 210, 230, 0.45) 15%, ${defaultBorderColor} 35%, rgba(140, 140, 150, 0.3) 55%, rgba(120, 120, 130, 0.35) 100%)`
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
              className="font-inter"
              style={{ fontSize: '12px', fontWeight: 500, lineHeight: '15px', letterSpacing: '0.01em', color: styles.secondaryText }}
            >
              {card.label}
            </span>
            <span
              className="font-inter"
              style={{ fontSize: '18px', fontWeight: 500, lineHeight: '24px', letterSpacing: '-0.01em', color: styles.textColor }}
            >
              {card.title}
            </span>
          </div>
          <span
            className="uppercase font-dotgothic"
            style={{
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '100%',
              color: styles.secondaryText,
              padding: '4.5px 8px 3.5px',
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

  // Extract content scale from expandedPosition (for shallow viewport scaling)
  const contentScale = expandedPosition.scale ?? 1

  // Override CTA styles for expanded state — collapsed uses transparent bg + gray text,
  // but expanded needs solid white bg + dark text (original values)
  const expandedStyles = card.variant === 'cta' ? {
    ...styles,
    bg: '#FFFFFF',
    textColor: '#8E8E8E',
    ctaTitleColor: '#8E8E8E',
    border: 'rgba(0,0,0,0.05)',
    badgeBg: 'rgba(0,0,0,0.08)',
  } : styles

  // If expanded with collapsedPosition, this is a portal card that animates from collapsed to expanded
  if (isExpanded && collapsedPosition) {
    return (
      <motion.div
        ref={cardRef}
        className="fixed overflow-hidden"
        // Non-CTA cards have rich/dark backgrounds — invert cursor to light variant
        {...(card.variant !== 'cta' ? { 'data-cursor-invert': '' } : {})}
        // Suppress i-beam text cursor on expanded card content (read-only text).
        // The CTA "Add a role..." input is a real <input> which uses native caret, not TEXT_NODE.
        data-cursor-no-text=""
        style={{
          backgroundColor: expandedStyles.bg,
          color: expandedStyles.textColor,
          zIndex: zIndexOverride ?? 9999,
          pointerEvents: isStacked ? 'none' : 'auto',
          // Parallax offset applied via Framer Motion's x property for real-time velocity response
          x: parallaxOffset,
          // Swipe-down offset for dismiss gesture feedback
          y: swipeDownOffset,
          transformOrigin: 'center center',
          // CTA: overflow visible so the SVG dashed border stroke isn't clipped.
          // From compact: blur is handled by the ghost overlay (not the portal).
          // From default: portal provides its own backdropFilter blur.
          // (non-CTA cards need overflow:hidden for content clipping during expand/collapse)
          ...(card.variant === 'cta' && expandedFromCompact
            ? { overflow: 'visible' as const }
            : card.variant === 'cta'
              ? { backdropFilter: 'blur(8px)', overflow: 'visible' as const }
              : {}),
        }}
        initial={{
          top: Math.round(collapsedPosition.top),
          left: Math.round(collapsedPosition.left),
          width: Math.round(collapsedPosition.width),
          height: Math.round(collapsedPosition.height),
          borderRadius: initialBorderRadius,
          rotate: 0,
          scale: 1,
        }}
        animate={{
          top: expandedPosition.y,
          left: expandedPosition.x,
          width: expandedPosition.width,
          height: expandedPosition.height,
          borderRadius: 20,
          rotate: stackedRotation,
          scale: stackedScale,
        }}
        exit={{
          // When returning to compact pill, use exact fractional values (no rounding) so the portal's
          // final frame pixel-perfectly matches the real compact bar that replaces it on unmount
          top: expandedFromCompact
            ? (exitPosition ?? collapsedPosition).top
            : Math.round((exitPosition ?? collapsedPosition).top),
          left: expandedFromCompact
            ? (exitPosition ?? collapsedPosition).left
            : Math.round((exitPosition ?? collapsedPosition).left),
          width: expandedFromCompact
            ? (exitPosition ?? collapsedPosition).width
            : Math.round((exitPosition ?? collapsedPosition).width),
          height: expandedFromCompact
            ? (exitPosition ?? collapsedPosition).height
            : Math.round((exitPosition ?? collapsedPosition).height),
          borderRadius: initialBorderRadius,
          rotate: 0,
          scale: 1,
          boxShadow: 'none',
          // Transition bg to match collapsed/compact pill appearance on unmount.
          // CTA compact: portal bg goes transparent so the ghost's own backdropFilter blur
          // sees through to the page (ghost provides the semi-transparent bg + blur).
          ...(expandedFromCompact && card.variant === 'cta'
            ? { backgroundColor: 'transparent' }
            : (expandedFromCompact || card.variant === 'cta')
              ? { backgroundColor: styles.bg }
              : {}),
          transition: (() => {
            // Compact-close uses a fast tween: no overshoot, no long settling tail.
            // A spring's overdamped mode converges slowly in the last few pixels (340ms tail),
            // which leaves a visible blob near the mini tray. A 200ms ease-out tween
            // reaches the target cleanly and triggers onExitComplete promptly.
            const collapseTween = { type: 'tween' as const, duration: 0.2, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] as [number, number, number, number] }
            const collapseTransition = reduced
              ? { duration: 0.01 }
              : expandedFromCompact
                ? collapseTween
                : mobileCollapseSpring
            return {
              top: collapseTransition,
              left: collapseTransition,
              width: collapseTransition,
              height: collapseTransition,
              borderRadius: collapseTransition,
              rotate: collapseTransition,
              scale: collapseTransition,
              boxShadow: { duration: 0.4, ease: 'easeOut' },
              backgroundColor: expandedFromCompact && card.variant === 'cta'
                ? { duration: 0.1, ease: 'easeOut' }
                : { duration: 0.2, ease: 'easeOut' },
            }
          })(),
        }}
        transition={reduced ? { duration: 0.01 } : {
          // Position - use bouncy spring for carousel nav AND for exit (collapse) animation
          top: useBouncyTransition ? ctaEntranceSpring : ctaEntranceSpring,
          left: useBouncyTransition ? ctaEntranceSpring : ctaEntranceSpring,
          // Size is critically damped - no bounce
          width: contentSpring,
          height: contentSpring,
          borderRadius: contentSpring,
          // Rotation/scale - bouncy for stacked cards during carousel nav, normal otherwise
          rotate: (isStacked && useBouncyTransition) ? stackedRotationSpring : positionSpring,
          scale: (isStacked && useBouncyTransition) ? stackedRotationSpring : positionSpring,
          // No transition on x - it should update instantly for real-time parallax
          x: { duration: 0 },
          // Y uses spring when releasing swipe, instant when dragging
          y: isSwipingDown ? { duration: 0 } : ctaEntranceSpring,
        }}
        onClick={(e) => {
          // Stop propagation to prevent the backdrop click handler from closing the card
          e.stopPropagation()
        }}
        onMouseEnter={() => hasPointer && !isStacked && setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Border - uses expandedBorder color when expanded */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: `1px solid ${styles.expandedBorder}`,
          }}
          initial={{ borderRadius: initialBorderRadius }}
          animate={{ borderRadius: 20, opacity: 1 }}
          exit={{
            borderRadius: expandedFromCompact ? 44 : 16,
            // When expandedFromCompact or CTA, fade out — the ghost has its own border
            ...((expandedFromCompact || card.variant === 'cta') ? { opacity: 0 } : {}),
          }}
          transition={reduced ? { duration: 0.01 } : {
            ...contentSpring,
            opacity: { duration: 0 },
          }}
        />

        {/* CTA: SVG dashed border — hidden when expanded, appears instantly on normal collapse exit */}
        {/* When expandedFromCompact, the ghost overlay provides its own rx=24 dashed border instead */}
        {card.variant === 'cta' && !expandedFromCompact && (
          <motion.svg
            className="absolute pointer-events-none"
            style={{ inset: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'visible' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ opacity: { duration: 0 } }}
          >
            <rect
              x="0" y="0" width="100%" height="100%"
              rx="16" ry="16"
              fill="none"
              stroke={styles.border}
              strokeWidth="2.5"
              strokeDasharray="12 8"
              strokeLinecap="round"
            />
          </motion.svg>
        )}

        {/* Spotlight hover effects - reduced opacity for expanded cards */}
        {/* Fill spotlight - subtle light following cursor */}
        <div
          className="absolute inset-0 rounded-[20px] pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 45%, transparent 80%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        />
        {/* Border spotlight layer */}
        <div
          className="absolute inset-0 rounded-[20px] pointer-events-none"
          style={{
            background: spotlightGradient,
            mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
            opacity: isHovered ? 0.6 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        />

        {/* Morphing text content - label and title scale proportionally with card */}
        {/* On mobile, this becomes a scrollable container for all content */}
        {/* On desktop/tablet, uses flexbox with space-between for auto-spacing between clusters (toggleable via Leva) */}
        <motion.div
          className={`absolute inset-0 flex flex-col ${(typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile) ? 'mobile-card-scroll' : 'justify-between'}`}
          style={{
            overflowY: (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile) ? 'auto' : 'hidden',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
          initial={{ padding: compactCta ? '18px 10px 19px 12px' : '18px 10px 19px 20px' }}
          animate={{ padding: (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile) ? '24px 14px 16px 16px' : (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.desktop) ? '24px 24px 18px 24px' : '24px 22px 24px 24px' }}
          exit={{
            ...(expandedFromCompact
              ? { opacity: 0, transition: { opacity: { duration: 0.06, ease: 'easeOut' } } }
              : { padding: compactCta ? '18px 10px 19px 12px' : '18px 10px 19px 20px',
                  transition: { padding: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] } } }),
          }}
          transition={reduced ? { duration: 0.01 } : contentSpring}
          onTouchStart={(e) => {
            // Track touch start position for direction detection
            const touch = e.touches[0]
            const target = e.currentTarget as HTMLElement
            target.dataset.touchStartX = String(touch.clientX)
            target.dataset.touchStartY = String(touch.clientY)
            target.dataset.touchDirection = ''
            target.dataset.scrollTopAtStart = String(target.scrollTop)
          }}
          onTouchMove={(e) => {
            // On mobile, detect swipe direction to decide whether to allow vertical scroll
            // or let horizontal swipe propagate to parent for card navigation
            if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile) {
              const target = e.currentTarget as HTMLElement
              const startX = parseFloat(target.dataset.touchStartX || '0')
              const startY = parseFloat(target.dataset.touchStartY || '0')
              const scrollTopAtStart = parseFloat(target.dataset.scrollTopAtStart || '0')
              const touch = e.touches[0]
              const deltaX = Math.abs(touch.clientX - startX)
              const deltaY = touch.clientY - startY // Keep sign for direction

              // If direction not yet determined, check which axis has more movement
              if (!target.dataset.touchDirection) {
                if (deltaX > 10 || Math.abs(deltaY) > 10) {
                  target.dataset.touchDirection = deltaX > Math.abs(deltaY) ? 'horizontal' : 'vertical'
                }
              }

              // If horizontal swipe and NOT already swiping down, let it propagate for card navigation
              if (target.dataset.touchDirection === 'horizontal' && !isSwipingDown) {
                return
              }

              // If swiping DOWN and we're at the top of scroll, apply rubber band effect
              // Note: We don't call preventDefault() to avoid passive listener warnings
              // The rubber band visual effect still works, scroll may compete slightly
              if (target.dataset.touchDirection === 'vertical' && deltaY > 0 && scrollTopAtStart <= 0) {
                setIsSwipingDown(true)
                // Rubber band effect: diminishing returns as you drag further
                const rubberBandOffset = Math.sqrt(deltaY) * 8
                setSwipeDownOffset(rubberBandOffset)
                return
              }
            }
          }}
          onTouchEnd={(e) => {
            // On mobile & tablet, check for swipe-down-to-dismiss
            if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.desktop) {
              const target = e.currentTarget as HTMLElement
              const startY = parseFloat(target.dataset.touchStartY || '0')
              const scrollTopAtStart = parseFloat(target.dataset.scrollTopAtStart || '0')
              const touch = e.changedTouches[0]
              const deltaY = touch.clientY - startY

              // Reset swipe state
              setIsSwipingDown(false)
              setSwipeDownOffset(0)

              // If we swiped down significantly while at the top, dismiss
              if (deltaY > 100 && scrollTopAtStart <= 0) {
                onClose()
              }
            }
          }}
        >
          {/* CTA card uses custom AddNewRoleContent layout */}
          {card.variant === 'cta' ? (
            <AddNewRoleContent
              onClose={onClose}
              isMobile={compactCta || (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile)}
              hideShortcut={hideShortcut}
              shortcut={card.shortcut}
              contentScale={contentScale}
              isFocused={isFocused}
              styles={expandedStyles}
              expandedFromCompact={expandedFromCompact}
              compactLabel={card.compactLabel || card.label}
            />
          ) : (
          <>
          {/* Shortcut badge - absolutely positioned at top right, animates position with padding */}
          {/* Separate from the text cluster to match collapsed card structure */}
          <motion.div
            data-cursor="morph"
            data-cursor-radius="20"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="flex items-center justify-center rounded-full shrink-0 cursor-pointer absolute"
            style={{ backgroundColor: styles.badgeBg }}
            initial={{ right: 10, top: 10, paddingTop: '4px', paddingBottom: '4px', paddingLeft: '8px', paddingRight: '8px', opacity: hideShortcut ? 0 : 1 }}
            animate={{ right: (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile) ? 14 : (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.desktop) ? 16 : 22, top: (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile) ? 18 : (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.desktop) ? 16 : 22, paddingTop: '4px', paddingBottom: '4px', paddingLeft: '18px', paddingRight: '17px', opacity: hideShortcut ? 0 : 1 }}
            exit={{
              right: 10,
              top: 10,
              paddingTop: '4px', paddingBottom: '4px', paddingLeft: '8px', paddingRight: '8px',
              opacity: (hideShortcut || expandedFromCompact) ? 0 : 1,
              transition: expandedFromCompact
                ? { opacity: { duration: 0.08, ease: 'easeOut' } }
                : undefined,
            }}
            transition={reduced ? { duration: 0.01 } : contentSpring}
          >
            {/* Badge text - same size as collapsed card */}
            <div
              className="uppercase leading-[100%] relative text-[12px] font-dotgothic"
              style={{ fontWeight: 400, letterSpacing: '0.12em', top: '-0.5px' }}
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

          {/* TOP CLUSTER: Header + Title + Date Range */}
          {/* This cluster stays at the top of the card */}
          {/* flex flex-col gap-[5px] matches collapsed card layout to prevent jump on exit */}
          <motion.div
            className="flex-shrink-0 flex flex-col"
            style={{ gap: 5 }}
            exit={undefined}
          >
            {/* Label - morphs from collapsed to expanded */}
            <motion.div
              className="text-left font-inter"
              style={{ color: styles.textColor, fontSize: '12px', fontWeight: 500, lineHeight: '15px', letterSpacing: '0.01em', transformOrigin: 'top left', whiteSpace: 'nowrap', overflow: 'hidden' }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 14 / 12, opacity: 1 }}
              exit={{
                scale: 1,
                opacity: compactCta ? 0 : 1,
                transition: {
                  scale: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
                  ...(compactCta ? { opacity: { duration: 0.15, ease: 'easeOut' } } : {}),
                },
              }}
              transition={reduced ? { duration: 0.01 } : contentSpring}
            >
              {label}
            </motion.div>

            {/* Morphing title - scales proportionally from collapsed to expanded */}
            {/* Uses transform scale instead of fontSize to prevent text reflow during transition */}
            {/* white-space: nowrap prevents text from re-wrapping during scale animation */}
            {/* Mobile uses smaller scale (26/18) to fit within narrower container */}
            {/* For compactCta (mobile CTA), fade out quickly on exit since collapsed state has different layout */}
            <motion.div
              className="text-left w-full font-inter"
              style={{ color: styles.textColor, transformOrigin: 'top left', fontSize: '18px', fontWeight: 500, lineHeight: '24px', letterSpacing: '-0.01em', whiteSpace: 'nowrap', position: 'relative' }}
              initial={{ scale: 1, marginTop: '-4px', marginLeft: '0px', opacity: 1 }}
              animate={{ scale: (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile) ? 28 / 18 : (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.desktop) ? 30 / 18 : 34 / 18, marginTop: '1px', marginLeft: '-1px', opacity: 1 }}
              exit={{
                scale: 1,
                marginTop: '-4px',
                marginLeft: '0px',
                opacity: compactCta ? 0 : 1,
                transition: {
                  scale: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
                  marginTop: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
                  marginLeft: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
                  ...(compactCta ? { opacity: { duration: 0.1, ease: 'easeOut' } } : {}),
                },
              }}
              transition={reduced ? { duration: 0.01 } : contentSpring}
            >
              {card.title}
            </motion.div>

            {/* Date Range - part of top cluster */}
            {(() => {
              const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile
              const isTabletViewport = typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS.mobile && window.innerWidth < BREAKPOINTS.desktop
              return expandedContent.dateRange && (
                <motion.p
                  className="font-inter"
                  style={{
                    fontWeight: 400,
                    fontSize: isMobileViewport ? '14px' : isTabletViewport ? '16px' : '18px',
                    lineHeight: isMobileViewport ? '20px' : isTabletViewport ? '22px' : '26px',
                    letterSpacing: '-0.01em',
                    color: styles.textColor,
                    marginTop: isMobileViewport ? '20px' : isTabletViewport ? '16px' : '28px',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.05, ease: 'easeOut' }}
                >
                  {expandedContent.dateRange.includes('→') ? (
                    <>
                      {expandedContent.dateRange.split('→')[0]}
                      <IoMdArrowForward style={{ display: 'inline', verticalAlign: 'middle', fontSize: '0.9em', margin: '0 1px', position: 'relative', top: '-1px' }} />
                      {expandedContent.dateRange.split('→')[1]}
                    </>
                  ) : (
                    expandedContent.dateRange
                  )}
                </motion.p>
              )
            })()}
          </motion.div>

          {/* MOBILE ONLY: Description + Bottom content in a separate structure */}
          {/* Date Range + Description + Bottom Content - fades in */}
          {(() => {
            const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile

            // Mobile layout uses different structure
            if (!isMobileViewport) return null

            return (
              <>
                {/* Description Container - mobile */}
                <div style={{ marginTop: '24px' }}>
                  <DescriptionContainer
                    description={expandedContent.description}
                    styles={styles}
                    isMobile={true}
                  />
                </div>

                {/* Mobile bottom content - absolutely positioned at bottom */}
                {isMobileViewport && (
                  <motion.div
                    className="flex flex-col"
                    style={{
                      position: 'absolute',
                      left: '16px',
                      right: '16px',
                      bottom: '16px',
                      gap: '16px',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { opacity: { duration: 0.1, ease: 'easeOut' } } }}
                  >
                    {/* Pinned label - shown once when any pinned content exists (matching desktop) */}
                    {(expandedContent.highlights?.length || expandedContent.nowPlayingCard || expandedContent.reflectionsCard) && (
                      <motion.p
                        className="flex items-center gap-2 font-inter"
                        style={{
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '20px',
                          letterSpacing: '-0.01em',
                          color: styles.textColor,
                          opacity: 0.9,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9, transition: { opacity: { duration: 0.2, ease: 'easeOut', delay: 0.12 } } }}
                        exit={{ opacity: 0, transition: { opacity: { duration: 0.1, ease: 'easeIn', delay: 0.1 } } }}
                      >
                        <RiPushpinLine style={{ width: '12px', height: '12px', transform: 'scaleX(-1)' }} />
                        <span style={{ marginLeft: '-1px' }}>Pinned</span>
                      </motion.p>
                    )}

                    {/* Highlights Section (IG Stories) */}
                    {expandedContent.highlights && expandedContent.highlights.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { opacity: { duration: 0.25, ease: 'easeOut', delay: 0.18 } } }}
                        exit={{ opacity: 0, transition: { opacity: { duration: 0.12, ease: 'easeIn', delay: 0.12 } } }}
                      >
                        <HighlightsContainer
                          highlights={expandedContent.highlights}
                          styles={styles}
                          onHighlightClick={onHighlightClick}
                          isMobile={true}
                        />
                      </motion.div>
                    )}

                    {/* Now Playing Card (Music) */}
                    {expandedContent.nowPlayingCard && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { opacity: { duration: 0.25, ease: 'easeOut', delay: 0.26 } } }}
                        exit={{ opacity: 0, transition: { opacity: { duration: 0.12, ease: 'easeIn', delay: 0.08 } } }}
                      >
                        <NowPlayingCard
                          card={expandedContent.nowPlayingCard}
                          styles={styles}
                          themeMode={themeMode}
                          variant={card.variant}
                          isMobile={true}
                        />
                      </motion.div>
                    )}

                    {/* Reflections Card (Video) */}
                    {expandedContent.reflectionsCard && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { opacity: { duration: 0.25, ease: 'easeOut', delay: 0.34 } } }}
                        exit={{ opacity: 0, transition: { opacity: { duration: 0.12, ease: 'easeIn', delay: 0.04 } } }}
                      >
                        <ReflectionsCard
                          card={expandedContent.reflectionsCard}
                          themeMode={themeMode}
                          variant={card.variant}
                          isMobile={true}
                          chip={
                            card.variant === 'blue'
                              ? { icon: 'slides', text: '35 Slides' }
                              : card.variant === 'white'
                              ? { icon: 'play', text: '29:21' }
                              : card.variant === 'red'
                              ? { icon: 'play', text: '3:35' }
                              : undefined
                          }
                          previewFrames={expandedContent.reflectionsCard.previewFrames}
                          previewVideo={expandedContent.reflectionsCard.previewVideo}
                          isActive={isFocused}
                        />
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    {expandedContent.actions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { opacity: { duration: 0.25, ease: 'easeOut', delay: 0.42 } } }}
                        exit={{ opacity: 0, transition: { opacity: { duration: 0.12, ease: 'easeIn' } } }}
                      >
                        <div className="flex flex-col gap-3">
                          {expandedContent.actions.map((action, i) => {
                            const Icon = action.icon ? iconMap[action.icon] : null
                            const isPrimary = action.primary

                            return (
                              <button
                                key={i}
                                data-cursor="morph"
                                data-cursor-radius="5"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center gap-3 rounded-[5px] relative overflow-hidden"
                                style={{
                                  width: '100%',
                                  height: '56px',
                                  backgroundColor: isPrimary ? styles.primaryButtonBg : styles.secondaryButtonBg,
                                  color: isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
                                  borderBottom: `2px solid ${isPrimary ? styles.primaryButtonBorder : styles.secondaryButtonBorder}`,
                                }}
                              >
                                {Icon && <Icon className="w-5 h-5" />}
                                <span data-cursor-parallax="" className="text-[18px] uppercase font-inter" style={{ fontWeight: 500, letterSpacing: '-0.01em' }}>
                                  {action.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </>
            )
          })()}

          {/* DESKTOP/TABLET: Middle cluster (description) + Bottom cluster (pinned content) */}
          {/* Uses flexbox space-between layout for auto-spacing between top/middle/bottom */}
          {/* Content scales proportionally with card dimensions via contentScale */}
          {typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS.mobile && (() => {
            return (
            <>
              {/* MIDDLE CLUSTER: Description - takes remaining space, vertically centered */}
              <div
                className="flex items-center"
                style={{ flex: '1 1 0%' }}
              >
                <motion.div
                  style={{ marginTop: `${Math.round(28 * contentScale)}px`, marginBottom: `${Math.round(28 * contentScale)}px` }}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      opacity: { duration: 0.2, ease: 'easeOut', delay: 0.08 },
                      y: { ...contentSpring, delay: 0.08 }
                    }
                  }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.1, ease: 'easeIn' } }}
                >
                  <DescriptionContainer
                    description={expandedContent.description}
                    styles={styles}
                    isMobile={false}
                    contentScale={contentScale}
                  />
                </motion.div>
              </div>

              {/* BOTTOM CLUSTER: Pinned content - anchored to bottom via flexbox */}
              <motion.div
                className="flex flex-col flex-shrink-0"
                style={{
                  gap: `${Math.round(16 * contentScale)}px`,
                  overflow: 'hidden',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: { opacity: { duration: 0.1, ease: 'easeOut' } },
                }}
              >
              {/* Pinned highlights label - shown when any pinned content exists */}
              {(expandedContent.highlights?.length || expandedContent.nowPlayingCard || expandedContent.reflectionsCard) && (
                <motion.p
                  className="flex items-center font-inter"
                  style={{
                    fontWeight: 400,
                    fontSize: `${Math.round(18 * contentScale)}px`,
                    lineHeight: `${Math.round(26 * contentScale)}px`,
                    letterSpacing: '-0.01em',
                    color: styles.textColor,
                    opacity: 0.9,
                    gap: `${Math.round(8 * contentScale)}px`,
                  }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{
                    opacity: 0.9,
                    y: 0,
                    transition: {
                      opacity: { duration: 0.2, ease: 'easeOut', delay: 0.12 },
                      y: { ...contentSpring, delay: 0.12 }
                    }
                  }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.1, ease: 'easeIn', delay: 0.1 } }}
                >
                  <RiPushpinLine style={{ width: `${Math.round(16 * contentScale)}px`, height: `${Math.round(16 * contentScale)}px`, transform: 'scaleX(-1)' }} />
                  <span style={{ marginLeft: '-1px' }}>Pinned</span>
                </motion.p>
              )}

              {/* Highlights Section (IG Stories) */}
              {expandedContent.highlights && expandedContent.highlights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      opacity: { duration: 0.25, ease: 'easeOut', delay: 0.18 },
                      y: { ...contentSpring, delay: 0.18 }
                    }
                  }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.1, ease: 'easeIn', delay: 0.08 } }}
                >
                  <HighlightsContainer
                    highlights={expandedContent.highlights}
                    styles={styles}
                    onHighlightClick={onHighlightClick}
                    isMobile={false}
                    contentScale={contentScale}
                  />
                </motion.div>
              )}

              {/* Now Playing Card (Music) */}
              {expandedContent.nowPlayingCard && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      opacity: { duration: 0.25, ease: 'easeOut', delay: 0.24 },
                      y: { ...contentSpring, delay: 0.24 }
                    }
                  }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.1, ease: 'easeIn', delay: 0.05 } }}
                >
                  <NowPlayingCard
                    card={expandedContent.nowPlayingCard}
                    styles={styles}
                    themeMode={themeMode}
                    variant={card.variant}
                    isMobile={false}
                    contentScale={contentScale}
                  />
                </motion.div>
              )}

              {/* Reflections Card (Video) */}
              {expandedContent.reflectionsCard && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      opacity: { duration: 0.25, ease: 'easeOut', delay: 0.30 },
                      y: { ...contentSpring, delay: 0.30 }
                    }
                  }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.1, ease: 'easeIn', delay: 0.02 } }}
                >
                  <ReflectionsCard
                    card={expandedContent.reflectionsCard}
                    themeMode={themeMode}
                    variant={card.variant}
                    isMobile={false}
                    contentScale={contentScale}
                    chip={
                      card.variant === 'blue'
                        ? { icon: 'slides', text: '35 Slides' }
                        : card.variant === 'white'
                        ? { icon: 'play', text: '29:21' }
                        : card.variant === 'red'
                        ? { icon: 'play', text: '3:35' }
                        : undefined
                    }
                    previewFrames={expandedContent.reflectionsCard.previewFrames}
                    previewVideo={expandedContent.reflectionsCard.previewVideo}
                    isActive={isFocused}
                  />
                </motion.div>
              )}

              {/* Action Buttons */}
              {expandedContent.actions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      opacity: { duration: 0.25, ease: 'easeOut', delay: 0.36 },
                      y: { ...contentSpring, delay: 0.36 }
                    }
                  }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.1, ease: 'easeIn' } }}
                >
                  <div className="flex flex-col" style={{ gap: `${Math.round(12 * contentScale)}px` }}>
                    {expandedContent.actions.map((action, i) => {
                      const Icon = action.icon ? iconMap[action.icon] : null
                      const isPrimary = action.primary
                      const buttonHeight = Math.round(65 * contentScale)
                      const iconSize = Math.round(20 * contentScale)
                      const fontSize = Math.round(20 * contentScale)

                      return (
                        <button
                          key={i}
                          data-cursor="morph"
                          data-cursor-radius="5"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center rounded-[5px] relative overflow-hidden"
                          style={{
                            width: '100%',
                            height: `${buttonHeight}px`,
                            gap: `${Math.round(12 * contentScale)}px`,
                            backgroundColor: isPrimary ? styles.primaryButtonBg : styles.secondaryButtonBg,
                            color: isPrimary ? styles.primaryButtonText : styles.secondaryButtonText,
                            borderBottom: `2px solid ${isPrimary ? styles.primaryButtonBorder : styles.secondaryButtonBorder}`,
                          }}
                        >
                          {Icon && <Icon style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />}
                          <span data-cursor-parallax="" className="uppercase font-inter" style={{ fontWeight: 500, letterSpacing: '-0.01em', fontSize: `${fontSize}px` }}>
                            {action.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
          )
        })()}

        </>
        )}

        </motion.div>

        {/* Non-CTA compact ghost removed: close-from-compact now targets mini tray (28×8px bare
            colored pills with no text/badge/border), so the card's own exit backgroundColor
            handles the visual match. The old ghost showed expanded-compact-bar labels + borders
            that don't exist at mini-tray size. */}

        {/* CTA compact pill ghost — fades in during exit to match the mini tray CTA pill.
            Uses mini-tray-sized border params (rx=4, thin stroke, small dashes) since the
            exit target is the 28×8px mini pill, not the expanded compact pill. */}
        {expandedFromCompact && card.variant === 'cta' && (() => {
          const ghostBorderColor = isOverDark ? 'rgba(255,255,255,0.4)' : '#cacaca'
          const ghostBg = isOverDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.36)'
          return (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 44,
              backgroundColor: ghostBg,
              boxSizing: 'border-box',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ opacity: { duration: 0.12, ease: 'easeIn', delay: 0.12 } }}
          >
            <svg
              className="absolute pointer-events-none"
              style={{ inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
            >
              <rect
                x="0" y="0" width="100%" height="100%"
                rx="4" ry="4"
                fill="none"
                stroke={ghostBorderColor}
                strokeWidth="1.5"
                strokeDasharray="3 2.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          )
        })()}

      </motion.div>
    )
  }

  // Collapsed card (normal flow)
  return (
    <motion.div
      ref={cardRef}
      data-cursor="morph-only"
      data-cursor-radius="16"
      className="rounded-[16px] overflow-hidden cursor-pointer relative"
      style={{
        backgroundColor: styles.bg,
        color: styles.textColor,
        width: '100%',
        height: 'auto',
        ...(card.variant === 'cta' ? { backdropFilter: 'blur(8px)', overflow: 'visible' as const } : {}),
        boxShadow: 'none',
      }}
      animate={{
        scale: isHovered ? 1.02 : 1,
      }}
      transition={reduced ? { duration: 0.01 } : hoverTransition}
      onClick={() => {
        // On mobile, clear hover state when clicking to expand
        if (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.mobile) {
          setIsHovered(false)
        }
        onClick()
      }}
      onMouseEnter={() => {
        // Only enable hover on desktop
        if (typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS.mobile) {
          setIsHovered(true)
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={reduced ? undefined : { scale: 0.97, transition: { duration: 0.1 } }}
    >
      {/* Border — CTA uses SVG dashed stroke (dash:12, gap:8, round caps) to match Figma */}
      {card.variant === 'cta' ? (
        <svg
          className="absolute pointer-events-none"
          style={{ inset: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'visible' }}
        >
          <rect
            x="0" y="0" width="100%" height="100%"
            rx="16" ry="16"
            fill="none"
            stroke={styles.border}
            strokeWidth="2.5"
            strokeDasharray="12 8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <div
          className="absolute inset-0 rounded-[16px] pointer-events-none"
          style={{ border: `1px solid ${styles.border}` }}
        />
      )}

      {/* Spotlight hover effects */}
      <div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%)`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease-out',
        }}
      />
      {/* Border spotlight — skip for CTA (clashes with dotted SVG border) */}
      {card.variant !== 'cta' && (
        <div
          className="absolute rounded-[15px] pointer-events-none"
          style={{
            top: '1px',
            left: '1px',
            right: '1px',
            bottom: '1px',
            background: spotlightGradient,
            mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        />
      )}

      {/* Badge - positioned absolutely in top right, OUTSIDE the padded container */}
      {!compactCta && !hideShortcut && !expandedFromCompact && (
        <div
          className="absolute"
          style={{
            top: '10px',
            right: '10px',
            transform: (isHovered && !isExpanded) ? 'translateY(-20px)' : 'translateY(0)',
            opacity: (isHovered && !isExpanded) ? 0 : 1,
            transition: 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
            zIndex: 10,
          }}
        >
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              padding: '4px 8px',
              backgroundColor: card.variant === 'cta' ? 'rgba(0,0,0,0.08)' : styles.badgeBg,
            }}
          >
            <div
              className="text-[12px] uppercase leading-[100%] font-dotgothic"
              style={{
                fontWeight: 400,
                letterSpacing: '0.08em',
                position: 'relative',
                top: '-0.5px',
                ...(card.variant === 'cta' && { color: 'rgba(0,0,0,0.48)' }),
              }}
            >
              {card.shortcut}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed content with hover slide effect */}
      <div
        className="overflow-hidden h-full relative"
        style={{ padding: compactCta ? '18px 10px 19px 12px' : '18px 10px 19px 20px' }}
      >
        {compactCta ? (
          <div data-cursor-parallax="" className="flex flex-col items-center justify-center w-full h-full">
            <div
              className="text-[12px] text-center font-inter"
              style={{ fontWeight: 500, lineHeight: '15px', letterSpacing: '-0.01em' }}
            >
              Add a role...
            </div>
          </div>
        ) : (
          <>
            {/* Role + Title cluster - top aligned to match expanded card exit state */}
            <div data-cursor-parallax="" className="flex flex-col gap-[5px] w-full relative">
              {/* Label - slides up and fades on hover */}
              <div
                className="text-[12px] text-left font-inter"
                style={{
                  fontWeight: 500,
                  lineHeight: '15px',
                  letterSpacing: '0.01em',
                  transform: (isHovered && !isExpanded) ? 'translateY(-20px)' : 'translateY(0)',
                  opacity: (isHovered && !isExpanded) ? 0 : 1,
                  transition: 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                }}
              >
                {label}
              </div>

              {/* Title - slides up to label position on hover */}
              <div
                className="text-left w-full font-inter"
                style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  lineHeight: '24px',
                  letterSpacing: '-0.01em',
                  marginTop: '-4px',
                  transform: (isHovered && !isExpanded) ? 'translateY(-21px)' : 'translateY(0)',
                  transition: 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                  color: card.variant === 'cta' ? (styles as typeof variantStylesLight.cta).ctaTitleColor : undefined,
                }}
              >
                {card.title}
              </div>

              {/* Date range - slides up from below on hover, hidden initially */}
              <div
                className="text-left absolute pointer-events-none font-inter"
                style={{
                  bottom: -19.5,
                  left: 0,
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '18px',
                  letterSpacing: '-0.01em',
                  transform: (isHovered && !isExpanded) ? 'translateY(-19px)' : 'translateY(0)',
                  opacity: (isHovered && !isExpanded) ? 1 : 0,
                  transition: 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
                  color: card.variant === 'cta' ? styles.textColor : undefined,
                }}
              >
                {expandedContent.dateRange.includes('→') ? (
                  <>
                    {expandedContent.dateRange.split('→')[0]}
                    <IoMdArrowForward style={{ display: 'inline', verticalAlign: 'middle', fontSize: '0.9em', margin: '0 1px', position: 'relative', top: '-1px' }} />
                    {expandedContent.dateRange.split('→')[1]}
                  </>
                ) : (
                  expandedContent.dateRange
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
