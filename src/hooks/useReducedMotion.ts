import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * React hook — subscribes to prefers-reduced-motion changes.
 * Returns `true` when the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return reduced
}

/**
 * Non-hook version for imperative contexts (GSAP, rAF loops, event handlers).
 * Reads current state on every call — does NOT subscribe to changes.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(QUERY).matches
}
