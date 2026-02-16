# Gradient Section Transitions — Technical Reference

**Purpose:** This document describes exactly how to build the enter and exit gradient transitions that sandwich the VideoMorphSection. Read this file IN FULL before implementing, debugging, or modifying any gradient transition code.

**Tech stack:** React + Tailwind + GSAP ScrollTrigger (imported from `../lib/gsap`) + Framer Motion. Match the patterns already used in `VideoMorphSection.tsx`.

---

## What the user should see

**Enter gradient:** As the user scrolls past the graffiti hero, a gradient "blooms" upward from the bottom of the viewport — it starts small and transparent, stretches vertically, and fades in. It washes over the hero content and transitions into the dark `#010000` background of the VideoMorphSection.

**Exit gradient:** After the video section, a second gradient blooms downward from the top of the viewport. It transitions out of the dark background into whatever section follows.

Both effects are 100% scroll-driven. They freeze when the user stops scrolling.

---

## Where the gradients live

The enter and exit gradients are **separate** from `VideoMorphSection.tsx`. They are their own components rendered in `App.tsx` — one directly ABOVE the `<VideoMorphSection />` and one directly BELOW it.

**App.tsx render order:**

```
...hero / graffiti content...
<GradientTransition direction="enter" />   ← blooms upward
<VideoMorphSection />                      ← the dark section (bg: #010000)
<GradientTransition direction="exit" />    ← blooms downward
...next content...
```

**Do NOT** nest the gradients inside VideoMorphSection. They are siblings in the document flow. This prevents z-index and overflow conflicts with the sticky wrapper inside VideoMorphSection.

---

## Component implementation

Create a single reusable component: `GradientTransition.tsx`

```tsx
import { useRef, useLayoutEffect } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'

interface GradientTransitionProps {
  direction: 'enter' | 'exit'
  src: string          // path to gradient PNG, e.g. "/images/transition-entry.png"
  className?: string
}

export function GradientTransition({ direction, src, className = '' }: GradientTransitionProps) {
  const runwayRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useLayoutEffect(() => {
    const runway = runwayRef.current
    const image = imageRef.current
    if (!runway || !image) return

    // Set initial state — small and invisible
    gsap.set(image, { scaleY: 0.3, opacity: 0 })

    const ctx = gsap.context(() => {
      gsap.to(image, {
        scaleY: 1,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: runway,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
        },
      })
    }, runway)

    return () => ctx.revert()
  }, [])

  const isEnter = direction === 'enter'

  return (
    <div
      ref={runwayRef}
      className={`relative w-full ${className}`}
      style={{
        height: '200vh',
        // NO overflow hidden here — this is just a scroll spacer
      }}
    >
      <div
        className="w-full pointer-events-none"
        style={{
          position: 'sticky',
          [isEnter ? 'bottom' : 'top']: 0,
          height: '100vh',
          overflow: 'hidden',          // overflow hidden ONLY here
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt=""
          className="w-full"
          style={{
            height: '140%',
            objectFit: 'cover',
            objectPosition: isEnter ? 'center bottom' : 'center top',
            transformOrigin: isEnter ? 'center bottom' : 'center top',
            willChange: 'transform, opacity',
          }}
        />
      </div>
    </div>
  )
}
```

---

## Usage in App.tsx

```tsx
import { GradientTransition } from './components/GradientTransition'
import { VideoMorphSection } from './components/VideoMorphSection'

// Inside JSX, in document flow order:

{/* ...hero / graffiti content above... */}

<GradientTransition
  direction="enter"
  src="/images/transition-entry.png"
  className="relative"
  style={{ zIndex: 2 }}
/>

<VideoMorphSection /> {/* VideoMorphSection already has bg #010000 and its own z-index */}

<GradientTransition
  direction="exit"
  src="/images/transition-exit.png"
  className="relative"
  style={{ zIndex: 5 }}
/>

{/* ...next content below... */}
```

---

## The three nested elements — what each one does

