import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { motion, useSpring, useTransform, useMotionValueEvent } from 'framer-motion'
import { gsap, ScrollTrigger, SplitText } from '../lib/gsap'
import { BREAKPOINTS } from '../constants/breakpoints'

const YOUTUBE_VIDEO_ID = 'rJKduGHwvHk'

// Spring config for the morph — gradual scale-up with gentle settle
const morphSpring = { stiffness: 180, damping: 38, mass: 1.6 }

// Grid constants — 12-column layout with 25px margins and 20px gutters
const GRID_MARGIN = 25
const GRID_GUTTER = 20
const GRID_COLS = 12

const computeGridWidth = (vw: number) => {
  const videoCols = vw <= 1028 ? 12 : 8
  const contentArea = vw - 2 * GRID_MARGIN
  const colWidth = (contentArea - (GRID_COLS - 1) * GRID_GUTTER) / GRID_COLS
  return videoCols * colWidth + (videoCols - 1) * GRID_GUTTER
}

export function VideoMorphSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const [targetWidth, setTargetWidth] = useState(() => {
    if (typeof window === 'undefined') return 900
    return computeGridWidth(window.innerWidth)
  })

  const [viewportWidth, setViewportWidth] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1440
  })

  const isNarrow = viewportWidth < BREAKPOINTS.tablet
  const isCompactVideo = viewportWidth <= 1028

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

  // ── Spring-driven morph (original pattern) ────────────────────────────
  const morphProgress = useSpring(0, morphSpring)

  const morphWidth = useTransform(morphProgress, [0, 1], [22, targetWidth])
  const morphHeight = useTransform(morphProgress, [0, 1], [22, targetWidth * (9 / 16)])
  const borderRadius = useTransform(morphProgress, [0, 1], [2, 16])
  const videoOpacity = useTransform(morphProgress, [0, 0.4, 0.6], [0, 0, 1])
  const loaderOpacity = useTransform(morphProgress, [0, 0.05], [1, 0])
  const morphBg = useTransform(morphProgress, [0, 0.05], ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'])

  // Compact label slide: start tight next to loader, slide out to twoColOffset
  const LABEL_START_GAP = 11 + 24
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

  // Shadow base from morph progress
  const morphShadowBase = useTransform(morphProgress, [0, 0.3, 0.8], [0, 0, 1])

  const [showCredits, setShowCredits] = useState(false)
  const creditsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hover effects — gated behind morph completion
  const [morphComplete, setMorphComplete] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const morphWrapperRef = useRef<HTMLDivElement>(null)

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

  // Shadow — 5-layer Figma-matched, cursor-repelling
  const [shadowIntensity, setShadowIntensity] = useState(0)
  useMotionValueEvent(morphShadowBase, 'change', (v) => {
    setShadowIntensity(v)
  })

  const computeShadow = useCallback(() => {
    if (shadowIntensity <= 0) return '0 0 0 0 rgba(0,0,0,0)'
    const s = shadowIntensity

    const repelX = hoverActive ? (50 - mousePos.x) * 0.8 : 0
    const repelY = hoverActive ? (50 - mousePos.y) * 0.5 : 0

    const layers = [
      { y: 549, blur: 154, spread: 0, a: 0.00 },
      { y: 351, blur: 141, spread: 0, a: 0.01 },
      { y: 197, blur: 118, spread: 0, a: 0.05 },
      { y: 87,  blur: 87,  spread: 0, a: 0.09 },
      { y: 21,  blur: 48,  spread: 0, a: 0.10 },
    ]

    return layers.map(l => {
      const x = Math.round(repelX * (l.y / 549) * s)
      const y = Math.round((l.y + repelY * (l.y / 549)) * s)
      const blur = Math.round(l.blur * s)
      const spread = Math.round(l.spread * s)
      const a = (l.a * s).toFixed(2)
      return `${x}px ${y}px ${blur}px ${spread}px rgba(0,0,0,${a})`
    }).join(', ')
  }, [shadowIntensity, hoverActive, mousePos.x, mousePos.y])

  const dynamicShadow = computeShadow()

  // ── Morph trigger/reverse (original IntersectionObserver pattern) ──────
  const handleMorph = useCallback((enter: boolean) => {
    if (enter) {
      if (!hasPlayedSkew.current && loaderInnerRef.current) {
        hasPlayedSkew.current = true
        const anims = loaderInnerRef.current.getAnimations()
        const anim = anims.find(a => (a as CSSAnimation).animationName === 'loaderSkew') as CSSAnimation | undefined
        if (anim && anim.currentTime != null) {
          const duration = 2400
          const rawT = ((anim.currentTime as number) % duration) / duration
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

  // IntersectionObserver sentinel — triggers morph at viewport center
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
          handleMorph(true)
        } else if (!scrollingDown) {
          handleMorph(false)
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [handleMorph])

  // ── GSAP ScrollTrigger — dome transitions + section bg + label colors ──
  // Only the gradient domes and section bg are scroll-driven.
  // The morph itself is spring-driven via IntersectionObserver above.
  const leftLabelRef = useRef<HTMLSpanElement>(null)
  const rightLabelRef = useRef<HTMLSpanElement>(null)
  const contentRowRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const contentRow = contentRowRef.current
    if (!section) return

    const splits: ReturnType<typeof SplitText.create>[] = []

    const ctx = gsap.context(() => {
      // ─── Lockup entrance — char-by-char reveal ────────────────────
      // "And occasionally..." exits char-by-char (top top → 5% top) in App.tsx.
      // These labels enter AFTER that exit completes (5% top → 10% top).
      const leftLabel = leftLabelRef.current
      const rightLabel = rightLabelRef.current

      if (leftLabel) {
        const splitLeft = SplitText.create(leftLabel, { type: 'chars' })
        splits.push(splitLeft)
        gsap.set(splitLeft.chars, { autoAlpha: 0, yPercent: 100 })
        gsap.to(splitLeft.chars, {
          autoAlpha: 1,
          yPercent: 0,
          ease: 'power2.out',
          stagger: 0.03,
          scrollTrigger: {
            trigger: section,
            start: '5% top',
            end: '10% top',
            scrub: true,
          },
        })
      }

      if (rightLabel) {
        const splitRight = SplitText.create(rightLabel, { type: 'chars' })
        splits.push(splitRight)
        gsap.set(splitRight.chars, { autoAlpha: 0, yPercent: 100 })
        gsap.to(splitRight.chars, {
          autoAlpha: 1,
          yPercent: 0,
          ease: 'power2.out',
          stagger: 0.03,
          scrollTrigger: {
            trigger: section,
            start: '5% top',
            end: '10% top',
            scrub: true,
          },
        })
      }

      // Loader bar — simple opacity fade alongside labels
      if (contentRow) {
        if (loaderInnerRef.current) {
          gsap.set(loaderInnerRef.current.parentElement!, { autoAlpha: 0 })
          gsap.to(loaderInnerRef.current.parentElement!, {
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: '5% top',
              end: '10% top',
              scrub: true,
            },
          })
        }
      }

      // ─── Label + loader color inversion ────────────────────────────
      // Labels start white (since lockup first appears on dark bg),
      // switch to dark when exiting the dark section.
      const setWhiteLabels = () => {
        if (leftLabelRef.current) leftLabelRef.current.style.color = '#FFFFFF'
        if (rightLabelRef.current) rightLabelRef.current.style.color = '#FFFFFF'
        if (loaderInnerRef.current) loaderInnerRef.current.style.backgroundColor = '#FFFFFF'
      }
      const setDarkLabels = () => {
        if (leftLabelRef.current) leftLabelRef.current.style.color = '#0E0E0E'
        if (rightLabelRef.current) rightLabelRef.current.style.color = '#0E0E0E'
        if (loaderInnerRef.current) loaderInnerRef.current.style.backgroundColor = '#0E0E0E'
      }

      // Start white — the lockup first appears on the dark bg
      setWhiteLabels()

      // Switch back to dark when section leaves
      ScrollTrigger.create({
        trigger: section,
        start: 'bottom top',
        end: 'bottom top',
        onEnter: setDarkLabels,
        onLeaveBack: setWhiteLabels,
      })
    }, section)

    return () => {
      ctx.revert()
      splits.forEach(s => s.revert())
    }
  }, [])

  const labelStyle = {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap' as const,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden' as const,
  }

  return (
    <section
      ref={sectionRef}
      data-section="video-morph"
      data-cursor-invert=""
      className="relative w-full"
      style={{ height: '250vh', backgroundColor: '#010000' }}
    >
      {/* ── Sticky wrapper — pins content to viewport center ────── */}
      <div
        className="sticky top-0 w-full flex items-center justify-center"
        style={{ height: '100vh', position: 'sticky', zIndex: 10 }}
      >
        <div ref={contentRowRef} className="relative">
          {/* Content row */}
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
            {/* Left label */}
            <motion.span
              ref={leftLabelRef}
              style={{
                ...labelStyle,
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
              }}
            >
              Live from SQSP
            </motion.span>

            {/* Morph wrapper — loader → video */}
            <div
              ref={morphWrapperRef}
              className="relative"
              style={{ flexShrink: 0, zIndex: 1 }}
              onMouseEnter={() => morphComplete && setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={handleMouseMove}
            >
              {/* Hover scale + tilt wrapper */}
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
                {/* The morphing element — spring-driven from 22×22 to video */}
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
                  {/* Video content */}
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

                  {/* Cursor spotlight */}
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

                  {/* Border spotlight */}
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

              {/* Loader animation — outside overflow:hidden so rotation isn't clipped */}
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
                    backgroundColor: '#0E0E0E',
                    borderRadius: 2,
                    animation: 'loaderSkew 2.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
                  }}
                />
              </motion.div>
            </div>

            {/* Right label */}
            <motion.span
              ref={rightLabelRef}
              style={{
                ...labelStyle,
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
              }}
            >
              Circle Day 2025
            </motion.span>
          </div>

          {/* Attribution text */}
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

      {/* Scroll sentinel — in normal document flow (NOT inside sticky).
          Section is 250vh → sticky travel is 150vh.
          Sentinel at 90vh → crosses viewport center at 40vh into travel. */}
      <div
        ref={sentinelRef}
        style={{ position: 'absolute', top: '120vh', bottom: 0, width: '100%', pointerEvents: 'none' }}
      />

    </section>
  )
}
