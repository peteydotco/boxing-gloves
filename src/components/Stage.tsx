import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { StageData } from '../types'
import { bladeStackConfig } from '../data/stages'

// Convert hex color to rgba with alpha
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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
  emailCopied?: boolean
}

export function Stage({ stage, isActive, onRequestCaseStudy, isExpanding = false, isZoomedNav = false, backgroundColor = '#000000', emailCopied = false }: StageProps) {
  // Per-stage surface colors with fallback to defaults
  const surface = {
    primary: stage.surfaceColors?.primary ?? stageSurface.primary,
    secondary: stage.surfaceColors?.secondary ?? stageSurface.secondary,
    hover: stage.surfaceColors?.hover ?? stageSurface.hover,
    text: stage.surfaceColors?.text ?? stageSurface.text,
  }

  // Cursor tracking for card spotlight effects
  const [logoCardMouse, setLogoCardMouse] = useState({ x: 50, y: 50 })
  const [logoCardHovered, setLogoCardHovered] = useState(false)
  const [descCardMouse, setDescCardMouse] = useState({ x: 50, y: 50 })
  const [descCardHovered, setDescCardHovered] = useState(false)
  const [_ctaCardMouse, setCtaCardMouse] = useState({ x: 50, y: 50 })
  const [ctaCardHovered, setCtaCardHovered] = useState(false)
  const [metaMouse, setMetaMouse] = useState({ x: 50, y: 50 })
  const [metaHovered, setMetaHovered] = useState(false)

  // Track description card width for responsive metadata panel visibility
  const [descCardWidth, setDescCardWidth] = useState(0)
  // Store the "full size" reference width for proportional scaling
  const [descCardFullWidth, setDescCardFullWidth] = useState(0)

  const logoCardRef = useRef<HTMLDivElement>(null)
  const descCardRef = useRef<HTMLDivElement>(null)
  const ctaCardRef = useRef<HTMLDivElement>(null)
  const metaPanelRef = useRef<HTMLDivElement>(null)

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

  const getLogoCardSpotlight = () => {
    if (!logoCardHovered) return 'none'
    return `radial-gradient(circle at ${logoCardMouse.x}% ${logoCardMouse.y}%, rgba(255, 255, 255, 1) 0%, rgba(230, 230, 232, 0.6) 15%, rgba(255, 255, 255, 0.8) 35%, rgba(200, 200, 205, 0.15) 55%, rgba(195, 195, 200, 0.17) 100%)`
  }

  // Description card border spotlight
  const getDescCardSpotlight = () => {
    if (!descCardHovered) return 'none'
    return `radial-gradient(circle at ${descCardMouse.x}% ${descCardMouse.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)`
  }

  // Metadata panel border spotlight
  const getMetaSpotlight = () => {
    if (!metaHovered) return 'none'
    return `radial-gradient(circle at ${metaMouse.x}% ${metaMouse.y}%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)`
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

      {/* Video background — when stage has backgroundMedia type 'video' */}
      {/* Hidden during expansion - background comes from StageBackground blade animation */}
      {stage.backgroundMedia?.type === 'video' && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            zIndex: 1,
            opacity: isExpanding ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            src={stage.backgroundMedia.src}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Image background — when stage has backgroundMedia type 'image' */}
      {stage.backgroundMedia?.type === 'image' && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            zIndex: 1,
            opacity: isExpanding ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <img
            src={stage.backgroundMedia.src}
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Post-it note overlay — Apple stage decorative element */}
      {stage.id === 'apple' && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            zIndex: 2,
            opacity: isExpanding ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <img
            src="/images/apple-postit.png"
            alt=""
            style={{
              width: 'clamp(129px, 16.1vw, 246px)',
              height: 'auto',
              transform: 'rotate(8deg)',
              filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3))',
            }}
          />
        </div>
      )}

      {/* Bottom cards container - slides up with the blade during transition */}
      {/* Uses Y transform to match blade's bottom position animation */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 flex items-end gap-4"
        style={{
          zIndex: 10,
          padding: '0 24px 24px 24px',
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
          {/* Stage logo */}
          <StageLogo stageId={stage.id} />
        </div>

        {/* Description Card - main content area with metadata panel */}
        {/* flex: 1 0 auto - grows to fill, won't shrink (CTA shrinks first) */}
        {/* No individual animation - expands naturally with the parent stage */}
        <div
          ref={descCardRef}
          style={{
            backgroundColor: surface.primary,
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
            // Base width is 340px; beyond 1536px viewport, metadata panel absorbs extra width
            const XL_BREAKPOINT = 1536
            const metadataPanelBaseWidth = 340
            const metadataPanelMargin = 8 // right margin
            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
            const extraWidth = Math.max(0, viewportWidth - XL_BREAKPOINT)
            const metadataPanelWidth = metadataPanelBaseWidth + extraWidth
            const metadataPanelTotalWidth = metadataPanelWidth + metadataPanelMargin

            // Calculate if metadata panel should be visible
            // Hide metadata panel when viewport hits 1230px
            // This threshold is based on the overall layout needs, not just the card width
            const METADATA_MIN_CARD_WIDTH = 620
            const showMetadataPanel = viewportWidth >= 1230 && descCardWidth >= METADATA_MIN_CARD_WIDTH

            // Description text layout
            const leftPadding = 37
            const gapBetweenTextAndMetadata = 36
            const rightPaddingWithoutMetadata = 37 // Match left padding when metadata hidden

            // Dynamic description text width based on metadata visibility
            // Beyond 1440px, description text stays fixed while metadata panel grows
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
                      fontFamily: 'GT Pressura',
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
                        color: surface.text,
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
                    ref={metaPanelRef}
                    className="cursor-pointer"
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      bottom: 8,
                      width: metadataPanelWidth,
                      backgroundColor: surface.secondary,
                      borderRadius: 18,
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '12px 16px 16px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 20,
                      overflow: 'hidden',
                    }}
                    onMouseMove={(e) => handleCardMouseMove(e, metaPanelRef, setMetaMouse)}
                    onMouseEnter={() => setMetaHovered(true)}
                    onMouseLeave={() => setMetaHovered(false)}
                  >
                    {/* Border spotlight overlay */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        inset: -1,
                        borderRadius: 17,
                        background: getMetaSpotlight(),
                        mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                        maskComposite: 'exclude',
                        WebkitMaskComposite: 'xor',
                        padding: '1px',
                      }}
                    />
              {/* Metadata rows container */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                {(stage.metadata.customRows ?? [
                  { label: 'PLATFORMS', value: stage.metadata.platforms },
                  { label: 'ACCOLADES', value: stage.metadata.accolades },
                  { label: 'AGENCY', value: stage.metadata.agency },
                ]).map((row, i, arr) => (
                  <MetadataRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    valueMaxWidth={224}
                    isLast={i === arr.length - 1}
                    borderColor={surface.primary}
                    textColor={surface.text}
                  />
                ))}
              </div>

              {/* Footer text */}
              <p
                style={{
                  width: '100%',
                  fontFamily: 'GT Pressura',
                  fontSize: '11px',
                  fontWeight: 400,
                  letterSpacing: '0.4px',
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
          ref={ctaCardRef}
          className="cursor-pointer"
          style={{
            width: 'clamp(216px, calc(348px - (1440px - 100vw) * 1.2), 348px)',
            flexShrink: 0,
            height: 216,
            backgroundColor: ctaCardHovered ? surface.secondary : hexToRgba(surface.primary, 0.04),
            borderRadius: 25,
            border: `3px solid ${surface.secondary}`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background-color 0.2s ease',
          }}
          onClick={onRequestCaseStudy}
          onMouseMove={(e) => handleCardMouseMove(e, ctaCardRef, setCtaCardMouse)}
          onMouseEnter={() => setCtaCardHovered(true)}
          onMouseLeave={() => setCtaCardHovered(false)}
        >
          {/* Keyboard shortcut badge - copies email on click, animates width for toast */}
          <motion.div
            className="absolute flex items-center justify-center overflow-hidden cursor-pointer"
            style={{
              top: 12,
              right: 12,
              backgroundColor: ctaCardHovered ? stage.accentColor : surface.secondary,
              borderRadius: 999,
              padding: '4px 0',
              transition: 'background-color 0.2s ease',
            }}
            initial={false}
            animate={{ width: emailCopied ? 108 : 44 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            onClick={(e) => {
              e.stopPropagation()
              onRequestCaseStudy?.()
            }}
          >
            <div
              className="uppercase font-pressura-mono whitespace-nowrap flex items-center justify-center gap-1"
              style={{
                fontSize: '12px',
                lineHeight: 1,
                position: 'relative',
                top: '-1px',
                color: ctaCardHovered ? surface.secondary : '#000000',
                transition: 'color 0.2s ease',
              }}
            >
              {emailCopied ? (
                <>
                  <span style={{ position: 'relative', top: '0.5px' }}>✓</span>
                  <span>Email Copied</span>
                </>
              ) : (
                '⌘ C'
              )}
            </div>
          </motion.div>

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
              color: ctaCardHovered ? 'transparent' : surface.secondary,
              backgroundColor: ctaCardHovered ? stage.accentColor : 'transparent',
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
  borderColor = stageSurface.primary,
  textColor = stageSurface.text,
}: {
  label: string
  value: string
  isLast?: boolean
  valueMaxWidth?: number
  borderColor?: string
  textColor?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: isLast ? 'none' : `1px solid ${borderColor}`,
      }}
    >
      <span
        style={{
          fontFamily: 'GT Pressura',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          color: 'rgba(0, 0, 0, 0.48)',
          whiteSpace: 'pre-line',
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
          color: textColor,
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

// Stage logo switcher - renders the correct logo per stage
function StageLogo({ stageId }: { stageId: string }) {
  switch (stageId) {
    case 'squarespace':
      return <SquarespaceLogo />
    case 'apple':
      return <AppleLogo />
    case 'shiphero':
      return <ShipHeroLogo />
    case 'masterclass':
    default:
      return <MasterClassLogo />
  }
}

// Squarespace Logo - interlocking S paths
function SquarespaceLogo() {
  return (
    <svg
      width="85"
      height="85"
      viewBox="0 0 364 364"
      fill="black"
    >
      <path d="M249.261 132.482C275.361 106.426 317.584 106.426 343.685 132.482C369.863 158.46 370.134 200.756 344.29 227.069L245.023 326.505L227.017 308.618L325.677 209.485C341.836 193.222 341.836 166.934 325.677 150.671C309.459 134.585 283.333 134.584 267.116 150.671L152.113 266.025L134.106 247.987L249.261 132.482ZM305.702 188.415L190.548 303.768C164.447 329.823 122.225 329.823 96.124 303.768L87.1963 294.824L104.9 276.635L113.829 285.73C130.098 301.834 156.272 301.834 172.541 285.73L287.544 170.529L305.702 188.415ZM136.224 50.9319L37.5625 150.368C21.3498 166.777 21.4854 193.244 37.8652 209.485C54.2452 225.725 80.667 225.59 96.8799 209.182L211.883 93.8293L229.134 111.564L113.979 227.068C87.9052 253.187 45.63 253.187 19.5557 227.068C-6.5184 200.948 -6.51858 158.601 19.5557 132.482L118.821 33.0452L136.224 50.9319ZM172.843 55.7825C198.943 29.7271 241.166 29.7271 267.267 55.7825L276.194 64.7258L258.339 82.7639L249.41 73.8206C241.652 65.9707 231.082 61.554 220.055 61.554C209.027 61.554 198.457 65.9706 190.698 73.8206L75.6953 189.022L57.5371 171.135L172.843 55.7825Z" />
    </svg>
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

// ShipHero Logo component - from marquee icon
function ShipHeroLogo() {
  return (
    <svg
      width="85"
      height="100"
      viewBox="-20 0 343 364"
      fill="white"
    >
      <path d="M142.846 21.0259C147.476 18.2373 153.031 18.2373 157.661 21.0259L282.666 93.5288C285.444 95.3878 287.296 97.2469 288.222 99.106C289.148 100.965 290.073 103.754 290.073 106.542V251.548C290.073 257.125 287.296 261.773 282.666 264.562L158.587 337.065C155.809 339.853 153.031 340.783 150.253 340.783C147.475 340.783 144.698 339.854 142.846 338.924L18.7666 265.492C14.1369 262.703 11.3594 258.055 11.3594 252.478V107.472C11.3594 104.684 12.285 101.895 13.2109 100.036C15.0628 97.2471 16.9147 95.3878 18.7666 93.5288L142.846 21.0259ZM158.064 64.1431C154.391 61.3771 147.044 61.377 143.37 64.1431L55.2061 115.777C51.5325 118.543 47.8584 124.076 47.8584 128.686V138.829C47.8586 143.439 51.5326 149.893 55.2061 151.737L181.024 225.5C184.698 228.266 184.698 231.953 181.024 233.797L158.064 247.628C154.391 250.394 147.044 250.394 143.37 247.628L55.2061 195.995C51.5327 193.229 47.8586 195.994 47.8584 200.604V231.032C47.8585 235.642 51.5326 242.096 55.2061 243.94L143.37 295.574C147.044 298.34 154.391 298.34 158.064 295.574L246.229 243.94C249.903 241.174 253.576 235.642 253.576 231.032V220.889C253.576 216.279 249.903 209.825 246.229 207.981L120.411 134.218C116.738 131.452 116.738 127.764 120.411 125.919L143.37 112.089C147.044 109.323 154.391 109.323 158.064 112.089L246.229 163.723C249.903 166.489 253.576 163.723 253.576 159.113V128.686C253.576 124.076 249.903 117.621 246.229 115.777L158.064 64.1431Z" />
    </svg>
  )
}

// Apple Logo component - from marquee icon
function AppleLogo() {
  return (
    <svg
      width="85"
      height="100"
      viewBox="0 0 243 364"
      fill="white"
    >
      <path d="M234.62 122.554C232.893 123.917 202.408 141.395 202.408 180.259C202.408 225.211 241.199 241.114 242.36 241.508C242.181 242.477 236.197 263.287 221.908 284.491C209.166 303.151 195.859 321.78 175.615 321.78C155.371 321.78 150.161 309.815 126.792 309.815C104.017 309.815 95.9198 322.174 77.4027 322.174C58.8856 322.174 45.9653 304.908 31.1099 283.704C13.9027 258.804 0 220.122 0 183.409C0 124.523 37.6296 93.2928 74.6639 93.2928C94.342 93.2928 110.745 106.439 123.1 106.439C134.859 106.439 153.198 92.5052 175.585 92.5052C184.07 92.5052 214.554 93.2928 234.62 122.554ZM164.957 67.5755C174.216 56.3981 180.765 40.8889 180.765 25.3798C180.765 23.2291 180.587 21.0482 180.2 19.2913C165.136 19.8668 147.214 29.4994 136.407 42.252C127.923 52.0664 120.004 67.5755 120.004 83.2967C120.004 85.6594 120.391 88.0221 120.57 88.7794C121.522 88.9612 123.07 89.1732 124.618 89.1732C138.134 89.1732 155.133 79.9647 164.957 67.5755Z" />
    </svg>
  )
}
