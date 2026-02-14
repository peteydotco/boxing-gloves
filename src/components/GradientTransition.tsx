import { useRef, useLayoutEffect } from 'react'
import { gsap } from '../lib/gsap'

interface GradientTransitionProps {
  direction: 'enter' | 'exit'
  src: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Scroll-driven gradient transition using scaleY.
 *
 * ENTER behavior:
 *   1. Runway (200vh) provides scroll distance. Sticky container pins
 *      to viewport bottom via `position: sticky; bottom: 0`.
 *   2. Phase 1 (first 15%): Image eases in from scaleY(0) → scaleY(0.08)
 *      with power2.out — a thin sliver that scrolls into view naturally.
 *   3. Phase 2 (remaining 85%): scaleY scrubs from 0.08 → 1 with
 *      power3.in — the first ~50% barely changes, then growth accelerates.
 *   4. At scaleY(1) the sticky releases. The gradient and the
 *      VideoMorphSection beneath it scroll up naturally together.
 *
 * EXIT behavior:
 *   Mirror of enter — image swings down from top edge. Sticky pins
 *   to viewport top.
 */
export function GradientTransition({ direction, src, className = '', style }: GradientTransitionProps) {
  const runwayRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const isEnter = direction === 'enter'

  useLayoutEffect(() => {
    const runway = runwayRef.current
    const image = imageRef.current
    if (!runway || !image) return

    // Initial state — fully flat (invisible)
    gsap.set(image, {
      scaleY: 0,
    })

    const ctx = gsap.context(() => {
      // Phase 1: Ease in from 0 → 0.08 as it scrolls into view and pins.
      // This gives a visible sliver that naturally enters the viewport.
      gsap.to(image, {
        scaleY: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: runway,
          start: 'top bottom',
          end: '15% bottom',
          scrub: true,
        },
      })

      // Phase 2: Grow from 0.08 → 1 with a steep ease-in so the first
      // ~50% of the remaining scroll barely changes the scale.
      gsap.fromTo(image, { scaleY: 0.08 }, {
        scaleY: 1,
        ease: 'power3.in',
        scrollTrigger: {
          trigger: runway,
          start: '15% bottom',
          end: 'bottom bottom',
          scrub: true,
        },
      })
    }, runway)

    return () => ctx.revert()
  }, [isEnter])

  return (
    <div
      ref={runwayRef}
      className={`relative w-full ${className}`}
      style={{
        height: '200vh',
        // Flexbox pushes the sticky child to the bottom of the runway in
        // normal flow. When sticky releases, it sits at the runway's bottom
        // edge — butting up against the VideoMorphSection with no gap.
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isEnter ? 'flex-end' : 'flex-start',
        // NO overflow hidden here — this is just a scroll spacer
        ...style,
      }}
    >
      <div
        className="w-full pointer-events-none"
        style={{
          position: 'sticky',
          ...(isEnter ? { bottom: 0 } : { top: 0 }),
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            transformOrigin: isEnter ? 'center bottom' : 'center top',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  )
}
