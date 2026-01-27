import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { SlPlus } from 'react-icons/sl'
import { contentSpring } from '../constants/animation'

// Timeline line style constant
const TIMELINE_COLOR = '#CFCFCF'
const TIMELINE_WIDTH = 2

// Work experience data
interface SubRole {
  title: string
  description: string
  dateRange: string
  logo: string
}

interface WorkExperience {
  company: string
  location: string
  title: string
  dateRange: string
  logo: string
  logoBg?: string
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
        logo: '/images/logos/squarespace.png',
      },
      {
        title: 'Squarespace 7.1',
        description: 'Design manager for content, styling',
        dateRange: '2020 → 2021',
        logo: '/images/logos/squarespace.png',
      },
      {
        title: 'Squarespace X',
        description: 'Design lead for next-gen platform',
        dateRange: '2019 → 2020',
        logo: '/images/logos/squarespace.png',
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
  },
  {
    company: 'Critical Mass',
    location: 'SILICON VALLEY',
    title: 'Experience design lead with Apple',
    dateRange: '2015 → 2017',
    logo: '/images/logos/critical-mass.png',
    logoBg: '#000000',
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
  shortcut: _shortcut = '⌘ C',
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
      {/* TOP CLUSTER - matches other cards structure with morphing animations */}
      <div className="flex-shrink-0">
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

          {/* Badge - shows ESC when expanded, morphs to shortcut on exit */}
          {!hideShortcut && (
            <motion.div
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="flex items-center justify-center rounded-[4px] shrink-0 cursor-pointer"
              style={{ backgroundColor: 'rgba(0,0,0,0.08)', padding: '4px 8px' }}
            >
              {/* Badge text - same size as collapsed card */}
              <div
                className="uppercase font-pressura-mono leading-[100%] relative text-[12px]"
                style={{ top: '-1px', color: '#3e3e3e' }}
              >
                ESC
              </div>
            </motion.div>
          )}
        </div>

        {/* Title input row - morphs from collapsed to expanded */}
        <motion.div
          className="flex items-center"
          style={{ gap: '12px', transformOrigin: 'top left' }}
          initial={{ scale: 1, marginTop: '0px' }}
          animate={{ scale: isMobile ? 26 / 18 : 32 / 18, marginTop: '4px' }}
          exit={{ scale: 1, marginTop: '0px' }}
          transition={contentSpring}
        >
          {/* Plus circle icon - scales with the row */}
          <SlPlus className="shrink-0" style={{ color: '#202020', width: '20px', height: '20px' }} />

          {/* Input field - wrapped in motion.div for exit animation */}
          <motion.div
            className="relative flex-1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: inputValue ? 1 : 0.3 }}
            exit={{ opacity: 1 }}
            transition={contentSpring}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add new role..."
              className="w-full bg-transparent outline-none font-pressura-light uppercase"
              style={{
                color: '#202020',
                fontSize: '18px',
                letterSpacing: '-0.3px',
                caretColor: '#202020',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* MIDDLE CLUSTER - Scrollable work experience list */}
      <motion.div
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{ marginTop: '44px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {/* Main continuous vertical timeline line */}
        <div
          className="absolute"
          style={{
            left: '18px', // Center of 38px parent logo
            top: '38px', // Start from bottom of Squarespace logo
            bottom: '100px', // Stop above Critical Mass logo
            width: `${TIMELINE_WIDTH}px`,
            backgroundColor: TIMELINE_COLOR,
          }}
        />

        {workExperience.map((exp) => {
          const hasSubRoles = exp.subRoles && exp.subRoles.length > 0

          return (
            <div key={exp.company} className="relative" style={{ marginBottom: hasSubRoles ? '4px' : '16px' }}>
              {/* Parent role */}
              <div className="flex items-start" style={{ gap: '20px' }}>
                {/* Logo */}
                <div
                  className="shrink-0 overflow-hidden flex items-center justify-center relative z-10"
                  style={{
                    width: '38px',
                    height: '38px',
                    border: '2.5px solid #cfcfcf',
                    borderRadius: '18px',
                    backgroundColor: exp.logoBg || '#f6f6f6',
                  }}
                >
                  <img
                    src={exp.logo}
                    alt={exp.company}
                    className="object-cover"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '16px',
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

              {/* Sub-roles */}
              {hasSubRoles && (
                <div
                  style={{
                    marginLeft: '57px', // 19px (center) + 38px (branch width)
                    marginTop: '8px',
                  }}
                >
                  {exp.subRoles!.map((subRole) => (
                    <div key={subRole.title} className="relative" style={{ marginBottom: '10px' }}>
                      {/* Horizontal branch from timeline to sub-role */}
                      <div
                        className="absolute"
                        style={{
                          left: '-39px', // Back to the timeline
                          top: '13px', // Middle of 28px sub-role logo
                          width: '27px',
                          height: `${TIMELINE_WIDTH}px`,
                          backgroundColor: TIMELINE_COLOR,
                        }}
                      />

                      <div className="flex items-start" style={{ gap: '12px' }}>
                        {/* Sub-role logo */}
                        <div
                          className="shrink-0 overflow-hidden flex items-center justify-center relative z-10"
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '2.5px solid #cfcfcf',
                            borderRadius: '8px',
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
                              borderRadius: '6px',
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
                  ))}
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
                    border: '2.5px solid #f6f6f6',
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
