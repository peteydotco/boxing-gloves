import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { IoMdArrowForward, IoMdCheckmark } from 'react-icons/io'
import { contentSpring } from '../constants/animation'
import { BREAKPOINTS } from '../constants/breakpoints'
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
  emailCopied?: boolean
  expandedFromCompact?: boolean
  compactLabel?: string
}

// Default light CTA colors (fallback when no styles prop)
const defaultCtaColors = {
  textColor: 'rgba(0,0,0,0.55)',
  ctaTitleColor: 'rgba(0,0,0,0.75)',
  secondaryText: 'rgba(0,0,0,0.7)',
  badgeTextColor: 'rgba(0,0,0,0.48)', // lighter gray for badge text
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
  emailCopied: emailCopiedProp = false,
  expandedFromCompact: _expandedFromCompact = false,
  compactLabel: _compactLabel,
}: AddNewRoleContentProps) {
  // Helper: scale a pixel value proportionally (mobile uses slightly smaller base sizes)
  const s = (px: number) => Math.round(px * contentScale)
  const [inputValue, setInputValue] = useState('')
  const [localCopied, setLocalCopied] = useState(false)
  const copied = localCopied || emailCopiedProp
  const [hoveredButton, setHoveredButton] = useState<'linkedin' | 'email' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Derive theme-aware colors from styles prop (or fall back to light CTA defaults)
  const themeText = styles?.textColor ?? defaultCtaColors.textColor
  const themeTitle = styles?.ctaTitleColor ?? defaultCtaColors.ctaTitleColor
  const themeBadgeBg = styles?.badgeBg ?? defaultCtaColors.badgeBg
  // Determine if we're in a dark theme (bg is dark)
  const isDark = styles ? styles.textColor.includes('255') : false
  // Badge text uses lighter color to match collapsed card badge
  const themeBadgeText = isDark ? 'rgba(255,255,255,0.48)' : defaultCtaColors.badgeTextColor
  // Stroke/divider color — use solid opaque colors to prevent dark overlap artifacts
  // where SVG connector paths intersect (rgba compounds at overlaps)
  const themeStroke = isDark ? '#404048' : '#E0E0E0'
  // Logo container bg: light → #f6f6f6, dark → slightly lighter than card bg
  const logoContainerBg = isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0'
  // Company name color (strong text) — black in light theme, white in dark
  const companyNameColor = isDark ? '#FFFFFF' : '#000000'
  // Input typed text color — slightly stronger than title
  const inputTypedColor = isDark ? (styles?.secondaryText ?? 'rgba(255,255,255,0.85)') : '#202020'
  // Ghosted text color — lighter than themeText for the expanded title/label hint
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
    setLocalCopied(true)
    setTimeout(() => setLocalCopied(false), 2000)
  }

  const handleLinkedIn = () => {
    window.open('https://www.linkedin.com/in/peteydotco/', '_blank', 'noopener,noreferrer')
  }

  // Responsive position values for badges
  const badgeRight = isMobile ? 14 : (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.desktop) ? 16 : 22
  const badgeTop = isMobile ? 18 : (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.desktop) ? 16 : 22

  return (
    <div className="flex flex-col h-full w-full">
      {/* Two separate badges that crossfade - solves width/padding issues */}
      {/* Each badge sizes itself naturally based on its text content */}
      {!hideShortcut && (
        <>
          {/* Shortcut badge (⌘ C) - visible in collapsed, fades out when expanded */}
          <motion.div
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="flex items-center justify-center rounded-full shrink-0 cursor-pointer absolute"
            style={{ backgroundColor: themeBadgeBg }}
            initial={{ right: 10, top: 10, paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px', opacity: 1 }}
            animate={{ right: badgeRight, top: badgeTop, paddingTop: '4px', paddingBottom: '4px', paddingLeft: '18px', paddingRight: '17px', opacity: 0 }}
            exit={{ right: 10, top: 10, paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px', opacity: 1 }}
            transition={contentSpring}
          >
            <div
              className="uppercase leading-[100%] text-[12px]"
              style={{ fontFamily: 'DotGothic16', fontWeight: 400, letterSpacing: '0.12em', position: 'relative', top: '-1px', color: themeBadgeText, whiteSpace: 'nowrap' }}
            >
              {shortcut}
            </div>
          </motion.div>

          {/* ESC badge - hidden in collapsed, fades in when expanded */}
          {/* Matches MorphingCard pattern exactly: shortcut provides layout, ESC overlays */}
          <motion.div
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="flex items-center justify-center rounded-full shrink-0 cursor-pointer absolute"
            style={{ backgroundColor: themeBadgeBg }}
            initial={{ right: 10, top: 10, paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px', opacity: 0 }}
            animate={{ right: badgeRight, top: badgeTop, paddingTop: '4px', paddingBottom: '4px', paddingLeft: '18px', paddingRight: '17px', opacity: 1 }}
            exit={{ right: 10, top: 10, paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px', opacity: 0 }}
            transition={contentSpring}
          >
            <div
              className="uppercase leading-[100%] relative text-[12px]"
              style={{ fontFamily: 'DotGothic16', fontWeight: 400, letterSpacing: '0.12em', top: '-1px' }}
            >
              {/* ESC text absolutely positioned - same as MorphingCard */}
              <span className="absolute inset-0 flex items-center justify-center" style={{ color: themeBadgeText }}>
                ESC
              </span>
              {/* Single digit provides layout width - matches other cards' shortcuts (1, 2, 3, 4) */}
              <span style={{ color: themeBadgeText, opacity: 0 }}>4</span>
            </div>
          </motion.div>
        </>
      )}

      {/* TOP CLUSTER - matches collapsed card's flex-col gap-[5px] structure */}
      {/* Extra 4px left padding brings content to 28px from card edge (24px card padding + 4px) */}
      <motion.div
        className="flex-shrink-0 flex flex-col"
        style={{ gap: 5 }}
        initial={{ paddingLeft: '0px' }}
        animate={{ paddingLeft: '4px' }}
        exit={{
          paddingLeft: '0px',
          transition: {
            type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1],
          },
        }}
        transition={contentSpring}
      >
        {/* Label row */}
        <motion.div
          className="text-left"
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            color: themeText,
            fontSize: '12px',
            lineHeight: '15px',
            letterSpacing: '0.01em',
            transformOrigin: 'top left',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 14 / 12, opacity: 1 }}
          exit={{
            scale: 1,
            opacity: 1,
            transition: {
              scale: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] },
            },
          }}
          transition={{ ...contentSpring, opacity: { duration: 0.15, delay: 0.1, ease: 'easeOut' } }}
        >
          Blank Slot
        </motion.div>

        {/* Title input row - morphs from collapsed to expanded */}
        {/* Matches collapsed structure: block div > span.flex.items-center.gap-3 */}
        {/* Uses textColor (0.55) in expanded for ghosted look, ctaTitleColor (0.75) on exit to match collapsed */}
        <motion.div
          className="text-[18px] text-left w-full"
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            transformOrigin: 'top left',
            letterSpacing: '-0.01em',
            lineHeight: '24px',
            whiteSpace: 'nowrap',
            position: 'relative',
          }}
          initial={{ scale: 1, marginTop: '-4px', marginLeft: '0px', color: themeTitle, opacity: 0 }}
          animate={{ scale: isMobile ? 26 / 18 : (typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.desktop) ? 28 / 18 : 32 / 18, marginTop: '1px', marginLeft: '-1px', color: themeTitle, opacity: 1 }}
          exit={{
            scale: 1,
            marginTop: '-4px',
            marginLeft: '0px',
            color: themeTitle,
            opacity: 1,
            transition: {
              scale: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] },
              marginTop: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] },
              marginLeft: { type: 'tween', duration: 0.25, ease: [0.33, 1, 0.68, 1] },
            },
          }}
          transition={{ ...contentSpring, opacity: { duration: 0.15, delay: 0.1, ease: 'easeOut' } }}
        >
          {/* Input row — fades out during compact exit */}
          <motion.span
            className="flex items-center gap-3"
            style={{ display: 'flex' }}
            exit={undefined}
          >
            {/* Input field with custom placeholder overlay */}
            <span className="relative flex-1" data-cursor-text="">
              {!inputValue && (
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    color: 'inherit',
                    fontSize: 'inherit',
                    letterSpacing: 'inherit',
                    lineHeight: 'inherit',
                  }}
                >
                  Add a role...
                </span>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!isFocused}
                tabIndex={isFocused ? 0 : -1}
                className="w-full bg-transparent outline-none relative"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
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
          </motion.span>
        </motion.div>
      </motion.div>

      {/* MIDDLE CLUSTER - Scrollable work experience list */}
      {/* flex + margin:auto centers content when shorter than container, scrolls naturally when taller */}
      <motion.div
        className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col"
        style={{
          padding: isMobile ? `${s(24)}px 3px 3px 3px` : '3px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.12, delay: 0, ease: 'easeOut' } }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div style={{ margin: 'auto 0' }}>
        {workExperience.map((exp) => {
          const hasSubRoles = exp.subRoles && exp.subRoles.length > 0

          return (
            <div key={exp.company} className="relative" style={{ marginBottom: `${s(20)}px` }}>
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
                      style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: `${s(21)}px`, color: companyNameColor }}
                    >
                      {exp.company}
                    </span>
                    <span style={{ width: `${s(12)}px` }} />
                    <span
                      className="uppercase"
                      style={{ fontFamily: 'DotGothic16', fontWeight: 400, fontSize: `${s(11)}px`, letterSpacing: '0.12em', color: themeText }}
                    >
                      {exp.location}
                    </span>
                  </div>

                  {/* Description */}
                  <span
                    style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: `${s(15)}px`, color: themeText }}
                  >
                    {exp.title}
                  </span>

                  {/* Date range */}
                  <span
                    style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: `${s(17)}px`, color: themeText }}
                  >
                    {exp.dateRange.includes('→') ? (
                      <>
                        {exp.dateRange.split('→')[0]}
                        <IoMdArrowForward style={{ display: 'inline', verticalAlign: 'middle', fontSize: '0.9em', margin: '0 1px', position: 'relative', top: '-1px' }} />
                        {exp.dateRange.split('→')[1]}
                      </>
                    ) : (
                      exp.dateRange
                    )}
                  </span>
                </div>
              </div>

              {/* Sub-roles with SVG branch connectors */}
              {hasSubRoles && (
                <div
                  style={{
                    marginLeft: `${s(57)}px`,
                    marginTop: `${s(24)}px`,
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

                        <div className="flex items-start" style={{ gap: `${s(16)}px` }}>
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
                              style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: `${s(18)}px`, letterSpacing: 0, color: companyNameColor }}
                            >
                              {subRole.title}
                            </span>
                            <span
                              style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: `${s(15)}px`, letterSpacing: '0', color: themeText }}
                            >
                              {subRole.description}
                            </span>
                            <span
                              style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: `${s(15)}px`, letterSpacing: '0', color: themeText }}
                            >
                              {subRole.dateRange.includes('→') ? (
                                <>
                                  {subRole.dateRange.split('→')[0]}
                                  <IoMdArrowForward style={{ display: 'inline', verticalAlign: 'middle', fontSize: '0.9em', margin: '0 1px', position: 'relative', top: '-1px' }} />
                                  {subRole.dateRange.split('→')[1]}
                                </>
                              ) : (
                                subRole.dateRange
                              )}
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
                    bottom: `${s(-23)}px`,
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
        style={{ gap: `${s(8)}px`, marginTop: 'auto', paddingBottom: '3px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.12, delay: 0, ease: 'easeOut' } }}
        transition={{ duration: 0.25, delay: 0.3 }}
      >
        <motion.button
          data-cursor="morph"
          data-cursor-radius="5"
          onClick={(e) => {
            e.stopPropagation()
            handleLinkedIn()
          }}
          onMouseEnter={() => setHoveredButton('linkedin')}
          onMouseLeave={() => setHoveredButton(null)}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: `${s(225)}px`,
            height: `${s(48)}px`,
            borderRadius: '5px',
            backgroundColor: hoveredButton === 'linkedin' ? '#FFFFFF' : 'transparent',
            border: hoveredButton === 'linkedin' ? '1px solid rgba(0,0,0,0.075)' : '1px solid rgba(0,0,0,0.09)',
            boxShadow: hoveredButton === 'linkedin' ? '0 1070px 250px 0 rgba(0,0,0,0.00), 0 685px 250px 0 rgba(0,0,0,0.02), 0 385px 231px 0 rgba(0,0,0,0.08), 0 171px 171px 0 rgba(0,0,0,0.14), 0 43px 94px 0 rgba(0,0,0,0.16)' : 'none',
            transition: 'background-color 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out',
          }}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3 }}
        >
          <span
            style={{
              fontFamily: 'Inter',
              fontSize: `${s(17)}px`,
              color: '#000000',
              fontWeight: 500,
              position: 'relative',
              top: '-1px',
            }}
          >
            More on Linkedin
          </span>
        </motion.button>
        <motion.button
          data-cursor="morph"
          data-cursor-radius="5"
          onClick={(e) => {
            e.stopPropagation()
            handleCopyEmail()
          }}
          onMouseEnter={() => setHoveredButton('email')}
          onMouseLeave={() => setHoveredButton(null)}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: `${s(225)}px`,
            height: `${s(48)}px`,
            borderRadius: '5px',
            backgroundColor: hoveredButton === 'email' ? '#FFFFFF' : 'transparent',
            border: hoveredButton === 'email' ? '1px solid rgba(0,0,0,0.075)' : '1px solid rgba(0,0,0,0.09)',
            boxShadow: hoveredButton === 'email' ? '0 1070px 250px 0 rgba(0,0,0,0.00), 0 685px 250px 0 rgba(0,0,0,0.02), 0 385px 231px 0 rgba(0,0,0,0.08), 0 171px 171px 0 rgba(0,0,0,0.14), 0 43px 94px 0 rgba(0,0,0,0.16)' : 'none',
            transition: 'background-color 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out',
          }}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={copied ? 'copied' : 'copy'}
              style={{
                fontFamily: 'Inter',
                fontSize: `${s(17)}px`,
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
      </motion.div>
    </div>
  )
}
