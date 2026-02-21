import { Analytics } from '@vercel/analytics/react'
import { Scene, mousePositionRef } from './components/Scene'
import { CustomCursor } from './components/CustomCursor'
import { TopCards } from './components/TopCards'
import { VideoMorphSection } from './components/VideoMorphSection'
import { GradientTransition } from './components/GradientTransition'

import { PeteyGraffitiSvg } from './components/PeteyGraffitiSvg'
import { SplitText } from './lib/gsap'


import { LogoMarqueeSection } from './components/LogoMarqueeSection'
import { SiteFooter } from './components/SiteFooter'
import { BottomBar } from './components/BottomBar'
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { BREAKPOINTS, Z, TYPE_SCALE, WEIGHT, LETTER_SPACING } from './constants'
import { colorTokens } from './constants/themes'
import { prefersReducedMotion } from './hooks/useReducedMotion'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import LocomotiveScroll from 'locomotive-scroll'
import { gsap, ScrollTrigger } from './lib/gsap'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [showCursor, setShowCursor] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.mobile : true
  })

  // Below mobile breakpoint (768px) — non-sticky canvas, simplified scene.
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.mobile : false
  })

  // Graffiti scale factor — on narrow viewports the SVG scales UP so PETEY
  // stays optically centered behind the hero gloves.
  // Desktop (≥1128): 1.0. Tablet (~1024): ~1.15. Mobile (≤768): 1.35.
  // Interpolates smoothly between breakpoints.
  const computeGraffitiScale = (w: number) => {
    if (w >= BREAKPOINTS.tabletWide) return 1
    if (w <= BREAKPOINTS.mobile) return 1.2
    return 1.2 - 0.2 * (w - BREAKPOINTS.mobile) / (BREAKPOINTS.tabletWide - BREAKPOINTS.mobile)
  }
  const [graffitiScale, setGraffitiScale] = useState(() => {
    return typeof window !== 'undefined' ? computeGraffitiScale(window.innerWidth) : 1
  })

  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.desktop : true
  })
  const [isTabletWide, setIsTabletWide] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.tabletWide : true
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
      setShowCursor(w >= BREAKPOINTS.mobile)
      setIsMobile(w < BREAKPOINTS.mobile)
      setIsDesktop(w >= BREAKPOINTS.desktop)
      setIsTabletWide(w >= BREAKPOINTS.tabletWide)
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

  // Scroll-driven glove scale: starts large in hero, scrubs down as user scrolls into graffiti
  const gloveScaleRef = useRef(1.15)
  const gloveRotationRef = useRef(0)       // legacy full-spin (still used for desktop)
  const gloveLeftRotRef = useRef(0)        // per-glove Y rotation — left glove
  const gloveRightRotRef = useRef(0)       // per-glove Y rotation — right glove
  const gloveDuskRef = useRef(0)  // 0 = full light, 1 = full dusk
  const gloveHorizontalRef = useRef(0)  // scroll-driven horizontal zig-zag (sub-desktop only)
  const travelZoneRef = useRef<HTMLDivElement>(null)
  const stickyCanvasRef = useRef<HTMLDivElement>(null)

  // Graffiti parallax — perspective tilt + subtle translate driven by cursor position
  const GRAFFITI_TILT = 2.0  // max degrees of rotation
  const GRAFFITI_SHIFT = 5   // max px translate
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
    // Skip parallax mouse-tracking when user prefers reduced motion —
    // graffiti stays static with no tilt or translate.
    if (prefersReducedMotion()) return

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
    const reducedMotion = prefersReducedMotion()
    const scroll = new LocomotiveScroll({
      lenisOptions: {
        lerp: reducedMotion ? 1 : 0.09,
        duration: reducedMotion ? 0 : 1.3,
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

  // Scroll-driven glove scale (1.5→1.0) + rotation (0→360°).
  // Both span the full travel zone for a very gradual, scroll-mapped effect.
  useLayoutEffect(() => {
    const zone = travelZoneRef.current
    if (!zone) return

    const ctx = gsap.context(() => {
      gsap.to(gloveScaleRef, {
        current: 1.0,
        ease: 'none',
        scrollTrigger: {
          trigger: zone,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })
      gsap.to(gloveRotationRef, {
        current: Math.PI * 2,
        ease: 'none',
        scrollTrigger: {
          trigger: zone,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })
      // Dusk lighting — scrubs 0→1 over the second half of the travel zone
      // so the shift begins as gloves approach the gradient dome.
      gsap.to(gloveDuskRef, {
        current: 1,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: zone,
          start: 'center center',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })
    })
    return () => ctx.revert()
  }, [])

  // Dissolve BottomBar + compact pill bar to 0% opacity during video section.
  // Uses a CSS class with !important to override Framer Motion's inline opacity.
  useLayoutEffect(() => {
    const videoSection = document.querySelector('[data-section="video-morph"]')
    if (!videoSection) return

    let hasPassedVideo = false
    const toggle = (hide: boolean) => {
      const compact = document.querySelector('[data-compact-bar]')
      const bottom = document.querySelector('[data-bottom-bar]')
      if (hide) {
        // Mark ready so CSS transition kicks in for both hide AND subsequent unhide
        compact?.classList.add('video-dissolve-ready', 'video-hidden-up')
        bottom?.classList.add('video-dissolve-ready', 'video-hidden-down')
      } else {
        // Compact bar always returns
        compact?.classList.remove('video-hidden-up')
        // BottomBar only returns when scrolling back up (before video)
        if (!hasPassedVideo) {
          bottom?.classList.remove('video-hidden-down')
        }
      }
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: videoSection,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => toggle(true),
        onLeave: () => {
          hasPassedVideo = true
          document.body.setAttribute('data-past-video', '')
          window.dispatchEvent(new CustomEvent('past-video-change', { detail: true }))
          toggle(false)
        },
        onEnterBack: () => toggle(true),
        onLeaveBack: () => {
          hasPassedVideo = false
          document.body.removeAttribute('data-past-video')
          window.dispatchEvent(new CustomEvent('past-video-change', { detail: false }))
          toggle(false)
        },
      })

      // On page refresh the browser may restore scroll to a position past the video
      // section. ScrollTrigger's callbacks only fire on scroll *events*, so if the
      // section is already past the viewport at mount time, onLeave never fires.
      // Explicitly set the attribute so TopCards renders the correct post-video variant.
      const vRect = videoSection.getBoundingClientRect()
      if (vRect.bottom < 0) {
        hasPassedVideo = true
        document.body.setAttribute('data-past-video', '')
        window.dispatchEvent(new CustomEvent('past-video-change', { detail: true }))
      }
    })
    return () => ctx.revert()
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

  // Graffiti vertical pull-up — responsive so bio text stays aligned with the SVG.
  // Desktop (≥1440): -32vw. Sub-desktop (768–1439): -10vw. Mobile (<768): -5vw.
  // Uses !isMobile && !isDesktop to catch the full 768–1439 range (isTablet only covers 1024–1439).
  const graffitiPullUp = isMobile ? 5 : isDesktop ? 32 : 10  // in vw units

  // Bio text vertical position factors (fraction of graffiti SVG height).
  // Sub-desktop: 50% more gap between strings 2 & 3 for better legibility.
  const bioFactor2 = isDesktop ? 0.60 : 0.675
  const bioFactor3 = isDesktop ? 0.75 : 0.85

  // Scroll-driven horizontal zig-zag — tablet+ (≥768px).
  // Gloves shift: right → left → right → center to weave between bio text strings.
  useLayoutEffect(() => {
    if (isMobile) {
      gloveHorizontalRef.current = 0
      return
    }
    const zone = travelZoneRef.current
    if (!zone) return

    const ctx = gsap.context(() => {
      const shift = 1.0 // Three.js world units (~horizontal offset at fov 45, z=7)
      gsap.fromTo(gloveHorizontalRef,
        { current: 0 },
        {
          keyframes: [
            { current: shift, duration: 0.33 },    // → right (during string 1)
            { current: -shift, duration: 0.34 },   // → left (during string 3)
            { current: 0, duration: 0.33 },         // → center (before gradient)
          ],
          ease: 'none',
          scrollTrigger: {
            trigger: zone,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
          },
        }
      )

      // Per-glove Y rotation — alternating "face the viewer" during zig-zag.
      // Right glove faces viewer during zig-right, left glove during zag-left.
      const faceAngle = Math.PI * 0.75  // ~135° — strong turn to show front face

      // Right glove: rotate during zig-right (phase 1), neutral otherwise
      gsap.fromTo(gloveRightRotRef,
        { current: 0 },
        {
          keyframes: [
            { current: faceAngle, duration: 0.25 },    // face viewer during zig right
            { current: faceAngle, duration: 0.08 },     // hold briefly
            { current: 0, duration: 0.25 },              // return as zag begins
            { current: 0, duration: 0.08 },              // hold at neutral
            { current: 0, duration: 0.34 },              // stay neutral through resolve
          ],
          ease: 'none',
          scrollTrigger: {
            trigger: zone,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
          },
        }
      )

      // Left glove: neutral during zig-right, rotate during zag-left (phase 2)
      gsap.fromTo(gloveLeftRotRef,
        { current: 0 },
        {
          keyframes: [
            { current: 0, duration: 0.33 },               // stay neutral during zig right
            { current: -faceAngle, duration: 0.25 },      // face viewer during zag left
            { current: -faceAngle, duration: 0.08 },      // hold briefly
            { current: 0, duration: 0.25 },                // return to neutral
            { current: 0, duration: 0.09 },                // hold through resolve
          ],
          ease: 'none',
          scrollTrigger: {
            trigger: zone,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
          },
        }
      )
    })
    return () => ctx.revert()
  }, [isMobile])

  // Toggle data-cursor-invert on the sticky canvas wrapper when the gradient
  // dome visually covers the center of the viewport. The dome uses power3.in
  // (scaleY = progress³), so scaleY ≈ 0.50 at ~79% of the 240vh runway.
  // This makes the drag/grab cursor invert to white over the dark section.
  useLayoutEffect(() => {
    const canvasWrapper = stickyCanvasRef.current
    const zone = travelZoneRef.current
    if (!canvasWrapper || !zone) return

    // Find the gradient runway — last child of travel zone with significant height
    const children = Array.from(zone.children) as HTMLElement[]
    const runway = children.find(
      (el) => el.offsetHeight > window.innerHeight && el.style.position !== 'fixed'
    )
    if (!runway) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: runway,
        start: '79% bottom',
        end: 'bottom bottom',
        onEnter: () => canvasWrapper.setAttribute('data-cursor-invert', ''),
        onLeaveBack: () => canvasWrapper.removeAttribute('data-cursor-invert'),
        onLeave: () => canvasWrapper.removeAttribute('data-cursor-invert'),
        onEnterBack: () => canvasWrapper.setAttribute('data-cursor-invert', ''),
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <main
      ref={containerRef}
      className="relative w-full min-h-screen flex flex-col"
      style={{ overflowX: 'clip' }}
    >
      <h1 className="sr-only">Peter Rodriguez — Designer</h1>

      {/* ===== PETEY Graffiti SVG — page-level background layer =====
           Positioned absolutely from the App root, scrolls with the page.
           overflow: hidden contains the oversized SVG within the viewport.
           Hidden on mobile — hero cuts straight to entry gradient. */}
      {!isMobile && (
        <motion.div
          className="absolute pointer-events-none"
          initial={prefersReducedMotion() ? false : { opacity: 0 }}
          animate={{ opacity: 0.10 }}
          transition={prefersReducedMotion() ? { duration: 0 } : { duration: 0.8, delay: 0.45, ease: [0.33, 1, 0.68, 1] }}
          style={{
            top: 0,
            left: 0,
            width: '100%',
            zIndex: Z.background,
            overflow: 'hidden',
          }}
        >
          <motion.div
            style={{
              width: `${130 * graffitiScale}vw`,
              height: 'auto',
              aspectRatio: '538 / 1185.79',
              marginLeft: `calc(50vw - ${(130 * graffitiScale / 2).toFixed(1)}vw)`,
              translateX: '3%',
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
        </motion.div>
      )}

      {/* ===== Bio text — positioned along the graffiti tail =====
           Separate from the graffiti wrapper so they aren't affected by its
           10% opacity. Each block uses GSAP SplitText for a word-by-word
           scroll-driven reveal, staggered as the user scrolls down the tail.
           Hidden on mobile (no graffiti tail to attach to). */}
      {!isMobile && (
        <>
          {/* String 1 — left-aligned; starts at col 1 */}
          <BioTextReveal
            top={`calc(${-graffitiPullUp}vw + ${(130 * graffitiScale * (1185.79 / 538) * 0.45).toFixed(1)}vw)`}
            left="25px"
            width="max(333px, calc(3 * (100vw - 270px) / 12 + 40px))"
            textAlign="left"
          >
            Peter Rodriguez is a{' '}
            <span className="font-fresh-marker" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>
              nuyorican
            </span>{' '}
            designer solving hard problems with soft products.
          </BioTextReveal>
          {/* String 2 — right-aligned; right-aligns with col 12. Visible on tabletWide+ (≥1128). */}
          {isTabletWide && (
            <BioTextReveal
              top={`calc(${-graffitiPullUp}vw + ${(130 * graffitiScale * (1185.79 / 538) * bioFactor2).toFixed(1)}vw)`}
              right="25px"
              width="max(333px, calc(3 * (100vw - 270px) / 12 + 40px))"
              textAlign="left"
            >
              Bringing over a decade of insight, intuition & influence. Off the{' '}
              <span className="font-fresh-marker" style={{ letterSpacing: '1px', whiteSpace: 'nowrap' }}>Do<span style={{ letterSpacing: '2.5px' }}>m</span>e</span>
              , to your{' '}
              <span className="font-fresh-marker" style={{ letterSpacing: '1px', whiteSpace: 'nowrap' }}>Chro<span style={{ letterSpacing: '2.5px' }}>m</span>E</span>.
            </BioTextReveal>
          )}
          {/* Strings 3 & 4 — tabletWide+ (≥1128): split into two flanking strings */}
          {isTabletWide ? (
            <>
              {/* String 3 — left-aligned, flanks gloves on the left */}
              <BioTextReveal
                top={`calc(${-graffitiPullUp}vw + ${(130 * graffitiScale * (1185.79 / 538) * bioFactor3).toFixed(1)}vw)`}
                left="25px"
                width="max(333px, calc(3 * (100vw - 270px) / 12 + 40px))"
                textAlign="left"
              >
                <span className="font-fresh-marker" style={{ letterSpacing: '0.48px', whiteSpace: 'nowrap' }}>NoWA<span style={{ letterSpacing: '-1.2px' }}>D</span>ays</span>
                , he{'\u2019'}s shaping vision
              </BioTextReveal>
              {/* String 4 — right-aligned, flanks gloves on the right (slides in from right) */}
              <BioTextReveal
                top={`calc(${-graffitiPullUp}vw + ${(130 * graffitiScale * (1185.79 / 538) * bioFactor3).toFixed(1)}vw)`}
                right="25px"
                width="max(333px, calc(3 * (100vw - 270px) / 12 + 40px))"
                textAlign="left"
                fromRight
              >
                for Squarespace{'\u2019'}s site builder.
              </BioTextReveal>
            </>
          ) : (
            /* Tablet (768–1127): single string, right-aligned */
            <BioTextReveal
              top={`calc(${-graffitiPullUp}vw + ${(130 * graffitiScale * (1185.79 / 538) * bioFactor3).toFixed(1)}vw)`}
              right="25px"
              width="max(333px, calc(3 * (100vw - 270px) / 12 + 40px))"
              textAlign="left"
            >
              <span className="font-fresh-marker" style={{ letterSpacing: '0.48px', whiteSpace: 'nowrap' }}>NoWA<span style={{ letterSpacing: '-1.2px' }}>D</span>ays</span>
              , he{'\u2019'}s shaping vision for Squarespace{'\u2019'}s site builder.
            </BioTextReveal>
          )}
          {/* Invisible trigger for "And occasionally..." reveal */}
          <div
            ref={string4TriggerRef}
            aria-hidden
            style={{
              position: 'absolute',
              top: `calc(${-graffitiPullUp}vw + ${(130 * graffitiScale * (1185.79 / 538) * (isDesktop ? 0.90 : 1.00)).toFixed(1)}vw)`,
              left: 0,
              width: '100%',
              height: '15vh',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
      {/* ===== Gloves Travel Zone =====
           Wraps the hero + graffiti spacer so the 3D canvas can stick (position: sticky)
           for the entire scroll range, unpinning naturally when the wrapper ends. */}
      <div ref={travelZoneRef} style={{ position: 'relative' }}>

        {/* Mobile hero graffiti background — full SVG with bottom fade.
             Below the sticky canvas (z-10 < z-30) so gloves render on top.
             Same SVG as desktop but contained within 100vh, no scroll travel. */}
        {isMobile && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 10,
              height: '100vh',
              overflow: 'hidden',
              opacity: 0.20,
              maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            }}
          >
            <PeteyGraffitiSvg
              style={{
                width: `${130 * graffitiScale}vw`,
                height: 'auto',
                aspectRatio: '538 / 1185.79',
                position: 'absolute',
                left: `calc(50% - ${(130 * graffitiScale / 2).toFixed(1)}vw)`,
                top: '-10vw',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* Sticky 3D Canvas — pinned at viewport top through the travel zone.
             z-30 sits above the gradient dome (z-20) so gloves remain visible.
             On mobile: same sticky behavior so gloves pin through the gradient. */}
        <motion.div
          ref={stickyCanvasRef}
          initial={prefersReducedMotion() ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion() ? { duration: 0 } : { duration: 0.6, delay: 0.75, ease: [0.33, 1, 0.68, 1] }}
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            width: '100%',
            zIndex: Z.stickyCanvas,
            pointerEvents: 'auto',
          }}
        >
          <Scene
            settings={settings}
            shadowSettings={shadowSettings}
            themeMode={themeMode}
            gloveHorizontalRef={gloveHorizontalRef}
            gloveDuskRef={gloveDuskRef}
            {...(!isMobile && { gloveScaleRef, gloveRotationRef, gloveLeftRotRef, gloveRightRotRef })}
          />
        </motion.div>

        {/* ===== Hero Section =====
             Absolute-positioned so it doesn't add flow height to the travel zone
             (flow height = sticky canvas + spacer only, giving maximum sticky travel). */}
        <section
          ref={heroRef}
          aria-label="Hero"
          className="relative h-screen w-full flex-shrink-0"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: Z.hero, pointerEvents: 'none' }}
        >
          <div
            className="absolute top-0 left-0 right-0"
            style={{ pointerEvents: 'auto', overflow: 'visible', zIndex: Z.hero }}
          >
            <TopCards themeMode={themeMode} introStagger />
          </div>
        </section>

        {/* Spacer — scroll through the graffiti while canvas stays pinned.
             0.50 of SVG height so the gradient dome begins before the tail appears.
             Hidden on mobile (no graffiti scroll-out). */}
        {!isMobile && (
          <div
            aria-hidden
            style={{
              height: `calc(${(130 * graffitiScale * (1185.79 / 538) * 0.50).toFixed(1)}vw - ${graffitiPullUp}vw - 100vh)`,
              position: 'relative',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ===== "And occasionally..." — 4th bio text, fixed at viewport center.
             Reveal triggered by invisible div at 0.90 SVG height position.
             Pins through gradient dome for handoff to "Live from SQSP..." lockup.
             Inside the travel zone so the sticky canvas persists through the gradient.
             Hidden on mobile. ===== */}
        {!isMobile && <AndOccasionallyText triggerRef={string4TriggerRef} />}

        {/* ===== Entry Gradient Transition =====
             Inside the travel zone — its z-index: 20 covers the sticky canvas (z-10)
             as the dome grows. The gloves unpin when this runway ends.
             Mobile: negative margin pulls runway up so the dome starts growing
             while the hero is still in view (seamless overlap). */}
        <GradientTransition
          direction="enter"
          src="/images/transition-entry.png"
          className="relative"
          style={{ zIndex: Z.gradientDome, ...(isMobile ? { marginTop: '-100vh' } : {}) }}
          fadeIn={isMobile}
        />

      </div>

      {/* ===== Video Morph Section =====
           marginTop: -1px closes a subpixel seam between the travel zone
           bottom edge and the video section's dark background. */}
      <div style={{ marginTop: -1 }}>
        <VideoMorphSection />
      </div>

      {/* ===== Spray Paint Zone — canvas overlay spans gradient + quote + footer ===== */}
      <div style={{ position: 'relative', zIndex: Z.sprayZone }}>
        {/* ===== Exit Gradient Transition ===== */}
        <GradientTransition
          direction="exit"
          src="/images/transition-exit.png"
          className="relative"
          style={{ zIndex: 1 }}
        />

        {/* ===== Logo Marquee + Quote ===== */}
        <LogoMarqueeSection />

        {/* ===== Footer ===== */}
        <SiteFooter />
      </div>

      {/* ===== Bottom Bar — fixed status bar ===== */}
      <BottomBar />

      {/* Vercel Web Analytics */}
      <Analytics />

      {/* Custom cursor (tablet + desktop — useCursorMorph self-disables on pure touch devices) */}
      {showCursor && <CustomCursor />}

      {/* Debug grid overlay — toggled with G key (Figma: 12 cols, 25px margin, 20px gutter) */}
      {showGrid && (
        <div
          className="debug-grid-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: Z.debugGrid,
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
    </main>
  )
}

// ---------------------------------------------------------------------------
// Bio text reveal — GSAP SplitText word-by-word scroll-driven animation
// ---------------------------------------------------------------------------
// Each text block reveals word-by-word as it scrolls into view.
// Words start at autoAlpha: 0 + y: 12, and stagger in with scrub.

function BioTextReveal({
  children,
  top,
  left,
  right,
  width,
  textAlign = 'justify',
  fromRight = false,
}: {
  children: React.ReactNode
  top: string
  left?: string
  right?: string
  width?: string
  textAlign?: 'justify' | 'right' | 'left'
  fromRight?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const split = SplitText.create(el, { type: 'words' })

    // When user prefers reduced motion, skip the GSAP scroll-driven
    // reveal and just show all words immediately (no stagger, no parallax).
    if (prefersReducedMotion()) {
      gsap.set(split.words, { autoAlpha: 1, y: 0 })
      return () => { split.revert() }
    }

    gsap.set(split.words, { autoAlpha: 0, y: 12 })

    const ctx = gsap.context(() => {
      // Word-by-word reveal
      gsap.to(split.words, {
        autoAlpha: 1,
        y: 0,
        ease: 'power2.out',
        stagger: fromRight ? { each: 0.08, from: 'end' } : 0.08,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'top 50%',
          scrub: 0.6,
        },
      })

      // Parallax — container drifts up as page scrolls
      gsap.to(el, {
        y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
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
      className="font-inter"
      style={{
        position: 'absolute',
        top,
        ...(left ? { left } : {}),
        ...(right ? { right } : {}),
        width,
        zIndex: 1,
        fontSize: TYPE_SCALE['2xl'].size,
        fontWeight: WEIGHT.medium,
        lineHeight: TYPE_SCALE['2xl'].lineHeight,
        letterSpacing: LETTER_SPACING.tighter,
        color: colorTokens.neutralNearBlack,
        textAlign,
      }}
    >
      {children}
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

    // Find the VideoMorphSection — may be a sibling of the gradient's parent (travel zone)
    // if the gradient was moved inside a wrapper for sticky scroll behavior.
    let videoSection = runway.nextElementSibling as HTMLElement | null
    if (!videoSection && runway.parentElement) {
      videoSection = runway.parentElement.nextElementSibling as HTMLElement | null
      // Skip 0-height / fixed siblings at the wrapper level too
      while (videoSection && (videoSection.style.position === 'fixed' || videoSection.offsetHeight === 0)) {
        videoSection = videoSection.nextElementSibling as HTMLElement | null
      }
    }

    // SplitText — words for reveal, chars for exit
    const split = SplitText.create(text, { type: 'chars' })
    gsap.set(split.chars, { opacity: 0 })
    // Start scaled to near-zero so nothing peeks from behind the gloves
    gsap.set(text, { scale: 0.005 })

    const ctx = gsap.context(() => {
      // ── Scale up from near-zero alongside char dissolve ──
      gsap.to(text, {
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: runway,
          start: '91% bottom',
          end: '97% bottom',
          scrub: 0.6,
        },
      })

      // ── Char dissolve — triggered by gradient runway at ~91% scroll ──
      // The dome uses power3.in (t³): scaleY = progress³.
      // At 91% scroll → scaleY ≈ 0.75 (dome ¾ up the viewport).
      // At 97% scroll → scaleY ≈ 0.91 (dome nearly full).
      gsap.to(split.chars, {
        opacity: 1,
        ease: 'power2.out',
        stagger: { each: 0.03, from: 'edges' },
        scrollTrigger: {
          trigger: runway,
          start: '91% bottom',
          end: '97% bottom',
          scrub: 0.6,
        },
      })

      // ── Color shift dark → white ──
      // The dome uses power3.in (t³) so it barely covers center until
      // ~80% of the runway. Shift at 93–98% where scaleY ≈ 0.83–0.95
      // so the text stays black until the dome has clearly passed center.
      if (runway) {
        gsap.to(text, {
          color: colorTokens.canvas,
          ease: 'none',
          scrollTrigger: {
            trigger: runway,
            start: '93% bottom',
            end: '98% bottom',
            scrub: true,
          },
        })
      }

      // ── Container exit — whole text fades up and out ──
      // Targets the parent div (not individual chars) to avoid
      // competing with the entrance tween's per-char opacity.
      if (videoSection) {
        gsap.to(text, {
          opacity: 0,
          y: -60,
          ease: 'power2.in',
          scrollTrigger: {
            trigger: videoSection,
            start: 'top top',
            end: '10% top',
            scrub: 0.6,
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
        className="font-inter"
        data-cursor-invert=""
        data-cursor-text=""
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 25,
          pointerEvents: 'auto',
          whiteSpace: 'nowrap',
          fontSize: TYPE_SCALE['2xl'].size,
          fontWeight: WEIGHT.medium,
          lineHeight: TYPE_SCALE['2xl'].lineHeight,
          letterSpacing: LETTER_SPACING.tight,
          color: colorTokens.neutralNearBlack,
          textAlign: 'center',
        }}
      >
        And occasionally, he hops on the{' '}<span className="font-fresh-marker" style={{ letterSpacing: '2px' }}>MIc</span>...
      </div>
    </>
  )
}

export default App