```
┌─ RUNWAY (ref: runwayRef) ──────────────────────────────────────────┐
│  height: 200vh. Normal document flow. NO overflow hidden.          │
│  This is just scroll distance for the animation to play across.    │
│                                                                     │
│  ┌─ STICKY CONTAINER ───────────────────────────────────────────┐  │
│  │  position: sticky. bottom: 0 (enter) or top: 0 (exit).      │  │
│  │  height: 100vh. overflow: hidden. pointer-events: none.      │  │
│  │  This is the "window frame" the gradient is revealed through.│  │
│  │                                                               │  │
│  │  ┌─ IMAGE (ref: imageRef) ─────────────────────────────────┐ │  │
│  │  │  height: 140%. The actual gradient PNG.                  │ │  │
│  │  │  Animated by GSAP: scaleY 0.3→1, opacity 0→1.          │ │  │
│  │  │  transformOrigin: center bottom (enter) / center top     │ │  │
│  │  │  (exit).                                                 │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Rules for these three elements — DO NOT VIOLATE:**

1. **Runway:** `overflow` must NOT be hidden. It must NOT have a constraining max-height. It must be in normal document flow (not absolute or fixed).
2. **Sticky container:** This is the ONLY element with `overflow: hidden`. It MUST have `height: 100vh`. The `position: sticky` with `bottom: 0` (enter) or `top: 0` (exit) is what pins it to the viewport edge.
3. **Image:** Must be `height: 140%` (taller than the sticky container). The `transformOrigin` must match the sticky direction — `center bottom` for enter, `center top` for exit. Gets `scaleY` and `opacity` animated by GSAP.

---

## Z-index stacking order

```
Layer                         z-index
─────────────────────────────────────
Hero / graffiti SVG              1
Enter gradient (runway)          2
VideoMorphSection                3  (internal sticky wrapper uses z:10 locally)
Exit gradient (runway)           5
Next content section             6
```

- The enter gradient must render IN FRONT of the hero (covers it) but BEHIND the VideoMorphSection's dark background.
- The exit gradient must render IN FRONT of the VideoMorphSection but BEHIND the next content section.

---

## GSAP pattern reference

This matches the `useLayoutEffect` + `gsap.context()` pattern already used in `VideoMorphSection.tsx`:

```tsx
useLayoutEffect(() => {
  const runway = runwayRef.current
  const image = imageRef.current
  if (!runway || !image) return

  gsap.set(image, { scaleY: 0.3, opacity: 0 })

  const ctx = gsap.context(() => {
    gsap.to(image, {
      scaleY: 1,
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: runway,
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true,
      },
    })
  }, runway)

  return () => ctx.revert()
}, [])
```

- **Do not** use `useEffect` — use `useLayoutEffect`. This ensures GSAP measures DOM dimensions before paint, matching the existing VideoMorphSection pattern.
- **Always** return `ctx.revert()` in cleanup. This prevents ScrollTrigger leaks on component unmount or hot reload.

---

## Gradient image specs

Each PNG should be:

- **Dimensions:** approximately 1920 × 2448px (landscape width, very tall)
- **Format:** PNG with transparency OR solid gradient — depends on your design
- **Enter gradient colors (top → bottom):** hero background color → rich accent midtones (purples, golds, magentas) → `#010000` (VideoMorphSection bg)
- **Exit gradient colors (top → bottom):** `#010000` → rich accent midtones → next section's background color

Place them in `/public/images/`:

```
/public/images/transition-entry.png
/public/images/transition-exit.png
```

---

## Debugging checklist

**Gradient is clipped**
- [ ] Is `overflow: hidden` ONLY on the sticky container? Not on the runway?
- [ ] Check every ancestor of the runway up to `<body>` — does any have `overflow: hidden` or `overflow-y: hidden`?
- [ ] Does the sticky container have exactly `height: 100vh`?
- [ ] Is the image `height: 140%`?
- [ ] Is the runway in normal document flow (NOT `position: absolute/fixed`)?

**Gradient doesn't appear**
- [ ] Is `gsap.set()` being called with initial `scaleY: 0.3, opacity: 0`?
- [ ] Is the ScrollTrigger trigger pointing at the runway ref?
- [ ] Is `scrub: true` set?
- [ ] Check z-index — is the gradient behind a higher-z element?
- [ ] Is the image `src` path correct? Check Network tab for 404.

**Gradient jumps or snaps**
- [ ] Is `ease: 'none'` set? Any other easing feels disconnected from scroll.
- [ ] Are ScrollTrigger start/end correct? Should be `'top bottom'` / `'bottom bottom'`.
- [ ] Is the runway tall enough? Increase height for a slower, smoother bloom.

**Gradient appears in wrong position**
- [ ] Enter: sticky must be `bottom: 0` + `transformOrigin` `center bottom`
- [ ] Exit: sticky must be `top: 0` + `transformOrigin` `center top`
- [ ] These must NOT be swapped — if they are, the bloom direction is inverted.

**Gradient blocks clicks/interaction**
- [ ] Sticky container needs `pointer-events: none`

---

## DO NOT

- Put `overflow: hidden` on the runway div
- Put `overflow: hidden` on any ancestor of the runway
- Nest the gradient inside `VideoMorphSection.tsx`
- Use `position: absolute` or `position: fixed` for the sticky container
- Use time-based animation — everything is `scrub: true`
- Use `useEffect` instead of `useLayoutEffect` for GSAP setup
- Modify this gradient code when fixing unrelated components
- Forget `ctx.revert()` cleanup in the `useLayoutEffect` return
