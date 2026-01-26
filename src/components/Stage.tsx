import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { StageData } from '../types'
import { bladeStackConfig } from '../data/stages'

interface StageProps {
  stage: StageData
  isActive: boolean
  onRequestCaseStudy?: () => void
  isExpanding?: boolean
  backgroundColor?: string
}

export function Stage({ stage, isActive, onRequestCaseStudy, isExpanding = false, backgroundColor = '#000000' }: StageProps) {
  // Cursor tracking for card spotlight effects
  const [logoCardMouse, setLogoCardMouse] = useState({ x: 50, y: 50 })
  const [logoCardHovered, setLogoCardHovered] = useState(false)
  const [descCardMouse, setDescCardMouse] = useState({ x: 50, y: 50 })
  const [ctaCardMouse, setCtaCardMouse] = useState({ x: 50, y: 50 })

  // Track description card width for responsive metadata panel visibility
  const [descCardWidth, setDescCardWidth] = useState(0)

  const logoCardRef = useRef<HTMLDivElement>(null)
  const descCardRef = useRef<HTMLDivElement>(null)
  const ctaCardRef = useRef<HTMLDivElement>(null)

  // Measure description card width on mount and resize
  useEffect(() => {
    const measureWidth = () => {
      if (descCardRef.current) {
        setDescCardWidth(descCardRef.current.offsetWidth)
      }
    }
    measureWidth()
    window.addEventListener('resize', measureWidth)
    return () => window.removeEventListener('resize', measureWidth)
  }, [])

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

  // Cards are part of the stage - they slide up with the blade
  const { frontBladePeek, stackOffset } = bladeStackConfig
  const numBlades = 4
  // Back blade peek amount (this is what becomes the stage background)
  const backBladePeekFromBottom = frontBladePeek + ((numBlades - 1) * stackOffset)

  // Cards start positioned at the bottom of the collapsed blade peek
  // The blade animates bottom from: calc(-100vh + 136px) to 0
  // This means the blade's top moves from (100vh - 136px) down to 0
  // Cards at "bottom: 40px" of the stage need to move with the blade
  // Initial Y offset = how far down the blade top starts = 100vh - 136px
  const initialCardsOffset = typeof window !== 'undefined'
    ? window.innerHeight - backBladePeekFromBottom
    : 0

  // Only show the stage if it's active
  // isExpanding just controls the animation, not visibility
  const shouldBeVisible = isActive

  // Spring transition for cards - matches blade animation exactly
  const cardsSpringTransition = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 40,
    mass: 1,
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col"
      initial={{ opacity: isExpanding && isActive ? 1 : 0 }}
      animate={{ opacity: shouldBeVisible ? 1 : 0 }}
      transition={{ duration: isExpanding ? 0 : 0.4 }}
      style={{
        pointerEvents: shouldBeVisible ? 'auto' : 'none',
      }}
    >
      {/* Solid background color - ensures stage has proper bg when scaled in zoomed nav mode */}
      {/* Hidden during expansion - background comes from StageBackground blade animation */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor,
          opacity: isExpanding ? 0 : 1,
          transition: 'opacity 0.3s ease-out',
        }}
      />


      {/* Bottom cards container - slides up with the blade during transition */}
      {/* Uses Y transform to match blade's bottom position animation */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 flex items-end gap-4"
        style={{
          zIndex: 10,
          padding: '0 40px 40px 40px',
        }}
        initial={{ y: isExpanding ? initialCardsOffset : 0 }}
        animate={{ y: 0 }}
        transition={isExpanding ? cardsSpringTransition : { duration: 0 }}
      >
        {/* Logo Card - coral pink with white border, backdrop blur */}
        {/* No individual animation - expands naturally with the parent stage */}
        <motion.div
          ref={logoCardRef}
          className="flex-shrink-0"
          style={{
            width: 216,
            height: 216,
            backgroundColor: stage.logoBgColor,
            borderRadius: 25,
            border: '1px solid rgba(255, 255, 255, 0.8)',
            // Disable backdrop blur during expansion to prevent color bleeding
            backdropFilter: isExpanding ? 'none' : 'blur(10.93px)',
            WebkitBackdropFilter: isExpanding ? 'none' : 'blur(10.93px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
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
        {/* flex-grow: 1 takes available space, flex-shrink: 0 means it won't shrink */}
        {/* CTA card shrinks first because it has flex-shrink: 1 */}
        {/* No individual animation - expands naturally with the parent stage */}
        <motion.div
          ref={descCardRef}
          style={{
            backgroundColor: '#e9d7da', // Salmon pink background from Figma
            borderRadius: 25,
            overflow: 'hidden',
            position: 'relative',
            height: 216,
            flexGrow: 1,
            flexShrink: 0,
            flexBasis: 'auto',
            minWidth: 300,
          }}
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
          {(() => {
            // Metadata panel dimensions
            const metadataPanelWidth = 348
            const metadataPanelMargin = 8 // right margin
            const metadataPanelTotalWidth = metadataPanelWidth + metadataPanelMargin

            // Calculate if metadata panel should be visible
            // Hide when panel's left edge would cross the halfway point of the card
            const halfwayPoint = descCardWidth / 2
            const metadataPanelLeftEdge = descCardWidth - metadataPanelTotalWidth
            const showMetadataPanel = metadataPanelLeftEdge > halfwayPoint

            // Description text width: fills available space
            // When metadata visible: from left padding (37px) to metadata panel left edge minus gap
            // When metadata hidden: from left padding to right padding (37px each side)
            const leftPadding = 37
            const rightPadding = 37
            const gapBetweenTextAndMetadata = 24

            const descriptionWidth = showMetadataPanel
              ? metadataPanelLeftEdge - leftPadding - gapBetweenTextAndMetadata
              : descCardWidth - leftPadding - rightPadding

            return (
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

                  {/* Description - bottom aligned at 188px from top (updated for 216px height) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 188,
                      left: 37,
                      transform: 'translateY(-100%)',
                      width: descriptionWidth > 0 ? descriptionWidth : 400,
                      overflow: 'hidden',
                      transition: 'width 0.3s ease',
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

                {/* Right side: Metadata panel - inset 8px from top, right, and bottom */}
                {/* Hidden when panel would cross past halfway point of parent container */}
                {showMetadataPanel && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      bottom: 8,
                      width: 348,
                      backgroundColor: '#e5c4ca',
                      borderRadius: 16,
                      padding: '12px 16px 16px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 20,
                      overflow: 'hidden',
                    }}
                  >
              {/* Metadata rows container - Frame 32 */}
              <div
                style={{
                  width: 316,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                <MetadataRow
                  label="PLATFORMS"
                  value={stage.metadata.platforms}
                  valueMaxWidth={224}
                />
                <MetadataRow
                  label="ACCOLADES"
                  value={stage.metadata.accolades}
                  valueMaxWidth={224}
                />
                <MetadataRow
                  label="AGENCY"
                  value={stage.metadata.agency}
                  valueMaxWidth={224}
                  isLast
                />
              </div>

              {/* Footer text */}
              <p
                style={{
                  width: 316,
                  alignSelf: 'stretch',
                  fontFamily: 'GT Pressura Mono',
                  fontSize: '11px',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  color: 'rgba(0, 0, 0, 0.4)',
                  textAlign: 'center',
                }}
              >
                {stage.footer}
              </p>
            </div>
                )}
              </div>
            )
          })()}
        </motion.div>

        {/* CTA Card - Request Case Study button */}
        {/* Shrinks first (flexShrink: 1) while description card doesn't shrink (flexShrink: 0) */}
        {/* Resizes between minWidth: 220px and maxWidth: 348px */}
        {/* No individual animation - expands naturally with the parent stage */}
        <motion.div
          ref={ctaCardRef}
          className="cursor-pointer"
          style={{
            flexBasis: 348,
            flexGrow: 0,
            flexShrink: 1,
            minWidth: 220,
            maxWidth: 348,
            height: 216,
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
      </motion.div>
    </motion.div>
  )
}

// Metadata row helper component
function MetadataRow({
  label,
  value,
  isLast = false,
  valueMaxWidth,
}: {
  label: string
  value: string
  isLast?: boolean
  valueMaxWidth?: number
}) {
  return (
    <div
      style={{
        width: 316,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: isLast ? 'none' : '1px solid #E9D7DA',
      }}
    >
      <span
        style={{
          fontFamily: 'GT Pressura Mono',
          fontSize: '11px',
          fontWeight: 350,
          letterSpacing: '0.02em',
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
          fontWeight: 350,
          color: '#1B202A',
          textAlign: 'right',
          letterSpacing: '-0.02em',
          ...(valueMaxWidth ? { maxWidth: valueMaxWidth } : {}),
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
