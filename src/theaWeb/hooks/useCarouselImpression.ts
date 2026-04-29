import { useEffect, type RefObject } from 'react';

/**
 * IntersectionObserver-based "this element entered the viewport" hook used by
 * carousel sections AND by the Mother's Day banner (any element where we want
 * to fire a one-time impression event).
 *
 * Per Tier 1 perf rule #2 (analytics handoff §16): one shared module-scoped
 * IntersectionObserver across the whole page, not one observer per carousel.
 * The MD guide alone has 8 carousels; per-component observers would create
 * 8+ Observer instances on a paid-traffic landing page where every ms of
 * setup matters.
 *
 * Behavior:
 *   - Fires `onVisible` exactly once per registered element per page-mount.
 *   - Threshold: 0.5 (≥50% of the element visible). Matches v6 spec for
 *     carousel impression events.
 *   - Element is unobserved immediately after firing — no overhead from
 *     repeat intersections during scroll.
 *   - Bot detection lives at the gaCarouselVisible helper level, not here.
 *     The hook itself fires its callback regardless of bot status; the
 *     callback's pixel call is what gates on isBot.
 */

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined') return null;
  if (typeof IntersectionObserver === 'undefined') return null;
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const cb = callbacks.get(entry.target);
        if (!cb) continue;
        // Fire once, then stop watching this element. Future scrolls past it
        // don't re-fire; the next time it impresses (e.g., after navigation
        // back to the same page) requires a fresh registration.
        callbacks.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
        cb();
      }
    },
    { threshold: 0.5 },
  );
  return sharedObserver;
}

/**
 * Register `ref.current` with the shared observer. On first ≥50% visibility,
 * `onVisible` runs once. The hook tears down on unmount or when `enabled`
 * flips to false.
 *
 * `enabled` exists so callers can wait for content to land (e.g., results
 * page carousels mount lazily) and start observing only when ready.
 */
export function useCarouselImpression(
  ref: RefObject<Element | null>,
  onVisible: () => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const observer = getObserver();
    if (!observer) {
      // jsdom + ancient-browser fallback: just fire synchronously so the
      // event still lands. The shape of the data on the wire matches.
      onVisible();
      return;
    }
    callbacks.set(el, onVisible);
    observer.observe(el);
    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
  }, [ref, onVisible, enabled]);
}
