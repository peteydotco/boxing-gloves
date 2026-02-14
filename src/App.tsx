import { Scene, mousePositionRef } from './components/Scene'
import { CustomCursor } from './components/CustomCursor'
import { TopCards } from './components/TopCards'
import { VideoMorphSection } from './components/VideoMorphSection'
import { GradientTransition } from './components/GradientTransition'
import { ScrollingTextSection } from './components/ScrollingTextSection'
import { PeteyGraffitiSvg } from './components/PeteyGraffitiSvg'
import { BioText1Svg } from './components/BioText1Svg'
import { BioText2Svg } from './components/BioText2Svg'
import { BioText3Svg } from './components/BioText3Svg'
import { SelectedWorksHeader } from './components/SelectedWorksHeader'
import { ProjectCardsGrid } from './components/ProjectCardsGrid'
import { LogoMarqueeSection } from './components/LogoMarqueeSection'
import { SiteFooter } from './components/SiteFooter'
import { useState, useEffect, useLayoutEffect, useRef, useCallback, type ReactNode } from 'react'
import { BREAKPOINTS } from './constants'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import LocomotiveScroll from 'locomotive-scroll'
import { gsap, ScrollTrigger } from './lib/gsap'

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

    // Sync GSAP ScrollTrigger with Lenis — Lenis uses native scroll,
    // so ScrollTrigger reads window.scrollY directly. We just need to
    // tell it to re-check on every Lenis tick for frame-accurate sync.
    scroll.lenisInstance?.on('scroll', ScrollTrigger.update)

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
      ScrollTrigger.getAll().forEach(st => st.kill())
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
           Positioned absolutely from the App root, scrolls with the page.
           overflow: hidden contains the oversized SVG within the viewport. */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 0,
          width: '100vw',
          zIndex: 0,
          overflow: 'hidden',
          opacity: 0.10,
        }}
      >
        <motion.div
          style={{
            // Width-driven sizing — slightly clipped on left and right.
            // Height follows from the 538:1185.79 aspect ratio.
            width: `${(isMobile ? 116 : 130) * graffitiScale}vw`,
            height: 'auto',
            aspectRatio: '538 / 1185.79',
            // Center horizontally with slight rightward offset:
            // marginLeft auto-centers, then translateX nudges right
            marginLeft: `calc(50vw - ${((isMobile ? 116 : 130) * graffitiScale / 2).toFixed(1)}vw)`,
            translateX: '3%',
            // Pull up so PETEY aligns behind the boxing gloves
            marginTop: '-32vw',
            rotateX: graffitiRotateX,
            rotateY: graffitiRotateY,
            x: graffitiX,
            y: graffitiY,
            perspective: 1200,
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
      </div>

      {/* ===== Bio text SVGs — positioned along the graffiti tail =====
           Separate from the graffiti wrapper so they aren't affected by its
           10% opacity. Positioned absolutely using calc() to align with the
           SVG's vertical extent. Each block fades in on scroll. */}
      <BioSvgReveal
        top={`calc(-32vw + ${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 0.36).toFixed(1)}vw)`}
        left="12vw"
        width="clamp(200px, 18vw, 320px)"
      >
        <BioText1Svg style={{ width: '100%', height: 'auto', display: 'block' }} />
      </BioSvgReveal>
      <BioSvgReveal
        top={`calc(-32vw + ${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 0.52).toFixed(1)}vw)`}
        right="12vw"
        width="clamp(280px, 26vw, 460px)"
      >
        <BioText2Svg style={{ width: '100%', height: 'auto', display: 'block' }} />
      </BioSvgReveal>
      <BioSvgReveal
        top={`calc(-32vw + ${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 0.72).toFixed(1)}vw)`}
        left="6vw"
        width="clamp(240px, 24vw, 420px)"
      >
        <BioText3Svg style={{ width: '100%', height: 'auto', display: 'block' }} />
      </BioSvgReveal>
      {/* "And occasionally..." is now inside VideoMorphSection's sticky wrapper
           so it pins at viewport center as the entry dome scrolls over it. */}

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

      {/* Spacer — scroll through the graffiti before content resumes.
           0.72 of SVG height so the gradient dome begins before the tail appears. */}
      <div
        aria-hidden
        style={{
          height: `calc(${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 0.72).toFixed(1)}vw - 32vw - 100vh)`,
          position: 'relative',
          pointerEvents: 'none',
        }}
      />

      {/* ===== "And occasionally..." — fixed text during gradient bloom =====
           Controlled by ScrollTrigger tied to the entry gradient runway.
           Fades in as dome starts, fades out before dome completes. */}
      <AndOccasionallyText />

      {/* ===== Entry Gradient Transition ===== */}
      <GradientTransition
        direction="enter"
        src="/images/transition-entry.png"
        className="relative"
        style={{ zIndex: 20 }}
      />

      {/* ===== Video Morph Section ===== */}
      <VideoMorphSection />

      {/* ===== Exit Gradient Transition ===== */}
      <GradientTransition
        direction="exit"
        src="/images/transition-exit.png"
        className="relative"
        style={{ zIndex: 20 }}
      />

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

// ---------------------------------------------------------------------------
// Bio SVG reveal — fade + slide-up on scroll into view
// ---------------------------------------------------------------------------

function BioSvgReveal({
  top,
  left,
  right,
  width,
  children,
}: {
  top: string
  left?: string
  right?: string
  width: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
        } else {
          setRevealed(false)
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{
        position: 'absolute',
        top,
        ...(left ? { left } : {}),
        ...(right ? { right } : {}),
        width,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// "And occasionally, he hops on stage..." — scroll-driven text
// ---------------------------------------------------------------------------
// Behavior:
//   1. Scrolls in naturally from below (translateY +50vh → 0) during the last
//      part of the spacer — a "scroll in, then pin" feel.
//   2. Starts as dark text (#0E0E0E) on the light bg.
//   3. Transitions to white as the entry gradient dome covers the viewport.
//   4. Stays pinned at viewport center through the dome and into VideoMorphSection.
//   5. Fades to opacity 0 simultaneously as the "Live from SQSP" lockup fades in
//      (at the very start of the VideoMorphSection scroll).
//
// Uses a 0-height marker in document flow. GSAP ScrollTriggers reference the
// gradient runway (next non-fixed sibling) and the VideoMorphSection.

function AndOccasionallyText() {
  const markerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const marker = markerRef.current
    const text = textRef.current
    const span = spanRef.current
    if (!marker || !text || !span) return

    // Find the gradient runway (skip past our own fixed overlay)
    let runway = marker.nextElementSibling as HTMLElement | null
    while (runway && (runway.style.position === 'fixed' || runway.offsetHeight === 0)) {
      runway = runway.nextElementSibling as HTMLElement | null
    }
    if (!runway) return

    // Find the VideoMorphSection — it's the next sibling after the gradient runway
    const videoSection = runway.nextElementSibling as HTMLElement | null

    // Initial state: well below viewport, invisible, dark text
    gsap.set(text, { y: '50vh' })
    gsap.set(span, { color: '#0E0E0E' })

    const ctx = gsap.context(() => {
      // ── Phase 1a: Slide up into center ──
      gsap.fromTo(text, { y: '50vh' }, {
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: runway,
          start: '-15% bottom',
          end: '15% bottom',
          scrub: true,
        },
      })

      // ── Fade out — crossfade with the lockup ──
      // Starts when the VideoMorphSection sticky engages (section top =
      // viewport top) so the lockup is already pinned at viewport center.
      if (videoSection) {
        gsap.fromTo(span, { opacity: 1 }, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: videoSection,
            start: 'top top',          // sticky just engaged, lockup at center
            end: '5% top',             // ~125px of scroll for crossfade
            scrub: true,
          },
        })
      }

      // ── Phase 2: Color shift dark → white ──
      gsap.to(span, {
        color: '#FFFFFF',
        ease: 'none',
        scrollTrigger: {
          trigger: runway,
          start: '25% bottom',
          end: '50% bottom',
          scrub: true,
        },
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <>
      <div ref={markerRef} aria-hidden style={{ height: 0, position: 'relative' }} />

      <div
        ref={textRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 25,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          ref={spanRef}
          style={{
            fontFamily: 'Inter',
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#0E0E0E',
            textAlign: 'center',
            display: 'block',
          }}
        >
          And occasionally, he hops on stage...
        </span>
      </div>
    </>
  )
}

export default App
