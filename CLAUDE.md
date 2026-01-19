# CLAUDE.md

This file provides guidance for Claude Code when working on the Pete Prototype project.

## Project Overview

Pete Prototype is a personal portfolio website for Peter Rodriguez, featuring an interactive 3D visualization of hanging spheres (like a car rearview mirror ornament). Built with React Three Fiber and physics simulation.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **3D Graphics**: React Three Fiber (`@react-three/fiber`) + Three.js
- **3D Helpers**: `@react-three/drei` (Environment, ContactShadows, Lightformer)
- **Physics**: `@react-three/rapier` (Rapier physics engine)
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite`)
- **Animation**: Framer Motion
- **Debug UI**: Leva (collapsible control panel)

## Commands

```bash
npm run dev      # Start development server
npm run build    # TypeScript check + production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── App.tsx                    # Main app with Leva controls and layout
├── main.tsx                   # Entry point
├── index.css                  # Global styles + Tailwind
└── components/
    ├── Scene.tsx              # Canvas setup, lighting, environment
    ├── HangingSpheres.tsx     # Physics-based draggable spheres with ropes
    ├── TopCards.tsx           # Header UI cards
    └── StackedFooter.tsx      # Footer component
```

## Key Architecture

### Settings Flow
- Leva controls in `App.tsx` create a `settings` object
- Settings are passed to `Scene` → `HangingSpheres` → individual sphere components
- Settings include: ball appearance (color, metalness, roughness), physics (mass, restitution, damping), string properties (length, thickness, color)

### Physics System
- Uses Rapier via `@react-three/rapier`
- Spheres have soft string constraints (not rigid joints)
- Dragging uses kinematic body type, releases as dynamic
- String length constraint enforced in `useFrame` loop

### 3D Scene
- Canvas with transparent background (alpha: true)
- Custom lighting setup (key, fill, back, top lights)
- Environment map with custom Lightformers for reflections
- ContactShadows for ground shadows

## Code Conventions

- TypeScript strict mode
- Functional components with hooks
- `useRef` for Three.js object references
- `useFrame` for per-frame updates
- `useCallback` for event handlers to prevent re-renders

## Commit Policy

Always commit changes after completing tasks. Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code restructuring
- `style:` for styling changes
- `docs:` for documentation
- `chore:` for maintenance tasks

## Development Notes

- The physics simulation runs at 60fps in `useFrame`
- Rope visuals use `CatmullRomCurve3` for smooth curves with sag
- Presets (Cotton Balls, Chrome Spheres, etc.) demonstrate material variations
- The "PETE" watermark is a large background text element
