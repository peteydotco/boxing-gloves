import { useState, useCallback, useRef, type ReactNode } from 'react'
import { motion, useTransform, motionValue, type MotionValue } from 'framer-motion'
import { bladeStackConfig, getBladeColor } from '../data/stages'

type ViewMode = 'hero' | 'stages'
type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'
type ThemeMode = 'light' | 'inverted' | 'dark' | 'darkInverted'

interface StageBackgroundProps {
  viewMode: ViewMode
  transitionPhase: TransitionPhase
  activeStageIndex: number
  onNavigateToStage?: (stageIndex: number) => void
  tugOffset?: MotionValue<number>
  themeMode?: ThemeMode
  children?: ReactNode
}

// Stable fallback MotionValue (never changes, always 0)
const ZERO_MV = motionValue(0)

/**
 * Unified background that morphs between:
 * - Collapsed: A full-height card positioned to peek from the bottom (front blade position)
 * - Expanded: Fullscreen background for the active stage
 *
 * Children (PersistentNav) are rendered in a SIBLING tug wrapper at z-59,
 * separate from the blade's z-45 tug wrapper. Both wrappers read the same
 * blade0TugY MotionValue so they move in lockstep at 60fps. The sibling
 * approach avoids the CSS stacking context trap where the blade's z-45
 * would flatten nav items below StagesContainer (z-50).
 */
