import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// ---------------------------------------------------------------------------
// Trail path — S-curves descending from top-center, ending in a loose spiral.
// ViewBox: 0 0 1000 5000. The path origin (~500, 0) aligns with the graffiti
// Y's tail position (horizontally centered in the hero image).
// ---------------------------------------------------------------------------

const PATH_D = [
  // Start slightly right of center (matching Y descender direction)
  'M 520 0',
  // First big sweep — right
  'C 520 180, 780 320, 740 520',
  // Sweep left
  'S 200 700, 260 960',
  // Sweep right
  'C 340 1200, 820 1300, 760 1560',
  // Sweep left
  'S 160 1780, 240 2040',
  // Sweep right (wider)
  'C 360 2300, 800 2380, 720 2640',
  // Sweep left
  'S 180 2860, 280 3100',
  // Sweep right (tightening toward spiral)
  'C 420 3340, 740 3400, 660 3600',
  // Transition into spiral — first loop
  'C 560 3780, 340 3820, 360 3960',
  'C 380 4100, 600 4120, 580 4000',
  // Second loop (tighter)
  'C 560 3920, 420 3920, 440 4000',
  // Tail flick
  'C 455 4050, 490 4030, 500 4020',
].join(' ')

// ---------------------------------------------------------------------------
// Text strings that appear along the trail at various scroll positions.
// pathFraction: 0–1 position along the path for placement.
// revealAt: scroll progress (0–1) when the text starts fading in.
// side: which side of the trail the text sits on.
// ---------------------------------------------------------------------------

interface TrailText {
  text: string
  pathFraction: number
  revealAt: number
  side: 'left' | 'right'
  fontSize?: string
  fontWeight?: number
}

const TRAIL_TEXTS: TrailText[] = [
  {
    text: 'Peter Evan Rodriguez',
    pathFraction: 0.06,
    revealAt: 0.04,
    side: 'right',
    fontSize: 'clamp(32px, 3vw, 52px)',
    fontWeight: 600,
  },
  {
    text: 'Nuyorican designer',
    pathFraction: 0.18,
    revealAt: 0.14,
    side: 'left',
    fontSize: 'clamp(24px, 2.2vw, 38px)',
    fontWeight: 500,
  },
  {
    text: 'solving hard problems\nwith soft product',
    pathFraction: 0.32,
    revealAt: 0.26,
    side: 'right',
    fontSize: 'clamp(26px, 2.4vw, 40px)',
    fontWeight: 500,
  },
  {
    text: 'Squarespace',
    pathFraction: 0.48,
    revealAt: 0.40,
    side: 'left',
    fontSize: 'clamp(28px, 2.8vw, 48px)',
    fontWeight: 600,
  },
  {
    text: 'design-minded AI\n& expressibility tools',
    pathFraction: 0.62,
    revealAt: 0.54,
    side: 'right',
    fontSize: 'clamp(24px, 2.2vw, 38px)',
    fontWeight: 500,
  },
  {
    text: 'from my dome\nto your chrome',
    pathFraction: 0.78,
    revealAt: 0.68,
    side: 'left',
    fontSize: 'clamp(28px, 2.8vw, 46px)',
    fontWeight: 600,
  },
]

// Horizontal offset (in vw-relative px) for text labels from the path point
const TEXT_OFFSET = 80

// Section height and derived scroll travel
const SECTION_HEIGHT_VH = 500
const SCROLL_TRAVEL_VH = SECTION_HEIGHT_VH - 100

