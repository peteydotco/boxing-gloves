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

// Section height and derived scroll travel
const SECTION_HEIGHT_VH = 500
const SCROLL_TRAVEL_VH = SECTION_HEIGHT_VH - 100

// SVG viewBox dimensions
const VB_W = 1000
const VB_H = 5000

// ---------------------------------------------------------------------------
// Text strings that appear along the trail at various scroll positions.
// pathFraction: 0–1 position along the path for placement.
// side: which side of the trail the text sits on.
// ---------------------------------------------------------------------------

interface TrailText {
  text: string
  /** 0–1 fraction along the path where this text is placed (drives reveal timing) */
  pathFraction: number
  /** Vertical position as % of section height (0–100) */
  topPct: number
  /** Horizontal position: 'left' places text in left 40%, 'right' in right 40% */
  side: 'left' | 'right'
  fontSize?: string
  fontWeight?: number
}

// Compute topPct so text is centered in the viewport when the trail reaches it.
// At scroll progress p, the camera shows container rows from p*SCROLL_TRAVEL to
// p*SCROLL_TRAVEL + 100vh. To center text at that moment:
//   topPct = (p * SCROLL_TRAVEL + 50) / SECTION_HEIGHT * 100
function computeTopPct(pathFraction: number): number {
  return ((pathFraction * SCROLL_TRAVEL_VH + 50) / SECTION_HEIGHT_VH) * 100
}

const TRAIL_TEXTS: TrailText[] = [
  {
    text: 'Peter Evan Rodriguez',
    pathFraction: 0.08,
    topPct: computeTopPct(0.08),
    side: 'left',
    fontSize: 'clamp(32px, 3vw, 52px)',
    fontWeight: 600,
  },
  {
    text: 'Nuyorican designer',
    pathFraction: 0.20,
    topPct: computeTopPct(0.20),
    side: 'right',
    fontSize: 'clamp(24px, 2.2vw, 38px)',
    fontWeight: 500,
  },
  {
    text: 'solving hard problems\nwith soft product',
    pathFraction: 0.34,
    topPct: computeTopPct(0.34),
    side: 'left',
    fontSize: 'clamp(26px, 2.4vw, 40px)',
    fontWeight: 500,
  },
  {
    text: 'Squarespace',
    pathFraction: 0.50,
    topPct: computeTopPct(0.50),
    side: 'right',
    fontSize: 'clamp(28px, 2.8vw, 48px)',
    fontWeight: 600,
  },
  {
    text: 'design-minded AI\n& expressibility tools',
    pathFraction: 0.65,
    topPct: computeTopPct(0.65),
    side: 'left',
    fontSize: 'clamp(24px, 2.2vw, 38px)',
    fontWeight: 500,
  },
  {
    text: 'from my dome\nto your chrome',
    pathFraction: 0.80,
    topPct: computeTopPct(0.80),
    side: 'right',
    fontSize: 'clamp(28px, 2.8vw, 46px)',
    fontWeight: 600,
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GraffitiScrollOut() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [totalLength, setTotalLength] = useState(0)

  // Measure path length after mount
  useEffect(() => {
    const measure = () => {
      if (pathRef.current) {
        const len = pathRef.current.getTotalLength()
        if (len > 0) setTotalLength(len)
      }
    }
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
          {TRAIL_TEXTS.map((item, i) => (
            <TrailTextLabel
              key={i}
              item={item}
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
  scrollYProgress,
}: {
  item: TrailText
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  // Text reveals when the trail drawing front reaches its position along the path.
  const revealStart = item.pathFraction
  const revealEnd = revealStart + 0.04

  const opacity = useTransform(scrollYProgress, [revealStart, revealEnd], [0, 1])
  const translateY = useTransform(scrollYProgress, [revealStart, revealEnd], [20, 0])

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: `${item.topPct}%`,
        // Left-side text: anchored from the left edge with padding
        // Right-side text: anchored from the right edge with padding
        ...(item.side === 'left'
          ? { left: 'clamp(24px, 5vw, 80px)' }
          : { right: 'clamp(24px, 5vw, 80px)' }),
        y: translateY,
        opacity,
        textAlign: item.side === 'left' ? 'left' : ('right' as const),
        whiteSpace: 'pre-line',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: item.fontSize || 'clamp(24px, 2.2vw, 38px)',
        fontWeight: item.fontWeight || 500,
        lineHeight: 1.2,
        letterSpacing: '-0.03em',
        color: '#0E0E0E',
        pointerEvents: 'none',
        maxWidth: 'min(440px, 38vw)',
      }}
    >
      {item.text}
    </motion.div>
  )
}
