// import { BackgroundMarquee } from './BackgroundMarquee'
import { motion } from 'framer-motion'

const quoteLines = [
  "Case studies coming soon.",
]

export function LogoMarqueeSection() {
  return (
    <section
      className=""
      style={{
        position: 'relative',
        zIndex: 21,
        overflowX: 'clip',
        overflowY: 'visible',
        height: '85vh',
        marginTop: '-20vh',
        backgroundColor: '#fff',
      }}
      data-scroll
      data-scroll-section
    >
      {/* Background marquee — disabled for now */}
      {/* <BackgroundMarquee marqueeFill="#DCDCDC" /> */}

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
          maxWidth: 'calc(100vw - 48px)',
          textAlign: 'center',
          fontFamily: 'Inter',
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: '-0.028em',
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
