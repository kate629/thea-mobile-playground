import { useEffect, useRef } from 'react';
import { gaTimeToFirstResult } from '../lib/gaPixel';

/**
 * LCP-anchored "time to first result" analytics, per spec §14. Fires the
 * `time_to_first_result_ms` GA4 event exactly once per results-page mount —
 * after (a) the carousel session has reached COMPLETED with content AND (b)
 * the browser has reported its Largest Contentful Paint entry AND (c) the
 * `thea-submit-click` + `thea-submit-callable-resolve` performance marks
 * exist (i.e., the user came in via a real submission, not a deep link).
 *
 * Sub-timings split the total felt latency into:
 *   - `submit_callable_ms` — BE submit speed
 *   - `agent_phase_ms` — carousel agent + curation duration
 *   - `nav_to_lcp_ms` — FE render-to-paint of the results page
 *
 * Marks are placed by the submit pipeline:
 *   - `thea-submit-click` — App.js handleSearchSubmit + QuizPage handleSubmit,
 *     at the moment the user's submission begins.
 *   - `thea-submit-callable-resolve` — useSubmitGiftFlow, after `submitGiftFlow`
 *     resolves successfully.
 *
 * Both marks are cleared at the start of the next submission so refreshes /
 * regenerates don't reuse stale timings. If either mark is missing when the
 * gating effect runs, the event is skipped — we can't compute the deltas.
 */

export interface UseTimeToFirstResultArgs {
  /** True when the session is COMPLETED AND has at least one carousel — i.e.,
   *  the moment the FE first considers the page "ready to display." */
  isReady: boolean;
  occasion?: string;
  relationship?: string;
  /** Carousel session id (joins to Firestore for the rollup table). */
  sessionId?: string;
}

export function useTimeToFirstResult({
  isReady,
  occasion,
  relationship,
  sessionId,
}: UseTimeToFirstResultArgs): void {
  // Mount time. nav_to_lcp_ms = LCP - mount.
  const mountTimeRef = useRef<number>(
    typeof performance !== 'undefined' ? performance.now() : 0,
  );
  // Captured the first time isReady flips true. NOTE: this effect must be
  // declared BEFORE the firing effect below so the ref is populated when the
  // firing effect reads it (React runs commit-phase effects in declaration
  // order).
  const completedTimeRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (isReady && completedTimeRef.current === null && typeof performance !== 'undefined') {
      completedTimeRef.current = performance.now();
    }
  }, [isReady]);

  useEffect(() => {
    if (firedRef.current) return;
    if (!isReady) return;
    if (typeof window === 'undefined') return;
    if (typeof performance === 'undefined') return;
    if (completedTimeRef.current === null) return;

    const submitClick = performance.getEntriesByName('thea-submit-click')[0];
    const submitCallable = performance.getEntriesByName(
      'thea-submit-callable-resolve',
    )[0];
    // Direct landings (deep link, refresh) won't have the marks. Skip.
    if (!submitClick || !submitCallable) return;

    const fire = (lcpStartTime: number) => {
      if (firedRef.current) return;
      firedRef.current = true;
      const completedTime = completedTimeRef.current ?? 0;
      gaTimeToFirstResult({
        time_to_first_result_ms: Math.max(
          0,
          Math.round(lcpStartTime - submitClick.startTime),
        ),
        submit_callable_ms: Math.max(
          0,
          Math.round(submitCallable.startTime - submitClick.startTime),
        ),
        agent_phase_ms: Math.max(
          0,
          Math.round(completedTime - submitCallable.startTime),
        ),
        nav_to_lcp_ms: Math.max(
          0,
          Math.round(lcpStartTime - mountTimeRef.current),
        ),
        ...(occasion !== undefined ? { occasion } : {}),
        ...(relationship !== undefined ? { relationship } : {}),
        ...(sessionId !== undefined ? { session_id: sessionId } : {}),
      });
    };

    // LCP may have already fired by the time isReady flips true; check the
    // existing entries before installing an observer.
    const existing = performance.getEntriesByType('largest-contentful-paint');
    if (existing.length > 0) {
      fire(existing[existing.length - 1].startTime);
      return;
    }

    if (typeof PerformanceObserver === 'undefined') return;

    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (!last || last.entryType !== 'largest-contentful-paint') return;
        fire(last.startTime);
        observer?.disconnect();
      });
      // `buffered: true` catches LCP entries that fired BEFORE the observer
      // registered (defensive — we already checked existing entries above).
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Older browsers without LCP observer support — skip silently.
      observer = null;
    }

    return () => observer?.disconnect();
  }, [isReady, occasion, relationship, sessionId]);
}
