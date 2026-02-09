import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

const BIO_TEXT =
  'Peter Evan Rodriguez is a Nuyorican designer solving hard problems with soft product. He brings over a decade of insight, intuition and influence from his dome to your chrome. Nowadays he\u2019s shaping product design for Squarespace\u2019s flagship website builder with user-centered AI tools.'

/**
 * Measures how the browser naturally wraps `text` inside a hidden <p>
 * with the same font styles, then returns an array of line strings.
 */
function useLineBreaks(
  text: string,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [lines, setLines] = useState<string[]>([])

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    // Create an off-screen probe <p> with identical styles
    const probe = document.createElement('p')
    const cs = getComputedStyle(container.querySelector('p.bio-measure') || container)
    probe.style.cssText = `
      position:absolute;visibility:hidden;white-space:pre-wrap;
      font-family:${cs.fontFamily};font-size:${cs.fontSize};
      font-weight:${cs.fontWeight};line-height:${cs.lineHeight};
      letter-spacing:${cs.letterSpacing};
      width:${container.clientWidth}px;
      margin:0;padding:0;
    `
    document.body.appendChild(probe)

    // Build lines word-by-word
    const words = text.split(' ')
    const result: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      probe.textContent = testLine
      const lineCount = probe.getClientRects().length || Math.round(probe.offsetHeight / parseFloat(cs.lineHeight))

      if (lineCount > 1 && currentLine) {
        // Word caused a wrap → push the previous line
        result.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) result.push(currentLine)
    document.body.removeChild(probe)

    setLines(result)
  }, [text, containerRef])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [measure, containerRef])

  return lines
}

// Variants for staggered line reveal
const wrapperVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.10 },
  },
}

const lineVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.33, 1, 0.68, 1] as [number, number, number, number],
    },
  },
}

export function BioCopySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const lines = useLineBreaks(BIO_TEXT, containerRef)

  return (
    <section
      className=""
      data-scroll
      data-scroll-section
    >
      <div
        ref={containerRef}
        style={{
          /* Center within 12-col grid: 10 cols wide = calc(10 * colWidth + 9 * gutter) */
          maxWidth: 'calc(10 * ((100vw - 50px - 220px) / 12) + 9 * 20px)',
          margin: '0 auto',
          paddingLeft: 25,
          paddingRight: 25,
          paddingTop: 0,
          paddingBottom: 120,
        }}
      >
        {/* Hidden measurement <p> — keeps styles in sync for line-break detection */}
        <p
          className="bio-measure"
          aria-hidden
          style={{
            position: 'absolute',
            visibility: 'hidden',
            fontFamily: 'Inter',
            fontSize: 'clamp(48px, 3.33vw, 60px)',
            fontWeight: 600,
            lineHeight: 'clamp(60px, 4.17vw, 75px)',
            letterSpacing: 'clamp(-1.65px, -0.092vw, -1.32px)',
            whiteSpace: 'pre-wrap',
            margin: 0,
            padding: 0,
          }}
        >
          {BIO_TEXT}
        </p>

        {/* Animated lines */}
        <motion.div
          variants={wrapperVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          style={{
            fontFamily: 'Inter',
            fontSize: 'clamp(48px, 3.33vw, 60px)',
            fontWeight: 600,
            lineHeight: 'clamp(60px, 4.17vw, 75px)',
            letterSpacing: 'clamp(-1.65px, -0.092vw, -1.32px)',
            color: '#0E0E0E',
          }}
        >
          {lines.map((line, i) => (
            <div key={`${i}-${line.slice(0, 12)}`} style={{ overflow: 'hidden' }}>
              <motion.div variants={lineVariants}>
                {line}
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
