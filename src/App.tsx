import { Scene, mousePositionRef } from './components/Scene'
import { TopCards } from './components/TopCards'
import { PeteLogo } from './components/PeteLogo'
import { LeftBioSvg } from './components/LeftBioSvg'
import { RightBioSvg } from './components/RightBioSvg'
import { BackgroundMarquee } from './components/BackgroundMarquee'
import { StackedBlades } from './components/StackedBlades'
import { StageBackground } from './components/StageBackground'
import { StagesContainer } from './components/StagesContainer'
import { PersistentNav } from './components/PersistentNav'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

// View modes: 'hero' is the landing page, 'stages' is the selected work section
type ViewMode = 'hero' | 'stages'

// Transition phases for blade animation
type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'

function App() {
  // Ref for the main container - used as event source for Canvas
  // This allows mouse events to be captured even when over TopCards
  const containerRef = useRef<HTMLDivElement>(null)

  // Current view mode
  const [viewMode, setViewMode] = useState<ViewMode>('hero')

  // Active stage index (which stage to show when in stages view)
  const [activeStageIndex, setActiveStageIndex] = useState(0)

  // Transition animation phase
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle')

  // Zoomed nav mode - when true, stage scales down and TopCards become visible
  const [isZoomedNav, setIsZoomedNav] = useState(false)

  // Track blade 0 hover state for nav item animation
  const [isBlade0Hovered, setIsBlade0Hovered] = useState(false)
  // Track nav item hover state (nav items are on blade 0, so hovering them should keep blade offset)
  const [isNavHovered, setIsNavHovered] = useState(false)

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
  const cycleTheme = useCallback(() => {
    setThemeMode(current => {
      if (current === 'light') return 'inverted'
      if (current === 'inverted') return 'dark'
      if (current === 'dark') return 'darkInverted'
      return 'light'
    })
  }, [])

  // Navigate to a specific stage with transition animation
  const navigateToStage = useCallback((stageIndex: number) => {
    // Set the target stage before animation starts
    setActiveStageIndex(stageIndex)
    // Start the expanding animation
    setTransitionPhase('expanding')
    // After animation completes, switch to stages view
    // Spring with stiffness:200, damping:30, mass:1 settles in ~700ms
    setTimeout(() => {
      setViewMode('stages')
      setTransitionPhase('complete')
      // Keep complete phase until blade 0 fully covers viewport
      setTimeout(() => {
        setTransitionPhase('idle')
      }, 300)
    }, 700)
  }, [])

  // Navigate back to hero view with collapse animation
  const navigateToHero = useCallback(() => {
    // Exit zoomed nav if active
    setIsZoomedNav(false)
    // Start the collapsing animation (blade shrinks back)
    setTransitionPhase('collapsing')
    // Switch view immediately so blades are visible
    setViewMode('hero')
    // After animation completes, reset to idle
    setTimeout(() => {
      setTransitionPhase('idle')
    }, 450)
  }, [])

  // Handle logo click - toggles zoomed nav in stages view, cycles theme in hero view
  const handleLogoClick = useCallback(() => {
    if (viewMode === 'stages') {
      setIsZoomedNav(prev => !prev)
    } else {
      cycleTheme()
    }
  }, [viewMode, cycleTheme])

  // Exit zoomed nav mode (clicking the scaled stage)
  const exitZoomedNav = useCallback(() => {
    setIsZoomedNav(false)
  }, [])

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

  // Wheel navigation to stages from hero (scrolls to stage 0 by default)
  const wheelState = useRef({ lastTime: 0, lastNavTime: 0 })
  useEffect(() => {
    if (viewMode !== 'hero') return

    const handleWheel = (e: WheelEvent) => {
      // Skip if TopCards are expanded (they handle their own scroll)
      if (document.documentElement.hasAttribute('data-topcards-expanded')) {
        return
      }

      // Only handle vertical scroll down (to stages) — ignore horizontal swipes
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      const delta = e.deltaY
      if (delta <= 0) return // Only scroll down

      const now = Date.now()
      const state = wheelState.current
      const timeSinceLastNav = now - state.lastNavTime

      // Require cooldown after navigation
      if (timeSinceLastNav < 800) return

      // Ignore small deltas
      if (Math.abs(delta) < 30) return

      state.lastNavTime = now
      navigateToStage(0) // Default to first stage when scrolling
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [viewMode, navigateToStage])

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

  // Determine if TopCards should be visible
  // Show in hero view, hide in stages view UNLESS zoomed nav is active
  const isInStagesView = viewMode === 'stages' || transitionPhase === 'expanding'
  const showTopCards = !isInStagesView || isZoomedNav

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: theme.bgColor }}
    >
      {/* Desktop: 3D Scene - always rendered to prevent gloves from dropping on every transition */}
      {/* Gloves stay visible during transition - blades cover them as they slide up */}
      {isDesktop && (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 10,
            pointerEvents: viewMode === 'hero' ? 'auto' : 'none',
            opacity: viewMode === 'hero' || transitionPhase === 'expanding' ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <Scene settings={settings} shadowSettings={shadowSettings} themeMode={themeMode} />
        </div>
      )}

      {/* Desktop: TopCards - slides up/down during transition, also shows in zoomed nav mode */}
      {/* z-index: 20 normally, but z-60 when zoomed to appear above scaled stage */}
      {isDesktop && (
        <motion.div
          className="absolute top-0 left-0 right-0"
          style={{
            pointerEvents: showTopCards ? 'auto' : 'none',
            overflow: 'visible',
            zIndex: isZoomedNav ? 60 : 20,
          }}
          initial={{ y: 0, opacity: 1 }}
          animate={{
            y: showTopCards ? 0 : -150,
            opacity: showTopCards ? 1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 40,
            mass: 1,
          }}
        >
          <TopCards themeMode={themeMode} />
        </motion.div>
      )}

      {/* Hero View - background elements only on desktop, full view on mobile/tablet */}
      <AnimatePresence>
        {viewMode === 'hero' && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
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

            {/* Mobile/Tablet only: Cards inside hero (desktop has them outside for animation) */}
            {!isDesktop && (
              <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
                <TopCards themeMode={themeMode} />
              </div>
            )}

            {/* Mobile/Tablet only: 3D Scene (desktop has it outside for persistence) */}
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

            {/* Mobile/Tablet: Text lockup (time/location + coming soon) */}
            {/* Both mobile and tablet: positioned near bottom */}
            {!isDesktop && (
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
            )}

            {/* Mobile/Tablet: Pete Logo - stays at bottom */}
            {!isDesktop && (
              <div className="fixed left-0 right-0 z-30 flex flex-col items-center padding-responsive" style={{ bottom: '16px' }}>
                <PeteLogo onClick={cycleTheme} fill={theme.logoFill} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: Unified background - single element that morphs between blade and fullscreen */}
      {/* Always rendered on desktop to provide seamless transition */}
      {isDesktop && (
        <StageBackground
          viewMode={viewMode}
          transitionPhase={transitionPhase}
          activeStageIndex={activeStageIndex}
          onNavigateToStage={navigateToStage}
          onHoverChange={setIsBlade0Hovered}
          isNavHovered={isNavHovered}
        />
      )}

      {/* Desktop: Stacked Blades (back blades 1,2,3 - blade 0 is StageBackground) */}
      {/* Always mounted - they sit behind blade 0 (z-45) so invisible when in stages view */}
      {/* This prevents them from disappearing mid-animation */}
      {isDesktop && (
        <StackedBlades
          onNavigateToStage={navigateToStage}
          themeMode={themeMode}
          transitionPhase={transitionPhase}
          viewMode={viewMode}
          nycTime={nycTime}
          colonVisible={colonVisible}
          isDaylight={isDaylight}
        />
      )}

      {/* Zoomed nav background - shows hero bg behind scaled stage */}
      {isZoomedNav && (
        <motion.div
          className="fixed inset-0"
          style={{ backgroundColor: theme.bgColor, zIndex: 45 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Stages View - content only, background is provided by StageBackground */}
      {/* Visible during expanding transition so cards slide up with the blade */}
      <StagesContainer
        isVisible={viewMode === 'stages' || transitionPhase === 'expanding'}
        onNavigateToHero={navigateToHero}
        onThemeToggle={cycleTheme}
        logoFill={theme.logoFill}
        themeMode={themeMode}
        isInitialEntry={transitionPhase === 'complete'}
        initialStageIndex={activeStageIndex}
        onStageChange={setActiveStageIndex}
        transitionPhase={transitionPhase}
        isZoomedNav={isZoomedNav}
        onExitZoomedNav={exitZoomedNav}
      />

      {/* Desktop: Persistent Nav - single instance that animates between hero and stages */}
      {isDesktop && (
        <PersistentNav
          viewMode={viewMode}
          transitionPhase={transitionPhase}
          onNavigateToHero={navigateToHero}
          onNavigateToStages={() => navigateToStage(0)}
          onLogoClick={handleLogoClick}
          isZoomedNav={isZoomedNav}
          heroBgColor={theme.bgColor}
          activeStageIndex={activeStageIndex}
          isBlade0Hovered={isBlade0Hovered}
          onNavHoverChange={setIsNavHovered}
        />
      )}
    </div>
  )
}

export default App
