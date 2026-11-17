export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.42, ease: EASE_OUT_EXPO },
};

export const POLAROID_LIFT = {
  whileHover: { y: -6, scale: 1.025, transition: { duration: 0.22, ease: EASE_OUT_EXPO } },
  whileTap: { scale: 0.985, transition: { duration: 0.12 } },
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
