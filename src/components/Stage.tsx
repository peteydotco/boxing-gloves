import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { StageData } from '../types'
import { hoverTransition } from '../constants/animation'

interface StageProps {
  stage: StageData
  isActive: boolean
  onRequestCaseStudy?: () => void
}

export function Stage({ stage, isActive, onRequestCaseStudy }: StageProps) {
  // Cursor tracking for card spotlight effects
  const [logoCardMouse, setLogoCardMouse] = useState({ x: 50, y: 50 })
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

  // Spotlight gradient generator
  const getSpotlightGradient = (mousePos: { x: number; y: number }, isDark = false) => {
    const lightColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.15)'
    const midColor = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)'
    return `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${lightColor} 0%, ${midColor} 50%, transparent 100%)`
  }

  // Border spotlight gradient
  const getBorderSpotlight = (mousePos: { x: number; y: number }) => {
    return `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)`
  }

  // Shared card styles
  const cardBaseStyle: React.CSSProperties = {
    borderRadius: 20,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    overflow: 'hidden',
    position: 'relative',
  }

  // Card with tinted glass effect
  const glassCardStyle: React.CSSProperties = {
    ...cardBaseStyle,
    backgroundColor: 'rgba(246, 232, 232, 0.85)', // Warm off-white/cream tint from reference
    boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
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
        className="absolute bottom-0 left-0 right-0 flex items-end gap-3 p-6"
        style={{ zIndex: 10 }}
      >
        {/* Logo Card */}
        <motion.div
          ref={logoCardRef}
          className="flex-shrink-0"
          style={{
            ...glassCardStyle,
            width: 120,
            height: 120,
            backgroundColor: stage.logoBgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseMove={(e) => handleCardMouseMove(e, logoCardRef, setLogoCardMouse)}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={hoverTransition}
        >
          {/* Spotlight overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: getSpotlightGradient(logoCardMouse, true),
              borderRadius: 20,
            }}
          />
          {/* Border spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 20,
              background: getBorderSpotlight(logoCardMouse),
              maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
          {/* Logo placeholder - would be an img or svg */}
          <div
            className="text-white font-bold text-3xl"
            style={{ fontFamily: 'GT Pressura' }}
          >
            M
          </div>
        </motion.div>

        {/* Description Card */}
        <motion.div
          ref={descCardRef}
          className="flex-1"
          style={{
            ...glassCardStyle,
            minHeight: 120,
            padding: '16px 20px',
          }}
          onMouseMove={(e) => handleCardMouseMove(e, descCardRef, setDescCardMouse)}
          whileHover={{ scale: 1.005, y: -2 }}
          transition={hoverTransition}
        >
          {/* Spotlight overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: getSpotlightGradient(descCardMouse),
              borderRadius: 20,
            }}
          />
          {/* Border spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 20,
              background: getBorderSpotlight(descCardMouse),
              maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />

          <div className="relative z-10 h-full flex">
            {/* Left: Role & Title */}
            <div className="flex-1 pr-4">
              <p
                style={{
                  fontFamily: 'GT Pressura Mono',
                  fontSize: '10px',
                  fontWeight: 400,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  color: 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '4px',
                }}
              >
                {stage.role}
              </p>
              <h3
                style={{
                  fontFamily: 'GT Pressura',
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'rgba(0, 0, 0, 0.87)',
                  lineHeight: 1.2,
                  marginBottom: '8px',
                }}
              >
                {stage.title}
              </h3>
              <p
                style={{
                  fontFamily: 'GT Pressura Light',
                  fontSize: '13px',
                  fontWeight: 300,
                  color: 'rgba(0, 0, 0, 0.65)',
                  lineHeight: 1.4,
                }}
              >
                {stage.description}
              </p>
            </div>

            {/* Right: Metadata */}
            <div
              className="flex-shrink-0 pl-4 border-l"
              style={{
                borderColor: 'rgba(0, 0, 0, 0.08)',
                minWidth: 180,
              }}
            >
              <div className="space-y-2">
                <MetadataRow label="PLATFORMS" value={stage.metadata.platforms} />
                <MetadataRow label="ACCOLADES" value={stage.metadata.accolades} />
                <MetadataRow label="AGENCY" value={stage.metadata.agency} />
              </div>
              <p
                style={{
                  fontFamily: 'GT Pressura Mono',
                  fontSize: '9px',
                  fontWeight: 400,
                  letterSpacing: '0.27px',
                  textTransform: 'uppercase',
                  color: 'rgba(0, 0, 0, 0.35)',
                  marginTop: '12px',
                }}
              >
                {stage.footer}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Card */}
        <motion.div
          ref={ctaCardRef}
          className="flex-shrink-0 cursor-pointer"
          style={{
            ...glassCardStyle,
            width: 140,
            height: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
          onMouseMove={(e) => handleCardMouseMove(e, ctaCardRef, setCtaCardMouse)}
          onClick={onRequestCaseStudy}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={hoverTransition}
        >
          {/* Spotlight overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: getSpotlightGradient(ctaCardMouse),
              borderRadius: 20,
            }}
          />
          {/* Border spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 20,
              background: getBorderSpotlight(ctaCardMouse),
              maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />

          {/* Keyboard shortcut badge */}
          <div
            className="absolute top-3 right-3"
            style={{
              fontFamily: 'GT Pressura Mono',
              fontSize: '10px',
              fontWeight: 400,
              color: 'rgba(0, 0, 0, 0.35)',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            ⌘ R
          </div>

          <div className="relative z-10 text-center">
            <p
              style={{
                fontFamily: 'GT Pressura',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(0, 0, 0, 0.75)',
                lineHeight: 1.2,
              }}
            >
              REQUEST
            </p>
            <p
              style={{
                fontFamily: 'GT Pressura',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(0, 0, 0, 0.75)',
                lineHeight: 1.2,
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
function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span
        style={{
          fontFamily: 'GT Pressura Mono',
          fontSize: '10px',
          fontWeight: 400,
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          color: 'rgba(0, 0, 0, 0.4)',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'GT Pressura',
          fontSize: '12px',
          fontWeight: 400,
          color: 'rgba(0, 0, 0, 0.7)',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}
