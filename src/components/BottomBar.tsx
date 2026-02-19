import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react'
import { IoMdArrowForward } from 'react-icons/io'
import { BREAKPOINTS, DURATION, WEIGHT } from '../constants'
import { colorTokens } from '../constants/themes'
import { elevations } from '../constants/elevations'
import { useNycTime } from '../hooks/useNycTime'
import { useStatusSchedule, ALL_STATUSES, getNextStatus, getNycDate } from '../hooks/useStatusSchedule'
import { useNycWeather } from '../hooks/useNycWeather'
import { gsap } from '../lib/gsap'
import { prefersReducedMotion } from '../hooks/useReducedMotion'

const ICON_STROKE = colorTokens.neutralDarkGray

const SLIDE_TRANSITION = 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.25s cubic-bezier(0.33, 1, 0.68, 1)'

export function BottomBar() {
  const { hours, minutes, period, timezone, colonVisible } = useNycTime()
  const currentStatus = useStatusSchedule()
  const weather = useNycWeather()
  const barRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)

  // Active status index — always reflects the current time-based status
  const statusIndex = ALL_STATUSES.indexOf(currentStatus)

  const [hovered, setHovered] = useState(false)

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.mobile : false
  )
  const [isTouch, setIsTouch] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.tablet : false
  )
  const [isWide, setIsWide] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.tabletWide : true
  )

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setIsMobile(w < BREAKPOINTS.mobile)
      setIsTouch(w < BREAKPOINTS.tablet)
      setIsWide(w >= BREAKPOINTS.tabletWide)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Collapse on outside tap (touch devices only)
  useEffect(() => {
    if (!isTouch || !hovered) return
    const handleOutsideTap = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setHovered(false)
      }
    }
    document.addEventListener('pointerdown', handleOutsideTap)
    return () => document.removeEventListener('pointerdown', handleOutsideTap)
  }, [isTouch, hovered])

  // Entrance — slide up from below after TopCards stagger in.
  // Uses autoAlpha (visibility + opacity) so it doesn't conflict with the
  // scroll-driven opacity tween that takes over after entrance completes.
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return

    // Reduced motion: show immediately, skip entrance + scroll animations
    if (prefersReducedMotion()) {
      gsap.set(bar, { autoAlpha: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      // Start hidden and offset
      gsap.set(bar, { autoAlpha: 0, y: 40 })

      // Entrance animation
      gsap.to(bar, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.3,
      })

      // Scroll-driven fade out — dissolve to 0 as user scrolls past hero.
      // Uses autoAlpha so visibility:hidden is set at 0.
      gsap.fromTo(bar,
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: '100vh top',
            scrub: 0.6,
            // Toggle pointerEvents at actual scroll position (no scrub lag).
            // The bar is position:fixed so it's always in the viewport —
            // without this, elementFromPoint picks it up and triggers cursor morph.
            onUpdate: (self) => {
              bar.style.pointerEvents = self.progress > 0.05 ? 'none' : 'auto'
            },
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  // On touch devices (<1024), tap toggles expand/collapse.
  const handleTap = useCallback(() => {
    if (isTouch) {
      setHovered(prev => !prev)
    }
  }, [isTouch])

  // Temperature display — with F unit
  const tempStr = weather.temp !== null ? `${weather.temp}\u00B0F` : '--'

  const fontSize = isMobile ? 15 : 18

  const status = ALL_STATUSES[statusIndex]
  const statusText = isMobile ? status.shortText : status.text

  // Next-status preview for hover slide-up
  const nextInfo = useMemo(() => getNextStatus(getNycDate()), [statusIndex])
  const previewText = (
    <>
      {status.shortText}
      {' '}<IoMdArrowForward aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', fontSize: '0.9em', margin: '0 1px', position: 'relative', top: '-1px' }} />{' '}
      {nextInfo.status.shortText} in {nextInfo.hoursUntil}h
    </>
  )

  // Location label — neighborhood per focus mode
  const locationLabels: Record<number, string> = {
    0: 'West Village',  // Designing
    1: 'Gramercy',      // Teaching
    2: 'Brooklyn',      // Dad mode
    3: 'Brooklyn',      // DND / Sleeping
  }
  const locationLabel = !isWide ? 'NYC' : (locationLabels[statusIndex] ?? 'New York')

  return (
    <div
      ref={barRef}
      role="button"
      tabIndex={0}
      aria-label="Status bar"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTap() } }}
      className="font-inter"
      data-bottom-bar
      data-cursor="morph"
      onClick={handleTap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: isMobile ? 'max(12px, env(safe-area-inset-bottom, 12px))' : 24,
        left: 0,
        right: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        zIndex: 40,
        height: 48,
        width: isMobile
          ? 'calc(100% - 24px)'                            // mobile (<768): full width minus padding
          : isWide
            ? 'calc(100vw - 48px)'                         // wide (≥1128): full width minus 24px each side
            : 'calc(10 * (100vw - 270px) / 12 + 180px)',   // tablet (768–1127): 10 columns + 9 gutters
        borderRadius: 16,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        background: hovered ? colorTokens.surfaceWhite : colorTokens.surfaceWhiteHover,
        border: hovered ? `1px solid ${colorTokens.surfaceWhite}` : `1px solid ${colorTokens.surfaceWhiteHover}`,
        boxShadow: elevations.figma5Step,
        padding: '0 20px 1px',
        fontWeight: WEIGHT.medium,
        fontSize,
        color: ICON_STROKE,
        pointerEvents: 'auto',
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Left — NYC Time (absolute so it doesn't shift center) */}
      <div data-cursor-parallax style={{
        position: 'absolute',
        left: 20,
        top: 0,
        bottom: 1,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        opacity: (isMobile && hovered) ? 0 : 1,
        transition: SLIDE_TRANSITION,
      }}>
        {isWide && (weather.isDaytime ? (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
            <circle cx="8" cy="8" r="3.5" stroke={ICON_STROKE} strokeWidth="1.5"/>
            <line x1="8" y1="0.5" x2="8" y2="2.5" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="13.5" x2="8" y2="15.5" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="0.5" y1="8" x2="2.5" y2="8" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="13.5" y1="8" x2="15.5" y2="8" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2.7" y1="2.7" x2="4.1" y2="4.1" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="11.9" y1="11.9" x2="13.3" y2="13.3" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2.7" y1="13.3" x2="4.1" y2="11.9" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="11.9" y1="4.1" x2="13.3" y2="2.7" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
            <path d="M6.5 1.5C6.5 1.5 6 4.5 7 7C8 9.5 11 11 13.5 10.5C12.5 13.5 9.5 15 6.5 14C3.5 13 1.5 9.5 2.5 6.5C3.5 3.5 6.5 1.5 6.5 1.5Z" stroke={ICON_STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ))}
        <span>
          {hours}
          <span style={{ opacity: colonVisible ? 1 : 0, transition: `opacity ${DURATION.fast}s ease` }}>:</span>
          {minutes} {period}{isWide && ` ${timezone}`}
        </span>
      </div>

      {/* Center — Status with slide-up hover reveal (matches topcard pattern) */}
      <div
        ref={centerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          position: 'relative',
        }}
      >
        {/* Current status — slides up and fades out on hover */}
        <div
          data-cursor-parallax
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transform: hovered ? 'translateY(-32px)' : 'translateY(0)',
            opacity: hovered ? 0 : 1,
            transition: SLIDE_TRANSITION,
          }}
        >
          {isWide && (
            <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={status.icon}
                alt=""
                style={{ width: 20, height: 20 }}
              />
            </div>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {statusText}
          </span>
        </div>

        {/* Preview — positioned below, slides up and fades in on hover */}
        <div
          data-cursor-parallax
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            transform: hovered ? 'translateY(0)' : 'translateY(32px)',
            opacity: hovered ? 1 : 0,
            transition: SLIDE_TRANSITION,
            pointerEvents: 'none',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {previewText}
          </span>
        </div>
      </div>

      {/* Right — Location + Temp (absolute so it doesn't shift center) */}
      <div data-cursor-parallax style={{
        position: 'absolute',
        right: 20,
        top: 0,
        bottom: 1,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        opacity: (isMobile && hovered) ? 0 : 1,
        transition: SLIDE_TRANSITION,
      }}>
        {isWide && (
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: 6 }}>
            <path d="M0.769144 5.95684L13.2691 0.191216C14.5973 -0.425972 15.6363 0.534966 15.0191 1.8709L9.26914 14.3084C8.68321 15.5897 6.97227 15.3318 6.96446 13.949L6.95664 8.33965C6.95664 8.26153 6.93321 8.23809 6.85508 8.23809L1.20664 8.21465C-0.137106 8.20684 -0.465231 6.52715 0.769144 5.95684ZM2.70664 6.7459L7.71446 6.71465C8.20664 6.70684 8.46446 6.97247 8.45664 7.44903L8.42539 12.4725C8.42539 12.5037 8.45664 12.5037 8.47227 12.4725L13.316 1.92559C13.3473 1.86309 13.316 1.84747 13.2613 1.86309L2.69883 6.69122C2.65977 6.70684 2.66758 6.7459 2.70664 6.7459Z" fill={ICON_STROKE}/>
          </svg>
        )}
        {weather.loading ? (
          <span style={{ opacity: 0.6 }}>{locationLabel}</span>
        ) : (
          <>{locationLabel}{'\u00A0\u00A0'}{tempStr}</>
        )}
      </div>
    </div>
  )
}
