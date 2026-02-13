import { useRef, useEffect, useMemo } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'

const TEXT = 'From my dome to your chrome.'
const SECTION_HEIGHT = '450vh'

// Deterministic pseudo-random seeded by index — stable across HMR
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function LetterSpan({
  char,
  scrollYProgress,
  scatter,
}: {
  char: string
  scrollYProgress: MotionValue<number>
  scatter: {
    yOffset: number
    rotation: number
    // Progress value at which this letter crosses viewport center
    centerProgress: number
  }
}) {
  // Each letter resolves over a window centered on when it crosses the viewport midpoint.
  // settle window = 0.15 of total progress, so letters are fully resolved
  // well before they reach the left edge.
  const settleStart = Math.max(0, scatter.centerProgress - 0.18)
  const settleEnd = Math.min(1, scatter.centerProgress - 0.04)

  const y = useTransform(
    scrollYProgress,
    [settleStart, settleEnd],
    [scatter.yOffset, 0],
  )
  const rotate = useTransform(
    scrollYProgress,
    [settleStart, settleEnd],
    [scatter.rotation, 0],
  )
  const opacity = useTransform(
    scrollYProgress,
    [settleStart, settleEnd],
    [0, 1],
  )

  return (
    <motion.span
      style={{
        display: 'inline-block',
        y,
        rotate,
        opacity,
        whiteSpace: 'pre',
      }}
    >
      {char}
    </motion.span>
  )
}

export function ScrollingTextSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const textWidthRef = useRef(3000)

  // Measure text width after fonts load + on resize
  useEffect(() => {
    const measure = () => {
      if (textRef.current) {
        textWidthRef.current = textRef.current.scrollWidth
      }
    }
    measure()
    document.fonts?.ready?.then(measure)

    const ro = new ResizeObserver(measure)
    if (textRef.current) ro.observe(textRef.current)
    return () => ro.disconnect()
  }, [])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end end'],
  })

  // Horizontal translation: starts fully off-screen right, scrolls left
  const x = useTransform(scrollYProgress, (progress) => {
    const vw = window.innerWidth
    const tw = textWidthRef.current
    const start = vw // begin completely off-screen right
    const end = -tw  // end completely off-screen left
    return start + (end - start) * progress
  })

  const characters = useMemo(() => TEXT.split(''), [])

  // Compute the scroll progress at which each letter crosses viewport center.
  // x(p) = vw - (vw + tw) * p, so letter at offset `off` hits screen center (vw/2) when:
  //   vw - (vw + tw) * p + off = vw/2  →  p = (vw/2 + off) / (vw + tw)
  const scatterData = useMemo(
    () => {
      const vw = window.innerWidth
      const tw = textWidthRef.current
      const totalTravel = vw + tw
      const charAdvance = tw / characters.length

      return characters.map((_, i) => {
        const charOffset = i * charAdvance
        const cp = Math.max(0.05, Math.min(0.95, (vw / 2 + charOffset) / totalTravel))

        return {
          yOffset: (seededRandom(i) - 0.5) * window.innerHeight * 0.55,
          rotation: (seededRandom(i + 100) - 0.5) * 40,
          centerProgress: cp,
        }
      })
    },
    [characters],
  )

  return (
    <section
      ref={sectionRef}
      style={{
        height: SECTION_HEIGHT,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <motion.div
          ref={textRef}
          style={{
            x,
            display: 'flex',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 'clamp(80px, 15vw, 280px)',
            letterSpacing: '-0.07em',
            lineHeight: 0.9,
            color: '#0E0E0E',
            userSelect: 'none',
            cursor: 'default',
          }}
        >
          {characters.map((char, i) => (
            <LetterSpan
              key={i}
              char={char}
              scrollYProgress={scrollYProgress}
              scatter={scatterData[i]}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
