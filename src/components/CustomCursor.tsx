import { motion, useTransform } from 'framer-motion'
import { useCursorMorph } from '../hooks/useCursorMorph'

const DARK_COLOR = 'rgba(0, 0, 0, 0.18)'
const LIGHT_COLOR = 'rgba(255, 255, 255, 0.5)'

// Max parallax displacement for the play icon (px)
const PLAY_PARALLAX = 3

export function CustomCursor() {
  const { x, y, rawX, rawY, width, height, borderRadius, opacity, isMorphed, isInverted, mode, isEnabled } = useCursorMorph()

  // When morphed, cursor disappears — the element itself becomes the feedback
  const cursorOpacity = useTransform(
    [opacity, isMorphed],
    ([o, m]: number[]) => (m > 0.5 ? 0 : o)
  )

  // iPadOS-style color inversion: dark cursor on light bg, light cursor on dark bg
  const background = useTransform(isInverted, (v) => v > 0.5 ? LIGHT_COLOR : DARK_COLOR)

  // Play icon: match inversion — dark triangle on light bg, white on dark
  const playColor = useTransform(isInverted, (v) => v > 0.5 ? 'rgba(0, 0, 0, 0.7)' : 'white')

  // Play icon visibility — 1 when in play mode, 0 otherwise
  const playOpacity = useTransform(mode, (m) => m === 'play' ? 1 : 0)

  // Parallax: derive from the lag between raw mouse and spring-animated position.
  // The spring position lags behind rawX/rawY, so (raw - spring) gives the displacement
  // vector. We amplify it slightly and clamp for a subtle "icon floats" effect.
  const playParallaxX = useTransform(
    [rawX, x],
    ([raw, spring]: number[]) => {
      const delta = raw - spring
      return Math.max(-PLAY_PARALLAX, Math.min(PLAY_PARALLAX, delta * 0.5))
    }
  )
  const playParallaxY = useTransform(
    [rawY, y],
    ([raw, spring]: number[]) => {
      const delta = raw - spring
      return Math.max(-PLAY_PARALLAX, Math.min(PLAY_PARALLAX, delta * 0.5))
    }
  )

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
        width={32}
        height={32}
        style={{
          opacity: playOpacity,
          marginLeft: 3,
          x: playParallaxX,
          y: playParallaxY,
        }}
      >
        <motion.path
          d="M7.5 5.3c-.7-.4-1.5.1-1.5.9v11.6c0 .8.8 1.3 1.5.9l10.5-5.8c.7-.4.7-1.4 0-1.8L7.5 5.3z"
          style={{ fill: playColor }}
        />
      </motion.svg>
    </motion.div>
  )
}
