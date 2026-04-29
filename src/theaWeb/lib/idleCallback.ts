/**
 * Defer non-critical work (analytics fires, telemetry) to the browser's idle
 * window so it can never block paint, INP, or LCP.
 *
 * Per the Tier 1 perf budget rule (analytics handoff §16): every analytics
 * event MUST be queued through this helper. The browser is free to delay the
 * fire until it has spare cycles — typical observed latency is <50ms but can
 * be longer under heavy main-thread load. That's the point: events are not
 * user-facing, so it's fine for them to wait.
 *
 * `requestIdleCallback` is widely supported (Chromium, Firefox); Safari
 * shipped support in 16.4 (April 2023). The `setTimeout(0)` fallback covers
 * older Safari + jsdom (tests).
 *
 * NOTE: we don't redeclare `requestIdleCallback` on the Window interface —
 * lib.dom.d.ts already declares it (non-optional). We runtime-check via
 * `typeof` for the older-Safari case; TS is happy as long as we don't try
 * to disagree with the lib.
 */

/**
 * Run `fn` during the browser's next idle period. If the page is busy enough
 * that the idle window doesn't open within 2000ms, the optional timeout fires
 * `fn` anyway so events don't queue indefinitely on a heavily-loaded page.
 *
 * Errors thrown by `fn` are swallowed — analytics fires must never bubble
 * exceptions back into the caller's render path.
 */
export function fireWhenIdle(fn: () => void): void {
  if (typeof window === 'undefined') return;
  const safe = () => {
    try {
      fn();
    } catch {
      // Analytics is best-effort. Swallow to keep callers exception-free.
    }
  };
  const ric = (window as Window & {
    requestIdleCallback?: (
      cb: () => void,
      opts?: { timeout?: number },
    ) => number;
  }).requestIdleCallback;
  if (typeof ric === 'function') {
    ric(safe, { timeout: 2000 });
  } else {
    // Microtask isn't quite right (still runs before paint); use a 0ms timeout
    // so we yield the call stack first.
    setTimeout(safe, 0);
  }
}
