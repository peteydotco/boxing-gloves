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
 *   2. Image enters pinned at scaleY(0.15) — a thin sliver at the
 *      viewport bottom. It sits there for the first 30% of the runway
 *      scroll with no scale change.
 *   3. After 30%, scaleY scrubs from 0.15 → 1. The gradient stretches
 *      upward, washing over the light content.
 *   4. At scaleY(1) the sticky releases. The gradient and the
 *      VideoMorphSection beneath it scroll up naturally together.
 *
 * EXIT behavior:
 *   Mirror of enter — image starts scaleY(0.15) with transform-origin
 *   at top edge, grows downward. Sticky pins to viewport top.
 */
export function GradientTransition({ direction, src, className = '', style }: GradientTransitionProps) {
  const runwayRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const isEnter = direction === 'enter'

  useLayoutEffect(() => {
    const runway = runwayRef.current
    const image = imageRef.current
    if (!runway || !image) return

    // Initial state — squashed down
    gsap.set(image, {
      scaleY: 0.15,
    })

    const ctx = gsap.context(() => {
      // Delay scale start: the image sits pinned at scaleY(0.15) for
      // the first 30% of the runway, then grows to 1 over the rest.
      gsap.to(image, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: runway,
          start: isEnter ? '30% bottom' : '0% top',
          end: isEnter ? 'bottom bottom' : '70% top',
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
