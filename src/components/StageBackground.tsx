import { motion } from 'framer-motion'
import { bladeStackConfig, getBladeColor, getStageBackgroundColor } from '../data/stages'

type ViewMode = 'hero' | 'stages'
type TransitionPhase = 'idle' | 'expanding' | 'complete' | 'collapsing'

interface StageBackgroundProps {
  viewMode: ViewMode
  transitionPhase: TransitionPhase
  activeStageIndex: number
  onNavigateToStage?: (stageIndex: number) => void
}

/**
 * Unified background that morphs between:
 * - Collapsed: A full-height card positioned to peek from the bottom (back blade position)
 * - Expanded: Fullscreen background for the active stage
 *
 * Each blade represents a stage:
 * - Blade 0 (front) → Stage 0 (MasterClass)
 * - Blade 1 → Stage 1 (Spotify)
 * - Blade 2 → Stage 2 (Nike)
 * - Blade 3 (back) → Stage 3 (Airbnb)
 *
 * This eliminates the "flash" problem by being a single element
 * that transitions between states, rather than two separate elements
 * trying to coordinate their visibility.
 */
export function StageBackground({ viewMode, transitionPhase, activeStageIndex, onNavigateToStage }: StageBackgroundProps) {
  const { borderRadius, horizontalPadding, frontBladePeek, stackOffset, widthStagger } = bladeStackConfig

  // Back blade is index 3 (furthest back, most narrow)
  const numBlades = 4
  const backBladePadding = horizontalPadding + (3 * widthStagger)
  // Back blade peeks: frontBladePeek + 3 * stackOffset
  const backBladePeekFromBottom = frontBladePeek + ((numBlades - 1) * stackOffset)

  const isExpanding = transitionPhase === 'expanding'
  const isCollapsing = transitionPhase === 'collapsing'

  // Determine target state for animation
  // Expand when transitioning to stages OR when in stages view
  // The blade animates UP to fullscreen while front blades slide down
  const isExpanded = viewMode === 'stages' || isExpanding

  // Get colors based on active stage
  // Back blade (index 3) is what expands, so use its color for both collapsed and expanded states
  // This ensures seamless color transition during blade expansion
  const bladeColor = getBladeColor(3) // Back blade always uses index 3 color when collapsed
  const stageColor = getBladeColor(3) // Use same color as blade for seamless transition

  // Keep blade color during expansion animation, only switch to stage color when fully expanded
  // This allows the blade to visually expand over the hero content
  const shouldShowStageColor = viewMode === 'stages' && transitionPhase !== 'collapsing'

  // Unified spring transition - Figma's elevated timing
  const backdropTransition = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 40,
    mass: 1,
  }

  // Animation variants - now using full-height card approach
  // Border radii are kept at borderRadius throughout expansion, only snapping to 0 at the very end
  const backdropVariants = {
    collapsed: {
      // Full-height card positioned to show only the peek portion
      bottom: `calc(-100vh + ${backBladePeekFromBottom}px)`,
      left: backBladePadding,
      right: backBladePadding,
      top: 'auto' as const,
      height: '100vh',
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    expanded: {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      height: 'auto' as const,
      // Keep border radius during animation, snap to 0 at transitionEnd
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      transitionEnd: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
    },
  }

  // Determine if the blade should be interactive (only when collapsed in hero view)
  const isCollapsed = !isExpanded
  const isInteractive = isCollapsed && !isExpanding && !isCollapsing

  return (
    <motion.div
      className={`fixed z-40 ${isInteractive ? 'cursor-pointer' : ''}`}
      style={{
        // Use blade color during expansion animation, stage color when fully expanded
        backgroundColor: shouldShowStageColor ? stageColor : bladeColor,
        // Only allow pointer events when collapsed (interactive blade)
        pointerEvents: isCollapsed ? 'auto' : 'none',
      }}
      initial={isCollapsing ? 'expanded' : 'collapsed'}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      variants={backdropVariants}
      transition={backdropTransition}
      onClick={() => isInteractive && onNavigateToStage?.(3)}
      whileHover={isInteractive ? { y: -6, scale: 1.001 } : undefined}
    />
  )
}
