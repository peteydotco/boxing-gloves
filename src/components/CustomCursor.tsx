import { motion, useTransform } from 'framer-motion'
import { useCursorMorph } from '../hooks/useCursorMorph'

export function CustomCursor() {
  const { x, y, width, height, borderRadius, opacity, isMorphed, isEnabled } = useCursorMorph()

  // When morphed, cursor disappears — the element itself becomes the feedback
  const cursorOpacity = useTransform(
    [opacity, isMorphed],
    ([o, m]: number[]) => (m > 0.5 ? 0 : o)
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
        background: 'rgba(0, 0, 0, 0.18)',
        pointerEvents: 'none',
        zIndex: 99998,
      }}
    />
  )
}
