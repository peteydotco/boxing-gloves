import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

const BIO_TEXT =
  'Peter Evan Rodriguez is a Nuyorican designer solving hard problems with soft product. He brings over a decade of insight, intuition and influence from his dome to your chrome. Nowadays he\u2019s shaping product design for Squarespace\u2019s flagship website builder with user-centered AI tools.'

const FONT_STYLE: React.CSSProperties = {
  fontFamily: 'Inter',
  fontSize: 'clamp(48px, 3.33vw, 60px)',
  fontWeight: 600,
  lineHeight: 'clamp(60px, 4.17vw, 75px)',
  letterSpacing: 'clamp(-1.65px, -0.092vw, -1.32px)',
}

/**
 * Measures natural line breaks by rendering every word as an inline <span>
 * inside a hidden container, then grouping words that share the same offsetTop.
 * This approach is immune to font-loading timing and clamp() sizing.
 */
function useLineBreaks(
  text: string,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [lines, setLines] = useState<string[]>([])

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container || container.clientWidth === 0) return

    // Create a hidden probe div with the same width and font styles
    const probe = document.createElement('div')
    const measureEl = container.querySelector('.bio-measure') as HTMLElement | null
    const cs = measureEl ? getComputedStyle(measureEl) : null

    probe.style.cssText = `
      position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;
      width:${container.clientWidth - 50}px;
      font-family:${cs?.fontFamily || 'Inter'};
      font-size:${cs?.fontSize || '48px'};
      font-weight:${cs?.fontWeight || '600'};
      line-height:${cs?.lineHeight || '60px'};
      letter-spacing:${cs?.letterSpacing || '-1.65px'};
      white-space:normal;word-wrap:break-word;
    `
    container.appendChild(probe)

    // Render each word as an inline span
    const words = text.split(' ')
    const spans: HTMLSpanElement[] = []
    words.forEach((word, i) => {
      const span = document.createElement('span')
      span.textContent = i < words.length - 1 ? word + ' ' : word
      probe.appendChild(span)
      spans.push(span)
    })

    // Group words by their vertical position (offsetTop)
    const result: string[] = []
    let currentLine = ''
    let currentTop = spans[0]?.offsetTop ?? 0

    spans.forEach((span, i) => {
      const top = span.offsetTop
      if (Math.abs(top - currentTop) > 2) {
        // New line
        result.push(currentLine.trimEnd())
        currentLine = words[i] + ' '
        currentTop = top
      } else {
        currentLine += words[i] + ' '
      }
    })
    if (currentLine.trim()) result.push(currentLine.trimEnd())

    container.removeChild(probe)
    setLines(result)
  }, [text, containerRef])

  useEffect(() => {
    // Wait a frame for fonts + layout to settle
    const raf = requestAnimationFrame(() => measure())
    const ro = new ResizeObserver(() => measure())
    if (containerRef.current) ro.observe(containerRef.current)

    // Also re-measure when fonts finish loading
    document.fonts?.ready?.then(() => measure())

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
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
          position: 'relative',
          /* Center within 12-col grid: 10 cols wide = calc(10 * colWidth + 9 * gutter) */
          maxWidth: 'calc(10 * ((100vw - 50px - 220px) / 12) + 9 * 20px)',
          margin: '0 auto',
          paddingLeft: 25,
          paddingRight: 25,
          paddingTop: 0,
          paddingBottom: 120,
        }}
      >
        {/* Hidden measurement element — keeps computed styles in sync for line-break detection */}
        <p
          className="bio-measure"
          aria-hidden
          style={{
            ...FONT_STYLE,
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'pre-wrap',
            margin: 0,
            padding: 0,
          }}
        >
          {BIO_TEXT}
        </p>

        {/* Animated lines — each line slides up from behind an overflow clip */}
        <motion.div
          variants={wrapperVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          style={{
            ...FONT_STYLE,
            color: '#0E0E0E',
          }}
        >
          {lines.length > 0 ? (
            lines.map((line, i) => (
              <div key={`${i}-${line.slice(0, 16)}`} style={{ overflow: 'hidden' }}>
                <motion.div variants={lineVariants}>
                  {line}
                </motion.div>
              </div>
            ))
          ) : (
            /* Fallback: show full text if line measurement hasn't run yet */
            <div style={{ whiteSpace: 'pre-wrap' }}>{BIO_TEXT}</div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
