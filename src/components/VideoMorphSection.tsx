import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

const YOUTUBE_VIDEO_ID = 'rJKduGHwvHk'

// Spring config for the morph — snappy with visible bounce (low damping ratio for overshoot)
const morphSpring = { stiffness: 340, damping: 35, mass: 1.1 }

export function VideoMorphSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Compute target pixel width once (and on resize)
  const [targetWidth, setTargetWidth] = useState(() => {
    if (typeof window === 'undefined') return 900
    return Math.min(window.innerWidth * 0.65, 900)
  })

  useEffect(() => {
    const handleResize = () => {
      setTargetWidth(Math.min(window.innerWidth * 0.65, 900))
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
  const loaderOpacity = useTransform(morphProgress, [0, 0.15], [1, 0])
  const morphBg = useTransform(morphProgress, [0, 0.05], ['rgba(14,14,14,0)', 'rgba(14,14,14,1)'])
  const morphShadow = useTransform(
    morphProgress,
    [0, 0.3, 0.8],
    [
      '0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0)',
      '0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0)',
      '0 1070px 250px 0 rgba(0,0,0,0.00), 0 685px 250px 0 rgba(0,0,0,0.02), 0 385px 231px 0 rgba(0,0,0,0.08), 0 171px 171px 0 rgba(0,0,0,0.14), 0 43px 94px 0 rgba(0,0,0,0.16)',
    ]
  )
  const [showCredits, setShowCredits] = useState(false)
  const creditsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Trigger / reverse the morph
  const handleMorph = useCallback((enter: boolean) => {
    if (enter) {
      setIsPlaying(false)
      morphProgress.set(1)
      // Show credits 4s after morph triggers
      creditsTimerRef.current = setTimeout(() => setShowCredits(true), 250)
    } else {
      setIsPlaying(false)
      morphProgress.set(0)
      setShowCredits(false)
      if (creditsTimerRef.current) {
        clearTimeout(creditsTimerRef.current)
        creditsTimerRef.current = null
      }
    }
  }, [morphProgress])

  // Use a native IntersectionObserver on the sentinel to trigger the morph
  // when it crosses viewport center. rootMargin "-50% 0px -50% 0px" creates
  // a 0-height trigger line at the vertical midpoint of the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        handleMorph(entry.isIntersecting)
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [handleMorph])

  const labelStyle = {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 600,
    color: '#0E0E0E',
    letterSpacing: '-0.04em',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ backgroundColor: '#FAFAF9', height: '200vh' }}
    >
      {/* Sticky wrapper — pins content to viewport center */}
      <div
        className="sticky top-0 w-full flex items-center justify-center"
        style={{ height: '100vh', position: 'sticky' }}
      >
        {/* Center anchor — only the content row participates in centering;
            credits are positioned absolutely below so they don't push the row up */}
        <div className="relative">
        {/* Content row — flex keeps labels naturally flanking the morphing element */}
        <div
          className="flex items-center justify-center"
          style={{ gap: 24 }}
        >
          {/* Left label */}
          <span style={labelStyle}>
            Live from SQSP
          </span>

          {/* Morph wrapper — contains the morphing element + the loader animation on top */}
          <div className="relative" style={{ flexShrink: 0 }}>
            {/* The morphing element — starts as 22×22 square, becomes video container */}
            <motion.div
              className="relative"
              style={{
                width: morphWidth,
                height: morphHeight,
                borderRadius,
                backgroundColor: morphBg,
                boxShadow: morphShadow,
                overflow: 'hidden',
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
                    style={{ cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                      alt="Circle Day 2025 — Live from Squarespace"
                      className="w-full h-full"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        style={{
                          width: 68,
                          height: 48,
                          backgroundColor: 'rgba(255, 0, 0, 0.85)',
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: '18px solid white',
                            borderTop: '11px solid transparent',
                            borderBottom: '11px solid transparent',
                            marginLeft: 3,
                          }}
                        />
                      </div>
                    </div>
                  </button>
                )}
              </motion.div>
            </motion.div>

            {/*
              Loader animation — rendered OUTSIDE the overflow:hidden morphing element
              so the rotation/skew isn't clipped. Centered over the morphing element
              via absolute positioning. Fades out as morph begins.
            */}
            <motion.div
              style={{
                opacity: loaderOpacity,
                position: 'absolute',
                top: 0,
                left: 0,
                width: 22,
                height: 22,
                pointerEvents: 'none',
              }}
            >
              <div
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
          <span style={labelStyle}>
            Circle Day 2025
          </span>
        </div>

        {/* Attribution text — absolutely positioned below the content row
            so it doesn't affect vertical centering of the video lockup */}
        <motion.p
          animate={{ color: showCredits ? '#8B8B8B' : 'rgba(139,139,139,0)' }}
          transition={{ duration: showCredits ? 1 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: '24px',
            letterSpacing: '-0.04em',
            marginTop: 44,
            whiteSpace: 'nowrap',
          }}
        >
          A special thank you to my partners{' '}
          <a href="https://vanasaliu.com" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>
            Vanasa Liu
          </a>{' '}
          and{' '}
          <a href="https://guillermo.dev" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>
            Guillermo Suarez Ara
          </a>
          ,
          <br />
          and Websites engineering for making this live demo possible.
        </motion.p>
        </div>
      </div>

      {/*
        Scroll sentinel — lives in normal document flow (NOT inside sticky).
        Section is 200vh → sticky travel is 100vh.
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
