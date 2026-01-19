import { Scene } from './components/Scene'
import { TopCards } from './components/TopCards'
import { PeteLogo } from './components/PeteLogo'
import { LeftBioSvg } from './components/LeftBioSvg'
import { RightBioSvg } from './components/RightBioSvg'
import { BackgroundMarquee } from './components/BackgroundMarquee'
import { useState, useEffect } from 'react'

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 1080 : true
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to 0-1 range
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      setMousePosition({ x, y })
    }

    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1080)
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
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

  // Calculate distance from center (0 at center, 1 at corners)
  const distanceFromCenter = Math.sqrt(
    Math.pow(mousePosition.x - 0.5, 2) + Math.pow(mousePosition.y - 0.5, 2)
  ) * Math.sqrt(2) // Normalize to 0-1 range

  // Radius grows as cursor approaches center (inverted distance)
  const radiusPercent = 30 + (1 - distanceFromCenter) * 40 // 30% to 70% radius

  // Hardcoded shadow settings
  const shadowSettings = {
    lightX: 0,
    lightY: 2.5,
    lightZ: 10,
    shadowMapSize: 2048,
    shadowCameraBounds: 10,
    shadowCameraFar: 30,
    shadowRadius: 20,
    shadowBias: -0.00005,
    shadowOpacity: 0.12,
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
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Radial gradient spotlight background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, transparent 0%, transparent 30%, rgba(255,255,255,0.5) 55%, #FFFFFF 80%)`,
          transition: 'background 0.1s ease-out',
        }}
      />

      {/* Background Marquee - scrolling text revealed by cursor */}
      <BackgroundMarquee mousePosition={mousePosition} />

      {/* Cards - single container */}
      <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'auto' }}>
        <TopCards />
      </div>

      {/* 3D Scene - positioned below cards */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'translateY(-50px)',
          transformOrigin: 'top center',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <Scene settings={settings} shadowSettings={shadowSettings} mousePosition={mousePosition} />
      </div>

      {/* Left biographical text - show on tablet and desktop (md+) */}
      <div
        className="absolute z-20 pointer-events-none select-none hidden md:block"
        style={{
          left: '5%',
          bottom: isDesktop ? 'calc(8vh - 41px)' : '140px',
        }}
      >
        <LeftBioSvg />
      </div>

      {/* Right biographical text - show on tablet and desktop (md+) */}
      <div
        className="absolute z-20 pointer-events-none select-none hidden md:block"
        style={{
          right: '5%',
          bottom: isDesktop ? 'calc(8vh - 41px)' : '140px',
          maxWidth: '200px',
        }}
      >
        <RightBioSvg />
      </div>

      {/* Pete.co Logo - Desktop only (1080px+): positioned at bottom */}
      {isDesktop && (
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center padding-responsive" style={{ bottom: 'calc(8vh - 65px)' }}>
          <PeteLogo />
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

      {/* Mobile/Tablet: Logo and text - mobile: lower position (where bottom CTA used to be), tablet: above CTA card */}
      {!isDesktop && (
        <div className="fixed left-0 right-0 z-30 flex flex-col items-center padding-responsive" style={{ bottom: isMobile ? '40px' : '124px' }}>
          <PeteLogo />
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
