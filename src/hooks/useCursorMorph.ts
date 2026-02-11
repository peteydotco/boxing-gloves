import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, type MotionValue } from 'framer-motion'
import { cursorFollowSpring, cursorMorphSpring, POINTER_LIFT } from '../constants/animation'

const DEFAULT_SIZE = 22
const GROW_SIZE = 48
const MORPH_PADDING = 4
const IFRAME_TIMEOUT = 150

// I-beam text cursor dimensions (iPadOS-style)
const TEXT_BEAM_WIDTH = 4
const TEXT_BEAM_HEIGHT = 26
const TEXT_BEAM_RADIUS = 2

// Play cursor dimensions — rectangular like the YouTube play button
const PLAY_WIDTH = 78
const PLAY_HEIGHT = 54
const PLAY_RADIUS = 16

// Magnetic pull: element shifts toward cursor by this fraction of the offset
const MAGNETIC_STRENGTH = 0.08
// Max pixels the element can be displaced
const MAGNETIC_MAX = 3

export type CursorMode = 'default' | 'morph' | 'morph-only' | 'grow' | 'text' | 'play'

export interface CursorMorphValues {
  x: MotionValue<number>
  y: MotionValue<number>
  rawX: MotionValue<number>
  rawY: MotionValue<number>
  width: MotionValue<number>
  height: MotionValue<number>
  borderRadius: MotionValue<number>
  opacity: MotionValue<number>
  isMorphed: MotionValue<number>
  isInverted: MotionValue<number>
  mode: MotionValue<string>
  isEnabled: boolean
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Detect if the cursor is over selectable text using the browser's native
 * caret positioning API. Returns the text line-height in px, or 0 if not over text.
 */
function getTextBeamHeight(clientX: number, clientY: number, target: Element): number {
  try {
    let caretNode: Node | null = null
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(clientX, clientY)
      caretNode = range?.startContainer ?? null
    } else if ((document as unknown as { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null }).caretPositionFromPoint) {
      const pos = (document as unknown as { caretPositionFromPoint: (x: number, y: number) => { offsetNode: Node } | null }).caretPositionFromPoint(clientX, clientY)
      caretNode = pos?.offsetNode ?? null
    }

    if (!caretNode || caretNode.nodeType !== Node.TEXT_NODE) return 0
    if (!target.contains(caretNode)) return 0

    const text = caretNode.textContent
    if (!text || !text.trim()) return 0

    // caretRangeFromPoint projects to the nearest text even when the cursor
    // is far away. Verify the cursor is actually within the text's line box.
    const textEl = caretNode.parentElement
    if (!textEl) return 0
    const rect = textEl.getBoundingClientRect()
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return 0

    // Exclude text inside interactive elements — those use morph/grow, not i-beam
    if (target.closest('button, a, [role="button"], summary')) return 0

    // Return the computed line-height (or font-size as fallback) to size the beam
    const style = getComputedStyle(textEl)
    const lh = parseFloat(style.lineHeight)
    if (lh && lh > 0) return lh
    // "normal" line-height — approximate as 1.2 × font-size
    const fs = parseFloat(style.fontSize)
    return fs ? fs * 1.2 : TEXT_BEAM_HEIGHT
  } catch {
    return 0
  }
}

// Track leave-animation timers per element to handle re-entrance
const liftTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

