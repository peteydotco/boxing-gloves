// import { BackgroundMarquee } from './BackgroundMarquee'
import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IoMdCheckmark } from 'react-icons/io'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { DURATION } from '../constants/animation'
import { TYPE_SCALE, WEIGHT, LETTER_SPACING } from '../constants/typography'
import { colorTokens } from '../constants/themes'

export function LogoMarqueeSection() {
  const [copied, setCopied] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<'linkedin' | 'email' | null>(null)
  const reduced = useReducedMotion()

  // ── Embed hover effects (mirrors VideoMorphSection) ──
  const embedRef = useRef<HTMLDivElement>(null)
  const [embedHovered, setEmbedHovered] = useState(false)
  const [embedMouse, setEmbedMouse] = useState({ x: 50, y: 50 })
  const hoverActive = embedHovered && !reduced

  const handleEmbedMouseMove = useCallback((e: React.MouseEvent) => {
    if (!embedRef.current) return
    const rect = embedRef.current.getBoundingClientRect()
    setEmbedMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  // 5-layer Figma-matched shadow — cursor-repelling, visible only on hover
  const embedShadow = (() => {
    const layers = [
      { y: 549, blur: 154, a: 0.00 },
      { y: 351, blur: 141, a: 0.01 },
      { y: 197, blur: 118, a: 0.05 },
      { y: 87,  blur: 87,  a: 0.09 },
      { y: 21,  blur: 48,  a: 0.10 },
    ]
    const repelX = hoverActive ? (50 - embedMouse.x) * 0.8 : 0
    const repelY = hoverActive ? (50 - embedMouse.y) * 0.5 : 0
    return layers.map(l => {
      const a = hoverActive ? l.a : 0
      const x = Math.round(repelX * (l.y / 549))
      const y = Math.round((l.y + repelY * (l.y / 549)))
      return `${x}px ${y}px ${Math.round(l.blur)}px 0px rgba(0,0,0,${a.toFixed(2)})`
    }).join(', ')
  })()

  const spotlightGradient = hoverActive
    ? `radial-gradient(circle at ${embedMouse.x}% ${embedMouse.y}%, rgba(255,255,255,1) 0%, rgba(120,120,130,0.35) 35%, rgba(120,120,130,0.35) 100%)`
    : 'none'

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hello@petey.co').catch(() => {
      // Clipboard API may fail in insecure contexts or when denied permission
      console.warn('Clipboard write failed')
    })
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
      aria-label="Clients and collaborators"
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
          fontSize: TYPE_SCALE['2xl'].size,
          fontWeight: WEIGHT.medium,
          lineHeight: TYPE_SCALE['2xl'].lineHeight,
          letterSpacing: LETTER_SPACING.tighter,
          color: colorTokens.neutralNearBlack,
        }}
      >
        <div style={{ overflow: 'hidden' }}>
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
            Case studies coming soon.
          </motion.div>
        </div>

        {/* Apple Music embed — "While U Wait" playlist */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, delay: 0.10, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
            },
          }}
          style={{
            marginTop: 28,
            pointerEvents: 'auto',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Hover wrapper — mouse tracking for shadow + spotlight */}
          <div
            ref={embedRef}
            onMouseEnter={() => setEmbedHovered(true)}
            onMouseLeave={() => { setEmbedHovered(false); setEmbedMouse({ x: 50, y: 50 }) }}
            onMouseMove={handleEmbedMouseMove}
            style={{ width: '100%', maxWidth: 660 }}
          >
            {/* Shadow + border-radius container */}
            <div
              className="relative"
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: `${embedShadow}, inset 0 0 0 1px rgba(0,0,0,0.09)`,
                transition: `box-shadow ${DURATION.slow}s ease-out`,
              }}
            >
              <iframe
                allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                frameBorder="0"
                height="450"
                style={{
                  width: '100%',
                  display: 'block',
                  overflow: 'hidden',
                  background: 'transparent',
                }}
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                src="https://embed.music.apple.com/us/playlist/while-u-wait/pl.u-gZYmCbYVKyZ?theme=light"
                title="While U Wait — Apple Music playlist"
              />

              {/* Border spotlight — mouse-following edge glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: 'inherit',
                  background: spotlightGradient,
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  padding: '1px',
                  opacity: hoverActive ? 0.6 : 0,
                  transition: `opacity ${DURATION.slow}s ease-out`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Action buttons — Copy email & More on LinkedIn */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, delay: 0.25, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
            },
          }}
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginTop: 36,
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: 'normal',
            lineHeight: 'normal',
            pointerEvents: 'auto',
          }}
        >
          <motion.button
            type="button"
            data-cursor="morph"
            data-cursor-radius="5"
            onClick={handleCopyEmail}
            onMouseEnter={() => setHoveredButton('email')}
            onMouseLeave={() => setHoveredButton(null)}
            className="flex items-center justify-center cursor-pointer focus-visible:outline-none"
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
            type="button"
            data-cursor="morph"
            data-cursor-radius="5"
            onClick={handleLinkedIn}
            onMouseEnter={() => setHoveredButton('linkedin')}
            onMouseLeave={() => setHoveredButton(null)}
            className="flex items-center justify-center cursor-pointer focus-visible:outline-none"
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
