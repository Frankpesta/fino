import gsap from "gsap";

/**
 * Runs `normal` under `(prefers-reduced-motion: no-preference)` and
 * `reduced` (typically just `gsap.set(...)` to the final state, no tween)
 * under `(prefers-reduced-motion: reduce)`. Call inside `useGSAP()` so
 * cleanup/revert is handled automatically.
 */
export function withReducedMotion(normal: () => void, reduced: () => void) {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", normal);
  mm.add("(prefers-reduced-motion: reduce)", reduced);
  return mm;
}
