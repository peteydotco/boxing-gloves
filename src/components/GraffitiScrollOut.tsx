import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { PeteyGraffitiSvg } from './PeteyGraffitiSvg'

// ---------------------------------------------------------------------------
// Section height and derived scroll travel
// ---------------------------------------------------------------------------

const SECTION_HEIGHT_VH = 500
const SCROLL_TRAVEL_VH = SECTION_HEIGHT_VH - 100

// ---------------------------------------------------------------------------
// Text strings that appear along the graffiti at various scroll positions.
// ---------------------------------------------------------------------------

interface TrailText {
  text: string
  pathFraction: number
  topPct: number
  side: 'left' | 'right'
  fontSize?: string
  fontWeight?: number
}

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

  // Scroll-driven animation
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Camera pan: translate the tall inner container upward as user scrolls
  const svgTranslateY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -SCROLL_TRAVEL_VH],
  )
  const svgY = useTransform(svgTranslateY, (v) => `${v}vh`)

  // Graffiti opacity: fade in subtly over the first 10% of scroll progress
  const graffitiOpacity = useTransform(
    scrollYProgress,
    [0, 0.08],
    [0.02, 0.08],
  )

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
          {/* Static PETEY graffiti — positioned to continue seamlessly from hero.
               The hero renders the same SVG clipped at 100vh. Here we render the
               full SVG offset upward by 100vh so the lower portion is visible in
               the scroll-out viewport while the hero-covered portion sits above. */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              // Match the hero's graffiti sizing: 250vh height (full SVG)
              // The hero clips the top portion; this section shows the continuation
              height: '250vh',
              width: 'auto',
              aspectRatio: '538 / 1185.79',
              // Offset upward so the SVG top aligns with the hero top
              // (the hero occupies 100vh above this section)
              marginTop: '-100vh',
              opacity: graffitiOpacity,
              pointerEvents: 'none',
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

          {/* Text labels along the graffiti */}
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
  const revealStart = item.pathFraction
  const revealEnd = revealStart + 0.04

  const opacity = useTransform(scrollYProgress, [revealStart, revealEnd], [0, 1])
  const translateY = useTransform(scrollYProgress, [revealStart, revealEnd], [20, 0])

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: `${item.topPct}%`,
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
