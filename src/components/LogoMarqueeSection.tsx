import { BackgroundMarquee } from './BackgroundMarquee'
import { motion } from 'framer-motion'

const quoteLines = [
  "Delivering shareholder value",
  "despite macroeconomic trends",
  "since 1989.",
]

export function LogoMarqueeSection() {
  return (
    <section
      className=""
      style={{
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'visible',
        height: '140vh',
      }}
      data-scroll
      data-scroll-section
    >
      {/* Background marquee — same component previously used in hero */}
      <BackgroundMarquee marqueeFill="#DCDCDC" />

      {/* Quote — overlaying the marquee, line-by-line reveal */}
      <motion.div
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.10 } } }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 3,
          width: 685,
          textAlign: 'center',
          fontFamily: 'Inter',
          fontSize: 48,
          fontWeight: 600,
          lineHeight: '60px',
          letterSpacing: '-1.32px',
          color: '#0E0E0E',
        }}
      >
        {quoteLines.map((line, i) => (
          <div key={i} style={{ overflow: 'hidden' }}>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 28 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.7, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
                },
              }}
            >
              {line}
            </motion.div>
          </div>
        ))}
      </motion.div>

    </section>
  )
}
