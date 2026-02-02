import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

/**
 * VariableTypeBg — Interactive variable-font background for stages.
 *
 * Displays a specimen string (default "Petey!") using the Saira variable font.
 * Features:
 * - Autoplay: Sine-wave weight cycling (100-900) when idle
 * - Weight scrubbing: Horizontal drag on text changes font weight
 * - Width scrubbing: Vertical drag changes horizontal scale
 * - Auto-resumes autoplay after 2s of inactivity
 *
 * Ported from the Lovable "variable-type-test" project.
 */

interface VariableTypeBgProps {
  /** Text to display */
  specimen?: string
  /** Base font size in px */
  fontSize?: number
  /** Text color */
  color?: string
  /** Animation duration in seconds (full sine cycle) */
  duration?: number
  /** Min weight (Saira supports 100-900) */
  minWeight?: number
  /** Max weight (Saira supports 100-900) */
  maxWeight?: number
  /** Initial horizontal scale factor (scaleX) for width variation */
  initialScaleX?: number
  /** Initial letter spacing in em */
  initialLetterSpacing?: number
  /** Whether the component is active (controls autoplay) */
  playing?: boolean
}

export function VariableTypeBg({
  specimen = 'Petey!',
  fontSize: initialFontSize = 200,
  color = 'rgba(255, 255, 255, 0.08)',
  duration = 4,
  minWeight = 100,
  maxWeight = 900,
  initialScaleX = 0.94,
  initialLetterSpacing = -0.07,
  playing = true,
}: VariableTypeBgProps) {
  // --- State ---
  const [fontWeight, setFontWeight] = useState(400)
  const [scaleX, setScaleX] = useState(initialScaleX)
  const [letterSpacing] = useState(initialLetterSpacing)
  const [isDragging] = useState(false)
  const [isWeightScrubbing, setIsWeightScrubbing] = useState(false)

  // --- User interaction detection (pauses autoplay) ---
  const [isUserActive, setIsUserActive] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialization delay — prevent page-load interactions from pausing autoplay
  useEffect(() => {
    initTimeoutRef.current = setTimeout(() => {
      setIsInitialized(true)
    }, 1000)
    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current)
    }
  }, [])

  const markUserActive = useCallback(() => {
    if (!isInitialized) return
    setIsUserActive(true)
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current)
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsUserActive(false)
    }, 2000)
  }, [isInitialized])

  // --- Autoplay (sine wave weight cycling) ---
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const shouldPause = isUserActive || isDragging || isWeightScrubbing || !isInitialized

  const calculateWeight = useCallback(
    (progress: number): number => {
      const range = maxWeight - minWeight
      const normalizedProgress = (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2
      return minWeight + range * normalizedProgress
    },
    [minWeight, maxWeight],
  )

  useEffect(() => {
    if (!playing || shouldPause) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const durationMs = duration * 1000

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }
      const elapsed = timestamp - startTimeRef.current
      const progress = (elapsed % durationMs) / durationMs
      setFontWeight(calculateWeight(progress))
      animationRef.current = requestAnimationFrame(animate)
    }

    startTimeRef.current = null
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [playing, shouldPause, duration, calculateWeight])

  // --- Weight / width scrubbing (drag on text) ---
  const handleTextMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      markUserActive()
      setIsWeightScrubbing(true)

      const startX = e.clientX
      const startY = e.clientY
      const startWeight = fontWeight
      const startScaleX = scaleX

      const handleMouseMove = (ev: MouseEvent) => {
        const deltaX = ev.clientX - startX
        const deltaY = ev.clientY - startY
        // Horizontal → weight (2x multiplier)
        const newWeight = Math.max(minWeight, Math.min(maxWeight, startWeight + deltaX * 2))
        setFontWeight(newWeight)
        // Vertical → width via scaleX
        const newScaleX = Math.max(0.5, Math.min(1.5, startScaleX - deltaY * 0.002))
        setScaleX(newScaleX)
      }

      const handleMouseUp = () => {
        setIsWeightScrubbing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [fontWeight, scaleX, minWeight, maxWeight, markUserActive],
  )

  // --- Font style memo ---
  const fontStyle = useMemo(
    () => ({
      fontFamily: "'Saira', sans-serif",
      fontSize: `${initialFontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}em`,
      lineHeight: 1.0,
      textAlign: 'center' as const,
      whiteSpace: 'nowrap' as const,
      color,
      transform: `scaleX(${scaleX})`,
      transformOrigin: 'center center',
      userSelect: 'none' as const,
      cursor: 'ew-resize',
      transition: isWeightScrubbing || isDragging ? 'none' : 'all 0.2s ease-out',
    }),
    [initialFontSize, fontWeight, letterSpacing, color, scaleX, isWeightScrubbing, isDragging],
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={fontStyle}
        onMouseDown={handleTextMouseDown}
      >
        {specimen}
      </div>
    </div>
  )
}
