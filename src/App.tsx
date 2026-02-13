import { Scene, mousePositionRef } from './components/Scene'
import { CustomCursor } from './components/CustomCursor'
import { TopCards } from './components/TopCards'
import { VideoMorphSection } from './components/VideoMorphSection'
import { ScrollingTextSection } from './components/ScrollingTextSection'
import { PeteyGraffitiSvg } from './components/PeteyGraffitiSvg'
import { SelectedWorksHeader } from './components/SelectedWorksHeader'
import { ProjectCardsGrid } from './components/ProjectCardsGrid'
import { LogoMarqueeSection } from './components/LogoMarqueeSection'
import { SiteFooter } from './components/SiteFooter'
import { useState, useEffect, useRef, useCallback } from 'react'
import { BREAKPOINTS } from './constants'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import LocomotiveScroll from 'locomotive-scroll'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.desktop : true
  })

  const [showCursor, setShowCursor] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.mobile : true
  })

  // Below tablet breakpoint (1024px) we use a shorter graffiti height
  // to keep PETEY legible on narrower viewports.
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.tablet : false
  })

  // Graffiti scale factor — scales continuously below tabletWide (1128px) to prevent
  // the SVG from being too large on narrower viewports.
  // Above 1128: 1.0 (full size). Below 1128→768: interpolates from 1.0 → 0.667.
  const computeGraffitiScale = (w: number) => {
    if (w >= BREAKPOINTS.tabletWide) return 1
    if (w <= BREAKPOINTS.mobile) return 2 / 3
    return 2 / 3 + (1 / 3) * (w - BREAKPOINTS.mobile) / (BREAKPOINTS.tabletWide - BREAKPOINTS.mobile)
  }
  const [graffitiScale, setGraffitiScale] = useState(() => {
    return typeof window !== 'undefined' ? computeGraffitiScale(window.innerWidth) : 1
  })

  const themeMode = 'light' as const

  // Debug grid overlay — toggle with "G" key
  const [showGrid, setShowGrid] = useState(false)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === 'g' || e.key === 'G') setShowGrid(prev => !prev)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      mousePositionRef.current = { x, y }
    }

    const handleResize = () => {
      const w = window.innerWidth
      setIsDesktop(w >= BREAKPOINTS.desktop)
      setShowCursor(w >= BREAKPOINTS.mobile)
      setIsMobile(w < BREAKPOINTS.tablet)
      setGraffitiScale(computeGraffitiScale(w))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const heroRef = useRef<HTMLElement>(null)

  // Graffiti parallax — perspective tilt + subtle translate driven by cursor position
  const GRAFFITI_TILT = 0.5  // max degrees of rotation (very subtle)
  const GRAFFITI_SHIFT = 2   // max px translate (barely perceptible)
  const graffitiSpring = { stiffness: 50, damping: 20, mass: 1 }
  const graffitiTiltTargetX = useMotionValue(0)
  const graffitiTiltTargetY = useMotionValue(0)
  const graffitiShiftTargetX = useMotionValue(0)
  const graffitiShiftTargetY = useMotionValue(0)
  const graffitiRotateX = useSpring(graffitiTiltTargetX, graffitiSpring)
  const graffitiRotateY = useSpring(graffitiTiltTargetY, graffitiSpring)
  const graffitiX = useSpring(graffitiShiftTargetX, graffitiSpring)
  const graffitiY = useSpring(graffitiShiftTargetY, graffitiSpring)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const { x, y } = mousePositionRef.current
      // Tilt: cursor right → rotateY positive (surface turns toward cursor)
      graffitiTiltTargetY.set((x - 0.5) * GRAFFITI_TILT * 2)
      // Tilt: cursor down → rotateX negative (top tilts away)
      graffitiTiltTargetX.set((y - 0.5) * -GRAFFITI_TILT * 2)
      // Subtle translate opposite to cursor for parallax depth
      graffitiShiftTargetX.set((x - 0.5) * -GRAFFITI_SHIFT * 2)
      graffitiShiftTargetY.set((y - 0.5) * -GRAFFITI_SHIFT * 2)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [graffitiTiltTargetX, graffitiTiltTargetY, graffitiShiftTargetX, graffitiShiftTargetY])

  // Initialize Locomotive Scroll (smooth scrolling + data-scroll detection)
  // Store instance so we can stop/start it when TopCards modal is active
  const scrollRef = useRef<LocomotiveScroll | null>(null)

  useEffect(() => {
    const scroll = new LocomotiveScroll({
      lenisOptions: {
        lerp: 0.09,
        duration: 1.3,
        smoothWheel: true,
        syncTouch: false,
      },
    })
    scrollRef.current = scroll

    // Watch for TopCards expanded state to freeze/resume page scroll
    const observer = new MutationObserver(() => {
      const expanded = document.documentElement.hasAttribute('data-topcards-expanded')
      if (expanded) {
        scroll.stop()
      } else {
        scroll.start()
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-topcards-expanded'] })

    return () => {
      observer.disconnect()
      scroll.destroy()
      scrollRef.current = null
    }
  }, [])

  // Hardcoded shadow settings
  const shadowSettings = {
    lightX: 0,
    lightY: 2.5,
    lightZ: 10,
    shadowMapSize: 2048,
    shadowCameraBounds: 8,
    shadowCameraFar: 30,
    shadowRadius: 4,
    shadowBias: -0.0001,
    shadowOpacity: 0.08,
  }

  // Boxing Gloves preset - hardcoded
  const settings = {
    color: '#8b0000',
    metalness: 0.1,
    roughness: 0.6,
    envMapIntensity: 0.4,
    radius: 0.525,
    mass: 1.2,
    restitution: 0.02,
    friction: 0.8,
    linearDamping: 1.0,
    gravity: -200,
    springStrength: 350,
    stringLength: 2.5,
    stringThickness: 0.028,
    stringColor: '#d4a574',
    ropeDamping: 0.92,
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen flex flex-col"
    >

      {/* ===== PETEY Graffiti SVG — page-level background layer =====
           Single instance positioned absolutely from the App root.
           Scrolls naturally with the page, sitting behind all sections.
           The tall portrait SVG starts at the hero and extends well below it. */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 0,
          right: 0,
          zIndex: 0,
          display: 'flex',
          justifyContent: 'center',
          perspective: 1200,
          opacity: 0.10,
        }}
      >
        <motion.div
          style={{
            position: 'relative',
            // Width-driven sizing — "slightly clipped on left and right".
            // 115vw means ~7.5% overhang per side. Height follows from the
            // 538 : 1185.79 aspect ratio (~253vw ≈ 450vh on 16:9).
            // PETEY letterforms occupy the top ~45% of the SVG.
            width: `${(isMobile ? 112 : 125) * graffitiScale}vw`,
            height: 'auto',
            aspectRatio: '538 / 1185.79',
            maxWidth: 'none',
            flexShrink: 0,
            rotateX: graffitiRotateX,
            rotateY: graffitiRotateY,
            x: graffitiX,
            y: graffitiY,
            // Pull the SVG up so the PETEY text's visual center (~22% of total
            // height) aligns with the boxing gloves (~40% from viewport top).
            marginTop: '-24vw',
            marginLeft: '4vw',
          }}
        >
          <PeteyGraffitiSvg
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </motion.div>
      </motion.div>

      {/* ===== Hero Section ===== */}
      <section ref={heroRef} className="relative h-screen w-full flex-shrink-0" style={{ overflow: 'hidden' }}>

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

        {/* Mobile/Tablet: TopCards + 3D Scene inside hero */}
        {!isDesktop && (
          <>
            <div className="absolute top-0 left-0 right-0 z-20" style={{ pointerEvents: 'auto', overflow: 'visible' }}>
              <TopCards themeMode={themeMode} />
            </div>
            <div
              className="absolute inset-0"
              style={{ zIndex: 10, pointerEvents: 'auto' }}
            >
              <Scene settings={settings} shadowSettings={shadowSettings} themeMode={themeMode} />
            </div>
          </>
        )}

      </section>

      {/* Spacer — pushes content below the full extent of the PETEY graffiti SVG.
           SVG total height ≈ 253vw × graffitiScale, offset up by 24vw. Subtracts
           the hero's 100vh to get the remaining distance. */}
      <div
        aria-hidden
        style={{
          height: `calc(${((isMobile ? 112 : 125) * graffitiScale * (1185.79 / 538)).toFixed(1)}vw - 24vw - 100vh)`,
          position: 'relative',
          pointerEvents: 'none',
        }}
      />

      {/* ===== Video Morph Section ===== */}
      <VideoMorphSection />

      {/* ===== Scrolling Text Section ===== */}
      <ScrollingTextSection />

      {/* ===== Selected Works Header ===== */}
      <SelectedWorksHeader />

      {/* ===== Project Cards Grid ===== */}
      <ProjectCardsGrid />

      {/* ===== Logo Marquee + Quote ===== */}
      <LogoMarqueeSection />

      {/* ===== Footer ===== */}
      <SiteFooter />

      {/* Custom cursor (tablet + desktop — useCursorMorph self-disables on pure touch devices) */}
      {showCursor && <CustomCursor />}

      {/* Debug grid overlay — toggled with G key (Figma: 12 cols, 25px margin, 20px gutter) */}
      {showGrid && (
        <div
          className="debug-grid-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            pointerEvents: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 20,
            padding: '0 25px',
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.04)',
                height: '100%',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default App
