import { Scene, mousePositionRef } from './components/Scene'
import { TopCards } from './components/TopCards'
import { LeftBioSvg } from './components/LeftBioSvg'
import { RightBioSvg } from './components/RightBioSvg'
import { BackgroundMarquee } from './components/BackgroundMarquee'
import { useState, useEffect, useRef } from 'react'

// Theme presets for quick toggling (cycles: light → inverted → dark → darkInverted)
const themes = {
  light: {
    bgColor: '#FFFFFF',
    spotlightOuter: 'rgba(224,224,224,0.65)',
    spotlightInverted: false,
    marqueeColor: '#E0E0E0',
    textColor: 'rgba(0, 0, 0, 0.44)',
    logoFill: '#1A1A2E',
    bioFill: '#000000',
    bioOpacity: 0.55,
  },
  inverted: {
    bgColor: '#E0E0E0',
    spotlightOuter: 'rgba(255,255,255,0.65)',
    spotlightInverted: false,
    marqueeColor: '#FFFFFF',
    textColor: 'rgba(0, 0, 0, 0.5)',
    logoFill: '#1A1A2E',
    bioFill: '#000000',
    bioOpacity: 0.55,
  },
  dark: {
    bgColor: '#0E0E16', // ink-850 (cool-biased)
    spotlightOuter: 'rgba(14,14,22,0.65)',
    spotlightInverted: false,
    marqueeColor: 'rgba(255,255,255,0.08)',
    textColor: 'rgba(255, 255, 255, 0.6)',
    logoFill: '#FFFFFF',
    bioFill: '#FFFFFF',
    bioOpacity: 0.55,
  },
  darkInverted: {
    bgColor: '#0A0A10', // ink-900 (cool-biased)
    spotlightOuter: 'rgba(10,10,16,0.65)', // Match bg color on periphery
    spotlightInverted: true, // Darkest at edges, lighter at center
    marqueeColor: '#1A1A2E', // ink-800 (cool-biased, visible on near-black)
    textColor: 'rgba(255, 255, 255, 0.6)',
    logoFill: '#FFFFFF',
    bioFill: '#FFFFFF',
    bioOpacity: 0.55,
  },
}