// SVG viewBox dimensions
const VB_W = 1000
const VB_H = 5000

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GraffitiScrollOut() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [totalLength, setTotalLength] = useState(0)
  const [textPositions, setTextPositions] = useState<{ x: number; y: number }[]>([])

  // Measure path length after mount
  useEffect(() => {
    const measure = () => {
      if (pathRef.current) {
        const len = pathRef.current.getTotalLength()
        if (len > 0) {
          setTotalLength(len)

          // Compute text positions from path
          const positions = TRAIL_TEXTS.map((t) => {
            const pt = pathRef.current!.getPointAtLength(t.pathFraction * len)
            return { x: pt.x, y: pt.y }
          })
          setTextPositions(positions)
        }
      }
    }
    // Wait a frame for SVG to render
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Scroll-driven animation
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Trail draw: dashoffset goes from totalLength (hidden) to 0 (fully drawn)
  const dashOffset = useTransform(scrollYProgress, [0, 1], [totalLength, 0])

  // Camera pan: translate the tall inner container upward as user scrolls
  const svgTranslateY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -SCROLL_TRAVEL_VH],
    // Output in vh — we'll apply as a style calc
  )
  // Convert vh number to CSS string
  const svgY = useTransform(svgTranslateY, (v) => `${v}vh`)

  // Subtle fade-in for the trail's leading edge
  const trailOpacity = useTransform(scrollYProgress, [0, 0.04], [0, 1])

  return (
    <section
      ref={sectionRef}
      data-scroll
      data-scroll-section
      style={{
        height: `${SECTION_HEIGHT_VH}vh`,
        position: 'relative',
      }}
    >
      {/* Sticky viewport — clips the tall inner content */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Tall inner container — panned vertically by scroll */}
        <motion.div
          style={{
            height: `${SECTION_HEIGHT_VH}vh`,
            width: '100%',
            position: 'relative',
            y: svgY,
          }}
        >
          {/* SVG trail */}
          <motion.svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMin slice"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: trailOpacity,
            }}
          >
            <defs>
              {/* Organic brush-edge roughening filter */}
              <filter
                id="brush-roughen"
                x="-5%"
                y="-5%"
                width="110%"
                height="110%"
              >
                <feTurbulence
                  type="turbulence"
                  baseFrequency="0.015"
                  numOctaves="4"
                  seed={42}
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={4}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>

            <motion.path
              ref={pathRef}
              d={PATH_D}
              fill="none"
              stroke="#0E0E0E"
              strokeWidth={35}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#brush-roughen)"
              strokeDasharray={totalLength}
              style={{ strokeDashoffset: dashOffset }}
            />
          </motion.svg>

          {/* Text labels along the trail */}
          {textPositions.length === TRAIL_TEXTS.length &&
            TRAIL_TEXTS.map((item, i) => (
              <TrailTextLabel
                key={i}
                item={item}
                position={textPositions[i]}
                scrollYProgress={scrollYProgress}
              />
            ))}
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Individual text label — fades in when scroll reaches its threshold
// ---------------------------------------------------------------------------

function TrailTextLabel({
  item,
  position,
  scrollYProgress,
}: {
  item: TrailText
  position: { x: number; y: number }
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const opacity = useTransform(
    scrollYProgress,
    [item.revealAt, item.revealAt + 0.06],
    [0, 1],
  )
  const translateY = useTransform(
    scrollYProgress,
    [item.revealAt, item.revealAt + 0.06],
    [24, 0],
  )

  // Convert SVG coordinates to percentage positions within the container
  const leftPct = (position.x / VB_W) * 100
  const topPct = (position.y / VB_H) * 100

  // Offset text to the side of the trail
  const xOffset = item.side === 'right' ? TEXT_OFFSET : -TEXT_OFFSET
  const textAlign = item.side === 'right' ? 'left' : 'right' as const
  // Anchor: right-side text anchors from its left edge; left-side from right edge
  const transformOrigin = item.side === 'right' ? 'left center' : 'right center'

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        x: xOffset,
        y: translateY,
        opacity,
        transformOrigin,
        textAlign,
        whiteSpace: 'pre-line',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: item.fontSize || 'clamp(24px, 2.2vw, 38px)',
        fontWeight: item.fontWeight || 500,
        lineHeight: 1.2,
        letterSpacing: '-0.03em',
        color: '#0E0E0E',
        pointerEvents: 'none',
        // Prevent text from being too wide on narrow screens
        maxWidth: 'min(400px, 40vw)',
      }}
    >
      {item.text}
    </motion.div>
  )
}
