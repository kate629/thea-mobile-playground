/**
 * First-party event sink for the product-ranker training pipeline.
 *
 * In-memory queue → batched POST to the `theaWebLogEvents` callable → GCS →
 * hourly bq-load → BigQuery `analytics.user_events`.
 *
 * Why first-party (not GA4): ad-blockers drop 25-40% of GA events with strong
 * selection bias toward privacy-conscious users; the resulting training data
 * is biased and unfixable. Same-origin POST through Firebase Functions runs on
 * our own domain and survives blockers ~100% of the time.
 *
 * Flush triggers:
 *   - 10 events queued (BATCH_SIZE)
 *   - 5s elapsed since first queued event (BATCH_INTERVAL_MS)
 *   - `visibilitychange → hidden` (mobile background, tab switch)
 *   - `pagehide` (true unload)
 *
 * Bot traffic is dropped at queue time (mirrors gaPixel's posture). Errors
 * never bubble — telemetry must not break the user's session.
 */

import { logEvents } from '../callables';
import type { TheaWebLogEvent, TheaWebLogEventName } from '../schemas';
import { isBot } from './botDetect';

const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5_000;
const PAYLOAD_BYTE_BUDGET = 200 * 1024; // BE caps at 256KB; leave headroom.

let queue: TheaWebLogEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersInstalled = false;

function eventTsClient(): string {
  // performance.timeOrigin is wall-clock ms at navigation start; .now() is
  // monotonic ms since. The sum is a high-resolution wall-clock timestamp
  // that doesn't drift even if the system clock changes mid-session.
  if (typeof performance !== 'undefined' && typeof performance.timeOrigin === 'number') {
    return new Date(performance.timeOrigin + performance.now()).toISOString();
  }
  return new Date().toISOString();
}

function newEventId(): string {
  // Prefer crypto.randomUUID where available; fall back to a sufficient
  // pseudo-random for older browsers (training-data dedup, not security).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Pseudo-uuid: timestamp + 16 random hex chars. Uniqueness is per-client,
  // and the BE dedup MERGE keys on event_id, so collisions across clients
  // are functionally impossible at our scale.
  const rand = Math.random().toString(16).slice(2, 18).padEnd(16, '0');
  return `${Date.now().toString(16)}-${rand}`;
}

function ensureFlushTimer(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, BATCH_INTERVAL_MS);
}

function clearFlushTimer(): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function installLifecycleListenersOnce(): void {
  if (listenersInstalled) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  listenersInstalled = true;

  // Hidden → flush. Fires on tab switch and on Safari's pre-unload moment.
  // The fetch initiated by httpsCallable will normally complete in flight
  // even if the page is backgrounded.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flush();
    }
  });

  // Hard unload — last best effort. The httpsCallable fetch may not complete
  // here; we accept some loss on hard unloads and rely on the visibilitychange
  // path (which fires first) to drain most of the queue.
  window.addEventListener('pagehide', () => {
    void flush();
  });
}

/**
 * Queue a single event for batched delivery. Safe to call from render-path
 * code: the actual POST is deferred to the next batch boundary, never
 * blocks, and never throws.
 *
 * Wrapped in a top-level try so a misbehaving caller (e.g. a property bag
 * that overrides toString to throw) can never bubble up into a click handler
 * or render path. Telemetry loss > user-facing breakage.
 */
export function logEvent(
  name: TheaWebLogEventName,
  properties: Record<string, unknown> = {},
): void {
  try {
    if (typeof window === 'undefined') return; // SSR/test guard.
    if (isBot()) return;

    installLifecycleListenersOnce();

    queue.push({
      event_id: newEventId(),
      event_name: name,
      event_ts_client: eventTsClient(),
      properties,
    });

    if (queue.length >= BATCH_SIZE) {
      void flush();
    } else {
      ensureFlushTimer();
    }
  } catch {
    // Best-effort. A throw here would propagate into the caller's render
    // path or click handler, which we explicitly never want.
  }
}

/**
 * Flush all queued events immediately. Called on lifecycle events and from
 * tests; callers shouldn't normally need to invoke this directly. Returns a
 * promise that resolves when the call completes (or fails); the resolved
 * promise is provided for tests, not for caller awaiting.
 */
export async function flush(): Promise<void> {
  try {
    clearFlushTimer();
    if (queue.length === 0) return;

    // Take a snapshot so events queued during the in-flight POST land in the
    // next batch instead of being dropped.
    const batch = queue;
    queue = [];

    // Soft byte-budget guard. If a single batch ever exceeds the cap, split
    // it in half and recurse — much simpler than per-event accounting and
    // covers the realistic case (a burst of events with large `properties`).
    // JSON.stringify is inside the outer try so a circular-ref property bag
    // (we never construct one, but defense in depth) can't escape.
    let approxBytes = 0;
    try {
      approxBytes = JSON.stringify(batch).length;
    } catch {
      // If we can't even stringify the batch, the BE call would fail too.
      // Drop the batch silently rather than retry.
      return;
    }
    if (approxBytes > PAYLOAD_BYTE_BUDGET && batch.length > 1) {
      const mid = Math.floor(batch.length / 2);
      queue = [...batch.slice(mid), ...queue];
      queue = [...batch.slice(0, mid), ...queue];
      // Re-flush in two passes.
      await flush();
      await flush();
      return;
    }

    try {
      await logEvents({ events: batch });
    } catch {
      // Telemetry must never break the user. Drop on failure — the BE can't
      // reproduce this batch and there's no productive retry path that won't
      // amplify the failure. Future: consider sessionStorage spool for retry
      // on next page load if loss rate proves significant.
    }
  } catch {
    // Outer safety net — anything we missed (a synchronous throw from
    // logEvents() before it returns its promise, an exception from the
    // queue snapshot, etc.) gets swallowed here.
  }
}

/** Test-only: drain state between tests. Never call from app code. */
export function _resetEventSinkForTesting(): void {
  queue = [];
  clearFlushTimer();
  listenersInstalled = false;
}

/** Test-only: peek the current queue without flushing. */
export function _peekQueueForTesting(): TheaWebLogEvent[] {
  return [...queue];
}
