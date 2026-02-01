import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { SlPlus } from 'react-icons/sl'
import { contentSpring } from '../constants/animation'
import type { VariantStyle } from '../types'

const STROKE_WIDTH = 2.5

// Inline SVG connectors — paths derived from Figma, re-oriented for vertical flow
// First branch: from parent logo bottom → curves right to first sub-role
// Draws: vertical down, then curves right with 11px radius
const BranchFirst = ({ scale = 1, strokeColor }: { scale?: number; strokeColor: string }) => (
  <svg
    width={Math.round(27 * scale)}
    height={Math.round(70 * scale)}
    viewBox="0 0 27 70"
    fill="none"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <path
      d="M1.25 1.25V58.25C1.25 64.325 6.175 69.25 12.25 69.25H25.75"
      stroke={strokeColor}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
  </svg>
)

// Subsequent branch: taller vertical run, same curve right
const BranchSub = ({ scale = 1, strokeColor }: { scale?: number; strokeColor: string }) => (
  <svg
    width={Math.round(27 * scale)}
    height={Math.round(97 * scale)}
    viewBox="0 0 27 97"
    fill="none"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <path
      d="M1.25 1.25V85.25C1.25 91.325 6.175 96.25 12.25 96.25H25.75"
      stroke={strokeColor}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
  </svg>
)

// Curly loop: vertical line → figure-8 thread → vertical line
// Used between Squarespace X and Fantasy
const CurlyLoop = ({ scale = 1, strokeColor }: { scale?: number; strokeColor: string }) => (
  <svg
    width={Math.round(21 * scale)}
    height={Math.round(79 * scale)}
    viewBox="0 0 21.5 79.5"
    fill="none"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <path
      d="M1.25 1.25L1.25 38.75"
      stroke={strokeColor}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
    <path
      d="M1.25 58.25C1.25 39.25 20.25 39.25 20.25 48.9234C20.25 58.5967 1.25 59.541 1.25 39.25"
      stroke={strokeColor}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
    <path
      d="M1.25 58.25L1.25 78.25"
      stroke={strokeColor}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
  </svg>
)

// Straight vertical connector between Fantasy and Critical Mass
const VerticalLine = ({ scale = 1, strokeColor }: { scale?: number; strokeColor: string }) => (
  <svg
    width={Math.round(3 * scale)}
    height={Math.round(43 * scale)}
    viewBox="0 0 2.5 43"
    fill="none"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <line
      x1="1.25"
      y1="1.25"
      x2="1.25"
      y2="41.75"
      stroke={strokeColor}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
  </svg>
)

// Work experience data
interface SubRole {
  title: string
  description: string
  dateRange: string
  logo: string
  shape?: 'square' | 'circle'
}

interface LogoFit {
  width: string
  height: string
  left?: string
  top?: string
  objectFit?: 'contain' | 'cover'
}

interface WorkExperience {
  company: string
  location: string
  title: string
  dateRange: string
  logo: string
  logoBg?: string
  logoFit?: LogoFit
  subRoles?: SubRole[]
}

const workExperience: WorkExperience[] = [
  {
    company: 'Squarespace',
    location: 'NEW YORK',
    title: 'Design lead for websites editor',
    dateRange: '2023 → Now',
    logo: '/images/logos/squarespace.webp',
    subRoles: [
      {
        title: 'Unfold app',
        description: 'Design lead for creator tools',
        dateRange: '2022 → 2024',
        logo: '/images/logos/unfold.webp',
      },
      {
        title: 'Squarespace app',
        description: 'Reimagined for first-time sellers',
        dateRange: '2022 → 2024',
        logo: '/images/logos/squarespace-app.webp',
      },
      {
        title: 'Squarespace 7.1',
        description: 'Design manager for content, styling',
        dateRange: '2020 → 2021',
        logo: '/images/logos/squarespace.webp',
        shape: 'circle',
      },
      {
        title: 'Squarespace X',
        description: 'Design lead for next-gen platform',
        dateRange: '2019 → 2020',
        logo: '/images/logos/squarespace.webp',
        shape: 'circle',
      },
    ],
  },
  {
    company: 'Fantasy',
    location: 'SAN FRANCISCO',
    title: 'Experience design lead',
    dateRange: '2017 → 2018',
    logo: '/images/logos/fantasy.webp',
    logoBg: '#FFFFFF',
    logoFit: { width: '88%', height: '88%', left: '6.8%', top: '6.6%', objectFit: 'contain' },
  },
  {
    company: 'Critical Mass',
    location: 'SILICON VALLEY',
    title: 'Experience design lead with Apple',
    dateRange: '2015 → 2017',
    logo: '/images/logos/critical-mass.webp',
    logoBg: '#000000',
    logoFit: { width: '102%', height: '75%', left: '-1%', top: '12.7%', objectFit: 'cover' },
  },
]