export function StageBackground({ viewMode, transitionPhase, activeStageIndex: _activeStageIndex, onNavigateToStage, tugOffset, themeMode: _themeMode = 'light', children }: StageBackgroundProps) {
  const { borderRadius, horizontalPadding, frontBladePeek } = bladeStackConfig
  const mv = tugOffset ?? ZERO_MV

  // Front blade is index 0 (closest to viewer, widest)
  const frontBladePadding = horizontalPadding
  const frontBladePeekFromBottom = frontBladePeek

  const isExpanding = transitionPhase === 'expanding'
  const isCollapsing = transitionPhase === 'collapsing'

  const isExpanded = viewMode === 'stages' || isExpanding

  const bladeColor = getBladeColor(0)

  // Blade 0 tug y — derived from MotionValue, updates DOM directly at 60fps
  const blade0TugMultiplier = 0.7
  const blade0TugY = useTransform(mv, (v: number) => -(v * blade0TugMultiplier))

  // Transition — expand/collapse springs only (tug is on the wrapper, not spring-animated)
  const backdropTransition = isExpanding
    ? {
        type: 'spring' as const,
        stiffness: 300,
        damping: 35,
        mass: 1,
        delay: 0.04,
      }
    : isCollapsing
    ? {
        type: 'tween' as const,
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1] as const,
        delay: 0,
      }
    : { type: 'spring' as const, stiffness: 300, damping: 25 }

  // Hover offset for blade
  const hoverOffset = 3

  // Variants — no tug in y, that's on the wrapper
  const backdropVariants = {
    collapsed: {
      bottom: `calc(-100vh + ${frontBladePeekFromBottom}px)`,
      left: frontBladePadding,
      right: frontBladePadding,
      top: 'auto' as const,
      height: '100vh',
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      y: 0,
      scale: 1,
    },
    collapsedHovered: {
      bottom: `calc(-100vh + ${frontBladePeekFromBottom}px)`,
      left: frontBladePadding,
      right: frontBladePadding,
      top: 'auto' as const,
      height: '100vh',
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      y: -hoverOffset,
      scale: 1.001,
    },
    expanded: {
      bottom: 0,
      left: 0,
      right: 0,
      top: 'auto' as const,
      height: '100vh',
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      y: 0,
      scale: 1,
    },
  }

  // Nav surface variants — only track the y from blade hover
  // Full-viewport overlay that just shifts y to match blade movement
  const navSurfaceVariants = {
    collapsed: {
      y: 0,
    },
    collapsedHovered: {
      y: -hoverOffset,
    },
    expanded: {
      y: 0,
    },
  }

  const isCollapsed = !isExpanded
  const isInteractive = isCollapsed && !isExpanding && !isCollapsing

  const [isBladeDirectlyHovered, setIsBladeDirectlyHovered] = useState(false)
  // Nav hover state — managed internally, no longer relayed through App
  const [isNavItemHovered, setIsNavItemHovered] = useState(false)

  // Mouse tracking for cursor spotlight border effect
  const bladeRef = useRef<HTMLDivElement>(null)
  const [bladeMouse, setBladeMouse] = useState({ x: 50, y: 50 })

  const handleBladeMouseMove = useCallback((e: React.MouseEvent) => {
    const el = bladeRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Visible area is the top portion of the element (top 88px peek)
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / frontBladePeekFromBottom) * 100
    setBladeMouse({ x, y })
  }, [frontBladePeekFromBottom])

  const isAnyHovered = isBladeDirectlyHovered || isNavItemHovered

  const getAnimateVariant = () => {
    if (isExpanded) return 'expanded'
    if (isAnyHovered) return 'collapsedHovered'
    return 'collapsed'
  }

  return (
    <>
      {/* Blade tug wrapper (z-45): tug offset at 60fps from MotionValue */}
      <motion.div
        className="fixed"
        style={{
          inset: 0,
          zIndex: 45,
          pointerEvents: 'none',
          y: blade0TugY,
        }}
      >
        {/* Blade visual: expand/collapse via variants + hover */}
        <motion.div
          ref={bladeRef}
          className={`fixed ${isInteractive ? 'cursor-pointer' : ''}`}
          style={{
            zIndex: 45,
            backgroundColor: bladeColor,
            pointerEvents: isCollapsed ? 'auto' : 'none',
            overflow: 'hidden',
          }}
          initial={isCollapsing ? 'expanded' : 'collapsed'}
          animate={getAnimateVariant()}
          variants={backdropVariants}
          transition={backdropTransition}
          onClick={() => isInteractive && onNavigateToStage?.(0)}
          onHoverStart={() => {
            if (isInteractive) {
              setIsBladeDirectlyHovered(true)
            }
          }}
          onHoverEnd={() => {
            setIsBladeDirectlyHovered(false)
          }}
          onMouseMove={isInteractive ? handleBladeMouseMove : undefined}
        >
          {/* Cursor spotlight — fill + border layers (always rendered, opacity fades) */}
          {/* Fill spotlight */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: frontBladePeekFromBottom,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              background: `radial-gradient(circle at ${bladeMouse.x}% ${bladeMouse.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%)`,
              opacity: isBladeDirectlyHovered && isInteractive ? 1 : 0,
              transition: 'opacity 0.4s ease-out',
            }}
          />
          {/* Border spotlight */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: frontBladePeekFromBottom,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
              background: `radial-gradient(circle at ${bladeMouse.x}% ${bladeMouse.y}%, rgba(255, 255, 255, 1) 0%, rgba(200, 210, 230, 0.8) 15%, rgba(140, 140, 150, 0.3) 35%, rgba(120, 120, 130, 0.15) 55%, transparent 100%)`,
              WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px 1px 0 1px',
              opacity: isBladeDirectlyHovered && isInteractive ? 0.6 : 0,
              transition: 'opacity 0.4s ease-out',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Nav tug wrapper (z-59): SIBLING to blade wrapper, same MotionValue for lockstep tug.
          Separate stacking context at z-59 so nav items sit above StagesContainer (z-50). */}
      {children && (
        <motion.div
          className="fixed"
          style={{
            inset: 0,
            zIndex: 59,
            pointerEvents: 'none',
            y: blade0TugY,
          }}
        >
          {/* Nav surface: hover y offset matches blade hover, identical transition */}
          <motion.div
            className="fixed"
            style={{
              inset: 0,
              pointerEvents: 'none',
            }}
            initial={isCollapsing ? 'expanded' : 'collapsed'}
            animate={getAnimateVariant()}
            variants={navSurfaceVariants}
            transition={backdropTransition}
            onHoverStart={() => {
              if (isInteractive) {
                setIsNavItemHovered(true)
              }
            }}
            onHoverEnd={() => {
              setIsNavItemHovered(false)
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
