import { Scene, mousePositionRef } from './components/Scene'
import { CustomCursor } from './components/CustomCursor'
import { TopCards } from './components/TopCards'
import { VideoMorphSection } from './components/VideoMorphSection'
import { GradientTransition } from './components/GradientTransition'
import { ScrollingTextSection } from './components/ScrollingTextSection'
import { PeteyGraffitiSvg } from './components/PeteyGraffitiSvg'
import { SplitText } from './lib/gsap'
import { SelectedWorksHeader } from './components/SelectedWorksHeader'
import { ProjectCardsGrid } from './components/ProjectCardsGrid'
import { LogoMarqueeSection } from './components/LogoMarqueeSection'
import { SiteFooter } from './components/SiteFooter'
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
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
  const string4TriggerRef = useRef<HTMLDivElement>(null)

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

      {/* ===== Bio text — positioned along the graffiti tail =====
           Separate from the graffiti wrapper so they aren't affected by its
           10% opacity. Each block uses GSAP SplitText for a word-by-word
           scroll-driven reveal, staggered as the user scrolls down the tail. */}
      <BioTextReveal
        text="Peter Rodriguez is a nuyorican designer solving hard problems with soft products."
        top={`calc(-32vw + ${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 0.45).toFixed(1)}vw)`}
        left="12vw"
        width="clamp(260px, 22vw, 380px)"
      />
      <BioTextReveal
        text="Bringing over a decade of insight, intuition & influence – off the dome, to your chrome."
        top={`calc(-32vw + ${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 0.60).toFixed(1)}vw)`}
        right="12vw"
        width="clamp(320px, 28vw, 480px)"
      />
      <BioTextReveal
        text={`Nowadays he\u2019s shaping the core experience of Squarespace\u2019s flagship website builder with design\u2011minded AI tools.`}
        top={`calc(-32vw + ${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 0.75).toFixed(1)}vw)`}
        left="6vw"
        width="clamp(280px, 26vw, 440px)"
      />
      {/* Invisible trigger for "And occasionally..." reveal — absolute at 1.05
           of SVG height so the SplitText fires well below bio string 3
           without adding any document-flow space. */}
      <div
        ref={string4TriggerRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: `calc(-32vw + ${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 1.05).toFixed(1)}vw)`,
          left: 0,
          width: '100%',
          height: '15vh',
          pointerEvents: 'none',
        }}
      />
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
           0.58 of SVG height so the gradient dome begins before the tail appears. */}
      <div
        aria-hidden
        style={{
          height: `calc(${((isMobile ? 116 : 130) * graffitiScale * (1185.79 / 538) * 0.58).toFixed(1)}vw - 32vw - 100vh)`,
          position: 'relative',
          pointerEvents: 'none',
        }}
      />

      {/* ===== "And occasionally..." — 4th bio text, fixed at viewport center.
           Reveal triggered by invisible div at 0.90 SVG height position.
           Pins through gradient dome for handoff to "Live from SQSP..." lockup. ===== */}
      <AndOccasionallyText triggerRef={string4TriggerRef} />

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
// Bio text reveal — GSAP SplitText word-by-word scroll-driven animation
// ---------------------------------------------------------------------------
// Each text block reveals word-by-word as it scrolls into view.
// Words start at autoAlpha: 0 + y: 12, and stagger in with scrub.

function BioTextReveal({
  text,
  top,
  left,
  right,
  width,
}: {
  text: string
  top: string
  left?: string
  right?: string
  width: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const split = SplitText.create(el, { type: 'words' })

    gsap.set(split.words, { autoAlpha: 0, y: 12 })

    const ctx = gsap.context(() => {
      gsap.to(split.words, {
        autoAlpha: 1,
        y: 0,
        ease: 'power2.out',
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'bottom 60%',
          scrub: true,
        },
      })
    })

    return () => {
      ctx.revert()
      split.revert()
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top,
        ...(left ? { left } : {}),
        ...(right ? { right } : {}),
        width,
        zIndex: 1,
        pointerEvents: 'none',
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: '-0.02em',
        color: '#0E0E0E',
        textAlign: 'justify',
      }}
    >
      {text}
    </div>
  )
}

// ---------------------------------------------------------------------------
// "And occasionally, he hops on stage..." — 4th bio string
// ---------------------------------------------------------------------------
// position: fixed at viewport center (zero document-flow space).
// SplitText word-by-word reveal triggered by an invisible absolute div
// at 1.05 of SVG height — same "appear" effect as bio strings 1–3.
//
// After revealing, the text stays at center (inherently pinned via fixed)
// while the gradient dome covers the screen:
//   1. Color shifts dark → white during the dome
//   2. Fades out as "Live from SQSP..." lockup fades in

function AndOccasionallyText({ triggerRef }: { triggerRef: React.RefObject<HTMLDivElement | null> }) {
  const markerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const marker = markerRef.current
    const text = textRef.current
    const trigger = triggerRef.current
    if (!marker || !text || !trigger) return

    // Find the gradient runway (skip past our own fixed overlay)
    let runway = marker.nextElementSibling as HTMLElement | null
    while (runway && (runway.style.position === 'fixed' || runway.offsetHeight === 0)) {
      runway = runway.nextElementSibling as HTMLElement | null
    }
    if (!runway) return

    // Find the VideoMorphSection — sibling after the gradient runway
    const videoSection = runway.nextElementSibling as HTMLElement | null

    // SplitText — words for reveal, chars for exit
    const split = SplitText.create(text, { type: 'words,chars' })
    gsap.set(split.words, { autoAlpha: 0, y: 12 })

    const ctx = gsap.context(() => {
      // ── Word reveal — triggered by invisible div at 0.90 SVG height ──
      gsap.to(split.words, {
        autoAlpha: 1,
        y: 0,
        ease: 'power2.out',
        stagger: 0.05,
        scrollTrigger: {
          trigger: trigger,
          start: 'top 85%',
          end: 'bottom 60%',
          scrub: true,
        },
      })

      // ── Color shift dark → white ──
      // The dome uses power3.in (t³) so it barely covers center until
      // ~80% of the runway. Shift at 93–98% where scaleY ≈ 0.83–0.95
      // so the text stays black until the dome has clearly passed center.
      if (runway) {
        gsap.to(text, {
          color: '#FFFFFF',
          ease: 'none',
          scrollTrigger: {
            trigger: runway,
            start: '93% bottom',
            end: '98% bottom',
            scrub: true,
          },
        })
      }

      // ── Character-by-character exit — letters slide up and out ──
      if (videoSection) {
        gsap.to(split.chars, {
          autoAlpha: 0,
          yPercent: -100,
          ease: 'power2.in',
          stagger: 0.03,
          scrollTrigger: {
            trigger: videoSection,
            start: 'top top',
            end: '5% top',
            scrub: true,
          },
        })
      }
    })

    return () => {
      ctx.revert()
      split.revert()
    }
  }, [triggerRef])

  return (
    <>
      {/* 0-height marker for sibling discovery (runway, videoSection) */}
      <div ref={markerRef} aria-hidden style={{ height: 0, position: 'relative' }} />

      {/* Fixed at viewport center — zero document flow */}
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
          fontFamily: 'Inter',
          fontSize: 24,
          fontWeight: 500,
          lineHeight: 1.4,
          letterSpacing: '-0.02em',
          color: '#0E0E0E',
          textAlign: 'center',
        }}
      >
        And occasionally, he hops on stage...
      </div>
    </>
  )
}

export default App