export function useCursorMorph(): CursorMorphValues {
  const enabled = typeof window !== 'undefined' && !isTouchDevice()

  // Raw mouse position (unsprung)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // Spring-driven cursor position
  const x = useSpring(rawX, cursorFollowSpring)
  const y = useSpring(rawY, cursorFollowSpring)

  // Spring-driven size and shape
  const width = useSpring(DEFAULT_SIZE, cursorMorphSpring)
  const height = useSpring(DEFAULT_SIZE, cursorMorphSpring)
  const borderRadius = useSpring(DEFAULT_SIZE / 2, cursorMorphSpring)
  const opacity = useSpring(0, { stiffness: 300, damping: 30 })

  // 0 = not morphed (cursor visible as circle), 1 = morphed (cursor visible as spotlight)
  const isMorphed = useMotionValue(0)

  // Current cursor mode — exposed so CustomCursor can render mode-specific content
  const mode = useMotionValue<string>('default')

  // 0 = dark cursor (light bg), 1 = light cursor (dark bg)
  const isInverted = useMotionValue(0)

  // Track morph state without re-renders
  const morphTargetRef = useRef<HTMLElement | null>(null)
  const modeRef = useRef<CursorMode>('default')
  const updateMode = (m: CursorMode) => { modeRef.current = m; mode.set(m) }
  const rafRef = useRef<number>(0)
  const iframeFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track the last mouse position for magnetic displacement calc in rAF
  const lastMouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled) return

    // Inject <style> to hide native cursor — sits outside Tailwind's @layer
    const style = document.createElement('style')
    style.setAttribute('data-custom-cursor', '')
    style.textContent = '*, *::before, *::after { cursor: none !important; }'
    document.head.appendChild(style)

    // Strip inline cursor styles that components set via JS
    const handleMouseOver = (e: MouseEvent) => {
      let el = e.target as HTMLElement | null
      while (el) {
        if (el.style?.cursor) el.style.removeProperty('cursor')
        el = el.parentElement
      }
    }
    document.addEventListener('mouseover', handleMouseOver, true)

    // ── Magnetic displacement helpers ──

    // Apply magnetic pull + lift scale: shift element toward cursor
    const applyMagnetic = (el: HTMLElement, mouseX: number, mouseY: number) => {
      // Get element center WITHOUT any existing transform displacement
      const existingTransform = el.style.transform
      el.style.transform = ''
      const naturalRect = el.getBoundingClientRect()
      el.style.transform = existingTransform

      const centerX = naturalRect.left + naturalRect.width / 2
      const centerY = naturalRect.top + naturalRect.height / 2

      // Vector from element center to cursor
      const dx = mouseX - centerX
      const dy = mouseY - centerY

      // Apply fraction as displacement, clamped
      const tx = clamp(dx * MAGNETIC_STRENGTH, -MAGNETIC_MAX, MAGNETIC_MAX)
      const ty = clamp(dy * MAGNETIC_STRENGTH, -MAGNETIC_MAX, MAGNETIC_MAX)

      el.style.transform = `translate(${tx}px, ${ty}px) scale(${POINTER_LIFT.liftScale})`
      el.style.transition = 'none' // Immediate tracking while hovering
    }

    // Release: spring element back to natural position and scale
    const releaseMagnetic = (el: HTMLElement) => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
      el.style.transform = ''
    }

    // ── Parallax via CSS custom properties ──

    const setParallax = (el: HTMLElement, mouseX: number, mouseY: number) => {
      const rect = el.getBoundingClientRect()
      const relX = clamp((mouseX - rect.left) / rect.width, 0, 1)
      const relY = clamp((mouseY - rect.top) / rect.height, 0, 1)

      const px = (relX - 0.5) * 2 * POINTER_LIFT.parallaxMax
      const py = (relY - 0.5) * 2 * POINTER_LIFT.parallaxMax
      el.style.setProperty('--parallax-x', `${px.toFixed(2)}px`)
      el.style.setProperty('--parallax-y', `${py.toFixed(2)}px`)
    }

    // Soft magnetic via CSS custom properties — safe for Framer Motion elements
    // Uses the CSS `translate` property (separate from `transform`) so it doesn't
    // clobber Framer Motion's managed transform (scale, rotate, etc.)
    const setSoftMagnetic = (el: HTMLElement, mouseX: number, mouseY: number) => {
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const dx = mouseX - centerX
      const dy = mouseY - centerY
      const tx = clamp(dx * MAGNETIC_STRENGTH, -MAGNETIC_MAX, MAGNETIC_MAX)
      const ty = clamp(dy * MAGNETIC_STRENGTH, -MAGNETIC_MAX, MAGNETIC_MAX)
      el.style.setProperty('--magnetic-x', `${tx.toFixed(2)}px`)
      el.style.setProperty('--magnetic-y', `${ty.toFixed(2)}px`)
    }

    const clearLiftProps = (el: HTMLElement) => {
      // Cancel any pending leave timer for this element
      const existingTimer = liftTimers.get(el)
      if (existingTimer) {
        clearTimeout(existingTimer)
        liftTimers.delete(el)
      }

      // Reset parallax and magnetic to center
      el.style.setProperty('--parallax-x', '0px')
      el.style.setProperty('--parallax-y', '0px')
      el.style.setProperty('--magnetic-x', '0px')
      el.style.setProperty('--magnetic-y', '0px')

      // After transition, clean up attributes and properties
      const timer = setTimeout(() => {
        el.removeAttribute('data-cursor-morphed')
        el.style.removeProperty('--parallax-x')
        el.style.removeProperty('--parallax-y')
        el.style.removeProperty('--magnetic-x')
        el.style.removeProperty('--magnetic-y')
        liftTimers.delete(el)
      }, 300)

      liftTimers.set(el, timer)
    }

    const setDefault = (clientX: number, clientY: number) => {
      // Release any previously morphed element
      if (morphTargetRef.current) {
        clearLiftProps(morphTargetRef.current)
        if (modeRef.current === 'morph') releaseMagnetic(morphTargetRef.current)
      }
      morphTargetRef.current = null
      updateMode('default')
      isMorphed.set(0)
      rawX.set(clientX)
      rawY.set(clientY)
      width.set(DEFAULT_SIZE)
      height.set(DEFAULT_SIZE)
      borderRadius.set(DEFAULT_SIZE / 2)
    }

    const setMorph = (el: HTMLElement, mouseX: number, mouseY: number) => {
      // Release previous target if switching elements
      if (morphTargetRef.current && morphTargetRef.current !== el) {
        clearLiftProps(morphTargetRef.current)
        if (modeRef.current === 'morph') releaseMagnetic(morphTargetRef.current)
      }

      // Cancel any pending leave timer on this element (re-entrance)
      const existingTimer = liftTimers.get(el)
      if (existingTimer) {
        clearTimeout(existingTimer)
        liftTimers.delete(el)
      }

      morphTargetRef.current = el
      updateMode('morph')
      isMorphed.set(1)

      // Activate lift effect on element
      el.setAttribute('data-cursor-morphed', '')

      // Apply magnetic pull + lift scale to the element
      applyMagnetic(el, mouseX, mouseY)

      // Set parallax
      setParallax(el, mouseX, mouseY)

      // Read displaced rect (after transform) for cursor positioning
      const rect = el.getBoundingClientRect()

      // Resolve target border-radius
      const rawRadius = el.dataset.cursorRadius
        || getComputedStyle(el).borderRadius
        || '0'
      const targetRadius = parseFloat(rawRadius) || 0

      // Cursor snaps to the displaced element center
      rawX.set(rect.left + rect.width / 2)
      rawY.set(rect.top + rect.height / 2)

      // Become the element shape + small padding
      width.set(rect.width + MORPH_PADDING * 2)
      height.set(rect.height + MORPH_PADDING * 2)
      borderRadius.set(targetRadius + MORPH_PADDING)
    }

    // Shape-only morph: cursor snaps to element shape + parallax on children,
    // but NO magnetic displacement or lift scale on the element itself.
    // Safe for Framer Motion–animated elements whose transforms we must not touch.
    const setMorphOnly = (el: HTMLElement, mouseX: number, mouseY: number) => {
      // Release previous target if switching elements
      if (morphTargetRef.current && morphTargetRef.current !== el) {
        clearLiftProps(morphTargetRef.current)
        if (modeRef.current === 'morph') releaseMagnetic(morphTargetRef.current)
      }

      // Cancel any pending leave timer on this element (re-entrance)
      const existingTimer = liftTimers.get(el)
      if (existingTimer) {
        clearTimeout(existingTimer)
        liftTimers.delete(el)
      }

      morphTargetRef.current = el
      updateMode('morph-only')
      isMorphed.set(1)

      // Activate parallax + soft magnetic on element (no direct transform — just CSS props)
      el.setAttribute('data-cursor-morphed', '')

      // Set parallax (shifts children) and soft magnetic (shifts element via CSS translate)
      setParallax(el, mouseX, mouseY)
      setSoftMagnetic(el, mouseX, mouseY)

      // Read natural rect (no displacement) for cursor positioning
      const rect = el.getBoundingClientRect()

      // Resolve target border-radius
      const rawRadius = el.dataset.cursorRadius
        || getComputedStyle(el).borderRadius
        || '0'
      const targetRadius = parseFloat(rawRadius) || 0

      // Cursor snaps to element center
      rawX.set(rect.left + rect.width / 2)
      rawY.set(rect.top + rect.height / 2)

      // Become the element shape + small padding
      width.set(rect.width + MORPH_PADDING * 2)
      height.set(rect.height + MORPH_PADDING * 2)
      borderRadius.set(targetRadius + MORPH_PADDING)
    }

    const setGrow = (clientX: number, clientY: number) => {
      if (morphTargetRef.current) {
        clearLiftProps(morphTargetRef.current)
        if (modeRef.current === 'morph') releaseMagnetic(morphTargetRef.current)
      }
      morphTargetRef.current = null
      updateMode('grow')
      isMorphed.set(0)
      rawX.set(clientX)
      rawY.set(clientY)
      width.set(GROW_SIZE)
      height.set(GROW_SIZE)
      borderRadius.set(GROW_SIZE / 2)
    }

    const setPlay = (clientX: number, clientY: number) => {
      if (morphTargetRef.current) {
        clearLiftProps(morphTargetRef.current)
        if (modeRef.current === 'morph') releaseMagnetic(morphTargetRef.current)
      }
      morphTargetRef.current = null
      updateMode('play')
      isMorphed.set(0)
      rawX.set(clientX)
      rawY.set(clientY)
      width.set(PLAY_WIDTH)
      height.set(PLAY_HEIGHT)
      borderRadius.set(PLAY_RADIUS)
    }

    const setTextBeam = (clientX: number, clientY: number, beamH: number) => {
      if (morphTargetRef.current) {
        clearLiftProps(morphTargetRef.current)
        if (modeRef.current === 'morph') releaseMagnetic(morphTargetRef.current)
      }
      morphTargetRef.current = null
      updateMode('text')
      isMorphed.set(0)
      rawX.set(clientX)
      rawY.set(clientY)
      width.set(TEXT_BEAM_WIDTH)
      height.set(beamH)
      borderRadius.set(TEXT_BEAM_RADIUS)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (iframeFadeTimerRef.current) {
        clearTimeout(iframeFadeTimerRef.current)
        iframeFadeTimerRef.current = null
      }
      opacity.set(1)
      lastMouseRef.current = { x: e.clientX, y: e.clientY }

      const target = document.elementFromPoint(e.clientX, e.clientY)

      // Detect dark-background sections for cursor color inversion
      isInverted.set(target?.closest('[data-cursor-invert]') ? 1 : 0)

      // Check for morph target first (magnetic snap)
      const morphEl = target?.closest('[data-cursor="morph"]') as HTMLElement | null
      if (morphEl) {
        setMorph(morphEl, e.clientX, e.clientY)
        return
      }

      // Check for shape-only morph (cursor snaps to shape, no magnetic/lift on element)
      const morphOnlyEl = target?.closest('[data-cursor="morph-only"]') as HTMLElement | null
      if (morphOnlyEl) {
        setMorphOnly(morphOnlyEl, e.clientX, e.clientY)
        return
      }

      // Check for play target (cursor becomes play button)
      const playEl = target?.closest('[data-cursor="play"]') as HTMLElement | null
      if (playEl) {
        setPlay(e.clientX, e.clientY)
        return
      }

      // Check for grow target (just enlarge circle)
      const growEl = target?.closest('[data-cursor="grow"]') as HTMLElement | null
      if (growEl) {
        setGrow(e.clientX, e.clientY)
      } else if (target) {
        const beamH = getTextBeamHeight(e.clientX, e.clientY, target)
        if (beamH > 0) {
          setTextBeam(e.clientX, e.clientY, beamH)
        } else {
          setDefault(e.clientX, e.clientY)
        }
      } else {
        setDefault(e.clientX, e.clientY)
      }

      // Iframe fade
      if (target?.tagName === 'IFRAME') {
        iframeFadeTimerRef.current = setTimeout(() => {
          opacity.set(0)
        }, IFRAME_TIMEOUT)
      }
    }

    const handleMouseEnter = () => { opacity.set(1) }
    const handleMouseLeave = () => {
      opacity.set(0)
      if (morphTargetRef.current) {
        clearLiftProps(morphTargetRef.current)
        if (modeRef.current === 'morph') releaseMagnetic(morphTargetRef.current)
      }
      morphTargetRef.current = null
      updateMode('default')
      isMorphed.set(0)
    }

    // rAF loop: while morphed, re-read target rect to track scroll + magnetic + parallax
    const tick = () => {
      const mode = modeRef.current
      if (morphTargetRef.current && (mode === 'morph' || mode === 'morph-only')) {
        const el = morphTargetRef.current
        const selector = mode === 'morph' ? '[data-cursor="morph"]' : '[data-cursor="morph-only"]'
        if (!el.isConnected || !el.closest(selector)) {
          clearLiftProps(el)
          if (mode === 'morph') releaseMagnetic(el)
          morphTargetRef.current = null
          updateMode('default')
          isMorphed.set(0)
        } else {
          if (mode === 'morph') {
            // Full morph: re-apply magnetic + lift and read displaced rect
            applyMagnetic(el, lastMouseRef.current.x, lastMouseRef.current.y)
          }
          // Read rect (displaced for morph, natural for morph-only)
          const rect = el.getBoundingClientRect()
          rawX.set(rect.left + rect.width / 2)
          rawY.set(rect.top + rect.height / 2)
          width.set(rect.width + MORPH_PADDING * 2)
          height.set(rect.height + MORPH_PADDING * 2)

          // Update parallax + soft magnetic for morph-only
          setParallax(el, lastMouseRef.current.x, lastMouseRef.current.y)
          if (mode === 'morph-only') {
            setSoftMagnetic(el, lastMouseRef.current.x, lastMouseRef.current.y)
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    document.addEventListener('mousemove', handleMouseMove)
    document.documentElement.addEventListener('mouseenter', handleMouseEnter)
    document.documentElement.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      style.remove()
      // Release any morphed element on cleanup
      if (morphTargetRef.current) {
        clearLiftProps(morphTargetRef.current)
        if (modeRef.current === 'morph') releaseMagnetic(morphTargetRef.current)
      }
      document.removeEventListener('mouseover', handleMouseOver, true)
      document.removeEventListener('mousemove', handleMouseMove)
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter)
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(rafRef.current)
      if (iframeFadeTimerRef.current) clearTimeout(iframeFadeTimerRef.current)
    }
  }, [enabled, rawX, rawY, width, height, borderRadius, opacity, isMorphed, isInverted, mode, x, y])

  return { x, y, rawX, rawY, width, height, borderRadius, opacity, isMorphed, isInverted, mode, isEnabled: enabled }
}