interface AddNewRoleContentProps {
  onClose: () => void
  isMobile?: boolean
  hideShortcut?: boolean
  shortcut?: string
  contentScale?: number
  isFocused?: boolean
  styles?: VariantStyle
}

// Default light CTA colors (fallback when no styles prop)
const defaultCtaColors = {
  textColor: 'rgba(0,0,0,0.55)',
  ctaTitleColor: 'rgba(0,0,0,0.75)',
  secondaryText: 'rgba(0,0,0,0.7)',
  badgeBg: 'rgba(0,0,0,0.08)',
  primaryButtonBg: 'rgba(0,0,0,0.87)',
  primaryButtonText: '#FFFFFF',
  primaryButtonBorder: 'rgba(0,0,0,0.2)',
  border: 'rgba(0,0,0,0.08)',
  dividerColor: 'rgba(0,0,0,0.12)',
}

export function AddNewRoleContent({
  onClose,
  isMobile = false,
  hideShortcut = false,
  shortcut = '⌘ C',
  contentScale = 1,
  isFocused = true,
  styles,
}: AddNewRoleContentProps) {
  // Helper: scale a pixel value proportionally (mobile uses slightly smaller base sizes)
  const s = (px: number) => Math.round(px * contentScale)
  const [inputValue, setInputValue] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Derive theme-aware colors from styles prop (or fall back to light CTA defaults)
  const themeText = styles?.textColor ?? defaultCtaColors.textColor
  const themeTitle = styles?.ctaTitleColor ?? defaultCtaColors.ctaTitleColor
  const themeSecondary = styles?.secondaryText ?? defaultCtaColors.secondaryText
  const themeBadgeBg = styles?.badgeBg ?? defaultCtaColors.badgeBg
  const themeBtnBg = styles?.primaryButtonBg ?? defaultCtaColors.primaryButtonBg
  const themeBtnText = styles?.primaryButtonText ?? defaultCtaColors.primaryButtonText
  const themeBtnBorder = styles?.primaryButtonBorder ?? defaultCtaColors.primaryButtonBorder
  // Determine if we're in a dark theme (bg is dark)
  const isDark = styles ? styles.textColor.includes('255') : false
  // Stroke/divider color — use solid opaque colors to prevent dark overlap artifacts
  // where SVG connector paths intersect (rgba compounds at overlaps)
  const themeStroke = isDark ? '#404048' : '#CFCFCF'
  // Logo container bg: light → #f6f6f6, dark → slightly lighter than card bg
  const logoContainerBg = isDark ? 'rgba(255,255,255,0.08)' : '#f6f6f6'
  // Company name color (strong text) — in light theme #202020, in dark use ctaTitleColor
  const companyNameColor = themeTitle
  // Input typed text color — slightly stronger than title
  const inputTypedColor = isDark ? (styles?.secondaryText ?? 'rgba(255,255,255,0.85)') : '#202020'
  // Ghosted text color — lighter than themeText for the expanded title/label hint
  const themeGhostedText = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
  // Caret color
  const caretColor = isDark ? 'rgba(255,255,255,0.9)' : '#000000'

  // Focus input when card becomes focused, blur when not
  // Use preventScroll to stop browser from auto-scrolling the card container
  useEffect(() => {
    if (isFocused && inputRef.current && !isMobile) {
      inputRef.current.focus({ preventScroll: true })
    } else if (!isFocused && inputRef.current) {
      inputRef.current.blur()
    }
  }, [isFocused])

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hello@petey.co')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLinkedIn = () => {
    window.open('https://www.linkedin.com/in/peteydotco/', '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* TOP CLUSTER - matches collapsed card's flex-col gap-[0px] structure */}
      <div className="flex-shrink-0 flex flex-col gap-[0px]">
        {/* Header row */}
        <div className="flex items-start justify-between w-full">
          <motion.div
            className="font-pressura leading-normal text-left uppercase"
            style={{
              color: themeText,
              fontSize: '12px',
              letterSpacing: '0.39px',
              transformOrigin: 'top left',
              whiteSpace: 'nowrap',
            }}
            initial={{ scale: 1, marginTop: '0px', opacity: 0 }}
            animate={{ scale: 14 / 12, marginTop: '1px', opacity: 1 }}
            exit={{
              scale: 1, marginTop: '0px', opacity: isMobile ? 0 : 1,
              transition: {
                scale: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] },
                marginTop: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] },
                ...(isMobile ? { opacity: { duration: 0.1, delay: 0, ease: 'easeOut' } } : {}),
              },
            }}
            transition={{ ...contentSpring, opacity: { duration: 0.15, delay: 0.1, ease: 'easeOut' } }}
          >
            - EMPTY SLOT -
          </motion.div>

          {/* Badge - cross-fades between ESC (expanded) and shortcut (collapsed) */}
          {!hideShortcut && (
            <motion.div
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="flex items-center justify-center rounded-[4px] shrink-0 cursor-pointer overflow-hidden"
              style={{ backgroundColor: themeBadgeBg }}
              initial={false}
              animate={{ padding: '4px 8px' }}
              exit={{ padding: '4px 12px' }}
              transition={contentSpring}
            >
              {/* Badge text container - dual spans for cross-fade */}
              <div
                className="uppercase font-pressura-mono leading-[100%] relative text-[12px] whitespace-nowrap"
                style={{ top: '-1px' }}
              >
                {/* ESC text - absolutely positioned, visible when expanded */}
                <motion.span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ color: themeSecondary }}
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                >
                  ESC
                </motion.span>
                {/* Shortcut text - provides layout, hidden when expanded */}
                <motion.span
                  style={{ color: themeSecondary }}
                  initial={false}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 1 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                >
                  {shortcut}
                </motion.span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Title input row - morphs from collapsed to expanded */}
        {/* Matches collapsed structure: block div > span.flex.items-center.gap-3 */}
        {/* Uses textColor (0.55) in expanded for ghosted look, ctaTitleColor (0.75) on exit to match collapsed */}
        <motion.div
          className="text-[18px] leading-normal text-left w-full uppercase font-pressura-light"
          style={{
            transformOrigin: 'top left',
            letterSpacing: '-0.3px',
          }}
          initial={{ scale: 1, marginTop: '0px', color: themeTitle, opacity: 0 }}
          animate={{ scale: isMobile ? 26 / 18 : 32 / 18, marginTop: '4px', color: themeGhostedText, opacity: 1 }}
          exit={{
            scale: 1, marginTop: '0px', color: themeTitle, opacity: isMobile ? 0 : 1,
            transition: {
              scale: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] },
              marginTop: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] },
              ...(isMobile ? { opacity: { duration: 0.1, delay: 0, ease: 'easeOut' } } : {}),
            },
          }}
          transition={{ ...contentSpring, opacity: { duration: 0.15, delay: 0.1, ease: 'easeOut' } }}
        >
          <span className="flex items-center gap-3">
            <motion.span
              className="shrink-0 inline-flex items-center justify-center"
              style={{
                cursor: inputValue ? 'pointer' : 'default',
                width: isMobile ? '16px' : '20px',
                height: isMobile ? '16px' : '20px',
              }}
              initial={{ marginLeft: '0px', rotate: 0 }}
              animate={{ marginLeft: '2.5px', rotate: inputValue ? 45 : 0 }}
              exit={{ marginLeft: '0px', rotate: 0 }}
              transition={{
                marginLeft: contentSpring,
                rotate: { type: 'tween', duration: 0.2, ease: 'easeInOut' },
              }}
              onClick={(e) => {
                if (inputValue) {
                  e.stopPropagation()
                  setInputValue('')
                  if (!isMobile) inputRef.current?.focus({ preventScroll: true })
                }
              }}
            >
              <SlPlus className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: themeTitle }} />
            </motion.span>
            {/* Input field with custom placeholder overlay */}
            <span className="relative flex-1">
              {!inputValue && (
                <span
                  className="absolute inset-0 font-pressura-light uppercase pointer-events-none"
                  style={{
                    color: 'inherit',
                    fontSize: 'inherit',
                    letterSpacing: 'inherit',
                    lineHeight: 'inherit',
                  }}
                >
                  Add new role
                </span>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!isFocused}
                tabIndex={isFocused ? 0 : -1}
                className="w-full bg-transparent outline-none font-pressura-light uppercase relative"
                style={{
                  color: inputValue ? inputTypedColor : 'inherit',
                  fontSize: 'inherit',
                  letterSpacing: 'inherit',
                  lineHeight: 'inherit',
                  padding: 0,
                  margin: 0,
                  border: 'none',
                  height: 'auto',
                  caretColor: isFocused ? caretColor : 'transparent',
                  pointerEvents: isFocused ? 'auto' : 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </span>
          </span>
        </motion.div>
      </div>

      {/* MIDDLE CLUSTER - Scrollable work experience list */}
      {/* On mobile: flex + margin:auto centers content when shorter than container, scrolls naturally when taller */}
      <motion.div
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{
          marginTop: isMobile ? 0 : `${s(48)}px`,
          padding: isMobile ? `${s(24)}px 3px 3px 3px` : '3px',
          display: isMobile ? 'flex' : undefined,
          flexDirection: isMobile ? 'column' : undefined,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.12, delay: 0, ease: 'easeOut' } }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div style={isMobile ? { margin: 'auto 0' } : undefined}>
        {workExperience.map((exp) => {
          const hasSubRoles = exp.subRoles && exp.subRoles.length > 0

          return (
            <div key={exp.company} className="relative" style={{ marginBottom: `${s(16)}px` }}>
              {/* Parent role */}
              <div className="flex items-start" style={{ gap: `${s(20)}px` }}>
                {/* Logo */}
                <div
                  className="shrink-0 relative z-10 overflow-hidden"
                  style={{
                    width: `${s(38)}px`,
                    height: `${s(38)}px`,
                    boxShadow: `0 0 0 ${STROKE_WIDTH}px ${themeStroke}`,
                    borderRadius: '50%',
                    backgroundColor: exp.logoBg || logoContainerBg,
                  }}
                >
                  <img
                    src={exp.logo}
                    alt={exp.company}
                    style={{
                      position: exp.logoFit ? 'absolute' : 'static',
                      width: exp.logoFit ? exp.logoFit.width : '100%',
                      height: exp.logoFit ? exp.logoFit.height : '100%',
                      left: exp.logoFit?.left,
                      top: exp.logoFit?.top,
                      objectFit: exp.logoFit?.objectFit || 'cover',
                      borderRadius: exp.logoFit ? '0' : '50%',
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col" style={{ gap: '0px' }}>
                  {/* Company + Location */}
                  <div className="flex items-baseline">
                    <span
                      className="font-pressura-ext"
                      style={{ fontSize: `${s(20)}px`, color: companyNameColor }}
                    >
                      {exp.company}
                    </span>
                    <span style={{ width: `${s(12)}px` }} />
                    <span
                      className="font-pressura-mono uppercase"
                      style={{ fontSize: `${s(14)}px`, color: themeText }}
                    >
                      {exp.location}
                    </span>
                  </div>

                  {/* Description */}
                  <span
                    className="font-pressura-ext"
                    style={{ fontSize: `${s(18)}px`, color: themeText, fontWeight: 350 }}
                  >
                    {exp.title}
                  </span>

                  {/* Date range */}
                  <span
                    className="font-pressura-ext"
                    style={{ fontSize: `${s(18)}px`, color: themeText, fontWeight: 350 }}
                  >
                    {exp.dateRange}
                  </span>
                </div>
              </div>

              {/* Sub-roles with SVG branch connectors */}
              {hasSubRoles && (
                <div
                  style={{
                    marginLeft: `${s(57)}px`,
                    marginTop: `${s(20)}px`,
                  }}
                >
                  {exp.subRoles!.map((subRole, subIndex) => {
                    const isLast = subIndex === exp.subRoles!.length - 1
                    return (
                      <div key={subRole.title} className="relative" style={{ marginBottom: `${s(10)}px` }}>
                        {/* SVG curved branch connector — arm ends under the sub-role logo */}
                        <div
                          className="absolute"
                          style={{
                            left: `${s(-40)}px`,
                            bottom: `calc(100% - ${s(14)}px)`,
                            width: `${s(27)}px`,
                            height: subIndex === 0 ? `${s(70)}px` : `${s(97)}px`,
                            pointerEvents: 'none',
                            zIndex: 0,
                          }}
                        >
                          {subIndex === 0 ? <BranchFirst scale={contentScale} strokeColor={themeStroke} /> : <BranchSub scale={contentScale} strokeColor={themeStroke} />}
                        </div>

                        {/* Curly loop — attached to last sub-role, bridges to Fantasy */}
                        {isLast && exp.company === 'Squarespace' && (
                          <div
                            className="absolute"
                            style={{
                              left: `${s(-40)}px`,
                              top: `${s(4)}px`,
                              width: `${s(21)}px`,
                              height: `${s(79)}px`,
                              pointerEvents: 'none',
                              zIndex: 0,
                            }}
                          >
                            <CurlyLoop scale={contentScale} strokeColor={themeStroke} />
                          </div>
                        )}

                        <div className="flex items-start" style={{ gap: `${s(12)}px` }}>
                          {/* Sub-role logo */}
                          <div
                            className="shrink-0 flex items-center justify-center relative z-10"
                            style={{
                              width: `${s(28)}px`,
                              height: `${s(28)}px`,
                              boxShadow: `0 0 0 ${STROKE_WIDTH}px ${themeStroke}`,
                              borderRadius: subRole.shape === 'circle' ? '44px' : `${s(8)}px`,
                              backgroundColor: logoContainerBg,
                            }}
                          >
                            <img
                              src={subRole.logo}
                              alt={subRole.title}
                              className="object-cover"
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: subRole.shape === 'circle' ? '44px' : `${s(8)}px`,
                              }}
                            />
                          </div>

                          {/* Sub-role info */}
                          <div className="flex flex-col" style={{ gap: '0px' }}>
                            <span
                              className="font-pressura-ext"
                              style={{ fontSize: `${s(18)}px`, color: companyNameColor }}
                            >
                              {subRole.title}
                            </span>
                            <span
                              className="font-pressura-ext"
                              style={{ fontSize: `${s(16)}px`, color: themeText, fontWeight: 350 }}
                            >
                              {subRole.description}
                            </span>
                            <span
                              className="font-pressura-ext"
                              style={{ fontSize: `${s(16)}px`, color: themeText, fontWeight: 350 }}
                            >
                              {subRole.dateRange}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Straight vertical connector between Fantasy and Critical Mass */}
              {exp.company === 'Fantasy' && (
                <div
                  className="absolute"
                  style={{
                    left: `${s(38) / 2 - 1.5}px`,
                    bottom: `${s(-19)}px`,
                    width: '3px',
                    height: `${s(55)}px`,
                    pointerEvents: 'none',
                  }}
                >
                  <VerticalLine scale={contentScale} strokeColor={themeStroke} />
                </div>
              )}

              {/* Apple logo overlay on Critical Mass */}
              {exp.company === 'Critical Mass' && (
                <div
                  className="absolute z-20"
                  style={{
                    left: `${s(20)}px`,
                    top: `${s(22)}px`,
                    width: `${s(28)}px`,
                    height: `${s(28)}px`,
                    borderRadius: '44px',
                    boxShadow: `0 0 0 ${STROKE_WIDTH}px ${logoContainerBg}`,
                    backgroundColor: '#999',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/images/logos/apple.webp"
                    alt="Apple"
                    style={{
                      width: '80%',
                      height: '80%',
                      objectFit: 'contain',
                      position: 'absolute',
                      left: '10%',
                      top: '6%',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
        </div>
      </motion.div>

      {/* BOTTOM CLUSTER - Buttons */}
      <motion.div
        className="flex-shrink-0 flex justify-center"
        style={{ gap: `${s(8)}px`, marginTop: `${s(16)}px` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.12, delay: 0, ease: 'easeOut' } }}
        transition={{ duration: 0.25, delay: 0.3 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLinkedIn()
          }}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: `${s(225)}px`,
            height: `${s(48)}px`,
            borderRadius: '5px',
            borderBottom: `2px solid ${themeBtnBorder}`,
            backgroundColor: themeBtnBg,
          }}
        >
          <span
            className="font-pressura uppercase"
            style={{
              fontSize: `${s(20)}px`,
              color: themeBtnText,
              letterSpacing: '-0.8px',
              fontWeight: 400,
              position: 'relative',
              top: '-1px',
            }}
          >
            More on Linkedin
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleCopyEmail()
          }}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: `${s(225)}px`,
            height: `${s(48)}px`,
            borderRadius: '5px',
            borderBottom: `2px solid ${themeBtnBorder}`,
            backgroundColor: themeBtnBg,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={copied ? 'copied' : 'copy'}
              className="font-pressura uppercase"
              style={{
                fontSize: `${s(20)}px`,
                color: themeBtnText,
                letterSpacing: '-0.8px',
                fontWeight: 400,
                position: 'relative',
                top: '-1px',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {copied ? '✓ Email Copied' : 'Copy Email'}
            </motion.span>
          </AnimatePresence>
        </button>
      </motion.div>
    </>
  )
}
