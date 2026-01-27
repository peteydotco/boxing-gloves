import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { StageData } from '../types'
import { bladeStackConfig } from '../data/stages'

// Stage surface colors (blush/salmon palette tokens)
const stageSurface = {
  primary: '#E9D7DA',   // blush-200 - description card bg
  secondary: '#E5C4CA', // blush-300 - metadata panel, borders
  hover: '#F0D0D5',     // blush-100 - hover state
  text: '#1B202A',      // ink-750 - text color
} as const

interface StageProps {
  stage: StageData
  isActive: boolean
  onRequestCaseStudy?: () => void
  isExpanding?: boolean
  isZoomedNav?: boolean
  backgroundColor?: string
}

export function Stage({ stage, isActive, onRequestCaseStudy, isExpanding = false, isZoomedNav = false, backgroundColor = '#000000' }: StageProps) {
  // Cursor tracking for card spotlight effects
  const [logoCardMouse, setLogoCardMouse] = useState({ x: 50, y: 50 })
  const [logoCardHovered, setLogoCardHovered] = useState(false)
  const [descCardMouse, setDescCardMouse] = useState({ x: 50, y: 50 })
  const [descCardHovered, setDescCardHovered] = useState(false)
  const [ctaCardHovered, setCtaCardHovered] = useState(false)

  // Track description card width for responsive metadata panel visibility
  const [descCardWidth, setDescCardWidth] = useState(0)
  // Store the "full size" reference width for proportional scaling
  const [descCardFullWidth, setDescCardFullWidth] = useState(0)

  const logoCardRef = useRef<HTMLDivElement>(null)
  const descCardRef = useRef<HTMLDivElement>(null)

  // Measure description card width on mount and resize
  // Uses ResizeObserver to detect element size changes (including Framer Motion animations)
  useEffect(() => {
    if (!descCardRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setDescCardWidth(width)
        // Capture the full width on first measurement (when stage is fullscreen)
        // or when width increases (returning to fullscreen)
        setDescCardFullWidth(prev => width > prev ? width : prev)
      }
    })

    resizeObserver.observe(descCardRef.current)
    // Initial measurement
    const initialWidth = descCardRef.current.offsetWidth
    setDescCardWidth(initialWidth)
    setDescCardFullWidth(initialWidth)

    return () => resizeObserver.disconnect()
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
  const logoCardBorderColor = 'rgba(255, 255, 255, 0.12)'
  const getLogoCardSpotlight = () => {
    if (!logoCardHovered) return 'none'
    return `radial-gradient(circle at ${logoCardMouse.x}% ${logoCardMouse.y}%, rgba(255, 255, 255, 1) 0%, rgba(230, 230, 232, 0.6) 15%, rgba(255, 255, 255, 0.8) 35%, rgba(200, 200, 205, 0.15) 55%, rgba(195, 195, 200, 0.17) 100%)`
  }

  // Description card border spotlight
  const getDescCardSpotlight = () => {
    if (!descCardHovered) return 'none'
    return `radial-gradient(circle at ${descCardMouse.x}% ${descCardMouse.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)`
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
        <div
          ref={logoCardRef}
          className="flex-shrink-0"
          style={{
            width: 216,
            height: 216,
            backgroundColor: stage.logoBgColor,
            borderRadius: 25,
            border: '1px solid rgba(255, 255, 255, 0.12)',
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
        >
          {/* Border spotlight overlay (matching TopCards style) */}
          {/* Uses inset: -1px to align with the 1px border */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: -1,
              borderRadius: 26,
              background: getLogoCardSpotlight(),
              mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
          {/* Logo - MasterClass "M" placeholder */}
          <MasterClassLogo />
        </div>

        {/* Description Card - main content area with metadata panel */}
        {/* flex: 1 0 auto - grows to fill, won't shrink (CTA shrinks first) */}
        {/* No individual animation - expands naturally with the parent stage */}
        <div
          ref={descCardRef}
          style={{
            backgroundColor: stageSurface.primary, // Salmon pink background
            borderRadius: 25,
            overflow: 'hidden',
            position: 'relative',
            height: 216,
            flex: '1 0 auto',
            minWidth: 200,
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
          onMouseMove={(e) => handleCardMouseMove(e, descCardRef, setDescCardMouse)}
          onMouseEnter={() => setDescCardHovered(true)}
          onMouseLeave={() => setDescCardHovered(false)}
        >
          {/* Border spotlight overlay */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: -1,
              borderRadius: 26,
              background: getDescCardSpotlight(),
              mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />

          {/* Card content layout */}
          {(() => {
            // Metadata panel dimensions
            const metadataPanelWidth = 320
            const metadataPanelMargin = 8 // right margin
            const metadataPanelTotalWidth = metadataPanelWidth + metadataPanelMargin

            // Calculate if metadata panel should be visible
            // Hide metadata panel when viewport hits 1230px
            // This threshold is based on the overall layout needs, not just the card width
            const METADATA_MIN_CARD_WIDTH = 620
            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
            const showMetadataPanel = viewportWidth >= 1230 && descCardWidth >= METADATA_MIN_CARD_WIDTH

            // Description text layout
            const leftPadding = 37
            const gapBetweenTextAndMetadata = 36
            const rightPaddingWithoutMetadata = 37 // Match left padding when metadata hidden

            // Dynamic description text width based on metadata visibility
            // When metadata visible: text area ends 24px before metadata panel
            // When metadata hidden: text area has symmetric padding (37px each side)
            const descriptionTextWidth = showMetadataPanel
              ? descCardWidth - metadataPanelTotalWidth - leftPadding - gapBetweenTextAndMetadata
              : descCardWidth - leftPadding - rightPaddingWithoutMetadata

            // Reference width for zoomed nav scaling
            // Use the text width as it appears at full size (with or without metadata based on full size)
            const fullSizeHasMetadata = descCardFullWidth >= METADATA_MIN_CARD_WIDTH
            const descriptionFullWidth = fullSizeHasMetadata
              ? descCardFullWidth - metadataPanelTotalWidth - leftPadding - gapBetweenTextAndMetadata
              : descCardFullWidth - leftPadding - rightPaddingWithoutMetadata

            // Only use proportional scaling in zoomed nav mode to preserve line breaks
            // In normal fullscreen mode, let the text box respond naturally
            const scaleFactor = isZoomedNav && descCardFullWidth > 0
              ? Math.min(1, descCardWidth / descCardFullWidth)
              : 1

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

                  {/* Title - positioned below role label */}
                  <h3
                    style={{
                      position: 'absolute',
                      top: 48,
                      left: 37,
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
                  {/* Uses proportional scaling to preserve line breaks when card shrinks in zoomed nav */}
                  {/* In normal mode, width responds dynamically based on metadata visibility */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 188,
                      left: 37,
                      transform: `translateY(-100%) scale(${scaleFactor})`,
                      transformOrigin: 'bottom left',
                      width: isZoomedNav
                        ? (descriptionFullWidth > 0 ? descriptionFullWidth : 400)
                        : Math.max(descriptionTextWidth, 100),
                      overflow: 'hidden',
                      transition: isZoomedNav ? 'none' : 'width 0.3s ease-out',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'GT Pressura Ext',
                        fontSize: '16px',
                        fontWeight: 350, // Text weight - lighter than Regular (400)
                        color: stageSurface.text,
                        lineHeight: 1.35,
                        letterSpacing: '-0.32px',
                      }}
                    >
                      {stage.description}
                    </p>
                  </div>
                </div>

                {/* Right side: Metadata panel - inset 8px from top, right, and bottom */}
                {/* Fixed width panel - hidden when card is too narrow */}
                {showMetadataPanel && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      bottom: 8,
                      width: 320,
                      backgroundColor: stageSurface.secondary,
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
              {/* Metadata rows container */}
              <div
                style={{
                  width: '100%',
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
                  width: '100%',
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
        </div>

        {/* CTA Card - Request Case Study button */}
        {/* Uses clamp() for responsive width: 216px min, 348px max */}
        {/* Shrinks from 348px to 216px as viewport narrows (1440-1330) */}
        <div
          className="cursor-pointer"
          style={{
            width: 'clamp(216px, calc(348px - (1440px - 100vw) * 1.2), 348px)',
            flexShrink: 0,
            height: 216,
            backgroundColor: ctaCardHovered ? stageSurface.secondary : 'transparent',
            borderRadius: 25,
            border: `3px solid ${stageSurface.secondary}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background-color 0.2s ease',
          }}
          onClick={onRequestCaseStudy}
          onMouseEnter={() => setCtaCardHovered(true)}
          onMouseLeave={() => setCtaCardHovered(false)}
        >
          {/* Keyboard shortcut badge - inverts colors on hover */}
          <div
            className="absolute top-5 right-5 flex items-center justify-center"
            style={{
              backgroundColor: ctaCardHovered ? backgroundColor : stageSurface.secondary,
              borderRadius: 4,
              padding: '4px 8px',
              transition: 'background-color 0.2s ease',
            }}
          >
            <span
              className="uppercase font-pressura-mono"
              style={{
                fontSize: '12px',
                lineHeight: 1,
                position: 'relative',
                top: '-1px',
                color: ctaCardHovered ? stageSurface.secondary : '#000000',
                transition: 'color 0.2s ease',
              }}
            >
              ⌘ R
            </span>
          </div>

          {/* Button text - GT Pressura Regular (lighter than title) */}
          {/* Knockout effect on hover (transparent text reveals dark bg) */}
          <span
            style={{
              fontFamily: 'GT Pressura',
              fontSize: '24px',
              fontWeight: 400,
              lineHeight: 1.3,
              textTransform: 'uppercase',
              textAlign: 'center',
              color: ctaCardHovered ? 'transparent' : stageSurface.secondary,
              backgroundColor: ctaCardHovered ? backgroundColor : 'transparent',
              WebkitBackgroundClip: ctaCardHovered ? 'text' : 'unset',
              backgroundClip: ctaCardHovered ? 'text' : 'unset',
              transition: 'color 0.2s ease',
            }}
          >
            REQUEST<br />CASE STUDY
          </span>
        </div>
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
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: isLast ? 'none' : `1px solid ${stageSurface.primary}`,
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
          color: stageSurface.text,
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
