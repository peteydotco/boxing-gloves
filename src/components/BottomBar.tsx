import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react'
import { BREAKPOINTS } from '../constants'
import { useNycTime } from '../hooks/useNycTime'
import { useStatusSchedule, ALL_STATUSES, getNextStatus, getNycDate } from '../hooks/useStatusSchedule'
import { useNycWeather } from '../hooks/useNycWeather'
import { gsap } from '../lib/gsap'

const SLIDE_TRANSITION = 'transform 0.25s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.25s cubic-bezier(0.33, 1, 0.68, 1)'

export function BottomBar() {
  const { hours, minutes, period, colonVisible } = useNycTime()
  const currentStatus = useStatusSchedule()
  const weather = useNycWeather()
  const barRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)

  // Active status index — initializes to the current time-based status
  const [statusIndex, setStatusIndex] = useState(() =>
    ALL_STATUSES.indexOf(currentStatus)
  )

  const [hovered, setHovered] = useState(false)

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.mobile : false
  )
  const [isWide, setIsWide] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.tabletWide : true
  )

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setIsMobile(w < BREAKPOINTS.mobile)
      setIsWide(w >= BREAKPOINTS.tabletWide)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll-driven fade out — dissolve to 0 as user scrolls past hero (first 100vh).
  // Uses same easing as VideoMorphSection (power2.out, scrub 0.6).
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return

    const ctx = gsap.context(() => {
      gsap.to(bar, {
        opacity: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: '100vh top',
          scrub: 0.6,
        },
      })
    })

    return () => ctx.revert()
  }, [])

  // Cycle to next status on tap — crossfade transition
  const handleTap = useCallback(() => {
    const center = centerRef.current
    const next = (prev: number) => (prev + 1) % ALL_STATUSES.length

    if (!center) {
      setStatusIndex(next)
      return
    }

    // Fade out current, swap, fade in
    gsap.to(center, {
      opacity: 0,
      y: -4,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => {
        setStatusIndex(next)
        gsap.set(center, { y: 4 })
        gsap.to(center, {
          opacity: 1,
          y: 0,
          duration: 0.2,
          ease: 'power2.out',
        })
      },
    })
  }, [])

  // Temperature display — with F unit
  const tempStr = weather.temp !== null ? `${weather.temp}\u00B0F` : '--'

  const fontSize = isMobile ? 15 : 18

  const status = ALL_STATUSES[statusIndex]
  const statusText = isMobile ? status.shortText : status.text

  // Next-status preview for hover slide-up
  const nextInfo = useMemo(() => getNextStatus(getNycDate()), [statusIndex])
  const previewText = `${status.shortText} → ${nextInfo.status.shortText} in ${nextInfo.hoursUntil}h`

  // Location label — neighborhood per focus mode
  const locationLabels: Record<number, string> = {
    0: 'West Village',  // Designing
    1: 'Gramercy',      // Teaching
    2: 'Brooklyn',      // Dad mode
    3: 'Brooklyn',      // DND / Sleeping
  }
  const locationLabel = locationLabels[statusIndex] ?? 'New York'

  return (
    <div
      ref={barRef}
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
        background: hovered ? '#FFFFFF' : 'rgba(250, 250, 250, 0.8)',
        border: hovered ? '1px solid #FFFFFF' : '1px solid rgba(250, 250, 250, 0.8)',
        boxShadow: '0px 216px 60px 0px rgba(0,0,0,0), 0px 138px 55px 0px rgba(0,0,0,0.01), 0px 78px 47px 0px rgba(0,0,0,0.05), 0px 35px 35px 0px rgba(0,0,0,0.09), 0px 9px 19px 0px rgba(0,0,0,0.1)',
        padding: '0 20px 1px',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontWeight: 500,
        fontSize,
        color: '#262626',
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
      }}>
        <span>
          {hours}
          <span style={{ opacity: colonVisible ? 1 : 0, transition: 'opacity 0.15s ease' }}>:</span>
          {minutes} {period}
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
            transform: hovered ? 'translateY(-20px)' : 'translateY(0)',
            opacity: hovered ? 0 : 1,
            transition: SLIDE_TRANSITION,
          }}
        >
          <img
            src={status.icon}
            alt=""
            style={{ width: isMobile ? 19 : 22, height: isMobile ? 19 : 22, flexShrink: 0 }}
          />
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
            transform: hovered ? 'translateY(0)' : 'translateY(20px)',
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
      }}>
        {weather.loading ? (
          <span style={{ opacity: 0.4 }}>{locationLabel}</span>
        ) : (
          <>{locationLabel}{'\u00A0\u00A0'}{tempStr}</>
        )}
      </div>
    </div>
  )
}
