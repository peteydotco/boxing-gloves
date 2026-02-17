// Animation spring configurations for Framer Motion

// Signature spring — the default curve for all UI motion
// mass: 1, stiffness: 320, damping: 40
export const signatureSpring = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 40,
  mass: 1,
}

// Spring for card container position — uses signature curve
export const positionSpring = { ...signatureSpring }

// Bouncier spring for stacked cards' rotation - subtle overshoot
export const stackedRotationSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 1,
}

// Spring for card open + carousel nav — fast with playful springback
export const ctaEntranceSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.9,
}

// Spring for card close / collapse — fast snap-back with subtle bounce
export const mobileCollapseSpring = {
  type: 'spring' as const,
  stiffness: 600,
  damping: 36,
  mass: 0.7,
}

// Faster critically damped spring for internal content (fonts, padding)
export const contentSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}

// Tween for hover interactions - matches CSS transition timing
export const hoverTransition = {
  type: 'tween' as const,
  duration: 0.25,
  ease: [0.33, 1, 0.68, 1] as [number, number, number, number], // easeOutCubic
}

// Spring for scroll tug snap-back - bouncy settle for satisfying microinteraction
export const tugSnapBackSpring = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 18,
  mass: 0.7,
}

// Spring for active tug tracking - stiff and responsive during scroll
export const tugTrackingSpring = {
  type: 'spring' as const,
  stiffness: 600,
  damping: 40,
  mass: 0.5,
}

// Custom cursor — stiff position tracking (glued to pointer, minimal lag)
export const cursorFollowSpring = {
  stiffness: 800,
  damping: 60,
  mass: 0.3,
}

// Custom cursor — morph snap (satisfying organic snap onto target elements)
export const cursorMorphSpring = {
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}

// iPadOS-style pointer lift effect configuration
export const POINTER_LIFT = {
  parallaxMax: 2.5,   // max px foreground children shift
  liftScale: 1.005,   // scale factor when morphed onto element
}

// Carousel tuning configuration
export const CAROUSEL_CONFIG = {
  dragThreshold: 50,
  normalDragMultiplier: 1.0,
  boundaryDragMultiplier: 1.6,
  momentumMultiplier: 8,
  velocityDecay: 0.82,
  parallaxMultiplier: 0.20,
  boundaryVelocityScale: 0.8,
  normalVelocityScale: 0.25,
  enableBoundarySpringBack: false,
  springBackMultiplier: 0,
}
