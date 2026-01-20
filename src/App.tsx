import { Scene, mousePositionRef } from './components/Scene'
import { TopCards } from './components/TopCards'
import { PeteLogo } from './components/PeteLogo'
import { LeftBioSvg } from './components/LeftBioSvg'
import { RightBioSvg } from './components/RightBioSvg'
import { BackgroundMarquee } from './components/BackgroundMarquee'
import { useState, useEffect, useRef } from 'react'

// Theme presets for quick toggling
const themes = {
  light: {
    bgColor: '#FFFFFF',
    spotlightOuter: 'rgba(224,224,224,0.65)',
    marqueeColor: '#E0E0E0',
  },
  dark: {
    bgColor: '#E0E0E0',
    spotlightOuter: 'rgba(255,255,255,0.65)',
    marqueeColor: '#FFFFFF',
  },
}

function App() {
  // Ref for the main container - used as event source for Canvas
  // This allows mouse events to be captured even when over TopCards
  const containerRef = useRef<HTMLDivElement>(null)

  // mousePosition state is only for 2D UI elements (spotlight, marquee)
  // Scene reads from mousePositionRef directly to avoid re-renders
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [isXLDesktop, setIsXLDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 1280 : true
  })
  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 && window.innerWidth <= 1280 : false
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
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const theme = themes[themeMode]

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
      setIsXLDesktop(window.innerWidth > 1280)
      setIsDesktop(window.innerWidth >= 1024 && window.innerWidth <= 1280)
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

    // Physics
    mass: 3,
    restitution: 0.1,
    friction: 0.3,
    linearDamping: 1.0,
    gravity: -60,
    springStrength: 800,

    // String
    stringLength: 2.5,
    stringThickness: 0.018,
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
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, transparent 0%, transparent 20%, ${theme.spotlightOuter} 50%)`,
            transition: 'background 0.1s ease-out',
          }}
        />
      )}

      {/* Cards - single container */}
      <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'auto' }}>
        <TopCards />
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
      {/* XL Desktop (>1280px): flanks gloves at vertical center */}
      {/* Desktop (1024-1280px): flanks Pete logo at bottom of viewport */}
      {/* Tablet (<1024px): positioned at bottom */}
      <div
        className="absolute z-20 pointer-events-none select-none hidden md:block"
        style={{
          left: '5%',
          ...(isXLDesktop
            ? { top: '50%', transform: 'translateY(-50%)' }
            : isDesktop
              ? { bottom: 'calc(8vh - 41px)' }
              : { bottom: '146px' }
          ),
        }}
      >
        <LeftBioSvg />
      </div>

      {/* Right biographical text - show on tablet and desktop (md+) */}
      {/* XL Desktop (>1280px): flanks gloves at vertical center */}
      {/* Desktop (1024-1280px): flanks Pete logo at bottom of viewport */}
      {/* Tablet (<1024px): positioned at bottom */}
      <div
        className="absolute z-20 pointer-events-none select-none hidden md:block"
        style={{
          right: '5%',
          maxWidth: '200px',
          ...(isXLDesktop
            ? { top: '50%', transform: 'translateY(-50%)' }
            : isDesktop
              ? { bottom: 'calc(8vh - 41px)' }
              : { bottom: '146px' }
          ),
        }}
      >
        <RightBioSvg />
      </div>

      {/* Pete.co Logo - Desktop only (1024-1280px): positioned at bottom of viewport, bottom-aligned with Bio SVGs */}
      {isDesktop && (
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center padding-responsive" style={{ bottom: 'calc(8vh - 59px)' }}>
          <PeteLogo onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} />
          <p style={{
            color: 'rgba(0, 0, 0, 0.6)',
            textAlign: 'center',
            fontFamily: 'GT Pressura Mono',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '15px',
            letterSpacing: '0.36px',
            textTransform: 'uppercase',
            marginTop: '20px'
          }}>
            &lt;&lt; Full site coming soon &gt;&gt;
          </p>
          <p style={{
            color: 'rgba(0, 0, 0, 0.6)',
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
            {formatTimeWithBlinkingColon(nycTime)} {isDaylight ? '☀︎' : '⏾'} BROOKLYN, NY
          </p>
        </div>
      )}

      {/* Mobile/Tablet/XL Desktop: Logo and text */}
      {/* XL Desktop (>1280px): bottom of viewport like Desktop */}
      {/* Tablet (768-1024px): above CTA card */}
      {/* Mobile (<768px): lower position */}
      {!isDesktop && (
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center padding-responsive" style={{ bottom: isMobile ? '40px' : isXLDesktop ? 'calc(8vh - 59px)' : '130px' }}>
          <PeteLogo onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} />
          <p style={{
            color: 'rgba(0, 0, 0, 0.6)',
            textAlign: 'center',
            fontFamily: 'GT Pressura Mono',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '15px',
            letterSpacing: '0.36px',
            textTransform: 'uppercase',
            marginTop: '20px'
          }}>
            &lt;&lt; Full site coming soon &gt;&gt;
          </p>
          <p style={{
            color: 'rgba(0, 0, 0, 0.6)',
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
            {formatTimeWithBlinkingColon(nycTime)} {isDaylight ? '☀︎' : '⏾'} BROOKLYN, NY
          </p>
        </div>
      )}

    </div>
  )
}

export default App
