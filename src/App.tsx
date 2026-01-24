import { Scene, mousePositionRef } from './components/Scene'
import { TopCards } from './components/TopCards'
import { PeteLogo } from './components/PeteLogo'
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
    bioOpacity: 0.44,
  },
  inverted: {
    bgColor: '#E0E0E0',
    spotlightOuter: 'rgba(255,255,255,0.65)',
    spotlightInverted: false,
    marqueeColor: '#FFFFFF',
    textColor: 'rgba(0, 0, 0, 0.5)',
    logoFill: '#1A1A2E',
    bioFill: '#000000',
    bioOpacity: 0.5,
  },
  dark: {
    bgColor: '#121212',
    spotlightOuter: 'rgba(40,40,40,0.75)',
    spotlightInverted: false,
    marqueeColor: 'rgba(255,255,255,0.08)',
    textColor: 'rgba(255, 255, 255, 0.6)',
    logoFill: '#FFFFFF',
    bioFill: '#FFFFFF',
    bioOpacity: 0.6,
  },
  darkInverted: {
    bgColor: '#121212', // Dark gray bg
    spotlightOuter: 'rgba(18,18,18,0.9)', // #121212 on periphery
    spotlightInverted: true, // Darkest at edges, lighter at center
    marqueeColor: '#000000', // Black marquee logos
    textColor: 'rgba(255, 255, 255, 0.6)',
    logoFill: '#FFFFFF',
    bioFill: '#FFFFFF',
    bioOpacity: 0.6,
  },
}

function App() {
  // Ref for the main container - used as event source for Canvas
  // This allows mouse events to be captured even when over TopCards
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

      {/* Cards - single container */}
      <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
        <TopCards themeMode={themeMode} />
      </div>

      {/* 3D Scene - positioned below cards */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <Scene settings={settings} shadowSettings={shadowSettings} />
      </div>

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

      {/* Desktop (>=1024px): Text lockup positioned below gloves */}
      {isDesktop && (
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center" style={{ bottom: '18%' }}>
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
      )}

      {/* Desktop (>=1024px): Pete Logo at bottom */}
      {isDesktop && (
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center padding-responsive" style={{ bottom: 'calc(8vh - 59px)' }}>
          <PeteLogo onClick={cycleTheme} fill={theme.logoFill} />
        </div>
      )}

      {/* Mobile/Tablet: Text lockup (time/location + coming soon) */}
      {/* Tablet (768-1024px): vertically center-aligned with Bio SVGs */}
      {/* Mobile (<768px): higher position */}
      {!isDesktop && (
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center" style={{ bottom: isMobile ? '110px' : '234px' }}>
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
      )}

      {/* Mobile/Tablet: Pete Logo - stays at bottom */}
      {!isDesktop && (
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center padding-responsive" style={{ bottom: isMobile ? '16px' : '114px' }}>
          <PeteLogo onClick={cycleTheme} fill={theme.logoFill} />
        </div>
      )}

    </div>
  )
}

export default App
