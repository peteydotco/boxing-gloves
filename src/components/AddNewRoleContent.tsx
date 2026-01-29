import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { SlPlus } from 'react-icons/sl'
import { contentSpring } from '../constants/animation'

// Timeline connector color
const STROKE_COLOR = '#CFCFCF'
const STROKE_WIDTH = 2.5

// Inline SVG connectors — paths derived from Figma, re-oriented for vertical flow
// First branch: from parent logo bottom → curves right to first sub-role
// Draws: vertical down, then curves right with 11px radius
const BranchFirst = () => (
  <svg
    width="27"
    height="70"
    viewBox="0 0 27 70"
    fill="none"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <path
      d="M1.25 1.25V58.25C1.25 64.325 6.175 69.25 12.25 69.25H25.75"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
  </svg>
)

// Subsequent branch: taller vertical run, same curve right
const BranchSub = () => (
  <svg
    width="27"
    height="97"
    viewBox="0 0 27 97"
    fill="none"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <path
      d="M1.25 1.25V85.25C1.25 91.325 6.175 96.25 12.25 96.25H25.75"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
  </svg>
)

// Curly loop: vertical line → figure-8 thread → vertical line
// Used between Squarespace X and Fantasy
const CurlyLoop = () => (
  <svg
    width="21"
    height="79"
    viewBox="0 0 21.5 79.5"
    fill="none"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <path
      d="M1.25 1.25L1.25 38.75"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
    <path
      d="M1.25 58.25C1.25 39.25 20.25 39.25 20.25 48.9234C20.25 58.5967 1.25 59.541 1.25 39.25"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
    <path
      d="M1.25 58.25L1.25 78.25"
      stroke={STROKE_COLOR}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
    />
  </svg>
)

// Straight vertical connector between Fantasy and Critical Mass
const VerticalLine = () => (
  <svg
    width="3"
    height="43"
    viewBox="0 0 2.5 43"
    fill="none"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <line
      x1="1.25"
      y1="1.25"
      x2="1.25"
      y2="41.75"
      stroke={STROKE_COLOR}
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
    logo: '/images/logos/squarespace.png',
    subRoles: [
      {
        title: 'Unfold app',
        description: 'Design lead for creator tools',
        dateRange: '2022 → 2024',
        logo: '/images/logos/unfold.png',
      },
      {
        title: 'Squarespace app',
        description: 'Reimagined for first-time sellers',
        dateRange: '2022 → 2024',
        logo: '/images/logos/squarespace-app.png',
      },
      {
        title: 'Squarespace 7.1',
        description: 'Design manager for content, styling',
        dateRange: '2020 → 2021',
        logo: '/images/logos/squarespace.png',
        shape: 'circle',
      },
      {
        title: 'Squarespace X',
        description: 'Design lead for next-gen platform',
        dateRange: '2019 → 2020',
        logo: '/images/logos/squarespace.png',
        shape: 'circle',
      },
    ],
  },
  {
    company: 'Fantasy',
    location: 'SAN FRANCISCO',
    title: 'Experience design lead',
    dateRange: '2017 → 2018',
    logo: '/images/logos/fantasy.png',
    logoBg: '#FFFFFF',
    logoFit: { width: '88%', height: '88%', left: '6.8%', top: '6.6%', objectFit: 'contain' },
  },
  {
    company: 'Critical Mass',
    location: 'SILICON VALLEY',
    title: 'Experience design lead with Apple',
    dateRange: '2015 → 2017',
    logo: '/images/logos/critical-mass.png',
    logoBg: '#000000',
    logoFit: { width: '102%', height: '75%', left: '-1%', top: '12.7%', objectFit: 'cover' },
  },
]

interface AddNewRoleContentProps {
  onClose: () => void
  isMobile?: boolean
  hideShortcut?: boolean
  shortcut?: string
}

