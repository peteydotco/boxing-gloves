import { Scene, mousePositionRef } from './components/Scene'
import { CustomCursor } from './components/CustomCursor'
import { TopCards } from './components/TopCards'
import { VideoMorphSection } from './components/VideoMorphSection'
import { BioCopySection } from './components/BioCopySection'
import { SelectedWorksHeader } from './components/SelectedWorksHeader'
import { ProjectCardsGrid } from './components/ProjectCardsGrid'
import { LogoMarqueeSection } from './components/LogoMarqueeSection'
import { SiteFooter } from './components/SiteFooter'
import { useState, useEffect, useRef, useCallback } from 'react'
import { BREAKPOINTS } from './constants'
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion'
import LocomotiveScroll from 'locomotive-scroll'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.desktop : true
  })

  const [showCursor, setShowCursor] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.mobile : true
  })

  // Below tablet breakpoint (1024px) we swap to a taller portrait graffiti asset
  // that fills the vertical space better on narrower viewports.
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.tablet : false
  })

  // Graffiti scale factor — scales continuously below tabletWide (1128px) to prevent
  // harsh left/right cropping while keeping PETEY centered and legible.
  // Above 1128: 1.0 (full size: 150vw / 180vh).
  // Below 1128→768: linearly interpolates from 1.0 → 0.667 (100vw / 120vh).
  // Both vw and vh terms scale in lockstep to keep the image proportional.
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

  // Hero section ref — used for scroll-driven graffiti fade
  const heroRef = useRef<HTMLElement>(null)

  // Scroll-driven graffiti fade: 10% opacity at top → 0% by the time hero is ~40% scrolled out.
  // This ensures the bio section text reads against a clean solid background.
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    // "start start" = element top meets viewport top (scrollY=0)
    // "end start" = element bottom meets viewport top (hero fully scrolled past)
    offset: ['start start', 'end start'],
  })
  // Map scroll progress [0, 0.4] → opacity [0.10, 0] — fully faded before hero is halfway gone
  const graffitiOpacity = useTransform(heroScrollProgress, [0, 0.4], [0.10, 0])

  // Graffiti parallax — perspective tilt + subtle translate driven by cursor position
  const GRAFFITI_TILT = 3    // max degrees of rotation
  const GRAFFITI_SHIFT = 8   // max px translate (small, just enough to feel physical)
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
      {/* Global grain texture — FIRST child so content paints on top */}
      <div className="grain-overlay" />

      {/* ===== Hero Section ===== */}
      <section ref={heroRef} className="relative h-screen w-full flex-shrink-0" style={{ overflow: 'hidden' }}>
        {/* Graffiti tag background image — centered on PETEY text to align with boxing gloves.
             Uses max(vw, vh) sizing so the image always covers the viewport while keeping
             the text centered regardless of aspect ratio. The slight upward nudge (-4%)
             accounts for the PETEY text sitting above the image's geometric center. */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            opacity: graffitiOpacity,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            perspective: 1200,
            // Feather the bottom edge so the graffiti dissolves naturally
            // before the hero/bio boundary — avoids a hard color break and
            // doesn't interfere with the grain overlay above.
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          }}
        >
          <motion.img
            src={isMobile ? '/images/graffiti-tag-tall.webp' : '/images/graffiti-tag.webp'}
            alt=""
            loading="lazy"
            style={{
              // Landscape asset: oversized width covers viewport, height follows.
              // Portrait asset (mobile): sized by height to fill the full-screen hero,
              // width follows the taller aspect ratio.
              ...(isMobile
                ? { height: '120vh', width: 'auto' }
                : { width: `max(${(150 * graffitiScale).toFixed(1)}vw, ${(180 * graffitiScale).toFixed(1)}vh)`, height: 'auto' }
              ),
              maxWidth: 'none',
              display: 'block',
              flexShrink: 0,
              rotateX: graffitiRotateX,
              rotateY: graffitiRotateY,
              x: graffitiX,
              y: graffitiY,
              translateX: '-2%',
              translateY: '2%',
            }}
          />
        </motion.div>

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


      {/* ===== Bio Copy Section ===== */}
      <BioCopySection />

      {/* ===== Video Morph Section ===== */}
      <VideoMorphSection />

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
