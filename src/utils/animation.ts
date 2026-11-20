export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// 4-Tier Motion Hierarchy (compositor-only properties: transform & opacity)
export const MOTION_MICRO = {
  duration: 0.2,
  ease: EASE_OUT_EXPO,
} as const;

export const MOTION_INTERFACE = {
  duration: 0.36,
  ease: EASE_OUT_EXPO,
} as const;

export const MOTION_EMOTIONAL = {
  duration: 0.72,
  ease: EASE_OUT_EXPO,
} as const;

export const MOTION_CINEMATIC = {
  duration: 1.4,
  ease: EASE_OUT_EXPO,
} as const;

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: MOTION_INTERFACE,
};

export const EMOTIONAL_REVEAL = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: MOTION_EMOTIONAL,
} as const;

export const POLAROID_LIFT = {
  whileHover: { y: -6, scale: 1.022, transition: MOTION_MICRO },
  whileTap: { scale: 0.985, transition: { duration: 0.12 } },
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