export function AddNewRoleContent({
  onClose,
  isMobile = false,
  hideShortcut = false,
  shortcut = '⌘ C',
}: AddNewRoleContentProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hello@petey.co')
  }

  const handleLinkedIn = () => {
    window.open('https://linkedin.com/in/peterodriguez', '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* TOP CLUSTER - matches collapsed card's flex-col gap-[0px] structure */}
      <div className="flex-shrink-0 flex flex-col gap-[0px]">
        {/* Header row */}
        <div className="flex items-start justify-between w-full">
          <motion.div
            className="font-pressura-mono leading-normal text-left uppercase"
            style={{
              color: '#6f6f6f',
              fontSize: '13px',
              letterSpacing: '0.39px',
              transformOrigin: 'top left',
              whiteSpace: 'nowrap',
            }}
            initial={{ scale: 1, marginTop: '0px', opacity: 1 }}
            animate={{ scale: 14 / 13, marginTop: '1px', opacity: 1 }}
            exit={{ scale: 1, marginTop: '0px', opacity: 1 }}
            transition={contentSpring}
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
              style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
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
                  style={{ color: '#3e3e3e' }}
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                >
                  ESC
                </motion.span>
                {/* Shortcut text - provides layout, hidden when expanded */}
                <motion.span
                  style={{ color: '#3e3e3e' }}
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
          initial={{ scale: 1, marginTop: '0px', color: 'rgba(0,0,0,0.75)' }}
          animate={{ scale: isMobile ? 26 / 18 : 32 / 18, marginTop: '4px', color: 'rgba(0,0,0,0.4)' }}
          exit={{ scale: 1, marginTop: '0px', color: 'rgba(0,0,0,0.75)' }}
          transition={contentSpring}
        >
          <span className="flex items-center gap-3">
            <motion.span
              className="shrink-0 inline-flex"
              initial={{ marginLeft: '0px' }}
              animate={{ marginLeft: '2.5px' }}
              exit={{ marginLeft: '0px' }}
              transition={contentSpring}
            >
              <SlPlus className="w-5 h-5" style={{ color: 'rgba(0,0,0,0.75)', position: 'relative', top: '1px' }} />
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
                className="w-full bg-transparent outline-none font-pressura-light uppercase relative"
                style={{
                  color: 'inherit',
                  fontSize: 'inherit',
                  letterSpacing: 'inherit',
                  lineHeight: 'inherit',
                  padding: 0,
                  margin: 0,
                  border: 'none',
                  height: 'auto',
                  caretColor: 'rgba(0,0,0,0.55)',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </span>
          </span>
        </motion.div>
      </div>

      {/* MIDDLE CLUSTER - Scrollable work experience list */}
      <motion.div
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{ marginTop: '48px', padding: '3px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {workExperience.map((exp) => {
          const hasSubRoles = exp.subRoles && exp.subRoles.length > 0

          return (
            <div key={exp.company} className="relative" style={{ marginBottom: hasSubRoles ? '16px' : '16px' }}>
              {/* Parent role */}
              <div className="flex items-start" style={{ gap: '20px' }}>
                {/* Logo */}
                <div
                  className="shrink-0 relative z-10 overflow-hidden"
                  style={{
                    width: '38px',
                    height: '38px',
                    boxShadow: '0 0 0 2.5px #cfcfcf',
                    borderRadius: '18px',
                    backgroundColor: exp.logoBg || '#f6f6f6',
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
                      borderRadius: exp.logoFit ? '0' : '18px',
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col" style={{ gap: '0px' }}>
                  {/* Company + Location */}
                  <div className="flex items-baseline">
                    <span
                      className="font-pressura-ext"
                      style={{ fontSize: '20px', color: '#202020' }}
                    >
                      {exp.company}
                    </span>
                    <span style={{ width: '12px' }} />
                    <span
                      className="font-pressura-mono uppercase"
                      style={{ fontSize: '14px', color: '#6f6f6f' }}
                    >
                      {exp.location}
                    </span>
                  </div>

                  {/* Description */}
                  <span
                    className="font-pressura-ext"
                    style={{ fontSize: '18px', color: '#6f6f6f', fontWeight: 350 }}
                  >
                    {exp.title}
                  </span>

                  {/* Date range */}
                  <span
                    className="font-pressura-ext"
                    style={{ fontSize: '18px', color: '#6f6f6f', fontWeight: 350 }}
                  >
                    {exp.dateRange}
                  </span>
                </div>
              </div>

              {/* Sub-roles with SVG branch connectors */}
              {hasSubRoles && (
                <div
                  style={{
                    marginLeft: '57px',
                    marginTop: '16px',
                  }}
                >
                  {exp.subRoles!.map((subRole, subIndex) => {
                    const isLast = subIndex === exp.subRoles!.length - 1
                    return (
                      <div key={subRole.title} className="relative" style={{ marginBottom: '10px' }}>
                        {/* SVG curved branch connector — arm ends under the sub-role logo */}
                        <div
                          className="absolute"
                          style={{
                            left: '-40px',
                            bottom: 'calc(100% - 14px)',
                            width: '27px',
                            height: subIndex === 0 ? '64px' : '97px',
                            pointerEvents: 'none',
                            zIndex: 0,
                          }}
                        >
                          {subIndex === 0 ? <BranchFirst /> : <BranchSub />}
                        </div>

                        {/* Curly loop — attached to last sub-role, bridges to Fantasy */}
                        {isLast && exp.company === 'Squarespace' && (
                          <div
                            className="absolute"
                            style={{
                              left: '-40px',
                              top: '4px',
                              width: '21px',
                              height: '79px',
                              pointerEvents: 'none',
                              zIndex: 0,
                            }}
                          >
                            <CurlyLoop />
                          </div>
                        )}

                        <div className="flex items-start" style={{ gap: '12px' }}>
                          {/* Sub-role logo */}
                          <div
                            className="shrink-0 flex items-center justify-center relative z-10"
                            style={{
                              width: '28px',
                              height: '28px',
                              boxShadow: '0 0 0 2.5px #cfcfcf',
                              borderRadius: subRole.shape === 'circle' ? '44px' : '8px',
                              backgroundColor: '#f6f6f6',
                            }}
                          >
                            <img
                              src={subRole.logo}
                              alt={subRole.title}
                              className="object-cover"
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: subRole.shape === 'circle' ? '44px' : '8px',
                              }}
                            />
                          </div>

                          {/* Sub-role info */}
                          <div className="flex flex-col" style={{ gap: '0px' }}>
                            <span
                              className="font-pressura-ext"
                              style={{ fontSize: '18px', color: '#202020' }}
                            >
                              {subRole.title}
                            </span>
                            <span
                              className="font-pressura-ext"
                              style={{ fontSize: '16px', color: '#6f6f6f', fontWeight: 350 }}
                            >
                              {subRole.description}
                            </span>
                            <span
                              className="font-pressura-ext"
                              style={{ fontSize: '16px', color: '#6f6f6f', fontWeight: 350 }}
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
                    left: '16.75px',
                    bottom: '-19px',
                    width: '3px',
                    height: '55px',
                    pointerEvents: 'none',
                  }}
                >
                  <VerticalLine />
                </div>
              )}

              {/* Apple logo overlay on Critical Mass */}
              {exp.company === 'Critical Mass' && (
                <div
                  className="absolute z-20"
                  style={{
                    left: '20px',
                    top: '22px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '44px',
                    boxShadow: '0 0 0 2.5px #f6f6f6',
                    backgroundColor: '#999',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/images/logos/apple.png"
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
      </motion.div>

      {/* BOTTOM CLUSTER - Buttons */}
      <motion.div
        className="flex-shrink-0 flex justify-center"
        style={{ gap: '8px', marginTop: '16px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.3 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleLinkedIn()
          }}
          className="flex items-center justify-center bg-white cursor-pointer"
          style={{
            width: '225px',
            height: '48px',
            borderRadius: '5px',
            borderBottom: '2px solid rgba(0,0,0,0.2)',
          }}
        >
          <span
            className="font-pressura uppercase"
            style={{
              fontSize: '20px',
              color: '#000',
              letterSpacing: '-0.8px',
              fontWeight: 500,
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
          className="flex items-center justify-center bg-white cursor-pointer"
          style={{
            width: '225px',
            height: '48px',
            borderRadius: '5px',
            borderBottom: '2px solid rgba(0,0,0,0.2)',
          }}
        >
          <span
            className="font-pressura uppercase"
            style={{
              fontSize: '20px',
              color: '#000',
              letterSpacing: '-0.8px',
              fontWeight: 500,
            }}
          >
            Copy Email
          </span>
        </button>
      </motion.div>
    </>
  )
}
