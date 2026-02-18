import { useRef, useEffect, useCallback } from 'react'

/**
 * Full-bleed transparent canvas overlay for spray-paint drawing.
 * Sits absolutely over its parent container (the spray-paint zone wrapper).
 *
 * - Desktop only: hidden on touch devices (custom cursor system self-disables).
 * - z-index 10 keeps it ABOVE all section content (text, buttons, footer).
 *   This ensures paint strokes are never interrupted by hover states or
 *   pointer-events on content below.
 * - Single clicks (mousedown → mouseup with no/minimal movement) are
 *   forwarded to the element underneath via elementFromPoint + click().
 * - `data-cursor="spray"` triggers the spray cursor mode in useCursorMorph.
 * - ResizeObserver keeps the canvas pixel-dimensions in sync with the container.
 */

const STROKE_COLOR = 'black'
const SHADOW_COLOR = 'black'
const SHADOW_BLUR = 10
const LINE_WIDTH = 25

/** Pixel threshold — moves below this count as a "click", not a drag */
const CLICK_THRESHOLD = 4

// ── Spatter / overspray settings ──
/** Number of spatter dots per mousemove event */
const SPATTER_COUNT = 8
/** Max distance (px) spatter dots can appear from the cursor center */
const SPATTER_RADIUS = 50
/** Min distance — keeps dots outside the core stroke */
const SPATTER_MIN_RADIUS = 18
/** Max dot radius (px) — tiny for subtle dust */
const SPATTER_DOT_MAX = 1.5
/** Min dot radius (px) */
const SPATTER_DOT_MIN = 0.3

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches
}

export function SprayPaintCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const isTouch = typeof window !== 'undefined' && isTouchDevice()

  // Track mousedown position to distinguish click from drag
  const downPos = useRef<{ x: number; y: number } | null>(null)
  const hasDragged = useRef(false)

  // Configure context for spray-paint style strokes
  const configureCtx = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = STROKE_COLOR
    ctx.shadowColor = SHADOW_COLOR
    ctx.shadowBlur = SHADOW_BLUR
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.lineWidth = LINE_WIDTH
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
  }, [])

  // ── Resize canvas to match parent container ──
  useEffect(() => {
    if (isTouch) return
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      // Preserve existing drawing when resizing
      const ctx = canvas.getContext('2d')
      let imageData: ImageData | null = null
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      }

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      if (ctx) {
        ctx.scale(dpr, dpr)
        // Restore previous drawing
        if (imageData) {
          ctx.putImageData(imageData, 0, 0)
        }
        configureCtx(ctx)
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    return () => ro.disconnect()
  }, [isTouch, configureCtx])

  // ── Helpers to suppress content pointer-events while painting ──
  // When the mouse is held down and dragging, we set data-spray-active on the
  // wrapper so that content above the canvas (buttons, footer links) can't
  // intercept the stroke or trigger hover states.
  const setSpraying = useCallback((active: boolean) => {
    const wrapper = canvasRef.current?.parentElement
    if (!wrapper) return
    if (active) {
      wrapper.setAttribute('data-spray-active', '')
    } else {
      wrapper.removeAttribute('data-spray-active')
    }
  }, [])

  // ── Drawing handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    isDrawing.current = true
    hasDragged.current = false
    downPos.current = { x: e.clientX, y: e.clientY }

    configureCtx(ctx)
    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
  }, [configureCtx])

  // Scatter subtle spatter dots around a point — called during drawing.
  // IMPORTANT: does NOT use ctx.save/restore or ctx.beginPath — those would
  // break the continuous stroke path. Instead, manually toggles shadow props
  // and restores them after drawing spatter.
  const drawSpatter = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    // Temporarily disable shadow for spatter (would make dots too heavy)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    for (let i = 0; i < SPATTER_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      // Bias distance toward outer edge — squared falloff
      const t = Math.random()
      const dist = SPATTER_MIN_RADIUS + (SPATTER_RADIUS - SPATTER_MIN_RADIUS) * t * t
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist

      const dotR = SPATTER_DOT_MIN + Math.random() * (SPATTER_DOT_MAX - SPATTER_DOT_MIN)
      // Opacity falls off with distance — very subtle
      const opacity = 0.08 + (1 - t) * 0.22

      // Use fillRect for tiny dots (faster than arc for sub-2px)
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
      ctx.fillRect(x - dotR, y - dotR, dotR * 2, dotR * 2)
    }

    // Restore shadow for the main stroke
    ctx.shadowColor = SHADOW_COLOR
    ctx.shadowBlur = SHADOW_BLUR
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Check if we've moved enough to count as a drag
    if (!hasDragged.current && downPos.current) {
      const dx = e.clientX - downPos.current.x
      const dy = e.clientY - downPos.current.y
      if (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD) {
        hasDragged.current = true
        // Suppress content pointer-events so buttons/links can't steal the stroke
        setSpraying(true)
      }
    }

    const ox = e.nativeEvent.offsetX
    const oy = e.nativeEvent.offsetY

    // Core stroke — continuous path from beginPath in mouseDown
    ctx.lineTo(ox, oy)
    ctx.stroke()

    // Overspray spatter — subtle dust particles beyond the core radius
    drawSpatter(ctx, ox, oy)
  }, [drawSpatter, setSpraying])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = false
    setSpraying(false)

    // If the user didn't drag, forward the click to the element underneath
    if (!hasDragged.current && canvasRef.current) {
      const canvas = canvasRef.current

      // Also clear the tiny dot that beginPath + moveTo may have left
      // (no lineTo was called, so nothing visible — but clear path state)
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.beginPath()

      // Temporarily hide canvas from hit-testing to find element below
      canvas.style.pointerEvents = 'none'
      const below = document.elementFromPoint(e.clientX, e.clientY)
      canvas.style.pointerEvents = 'auto'

      if (below && below !== canvas) {
        // Dispatch a full click to the element (handles buttons, links, etc.)
        below.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
          view: window,
        }))
      }
    }

    downPos.current = null
    hasDragged.current = false
  }, [setSpraying])

  // Also stop drawing if mouse leaves the canvas while button is held
  const handleMouseLeave = useCallback(() => {
    isDrawing.current = false
    setSpraying(false)
    downPos.current = null
    hasDragged.current = false
  }, [setSpraying])

  // Don't render on touch devices
  if (isTouch) return null

  return (
    <canvas
      ref={canvasRef}
      data-cursor="spray"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        // Transparent background — paint strokes only
        background: 'transparent',
      }}
    />
  )
}
