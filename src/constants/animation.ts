// Animation spring configurations for Framer Motion

// Spring for card container position - smooth ease with subtle settle
export const positionSpring = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 32,
  mass: 1,
}

// Bouncier spring for stacked cards' rotation - subtle overshoot
export const stackedRotationSpring = {
  type: 'spring' as const,
  stiffness: 250,
  damping: 22,
  mass: 1,
}

// Bouncy spring for card navigation - subtle overshoot for satisfying settle
export const ctaEntranceSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 28,
  mass: 1,
}

// Critically damped spring for mobile collapse - smooth settle, no bounce
export const mobileCollapseSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 1,
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

// Carousel tuning configuration
export const CAROUSEL_CONFIG = {
  dragThreshold: 50,
  normalDragMultiplier: 1.0,
  boundaryDragMultiplier: 1.8,
  momentumMultiplier: 8,
  velocityDecay: 0.70,
  parallaxMultiplier: 0.20,
  boundaryVelocityScale: 2.5,
  normalVelocityScale: 0.5,
  enableBoundarySpringBack: false,
  springBackMultiplier: 0,
}
