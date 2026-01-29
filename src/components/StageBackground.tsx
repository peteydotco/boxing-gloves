import { useState } from 'react'
import { motion } from 'framer-motion'
import { bladeStackConfig, getBladeColor } from '../data/stages'

type ViewMode = 'hero' | 'stages'
type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'

interface StageBackgroundProps {
  viewMode: ViewMode
  transitionPhase: TransitionPhase
  activeStageIndex: number
  onNavigateToStage?: (stageIndex: number) => void
  onHoverChange?: (isHovered: boolean) => void
  isNavHovered?: boolean
}

/**
 * Unified background that morphs between:
 * - Collapsed: A full-height card positioned to peek from the bottom (front blade position)
 * - Expanded: Fullscreen background for the active stage
 *
 * The front blade (index 0) is now MasterClass which expands to Section 1.
 * This blade is closest to the viewer and widest in the collapsed stack.
 *
 * This eliminates the "flash" problem by being a single element
 * that transitions between states, rather than two separate elements
 * trying to coordinate their visibility.
 */
export function StageBackground({ viewMode, transitionPhase, activeStageIndex: _activeStageIndex, onNavigateToStage, onHoverChange, isNavHovered = false }: StageBackgroundProps) {
  const { borderRadius, horizontalPadding, frontBladePeek } = bladeStackConfig

  // Front blade is index 0 (closest to viewer, widest)
  const frontBladePadding = horizontalPadding
  // Front blade peeks at frontBladePeek from the bottom
  const frontBladePeekFromBottom = frontBladePeek

  const isExpanding = transitionPhase === 'expanding'
  const isCollapsing = transitionPhase === 'collapsing'

  // Determine target state for animation
  // Expand when transitioning to stages OR when in stages view
  // The blade animates UP to fullscreen while front blades slide down
  const isExpanded = viewMode === 'stages' || isExpanding

  // Get color for front blade (index 0 / MasterClass)
  // Uses same color for both collapsed and expanded states for seamless transition
  const bladeColor = getBladeColor(0)

  // Blade 0 transition timing depends on direction:
  // - Expanding: snappy spring with 40ms delay for parallax cascade
  // - Collapsing: smooth ease-out for precise, bounce-free settling
  const backdropTransition = isExpanding
    ? {
        type: 'spring' as const,
        stiffness: 300,
        damping: 35,
        mass: 1,
        delay: 0.04,
      }
    : {
        type: 'tween' as const,
        duration: 0.5,
        ease: [0.32, 0.72, 0, 1] as const, // Custom ease-out curve
        delay: 0,
      }

  // Hover offset for blade
  const hoverOffset = 3

  // Animation variants - using consistent 100vh height to avoid layout jumps
  // The blade is always 100vh tall, only its position changes
  // Border radii animate smoothly from 24px to 0 during expansion
  const backdropVariants = {
    collapsed: {
      // Full-height card positioned to show only the peek portion
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
      // Same as collapsed but with hover offset
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
      // Fullscreen - covers entire viewport
      bottom: 0,
      left: 0,
      right: 0,
      top: 'auto' as const,
      height: '100vh',
      // Animate border radius smoothly to 0 (no snap)
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      y: 0,
      scale: 1,
    },
  }

  // Determine if the blade should be interactive (only when collapsed in hero view)
  const isCollapsed = !isExpanded
  const isInteractive = isCollapsed && !isExpanding && !isCollapsing

  // Track if blade itself is being directly hovered (not via nav items)
  // This is separate from isNavHovered which tracks when nav items are hovered
  const [isBladeDirectlyHovered, setIsBladeDirectlyHovered] = useState(false)

  // Determine which variant to animate to
  // Use collapsedHovered when:
  // - Nav items are hovered (isNavHovered from parent)
  // - Blade itself is directly hovered (isBladeDirectlyHovered local state)
  const getAnimateVariant = () => {
    if (isExpanded) return 'expanded'
    if (isNavHovered || isBladeDirectlyHovered) return 'collapsedHovered'
    return 'collapsed'
  }

  return (
    <motion.div
      className={`fixed ${isInteractive ? 'cursor-pointer' : ''}`}
      style={{
        // Front blade needs higher z-index than back blades (z-40 container)
        zIndex: 45,
        backgroundColor: bladeColor,
        // Only allow pointer events when collapsed (interactive blade)
        pointerEvents: isCollapsed ? 'auto' : 'none',
      }}
      initial={isCollapsing ? 'expanded' : 'collapsed'}
      animate={getAnimateVariant()}
      variants={backdropVariants}
      transition={backdropTransition}
      onClick={() => isInteractive && onNavigateToStage?.(0)}
      onHoverStart={() => {
        if (isInteractive) {
          setIsBladeDirectlyHovered(true)
          onHoverChange?.(true)
        }
      }}
      onHoverEnd={() => {
        setIsBladeDirectlyHovered(false)
        onHoverChange?.(false)
      }}
    />
  )
}
