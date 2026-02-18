// import { BackgroundMarquee } from './BackgroundMarquee'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IoMdCheckmark } from 'react-icons/io'
import { useReducedMotion } from '../hooks/useReducedMotion'

const quoteLines = [
  "Case studies coming soon.",
]

export function LogoMarqueeSection() {
  const [copied, setCopied] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<'linkedin' | 'email' | null>(null)
  const reduced = useReducedMotion()

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hello@petey.co')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLinkedIn = () => {
    window.open('https://www.linkedin.com/in/peteydotco/', '_blank', 'noopener,noreferrer')
  }

  /* Centering styles for the headline + button overlay */
  const centeredOverlay: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 685,
    maxWidth: 'calc(100vw - 48px)',
    textAlign: 'center',
  }

  return (
    <section
      className=""
      style={{
        position: 'relative',
        overflowX: 'clip',
        overflowY: 'visible',
        height: '85vh',
        marginTop: '-20vh',
        backgroundColor: 'var(--canvas)',
      }}
      data-scroll
      data-scroll-section
    >
      {/* Background marquee — disabled for now */}
      {/* <BackgroundMarquee marqueeFill="#DCDCDC" /> */}

      {/* ── Headline + Buttons — ABOVE the spray canvas ──
           Single layer at z-index 11 so paint goes UNDER the text and buttons.
           Headline text has pointer-events: none so spray painting passes through.
           Buttons have pointer-events: auto to preserve hover states and clicks. */}
      <motion.div
        className="font-inter"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.10 } } }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        style={{
          ...centeredOverlay,
          zIndex: 11,
          pointerEvents: 'none',
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: '-0.028em',
          color: '#000000',
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

        {/* Action buttons — Copy email & More on LinkedIn */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, delay: 0.15, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
            },
          }}
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginTop: 32,
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: 'normal',
            lineHeight: 'normal',
            pointerEvents: 'auto',
          }}
        >
          <motion.button
            data-cursor="morph"
            data-cursor-radius="5"
            onClick={handleCopyEmail}
            onMouseEnter={() => setHoveredButton('email')}
            onMouseLeave={() => setHoveredButton(null)}
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: 200,
              height: 48,
              borderRadius: 5,
              backgroundColor: hoveredButton === 'email' ? '#FFFFFF' : 'transparent',
              border: hoveredButton === 'email' ? '1px solid rgba(0,0,0,0.075)' : '1px solid rgba(0,0,0,0.09)',
              boxShadow: hoveredButton === 'email' ? '0 171px 171px 0 rgba(0,0,0,0.14), 0 43px 94px 0 rgba(0,0,0,0.16)' : 'none',
              transition: 'background-color 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out',
            }}
            whileHover={reduced ? undefined : { scale: 1.03 }}
            transition={{ duration: reduced ? 0.01 : 0.3 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={copied ? 'copied' : 'copy'}
                className="font-inter"
                style={{
                  fontSize: 17,
                  color: '#000000',
                  fontWeight: 500,
                  position: 'relative',
                  top: '-1px',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {copied ? <>Email copied<IoMdCheckmark style={{ display: 'inline', verticalAlign: 'middle', fontSize: '1.3em', marginLeft: '4px' }} /></> : 'Copy email'}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button
            data-cursor="morph"
            data-cursor-radius="5"
            onClick={handleLinkedIn}
            onMouseEnter={() => setHoveredButton('linkedin')}
            onMouseLeave={() => setHoveredButton(null)}
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: 200,
              height: 48,
              borderRadius: 5,
              backgroundColor: hoveredButton === 'linkedin' ? '#FFFFFF' : 'transparent',
              border: hoveredButton === 'linkedin' ? '1px solid rgba(0,0,0,0.075)' : '1px solid rgba(0,0,0,0.09)',
              boxShadow: hoveredButton === 'linkedin' ? '0 171px 171px 0 rgba(0,0,0,0.14), 0 43px 94px 0 rgba(0,0,0,0.16)' : 'none',
              transition: 'background-color 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out',
            }}
            whileHover={reduced ? undefined : { scale: 1.03 }}
            transition={{ duration: reduced ? 0.01 : 0.3 }}
          >
            <span
              className="font-inter"
              style={{
                fontSize: 17,
                color: '#000000',
                fontWeight: 500,
                position: 'relative',
                top: '-1px',
              }}
            >
              More on Linkedin
            </span>
          </motion.button>
        </motion.div>
      </motion.div>

    </section>
  )
}
