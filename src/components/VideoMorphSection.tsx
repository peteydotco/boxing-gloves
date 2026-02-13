import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useSpring, useTransform, useMotionValueEvent, useScroll } from 'framer-motion'
import { BREAKPOINTS } from '../constants/breakpoints'

const YOUTUBE_VIDEO_ID = 'rJKduGHwvHk'

// Spring config for the morph — gradual scale-up with gentle settle
const morphSpring = { stiffness: 180, damping: 38, mass: 1.6 }

export function VideoMorphSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Grid-proportional video width: 8 of 12 columns on desktop, 10 of 12 at ≤1028px
  // Content area = viewport - 2 × 25px margin = viewport - 50px
  // Column width = (contentArea - 11 gutters × 20px) / 12
  const GRID_MARGIN = 25
  const GRID_GUTTER = 20
  const GRID_COLS = 12

  const computeGridWidth = (vw: number) => {
    const videoCols = vw <= 1028 ? 12 : 8
    const contentArea = vw - 2 * GRID_MARGIN
    const colWidth = (contentArea - (GRID_COLS - 1) * GRID_GUTTER) / GRID_COLS
    return videoCols * colWidth + (videoCols - 1) * GRID_GUTTER
  }

  const [targetWidth, setTargetWidth] = useState(() => {
    if (typeof window === 'undefined') return 900
    return computeGridWidth(window.innerWidth)
  })

  // Track viewport width for responsive label layout
  const [viewportWidth, setViewportWidth] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1440
  })

  // Tablet/mobile breakpoint: stack labels vertically when viewport < tablet breakpoint
  const isNarrow = viewportWidth < BREAKPOINTS.tablet
  // Compact breakpoint: labels slide outward and video spans 10 cols, eclipsing them
  const isCompactVideo = viewportWidth <= 1028

  // 2-column offset from center for label positioning at compact breakpoints
  const twoColOffset = (() => {
    const contentArea = viewportWidth - 50
    const colWidth = (contentArea - 220) / 12
    return Math.round(2 * colWidth + 1.5 * GRID_GUTTER)
  })()

  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth
      setTargetWidth(computeGridWidth(vw))
      setViewportWidth(vw)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Animated spring value: 0 = loader square, 1 = full video
  const morphProgress = useSpring(0, morphSpring)

  // Derived values from the spring
  const morphWidth = useTransform(morphProgress, [0, 1], [22, targetWidth])
  const morphHeight = useTransform(morphProgress, [0, 1], [22, targetWidth * (9 / 16)])
  const borderRadius = useTransform(morphProgress, [0, 1], [2, 16])
  const videoOpacity = useTransform(morphProgress, [0, 0.4, 0.6], [0, 0, 1])
  const loaderOpacity = useTransform(morphProgress, [0, 0.05], [1, 0])
  const morphBg = useTransform(morphProgress, [0, 0.05], ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'])
  // Compact label slide: start tight next to loader (24px gap), slide out to twoColOffset
  const LABEL_START_GAP = 11 + 24 // half loader (11px) + 24px gap
  const labelLeftX = useTransform(morphProgress, (v: number) => {
    return -(LABEL_START_GAP + (twoColOffset - LABEL_START_GAP) * v)
  })
  const labelRightX = useTransform(morphProgress, (v: number) => {
    return LABEL_START_GAP + (twoColOffset - LABEL_START_GAP) * v
  })
  // Skew — captured from loader's live CSS animation on first morph only
  const morphSkew = useSpring(0, morphSpring)
  const loaderInnerRef = useRef<HTMLDivElement>(null)
  const hasPlayedSkew = useRef(false)

  // Scroll-linked transition — dramatic color-wash dome.
  //
  // Inspired by abhijitrout.in: a tall, static gradient "dome" image sits
  // between the white page and the dark video section. As the user scrolls
  // the dome naturally enters from below and the page transitions through:
  //   white → blue (#0064FF) → red (#EF4562) → dark (#0E0E0E)
  //
  // The dome is NOT animated with scale/opacity — it simply scrolls with
  // the page. Only the flat dark overlay fades in/out so that the video
  // content has a guaranteed solid dark backdrop.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })

  // Gradient dome — translateY driven by scroll.  The dome starts below
  // the viewport (100vh) and scrolls up to well above it (-130vh) as the
  // section enters.  Because the dome is 130vh tall and its bottom goes
  // dark → black, when it has scrolled up ~30vh the viewport is fully
  // covered in dark and the flat overlay can seamlessly take over.
  //
  // The dome is rendered as position:fixed so it covers the viewport, but
  // its Y position is scroll-driven.
  //
  // Entry:  progress 0.04 → 0.24  : dome slides from +100vh up to -130vh
  // Dwell:  the flat overlay is already opaque by 0.22
  // Exit:   progress 0.78 → 0.94  : dome slides from -130vh down back off-screen
  // Dome Y position: slides from fully below viewport (+110vh) to well
  // above (-140vh).  The long travel range (250vh of motion) mapped over
  // a wide scroll window creates the slow, immersive feel of the reference.
  const domeY = useTransform(
    scrollYProgress,
    [0,   0.02,  0.30,   0.72,  0.96, 1],
    [110, 110,   -140,   -140,  110,  110],  // in vh
  )
  const domeYStr = useTransform(domeY, (v) => `${v}vh`)

  // Dome opacity — visible only during entry and exit transition windows.
  // Fades in quickly at the start, stays visible through the color wash,
  // then fades out after the dark overlay is fully opaque.
  const domeOpacity = useTransform(
    scrollYProgress,
    [0, 0.02, 0.04, 0.26, 0.30, 0.72, 0.74, 0.92, 0.96, 1],
    [0, 0,    1,    1,    0,    0,    1,     1,    0,    0]
  )

  // Dark overlay — solid #0E0E0E that fades in once the dome's dark
  // bottom has covered the viewport, ensuring full darkness for video.
  const darkOverlayOpacity = useTransform(
    scrollYProgress,
    [0, 0.20, 0.26, 0.76, 0.84, 1],
    [0, 0,    1,    1,    0,    0]
  )

  // Label + loader color inversion — timed to when the dome covers the viewport
  const labelColor = useTransform(
    scrollYProgress,
    [0, 0.14, 0.21, 0.78, 0.88, 1],
    ['#0E0E0E', '#0E0E0E', '#FFFFFF', '#FFFFFF', '#0E0E0E', '#0E0E0E']
  )
  const loaderBg = useTransform(
    scrollYProgress,
    [0, 0.14, 0.21, 0.78, 0.88, 1],
    ['#0E0E0E', '#0E0E0E', '#FFFFFF', '#FFFFFF', '#0E0E0E', '#0E0E0E']
  )
  const morphShadowBase = useTransform(
    morphProgress,
    [0, 0.3, 0.8],
    [0, 0, 1]
  )
  const [showCredits, setShowCredits] = useState(false)
  const creditsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hover effects — gated behind morph completion
  const [morphComplete, setMorphComplete] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const morphWrapperRef = useRef<HTMLDivElement>(null)

  // Track when the spring settles at 1 (fully expanded)
  useMotionValueEvent(morphProgress, 'change', (v) => {
    if (v >= 0.98) {
      setMorphComplete(true)
    } else if (v < 0.5) {
      setMorphComplete(false)
      setIsHovered(false)
    }
  })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!morphWrapperRef.current) return
    const rect = morphWrapperRef.current.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x: xPercent, y: yPercent })
  }, [])

  const hoverActive = morphComplete && isHovered

  const spotlightGradient = hoverActive
    ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,1) 0%, rgba(200,210,230,0.8) 15%, rgba(120,120,130,0.35) 35%, rgba(140,140,150,0.3) 55%, rgba(120,120,130,0.35) 100%)`
    : 'none'

  // Shadow that repels from cursor — offsets shift opposite to mouse position
  // Base shadow layers (from Figma): Y-offsets at 1070, 685, 385, 171, 43
  // When hovered, we add an X offset and adjust Y based on cursor position
  const [shadowIntensity, setShadowIntensity] = useState(0)
  useMotionValueEvent(morphShadowBase, 'change', (v) => {
    setShadowIntensity(v)
  })

  const computeShadow = useCallback(() => {
    if (shadowIntensity <= 0) {
      return '0 0 0 0 rgba(0,0,0,0)'
    }
    const s = shadowIntensity // 0→1

    // Repel direction: opposite of cursor position relative to center
    // mousePos is 0-100%, center is 50%
    const repelX = hoverActive ? (50 - mousePos.x) * 0.8 : 0 // max ±40px offset
    const repelY = hoverActive ? (50 - mousePos.y) * 0.5 : 0 // max ±25px offset

    // 5-step shadow — matched to Figma node 4438:2935
    const layers = [
      { y: 549, blur: 154, spread: 0, a: 0.00 },
      { y: 351, blur: 141, spread: 0, a: 0.01 },
      { y: 197, blur: 118, spread: 0, a: 0.05 },
      { y: 87,  blur: 87,  spread: 0, a: 0.09 },
      { y: 21,  blur: 48,  spread: 0, a: 0.10 },
    ]

    return layers.map(l => {
      const x = Math.round(repelX * (l.y / 549) * s) // deeper layers repel more
      const y = Math.round((l.y + repelY * (l.y / 549)) * s)
      const blur = Math.round(l.blur * s)
      const spread = Math.round(l.spread * s)
      const a = (l.a * s).toFixed(2)
      return `${x}px ${y}px ${blur}px ${spread}px rgba(0,0,0,${a})`
    }).join(', ')
  }, [shadowIntensity, hoverActive, mousePos.x, mousePos.y])

  const dynamicShadow = computeShadow()

  // Trigger / reverse the morph
  const handleMorph = useCallback((enter: boolean) => {
    if (enter) {
      // Only apply skew/rotation effect on the first morph trigger.
      // Re-entering the section (scrolling back down) just does the scale morph.
      if (!hasPlayedSkew.current && loaderInnerRef.current) {
        hasPlayedSkew.current = true
        const anims = loaderInnerRef.current.getAnimations()
        const anim = anims.find(a => (a as CSSAnimation).animationName === 'loaderSkew') as CSSAnimation | undefined
        if (anim && anim.currentTime != null) {
          const duration = 2400 // 2.4s in ms
          const rawT = ((anim.currentTime as number) % duration) / duration
          // Only capture skew — ignore rotation so the video doesn't spin.
          // The loader's current rotational position is treated as "upright".
          let skewX = 0
          if (rawT < 0.25) skewX = (rawT / 0.25) * 18
          else if (rawT < 0.5) skewX = ((0.5 - rawT) / 0.25) * 18
          else if (rawT < 0.75) skewX = -((rawT - 0.5) / 0.25) * 18
          else skewX = -((1 - rawT) / 0.25) * 18
          morphSkew.jump(skewX)
          morphSkew.set(0)
        }
      }
      setIsPlaying(false)
      morphProgress.set(1)
      // Show credits after morph triggers
      creditsTimerRef.current = setTimeout(() => setShowCredits(true), 250)
    } else {
      setIsPlaying(false)
      morphProgress.set(0)
      morphSkew.set(0)
      hasPlayedSkew.current = false
      setShowCredits(false)
      if (creditsTimerRef.current) {
        clearTimeout(creditsTimerRef.current)
        creditsTimerRef.current = null
      }
    }
  }, [morphProgress, morphSkew])

  // Use a native IntersectionObserver on the sentinel to trigger the morph.
  // Opens when the sentinel crosses viewport center (scrolling down).
  // Only closes when scrolling back UP past the sentinel — scrolling down
  // past the section keeps the video open.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentScrollY = window.scrollY
        const scrollingDown = currentScrollY > lastScrollY.current
        lastScrollY.current = currentScrollY

        if (entry.isIntersecting) {
          // Sentinel entered the center zone — always open
          handleMorph(true)
        } else if (!scrollingDown) {
          // Sentinel left the center zone while scrolling UP — close
          handleMorph(false)
        }
        // If scrolling down and sentinel leaves — stay open
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [handleMorph])

  const labelStyle = {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap' as const,
    flex: 1,
    minWidth: 0,
  }

  return (
    <section
      ref={sectionRef}
      data-section="video-morph"
      data-cursor-invert=""
      className="relative w-full"
      style={{ height: '250vh' }}
    >
      {/* ── Gradient dome ──────────────────────────────────────────
          Fixed-position element whose Y position is driven by scroll
          progress, simulating a tall gradient "mountain" that scrolls
          through the viewport.  Inspired by abhijitrout.in which uses
          a pre-rendered PNG; we recreate it with layered CSS
          radial-gradients in the brand palette (white→blue→red→dark).

          The dome is 130vh tall. As it scrolls from +100vh (below
          viewport) to -130vh (above), the viewer sees:
            1. White page (dome not yet visible)
            2. Soft blue glow appearing from bottom-center
            3. Red/magenta mid-ring filling the viewport
            4. Dark/black bottom covering everything
          Then the flat dark overlay fades in seamlessly. */}
      <motion.div
        style={{
          position: 'fixed',
          left: 0,
          width: '100vw',
          height: '140vh',
          pointerEvents: 'none',
          zIndex: 5,
          top: 0,
          y: domeYStr,
          opacity: domeOpacity,
          willChange: 'transform, opacity',
          // Vertical gradient background: transparent at top → dark at bottom.
          // The transparent top lets the dome blend seamlessly with the page,
          // and the dark bottom merges into the flat dark overlay.
          background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, #0E0E0E 75%, #0E0E0E 100%)',
        }}
      >
        {/* Dome shape — oversized horizontally so the soft edges bleed
            off-screen, creating a mountain/dome silhouette.

            Layer order (painter's algorithm — last listed = rendered first):
              3. Dark base   (bottom, widest)
              2. Red/coral   (middle ring)
              1. Blue glow   (top halo, narrowest)

            All anchored at `50% 100%` (bottom-center) so the dome rises
            upward like a mountain peak. */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '180%',
            height: '100%',
            background: [
              // 1. Blue glow — concentrated core, the halo at the apex
              'radial-gradient(ellipse 38% 32% at 50% 100%, rgba(0,100,255,0.75) 0%, transparent 100%)',
              // 2. Red/coral — wider mid-ring, creates the warm band visible around the blue
              'radial-gradient(ellipse 52% 46% at 50% 100%, rgba(239,69,98,0.85) 0%, transparent 100%)',
              // 3. Dark base — widest, fills the bottom of the dome and blends to black
              'radial-gradient(ellipse 62% 58% at 50% 100%, rgba(14,14,14,1) 0%, transparent 100%)',
            ].join(', '),
          }}
        />
      </motion.div>

      {/* ── Dark overlay ──────────────────────────────────────────
          Solid #0E0E0E that fades in once the dome covers the viewport,
          ensuring a guaranteed dark backdrop while the video is visible.
          Fades out on exit so the page returns to light. */}
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#0E0E0E',
          opacity: darkOverlayOpacity,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      {/* Sticky wrapper — pins content to viewport center */}
      <div
        className="sticky top-0 w-full flex items-center justify-center"
        style={{ height: '100vh', position: 'sticky', zIndex: 10 }}
      >
        {/* Center anchor — only the content row participates in centering;
            credits are positioned absolutely below so they don't push the row up */}
        <div className="relative">
        {/* Content row — flex layout: horizontal on desktop, vertical on narrow viewports.
            At ≤1028px, labels are positioned absolutely so the morphing video eclipses them. */}
        <div
          className="flex items-center justify-center"
          style={{
            gap: isCompactVideo ? 0 : 24,
            flexDirection: (isNarrow && !isCompactVideo) ? 'column' : 'row',
            width: '100vw',
            padding: '0 25px',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {/* Top/Left label — at ≤1028px, positioned absolutely ~2 cols from center;
              the morphing video grows past it, creating the eclipse effect */}
          <motion.span style={{
            ...labelStyle,
            color: labelColor,
            textAlign: isCompactVideo ? 'right' : (isNarrow ? 'center' : 'right'),
            ...(isCompactVideo ? {
              position: 'absolute' as const,
              right: '50%',
              top: '50%',
              x: labelLeftX,
              y: '-50%',
              zIndex: 0,
              flex: 'none',
            } : {}),
          }}>
            Live from SQSP
          </motion.span>

          {/* Morph wrapper — contains the morphing element + the loader animation on top */}
          <div
            ref={morphWrapperRef}
            className="relative"
            style={{ flexShrink: 0, zIndex: 1 }}
            onMouseEnter={() => morphComplete && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
          >
            {/* Hover scale + tilt wrapper — wraps entire container so scale/tilt applies to border-radius + shadow */}
            <div
              style={{
                transform: hoverActive
                  ? `perspective(1200px) rotateX(${(mousePos.y - 50) * -0.025}deg) rotateY(${(mousePos.x - 50) * 0.025}deg) scale(1.006)`
                  : 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)',
                transition: hoverActive
                  ? 'transform 0.15s ease-out'
                  : 'transform 0.45s cubic-bezier(0.33, 1, 0.68, 1)',
              }}
            >
            {/* The morphing element — starts as 22×22 square, becomes video container */}
            <motion.div
              className="relative"
              style={{
                width: morphWidth,
                height: morphHeight,
                borderRadius,
                backgroundColor: morphBg,
                overflow: 'hidden',
                boxShadow: dynamicShadow,
                skewX: morphSkew,
              }}
            >
              {/* Video content — hidden until morph, then fades in */}
              <motion.div
                className="absolute inset-0"
                style={{ opacity: videoOpacity }}
              >
                {isPlaying ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="relative w-full h-full"
                    data-cursor="play"
                    style={{ cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}
                  >
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      poster={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                      className="w-full h-full"
                      style={{ objectFit: 'cover', display: 'block' }}
                      src="/images/vid-sqsp-thumb.webm"
                    />
                  </button>
                )}
              </motion.div>

              {/* Cursor spotlight — radial gradient following mouse */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: 'inherit',
                  background: hoverActive
                    ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 45%, transparent 80%)`
                    : 'none',
                  opacity: hoverActive ? 1 : 0,
                  transition: 'opacity 0.4s ease-out',
                }}
              />

              {/* Border spotlight — CSS mask compositing for glowing border */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: 'inherit',
                  background: spotlightGradient,
                  mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  padding: '1px',
                  opacity: hoverActive ? 0.6 : 0,
                  transition: 'opacity 0.4s ease-out',
                }}
              />
            </motion.div>
            </div>{/* end hover scale wrapper */}

            {/*
              Loader animation — rendered OUTSIDE the overflow:hidden morphing element
              so the rotation/skew isn't clipped. Centered over the morphing element
              via absolute positioning. Fades out as morph begins.
            */}
            <motion.div
              style={{
                opacity: loaderOpacity,
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 22,
                height: 22,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            >
              <motion.div
                ref={loaderInnerRef}
                style={{
                  width: 22,
                  height: 22,
                  backgroundColor: loaderBg,
                  borderRadius: 2,
                  animation: 'loaderSkew 2.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
                }}
              />
            </motion.div>
          </div>

          {/* Right label — at ≤1028px, positioned absolutely ~2 cols from center;
              the morphing video grows past it, creating the eclipse effect */}
          <motion.span style={{
            ...labelStyle,
            color: labelColor,
            textAlign: isCompactVideo ? 'left' : (isNarrow ? 'center' : 'left'),
            ...(isCompactVideo ? {
              position: 'absolute' as const,
              left: '50%',
              top: '50%',
              x: labelRightX,
              y: '-50%',
              zIndex: 0,
              flex: 'none',
            } : {}),
          }}>
            Circle Day 2025
          </motion.span>
        </div>

        {/* Attribution text — absolutely positioned below the content row
            so it doesn't affect vertical centering of the video lockup.
            Line-by-line staggered reveal triggered by showCredits. */}
        <motion.div
          animate={showCredits ? 'visible' : 'hidden'}
          initial="hidden"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.10 } },
          }}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 500,
            textAlign: 'center',
            lineHeight: '24px',
            letterSpacing: '-0.02em',
            marginTop: 44,
            whiteSpace: 'nowrap',
            mixBlendMode: 'luminosity',
          }}
        >
          {/* Line 1 */}
          <div style={{ overflow: 'hidden' }}>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] } },
              }}
              style={{ color: '#8B8B8B' }}
            >
              A special thank you to my partners{' '}
              <a href="https://www.linkedin.com/in/vanasa-liu/" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Vanasa Liu
              </a>{' '}
              and{' '}
              <a href="https://www.linkedin.com/in/guillermo-su%C3%A1rez-ara-59720680" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Guillermo Suarez Ara
              </a>
              ,
            </motion.div>
          </div>
          {/* Line 2 */}
          <div style={{ overflow: 'hidden' }}>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] } },
              }}
              style={{ color: '#8B8B8B' }}
            >
              and Websites engineering for making this live demo possible.
            </motion.div>
          </div>
        </motion.div>
        </div>
      </div>

      {/*
        Scroll sentinel — lives in normal document flow (NOT inside sticky).
        Section is 250vh → sticky travel is 150vh.
        Sentinel at 90vh → crosses viewport center at 40vh into travel,
        leaving 60vh of dwell with the expanded video before sticky ends.
      */}
      <div
        ref={sentinelRef}
        style={{ position: 'absolute', top: '90vh', bottom: 0, width: '100%', pointerEvents: 'none' }}
      />
    </section>
  )
}
