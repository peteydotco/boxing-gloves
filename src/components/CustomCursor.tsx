import { motion, useTransform } from 'framer-motion'
import { useCursorMorph } from '../hooks/useCursorMorph'

const DARK_COLOR = 'rgba(0, 0, 0, 0.18)'
const LIGHT_COLOR = 'rgba(255, 255, 255, 0.5)'

// Max parallax displacement for inner icons (px)
const ICON_PARALLAX = 6

// Max joystick nub offset during drag (px)
const NUB_OFFSET = 10

export function CustomCursor() {
  const { x, y, rawX, rawY, width, height, borderRadius, opacity, isMorphed, isInverted, mode, isEnabled } = useCursorMorph()

  // When morphed, cursor disappears — the element itself becomes the feedback
  const cursorOpacity = useTransform(
    [opacity, isMorphed],
    ([o, m]: number[]) => (m > 0.5 ? 0 : o)
  )

  // iPadOS-style color inversion: dark cursor on light bg, light cursor on dark bg
  const background = useTransform(isInverted, (v) => v > 0.5 ? LIGHT_COLOR : DARK_COLOR)

  // Icon color: match inversion — dark on light bg, white on dark
  const iconColor = useTransform(isInverted, (v) => v > 0.5 ? 'rgba(0, 0, 0, 0.7)' : 'white')

  // Mode-specific visibility
  const playOpacity = useTransform(mode, (m) => m === 'play' || m === 'play-circle' ? 1 : 0)
  const playIconSize = useTransform(mode, (m) => m === 'play-circle' ? 22 : 32)
  const playMarginLeft = useTransform(mode, (m) => m === 'play-circle' ? 2 : 3)
  const grabOrDrag = useTransform(mode, (m) => m === 'grab' || m === 'drag' ? 1 : 0)

  // Parallax: derive from the lag between raw mouse and spring-animated position.
  const parallaxX = useTransform(
    [rawX, x],
    ([raw, spring]: number[]) => {
      const delta = raw - spring
      return Math.max(-ICON_PARALLAX, Math.min(ICON_PARALLAX, delta * 0.65))
    }
  )
  const parallaxY = useTransform(
    [rawY, y],
    ([raw, spring]: number[]) => {
      const delta = raw - spring
      return Math.max(-ICON_PARALLAX, Math.min(ICON_PARALLAX, delta * 0.65))
    }
  )

  // Joystick nub offset — shifts in drag direction, zero when not dragging
  const nubX = useTransform(
    [rawX, x, mode] as any,
    ([raw, spring, m]: [number, number, string]) => {
      if (m !== 'drag') return 0
      return Math.max(-NUB_OFFSET, Math.min(NUB_OFFSET, (raw - spring) * 0.75))
    }
  ) as any
  const nubY = useTransform(
    [rawY, y, mode] as any,
    ([raw, spring, m]: [number, number, string]) => {
      if (m !== 'drag') return 0
      return Math.max(-NUB_OFFSET, Math.min(NUB_OFFSET, (raw - spring) * 0.75))
    }
  ) as any

  // Nub appearance: stroke ring in grab, filled in drag (with inversion support)
  const nubFillFinal = useTransform(
    [mode, isInverted] as any,
    ([m, inv]: [string, number]) => {
      if (m !== 'drag') return 'transparent'
      return inv > 0.5 ? 'rgba(0,0,0,0.7)' : 'white'
    }
  ) as any
  const nubStrokeFinal = useTransform(
    [mode, isInverted] as any,
    ([m, inv]: [string, number]) => {
      if (m === 'drag') return 'transparent'
      return inv > 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)'
    }
  ) as any
  // Dynamic radius: larger outline ring on grab, smaller filled dot on drag
  const nubRadius = useTransform(mode, (m) => m === 'drag' ? 4 : 6) as any

  if (!isEnabled) return null

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x,
        y,
        width,
        height,
        borderRadius,
        opacity: cursorOpacity,
        translateX: '-50%',
        translateY: '-50%',
        background,
        pointerEvents: 'none',
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Play triangle — rounded corners, parallaxes with cursor movement */}
      <motion.svg
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          width: playIconSize,
          height: playIconSize,
          opacity: playOpacity,
          marginLeft: playMarginLeft,
          x: parallaxX,
          y: parallaxY,
        }}
      >
        <motion.path
          d="M7.5 5.3c-.7-.4-1.5.1-1.5.9v11.6c0 .8.8 1.3 1.5.9l10.5-5.8c.7-.4.7-1.4 0-1.8L7.5 5.3z"
          style={{ fill: iconColor }}
        />
      </motion.svg>

      {/* Joystick nub — stroke ring on grab, filled dot on drag.
          Offsets in drag direction like a thumbstick. */}
      <motion.svg
        viewBox="0 0 20 20"
        width={20}
        height={20}
        style={{
          position: 'absolute',
          opacity: grabOrDrag,
          x: nubX,
          y: nubY,
          overflow: 'visible',
        }}
      >
        <motion.circle
          cx={10}
          cy={10}
          r={nubRadius}
          strokeWidth={2}
          style={{ fill: nubFillFinal, stroke: nubStrokeFinal } as any}
        />
      </motion.svg>
    </motion.div>
  )
}
