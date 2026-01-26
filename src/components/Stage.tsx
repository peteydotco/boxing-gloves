import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { StageData } from '../types'

interface StageProps {
  stage: StageData
  isActive: boolean
  onRequestCaseStudy?: () => void
  shouldAnimateIn?: boolean
}

export function Stage({ stage, isActive, onRequestCaseStudy, shouldAnimateIn = false }: StageProps) {
  // Cursor tracking for card spotlight effects
  const [logoCardMouse, setLogoCardMouse] = useState({ x: 50, y: 50 })
  const [logoCardHovered, setLogoCardHovered] = useState(false)
  const [descCardMouse, setDescCardMouse] = useState({ x: 50, y: 50 })
  const [ctaCardMouse, setCtaCardMouse] = useState({ x: 50, y: 50 })

  const logoCardRef = useRef<HTMLDivElement>(null)
  const descCardRef = useRef<HTMLDivElement>(null)
  const ctaCardRef = useRef<HTMLDivElement>(null)

  const handleCardMouseMove = useCallback((
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement | null>,
    setter: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setter({ x, y })
  }, [])

  // Spotlight gradient generator for fill effect
  const getSpotlightGradient = (mousePos: { x: number; y: number }, isDark = false) => {
    const lightColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.12)'
    const midColor = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)'
    return `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${lightColor} 0%, ${midColor} 50%, transparent 100%)`
  }

  // Border spotlight gradient
  const getBorderSpotlight = (mousePos: { x: number; y: number }) => {
    return `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 25%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)`
  }

  // Logo card border spotlight (matching TopCards/MorphingCard style)
  const logoCardBorderColor = 'rgba(255, 255, 255, 0.8)'
  const getLogoCardSpotlight = () => {
    if (!logoCardHovered) return 'none'
    return `radial-gradient(circle at ${logoCardMouse.x}% ${logoCardMouse.y}%, rgba(255, 255, 255, 1) 0%, rgba(230, 230, 232, 0.6) 15%, ${logoCardBorderColor} 35%, rgba(200, 200, 205, 0.15) 55%, rgba(195, 195, 200, 0.17) 100%)`
  }

  // Card entrance animation variants for initial blade transition
  const cardVariants = {
    hidden: {
      scale: 0.8,
      opacity: 0,
      y: 40,
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
    },
  }

  const cardTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      style={{
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {/* Background - placeholder for rich media */}
      <div className="absolute inset-0 bg-black">
        {/* TODO: Replace with actual stage background media */}
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${stage.accentColor}22 0%, #000 50%, ${stage.accentColor}11 100%)`,
          }}
        />
      </div>

      {/* Bottom cards container */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end gap-4"
        style={{
          zIndex: 10,
          padding: '0 40px 40px 40px',
        }}
      >
        {/* Logo Card - coral pink with white border, backdrop blur */}
        <motion.div
          ref={logoCardRef}
          className="flex-shrink-0"
          style={{
            width: 196,
            height: 196,
            backgroundColor: stage.logoBgColor,
            borderRadius: 25,
            border: '1px solid rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10.93px)',
            WebkitBackdropFilter: 'blur(10.93px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
          initial={shouldAnimateIn ? 'hidden' : 'visible'}
          animate="visible"
          variants={cardVariants}
          transition={{ ...cardTransition, delay: shouldAnimateIn ? 0.1 : 0 }}
          onMouseMove={(e) => handleCardMouseMove(e, logoCardRef, setLogoCardMouse)}
          onMouseEnter={() => setLogoCardHovered(true)}
          onMouseLeave={() => setLogoCardHovered(false)}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          {/* Border spotlight overlay (matching TopCards style) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 25,
              background: getLogoCardSpotlight(),
              mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
          {/* Logo - MasterClass "M" placeholder */}
          <MasterClassLogo />
        </motion.div>

        {/* Description Card - main content area with metadata panel */}
        <motion.div
          ref={descCardRef}
          className="flex-1"
          style={{
            backgroundColor: '#e9d7da', // Salmon pink background from Figma
            borderRadius: 25,
            overflow: 'hidden',
            position: 'relative',
            height: 196,
          }}
          initial={shouldAnimateIn ? 'hidden' : 'visible'}
          animate="visible"
          variants={cardVariants}
          transition={{ ...cardTransition, delay: shouldAnimateIn ? 0.15 : 0 }}
          onMouseMove={(e) => handleCardMouseMove(e, descCardRef, setDescCardMouse)}
          whileHover={{ scale: 1.005, y: -2 }}
        >
          {/* Spotlight overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: getSpotlightGradient(descCardMouse),
              borderRadius: 25,
            }}
          />
          {/* Border spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 25,
              background: getBorderSpotlight(descCardMouse),
              maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />

          {/* Card content layout */}
          <div className="relative z-10 h-full flex">
            {/* Left side: Role, Title, Description - positioned absolutely per Figma */}
            <div
              className="flex-1 relative"
              style={{
                paddingLeft: 37,
              }}
            >
              {/* Role label - top: 22px */}
              <p
                style={{
                  position: 'absolute',
                  top: 22,
                  left: 37,
                  fontFamily: 'GT Pressura Mono',
                  fontSize: '13px',
                  fontWeight: 400,
                  letterSpacing: '0.26px',
                  textTransform: 'uppercase',
                  color: '#000000',
                }}
              >
                {stage.role}
              </p>

              {/* Title - vertically centered around 61.65px */}
              <h3
                style={{
                  position: 'absolute',
                  top: 61.65,
                  left: 37,
                  transform: 'translateY(-50%)',
                  fontFamily: 'GT Pressura',
                  fontSize: '24px',
                  fontWeight: 500,
                  color: '#000000',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {stage.title}
              </h3>

              {/* Description - bottom aligned at 168px from top */}
              <div
                style={{
                  position: 'absolute',
                  top: 168,
                  left: 37,
                  transform: 'translateY(-100%)',
                  width: 400,
                  overflow: 'hidden',
                }}
              >
                <p
                  style={{
                    fontFamily: 'GT Pressura Ext',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#1b202a',
                    lineHeight: 1.35,
                    letterSpacing: '-0.32px',
                  }}
                >
                  {stage.description}
                </p>
              </div>
            </div>

            {/* Right side: Metadata panel - vertically centered, 385px wide */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 385,
                height: 196,
                backgroundColor: '#e5c4ca',
                border: '1px solid #ffeeee',
                borderRadius: 16,
                padding: '11px 16px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              {/* Metadata rows */}
              <div className="flex flex-col">
                <MetadataRow
                  label="PLATFORMS"
                  value={stage.metadata.platforms}
                  borderColor="#e9d7da"
                />
                <MetadataRow
                  label="ACCOLADES"
                  value={stage.metadata.accolades}
                  borderColor="#e9d7da"
                />
                <MetadataRow
                  label="AGENCY"
                  value={stage.metadata.agency}
                  borderColor="#e9d7da"
                  isLast
                />
              </div>

              {/* Footer text */}
              <p
                style={{
                  fontFamily: 'GT Pressura Mono',
                  fontSize: '11px',
                  fontWeight: 400,
                  letterSpacing: '0.22px',
                  textTransform: 'uppercase',
                  color: 'rgba(0, 0, 0, 0.4)',
                  textAlign: 'center',
                }}
              >
                {stage.footer}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Card - Request Case Study button */}
        <motion.div
          ref={ctaCardRef}
          className="flex-shrink-0 cursor-pointer"
          style={{
            width: 196,
            height: 196,
            backgroundColor: 'transparent',
            borderRadius: 25,
            border: '1px solid #e5c4ca',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
          initial={shouldAnimateIn ? 'hidden' : 'visible'}
          animate="visible"
          variants={cardVariants}
          transition={{ ...cardTransition, delay: shouldAnimateIn ? 0.2 : 0 }}
          onMouseMove={(e) => handleCardMouseMove(e, ctaCardRef, setCtaCardMouse)}
          onClick={onRequestCaseStudy}
          whileHover={{ scale: 1.02, y: -4, borderColor: '#f0d0d5' }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Spotlight overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: getSpotlightGradient(ctaCardMouse, true),
              borderRadius: 25,
            }}
          />
          {/* Border spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 25,
              background: getBorderSpotlight(ctaCardMouse),
              maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />

          {/* Keyboard shortcut badge */}
          <div
            className="absolute top-5 right-5 flex items-center gap-0.5"
            style={{
              backgroundColor: '#e5c4ca',
              borderRadius: 3.5,
              padding: '3px 5px',
              minWidth: 19,
              height: 19,
            }}
          >
            <span
              style={{
                fontFamily: 'GT Pressura Mono',
                fontSize: '12px',
                fontWeight: 400,
                color: '#000000',
                lineHeight: 1,
              }}
            >
              ⌘
            </span>
            <span
              style={{
                fontFamily: 'GT Pressura Mono',
                fontSize: '12px',
                fontWeight: 400,
                color: '#000000',
                lineHeight: 1,
              }}
            >
              R
            </span>
          </div>

          {/* Button text */}
          <div className="relative z-10 text-center">
            <p
              style={{
                fontFamily: 'Helvetica Neue',
                fontSize: '24px',
                fontWeight: 700,
                fontStretch: 'condensed',
                color: '#e5c4ca',
                lineHeight: 0.99,
                textTransform: 'uppercase',
              }}
            >
              REQUEST
            </p>
            <p
              style={{
                fontFamily: 'Helvetica Neue',
                fontSize: '24px',
                fontWeight: 700,
                fontStretch: 'condensed',
                color: '#e5c4ca',
                lineHeight: 0.99,
                textTransform: 'uppercase',
              }}
            >
              CASE STUDY
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Metadata row helper component
function MetadataRow({
  label,
  value,
  borderColor,
  isLast = false
}: {
  label: string
  value: string
  borderColor: string
  isLast?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between py-2 overflow-hidden"
      style={{
        borderBottom: isLast ? 'none' : `1px solid ${borderColor}`,
      }}
    >
      <span
        style={{
          fontFamily: 'GT Pressura Mono',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.22px',
          textTransform: 'uppercase',
          color: 'rgba(0, 0, 0, 0.48)',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'GT Pressura Ext',
          fontSize: '14px',
          fontWeight: 400,
          color: '#1b202a',
          textAlign: 'right',
          letterSpacing: '-0.28px',
        }}
      >
        {value}
      </span>
    </div>
  )
}

// MasterClass Logo component - same as marquee icon
function MasterClassLogo() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="25 0 465 364"
      fill="black"
    >
      <path d="M254.24 186.251L216.246 52.5022H110.845V73.9764H120.846C133.319 73.9764 143.665 81.3833 147.459 95.07L205.526 298.892H258.407L284.33 208.413L283.956 208.077C267.029 208.091 258.723 201.753 254.24 186.251Z" />
      <path d="M467.427 277.418C454.997 277.418 444.981 268.986 441.188 255.944L383.12 52.5022H302.262L372.386 298.892H477.428V277.432L467.427 277.418Z" />
      <path d="M36.7822 277.374V298.907H130.214V298.863V277.403V277.374H36.7822Z" />
    </svg>
  )
}