function App() {
  // Ref for the main container
  const containerRef = useRef<HTMLDivElement>(null)

  // mousePosition state is only for 2D UI elements (spotlight, marquee)
  // Scene reads from mousePositionRef directly to avoid re-renders
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  })
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false
  })
  const [nycTime, setNycTime] = useState(() => {
    const now = new Date()
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now)
  })
  const [colonVisible, setColonVisible] = useState(true)
  const [themeMode, setThemeMode] = useState<'light' | 'inverted' | 'dark' | 'darkInverted'>('light')
  const theme = themes[themeMode]

  // Sync data-theme attribute on <html> for CSS mode overrides
  useEffect(() => {
    const root = document.documentElement
    if (themeMode === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (themeMode === 'darkInverted') {
      root.setAttribute('data-theme', 'darker')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [themeMode])

  // Cycle through themes: light → inverted → dark → darkInverted → light
  const cycleTheme = () => {
    setThemeMode(current => {
      if (current === 'light') return 'inverted'
      if (current === 'inverted') return 'dark'
      if (current === 'dark') return 'darkInverted'
      return 'light'
    })
  }

  useEffect(() => {
    // Use requestAnimationFrame to batch mouse updates and prevent re-render storms
    let rafId: number | null = null
    let pendingX = 0.5
    let pendingY = 0.5

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to 0-1 range
      pendingX = e.clientX / window.innerWidth
      pendingY = e.clientY / window.innerHeight
      // Update ref for Scene immediately (no re-render)
      mousePositionRef.current = { x: pendingX, y: pendingY }

      // Batch state updates with RAF to prevent excessive re-renders
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          setMousePosition({ x: pendingX, y: pendingY })
          rafId = null
        })
      }
    }

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  // Update NYC time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setNycTime(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now))
    }

    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // Blink colon every second to simulate seconds counting
  useEffect(() => {
    const interval = setInterval(() => {
      setColonVisible(prev => !prev)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Get hour for NYC time to determine sun/moon (5AM-5:59PM = sun, 6PM-4:59AM = moon)
  const nycHour = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false })
  const hourNum = parseInt(nycHour, 10)
  const isDaylight = hourNum >= 5 && hourNum <= 17 // 5:00 AM to 5:59 PM

  // Format time with blinking colon
  const formatTimeWithBlinkingColon = (time: string) => {
    const colonIndex = time.indexOf(':')
    if (colonIndex === -1) return time
    const before = time.slice(0, colonIndex)
    const after = time.slice(colonIndex + 1)
    return (
      <>
        {before}
        <span style={{ opacity: colonVisible ? 1 : 0 }}>:</span>
        {after}
      </>
    )
  }

  // Hardcoded shadow settings
  const shadowSettings = {
    lightX: 0,
    lightY: 2.5,
    lightZ: 10,
    shadowMapSize: 1024,
    shadowCameraBounds: 6,
    shadowCameraFar: 30,
    shadowRadius: 4,
    shadowBias: -0.0001,
    shadowOpacity: 0.08,
  }

  // Boxing Gloves preset - hardcoded
  const settings = {
    // Ball/Glove appearance
    color: '#8b0000',
    metalness: 0.1,
    roughness: 0.6,
    envMapIntensity: 0.4,
    radius: 0.525, // Increased from 0.42 to 0.525 (1.25x larger)

    // Physics - light to drag, bouncy plop when released, dangly, soft collisions
    mass: 1.2,
    restitution: 0.02,
    friction: 0.8,
    linearDamping: 1.0, // Reduced from 1.5 for more bounce oscillation
    gravity: -200,
    springStrength: 350,

    // String
    stringLength: 2.5,
    stringThickness: 0.028,
    stringColor: '#d4a574',
    ropeDamping: 0.92,
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: theme.bgColor }}
    >
      {/* Desktop: 3D Scene */}
      {isDesktop && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 10, pointerEvents: 'auto' }}
        >
          <Scene settings={settings} shadowSettings={shadowSettings} themeMode={themeMode} />
        </div>
      )}

      {/* Desktop: TopCards */}
      {isDesktop && (
        <div
          className="absolute top-0 left-0 right-0"
          style={{ pointerEvents: 'auto', overflow: 'visible', zIndex: 20 }}
        >
          <TopCards themeMode={themeMode} />
        </div>
      )}

      {/* Hero View */}
      <div className="absolute inset-0">
        {/* Background Marquee - scrolling text revealed by cursor */}
        <BackgroundMarquee mousePosition={mousePosition} marqueeFill={theme.marqueeColor} />

        {/* Radial gradient spotlight overlay - covers marquee, reveals center (desktop only) */}
        {!isMobile && (
          <div
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              background: theme.spotlightInverted
                ? `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, transparent 0%, transparent 15%, ${theme.spotlightOuter} 45%)`
                : `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, transparent 0%, transparent 20%, ${theme.spotlightOuter} 50%)`,
              transition: 'background 0.1s ease-out',
            }}
          />
        )}

        {/* Mobile/Tablet only: Cards inside hero (desktop has them outside) */}
        {!isDesktop && (
          <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
            <TopCards themeMode={themeMode} />
          </div>
        )}

        {/* Mobile/Tablet only: 3D Scene (desktop has it outside) */}
        {!isDesktop && (
          <div
            className="absolute inset-0"
            style={{
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          >
            <Scene settings={settings} shadowSettings={shadowSettings} themeMode={themeMode} />
          </div>
        )}

        {/* Left biographical text - show on tablet and desktop (md+) */}
        {/* Desktop (>=1024px): flanks gloves at vertical center */}
        {/* Tablet (<1024px): positioned at bottom, offset +3px to center-align with taller Right Bio */}
        <div
          className="absolute z-20 pointer-events-none select-none hidden md:block"
          style={{
            left: '5%',
            ...(isDesktop
              ? { top: '50%', transform: 'translateY(-50%)' }
              : { bottom: '214px' }
            ),
          }}
        >
          <LeftBioSvg fill={theme.bioFill} fillOpacity={theme.bioOpacity} />
        </div>

        {/* Right biographical text - show on tablet and desktop (md+) */}
        {/* Desktop (>=1024px): flanks gloves at vertical center */}
        {/* Tablet (<1024px): positioned at bottom, center-aligned with left bio */}
        <div
          className="absolute z-20 pointer-events-none select-none hidden md:block"
          style={{
            right: '5%',
            maxWidth: '200px',
            ...(isDesktop
              ? { top: '50%', transform: 'translateY(-50%)' }
              : { bottom: '211px' }
            ),
          }}
        >
          <RightBioSvg fill={theme.bioFill} fillOpacity={theme.bioOpacity} />
        </div>

        {/* Text lockup (time/location + coming soon) */}
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center" style={{ bottom: '110px' }}>
          <p style={{
            color: theme.textColor,
            textAlign: 'center',
            fontFamily: 'GT Pressura Mono',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '15px',
            letterSpacing: '0.36px',
            textTransform: 'uppercase',
          }}>
            {formatTimeWithBlinkingColon(nycTime)} {isDaylight ? '☀︎' : '⏾'} BROOKLYN, NY
          </p>
          <p style={{
            color: theme.textColor,
            textAlign: 'center',
            fontFamily: 'GT Pressura Mono',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '15px',
            letterSpacing: '0.36px',
            textTransform: 'uppercase',
            marginTop: '4px'
          }}>
            《 Full site coming soon 》
          </p>
        </div>

        {/* Pete Logo - text with exact SVG border element from blades build */}
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center padding-responsive" style={{ bottom: '16px' }}>
          <div
            onClick={cycleTheme}
            style={{
              cursor: 'pointer',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            {/* SVG border frame + corner dots from PeteLogo */}
            <svg width="124" height="42" viewBox="0 0 124 42" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
              <path d="M5.09375 33.4473C6.23509 35.2759 7.92917 36.7364 9.96387 37.6172C10.8672 38.0082 12.0211 38.2619 13.9258 38.3965C15.8597 38.5331 18.3275 38.5352 21.8301 38.5352H101.727C105.229 38.5352 107.698 38.5331 109.632 38.3965C111.536 38.2619 112.69 38.0081 113.593 37.6172C115.135 36.9495 116.483 35.9487 117.542 34.707H121.141C119.689 37.1393 117.478 39.0816 114.806 40.2383L114.55 40.3438C111.886 41.4061 108.429 41.4062 101.727 41.4062H21.8301C15.1273 41.4062 11.6709 41.4062 9.00684 40.3438L8.75195 40.2383C5.76384 38.9449 3.35157 36.6694 1.93359 33.8242L5.09375 33.4473ZM3.52832 18.4355C3.52585 19.174 3.52539 19.9689 3.52539 20.8281C3.52539 24.2165 3.5277 26.6038 3.66895 28.4746C3.7369 29.3745 3.83395 30.1013 3.96289 30.7109L1.01172 31.0625C0.559395 28.7375 0.556641 25.6523 0.556641 20.8281C0.556641 19.9785 0.558068 19.1827 0.560547 18.4355H3.52832ZM122.58 10.7783C122.998 13.0818 122.999 16.1306 122.999 20.8281C122.999 22.4476 122.999 23.8711 122.981 25.1357H120.014C120.031 23.9013 120.031 22.4843 120.031 20.8281C120.031 17.4397 120.029 15.0524 119.888 13.1816C119.813 12.1979 119.702 11.4215 119.555 10.7783H122.58ZM101.727 0.25C108.646 0.25 112.106 0.249299 114.806 1.41797C117.82 2.72271 120.246 5.02709 121.659 7.90723H118.267C117.131 6.21993 115.514 4.87073 113.593 4.03906C112.69 3.64813 111.536 3.39435 109.632 3.25977C107.698 3.12312 105.229 3.12109 101.727 3.12109H21.8301C18.3275 3.12109 15.8597 3.12315 13.9258 3.25977C12.0211 3.39436 10.8672 3.64808 9.96387 4.03906C7.81312 4.97004 6.04116 6.54765 4.90234 8.52441L1.69434 8.33301L1.76465 8.17676C3.06859 5.35796 5.33634 3.06656 8.17578 1.68262L8.75195 1.41797C11.4518 0.249511 14.9115 0.25 21.8301 0.25H101.727Z" fill={theme.logoFill}/>
              <rect x="119" y="28.3281" width="4" height="4" rx="2" fill={theme.logoFill}/>
              <rect y="11.3281" width="4" height="4" rx="2" fill={theme.logoFill}/>
            </svg>
            {/* Live text centered over the SVG frame */}
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: 'GT Pressura, sans-serif',
                fontSize: '16.5px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: theme.logoFill,
                whiteSpace: 'nowrap',
              }}
            >
              PETEY.CO
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}

export default App
