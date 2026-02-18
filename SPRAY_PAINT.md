# Spray Paint Canvas — Shelved Feature

> **Status:** Shelved (disabled in App.tsx, all code preserved in place)
> **Last updated:** Feb 2026

Interactive spray-paint canvas that lets visitors draw black graffiti-style strokes over the bottom section of the site (gradient transition, "Case studies" quote, and footer).

---

## How to Re-enable

Uncomment two lines in `App.tsx`:

```tsx
// 1. Import (top of file, ~line 14)
import { SprayPaintCanvas } from './components/SprayPaintCanvas'

// 2. Component (inside the spray zone wrapper, ~line 679)
<SprayPaintCanvas />
```

That's it — everything else (cursor mode, CSS, z-index layering) is already wired up and dormant.

---

## What It Does

- Full-bleed transparent `<canvas>` overlays the gradient + quote + footer zone
- Desktop only — hidden on touch devices
- Black spray strokes with soft shadow glow (`shadowBlur: 10`)
- Subtle overspray spatter (8 dots per move, sub-2px, opacity falloff)
- Custom cursor swaps to a small nozzle dot in the spray zone
- Single clicks pass through to buttons underneath via `elementFromPoint`
- While painting (mouse held + dragging), `data-spray-active` suppresses `pointer-events` on content above the canvas so hover states don't interrupt strokes

## Pending Work

- **Pressure sensitivity** — simulate velocity-based taper (slow = thick/heavy, fast = thin/light). Track `lastPos`/`lastTime`, compute velocity, lerp `lineWidth` and `shadowBlur`. Was the next planned feature before shelving.

---

## Files Involved

### Core

| File | What |
|------|------|
| `src/components/SprayPaintCanvas.tsx` | Canvas component — drawing, spatter, click forwarding, spray-active toggle |

### Integration (small touches, already wired)

| File | Lines | What |
|------|-------|------|
| `src/App.tsx` | ~14, ~677-679 | Import + `<SprayPaintCanvas />` inside spray zone wrapper (currently commented out) |
| `src/App.tsx` | ~678 | Wrapper `<div>` with `position: relative; zIndex: 21` around gradient + quote + footer |
| `src/index.css` | ~484-490 | `[data-spray-active] > *:not(canvas)` — suppresses pointer-events while painting |
| `src/hooks/useCursorMorph.ts` | ~36-38 | `SPRAY_SIZE` / `SPRAY_RADIUS` constants |
| `src/hooks/useCursorMorph.ts` | ~45 | `'spray'` in `CursorMode` union type |
| `src/hooks/useCursorMorph.ts` | ~518-532 | `setSpray()` function |
| `src/hooks/useCursorMorph.ts` | ~607-611 | Spray element detection in `handleMouseMove` |
| `src/hooks/useCursorMorph.ts` | ~707 | `spray` in rAF attribute map |
| `src/components/CustomCursor.tsx` | ~33 | `sprayOpacity` transform |
| `src/components/CustomCursor.tsx` | ~151-168 | Spray nozzle dot SVG |

### Z-index Layering (in the spray zone wrapper)

| Z | Element | Notes |
|---|---------|-------|
| 11 | Headline text + buttons | `LogoMarqueeSection` — headline has `pointer-events: none`, buttons have `pointer-events: auto` |
| 11 | Footer content | `SiteFooter` |
| 10 | SprayPaintCanvas | The canvas itself |
| 1 | GradientTransition | Exit gradient image |

## Key Gotchas for Future Work

1. **`ctx.save()`/`ctx.restore()` breaks stroke paths** — the spatter function manually toggles `shadowColor`/`shadowBlur` instead of using save/restore, because restore resets the current path and turns smooth strokes into disconnected blobs.

2. **Content must sit above canvas for hover states** — buttons and footer are at `zIndex: 11` (above canvas at 10). The `data-spray-active` CSS rule suppresses their pointer-events only while actively painting, then re-enables them on mouseup.

3. **Click forwarding** — since the canvas covers interactive content, single clicks (mousedown+mouseup with <4px movement) are forwarded to the element below via `elementFromPoint` + `dispatchEvent`.

4. **Locomotive Scroll interference** — `window.scrollTo()` triggers smooth scroll animation, which can accidentally create paint marks if the cursor crosses the canvas during animation. Not a real user issue, only affects automated testing.
