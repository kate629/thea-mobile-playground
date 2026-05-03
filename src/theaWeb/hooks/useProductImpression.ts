import { useEffect, type RefObject } from 'react';

import { logEvent } from '../lib/eventSink';

/**
 * Per-card impression + dwell instrumentation for the product-ranker training
 * pipeline. Mirrors the shared-observer pattern in `useCarouselImpression`,
 * but at the card level and with dwell-time tracking on enter/exit cycles.
 *
 * Why this exists: per-carousel impressions tell us "the user reached this
 * row," but not which specific cards rendered into view. The ranker needs
 * per-card exposure to derive negative examples ("seen but not saved") and
 * graded positives via dwell time. Without dwell, save-rate is the only
 * signal — sparse (~3-5%) and high-variance.
 *
 * Event semantics:
 *   - `product_impression` fires on EXIT (or visibility hide / page unload)
 *     so the event carries actual dwell_ms instead of an unbounded "still
 *     visible" placeholder.
 *   - dwell_ms < 250 is filtered (scroll-through; not a real impression).
 *   - dwell_ms > 60_000 is capped (background tab / dropped focus poisoning).
 *   - At most 3 enter-exit cycles per (session_id, product_id) — protects
 *     against a noisy IntersectionObserver firing repeatedly on a single
 *     card the user is parked on.
 *
 * One module-scoped IntersectionObserver across the whole page (matches
 * the perf rule in `useCarouselImpression`).
 */

interface ImpressionParams {
  sessionId: string;
  productId: string;
  recommendationId?: string;
  recipientId?: string;
  carouselName?: string;
  cardPosition?: number;
  // Cohort fields propagated for join-free analysis in BQ.
  relationship?: string;
  occasion?: string;
  ageRange?: string;
  gender?: string;
  regenerateCount?: number;
}

interface ElementState {
  params: ImpressionParams;
  entryTs: number | null;
  cycleCount: number;
}

const MIN_DWELL_MS = 250;
const MAX_DWELL_MS = 60_000;
const MAX_CYCLES_PER_CARD = 3;

let sharedObserver: IntersectionObserver | null = null;
const elementState = new WeakMap<Element, ElementState>();
// Strong-ref mirror so we can iterate currently-visible elements during page
// hide. WeakMap doesn't expose iteration; this Map is pruned on unobserve.
const liveElements = new Map<Element, ElementState>();
let lifecycleListenersInstalled = false;

function fireImpressionFromState(now: number, state: ElementState): void {
  if (state.entryTs === null) return;
  if (state.cycleCount > MAX_CYCLES_PER_CARD) return;
  const rawDwell = now - state.entryTs;
  if (rawDwell < MIN_DWELL_MS) {
    state.entryTs = null;
    return;
  }
  const dwellMs = Math.min(rawDwell, MAX_DWELL_MS);
  state.entryTs = null;
  const p = state.params;
  logEvent('product_impression', {
    session_id: p.sessionId,
    product_id: p.productId,
    ...(p.recommendationId !== undefined ? { recommendation_id: p.recommendationId } : {}),
    ...(p.recipientId !== undefined ? { recipient_id: p.recipientId } : {}),
    ...(p.carouselName !== undefined ? { carousel_name: p.carouselName } : {}),
    ...(p.cardPosition !== undefined ? { card_position: p.cardPosition } : {}),
    ...(p.relationship !== undefined ? { relationship: p.relationship } : {}),
    ...(p.occasion !== undefined ? { occasion: p.occasion } : {}),
    ...(p.ageRange !== undefined ? { age_range: p.ageRange } : {}),
    ...(p.gender !== undefined ? { gender: p.gender } : {}),
    ...(p.regenerateCount !== undefined ? { regenerate_count: p.regenerateCount } : {}),
    dwell_ms: dwellMs,
    cycle: state.cycleCount,
  });
}

function flushAllVisible(): void {
  const now = performance.now();
  liveElements.forEach((state) => {
    fireImpressionFromState(now, state);
  });
}

function installLifecycleListenersOnce(): void {
  if (lifecycleListenersInstalled) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  lifecycleListenersInstalled = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAllVisible();
  });
  window.addEventListener('pagehide', () => flushAllVisible());
}

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined') return null;
  if (typeof IntersectionObserver === 'undefined') return null;
  if (sharedObserver) return sharedObserver;
  installLifecycleListenersOnce();
  sharedObserver = new IntersectionObserver(
    (entries) => {
      const now = performance.now();
      for (const entry of entries) {
        const state = elementState.get(entry.target);
        if (!state) continue;
        if (entry.isIntersecting) {
          if (state.entryTs !== null) continue; // Already counting.
          state.cycleCount += 1;
          if (state.cycleCount > MAX_CYCLES_PER_CARD) continue;
          state.entryTs = now;
        } else {
          fireImpressionFromState(now, state);
        }
      }
    },
    { threshold: 0.5 },
  );
  return sharedObserver;
}

/**
 * Register `ref.current` for impression + dwell tracking. Pass stable params
 * (sessionId, productId, recommendationId, etc. don't change across a card's
 * lifetime — a regenerate spawns a new card with a new key and remounts).
 *
 * `enabled` lets callers wait for content to settle (e.g., session loaded)
 * before observing — avoids firing impressions for skeleton placeholders.
 */
export function useProductImpression(
  ref: RefObject<Element | null>,
  params: ImpressionParams,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const observer = getObserver();
    const state: ElementState = {
      params,
      entryTs: null,
      cycleCount: 0,
    };
    elementState.set(el, state);
    liveElements.set(el, state);

    if (!observer) {
      // jsdom / no-IO fallback: synchronously fire a single impression with
      // dwell=0 so test paths still produce events. Real browsers always
      // have IntersectionObserver.
      state.cycleCount = 1;
      logEvent('product_impression', {
        session_id: params.sessionId,
        product_id: params.productId,
        ...(params.recommendationId !== undefined
          ? { recommendation_id: params.recommendationId }
          : {}),
        ...(params.recipientId !== undefined ? { recipient_id: params.recipientId } : {}),
        dwell_ms: 0,
        cycle: 1,
      });
      return () => {
        elementState.delete(el);
        liveElements.delete(el);
      };
    }

    observer.observe(el);
    return () => {
      // If the card unmounts while still visible, treat unmount as exit so
      // any in-flight dwell cycle still produces an event.
      const finalNow = performance.now();
      fireImpressionFromState(finalNow, state);
      observer.unobserve(el);
      elementState.delete(el);
      liveElements.delete(el);
    };
    // Intentionally only depend on ref + enabled; params are snapshotted at
    // observe time and don't need to re-bind the observer (params are
    // stable per card mount — see hook docstring).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled]);
}

/** Test-only: drain all module state. Never call from app code. */
export function _resetProductImpressionForTesting(): void {
  sharedObserver?.disconnect();
  sharedObserver = null;
  liveElements.clear();
  lifecycleListenersInstalled = false;
}
