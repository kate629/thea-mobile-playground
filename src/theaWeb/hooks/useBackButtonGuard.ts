import { useCallback, useEffect, useRef } from 'react';

/** Sentinel marker we push onto the history stack so we can recognize and
 *  intercept the user's first browser-back press from this surface. Using
 *  a known-shape state object lets us tell our own entries apart from
 *  states that other parts of the app may have pushed. */
const SENTINEL_KEY = 'theaQuizGuard';
type SentinelState = { [SENTINEL_KEY]: true };

const isSentinel = (state: unknown): state is SentinelState =>
  typeof state === 'object' && state !== null && (state as SentinelState)[SENTINEL_KEY] === true;

export interface BackButtonGuard {
  /** Disarms the guard and pops the history stack.
   *
   *  Default (`extraDepth = 0`): pops ONE entry — just the sentinel. Lands
   *  the user back on /quiz (or wherever the guard was armed). Use this for
   *  the simple "user pressed back, confirmed, let the original back proceed"
   *  case where the entry-point is one back-press away (which is the natural
   *  semantics of a single browser back).
   *
   *  With `extraDepth > 0`: pops `1 + extraDepth` entries. Use this when you
   *  want browser-native scroll restoration to fire on a deeper destination
   *  — e.g., the quiz was reached via `navigate('/quiz')` from
   *  `/occasion/mothers_day`, so popping the sentinel + the /quiz entry
   *  (extraDepth=1) lands the user back on the occasion page with their
   *  scroll position restored by the browser's popstate handling.
   *
   *  Each pop emits a popstate event; the guard's handler stays disarmed
   *  for exactly the count of entries it just popped, so intermediate
   *  popstates don't accidentally re-arm the sentinel.
   */
  release: (extraDepth?: number) => void;
}

/**
 * Browser back-button guard for the quiz surface (bug #12).
 *
 * On `enabled`, pushes a sentinel state onto `window.history`. When the user
 * presses browser back, the popstate fires consuming the sentinel; we
 * immediately re-push another sentinel (so the URL/route doesn't change) and
 * call `onTrigger`, which the caller wires to opening a leave-warning modal.
 *
 * If the user clicks "Stay" inside the modal, do nothing — the sentinel is
 * still armed, so the next back press will be intercepted again.
 *
 * If the user clicks "Leave", call `release()`. That sets `disarmedRef` so
 * the next popstate is allowed through, then calls `history.back()`. The
 * sentinel pops off and the user's original back-nav (one step further back)
 * actually executes.
 *
 * `useBlocker` from react-router would be the idiomatic fix but it's
 * `unstable_useBlocker` and only works under `<DataRouter>` — this app uses
 * `<BrowserRouter>`, so we handle the popstate ourselves.
 *
 * Caveats:
 * - The user can long-press back and skip multiple history entries. The
 *   sentinel only catches the first popstate; subsequent ones in the same
 *   gesture pass through. Acceptable: matches sovrn's old behavior.
 * - Not active during SSR (guarded by `typeof window`).
 * - Disabled while `enabled` is false (e.g., after submit completes and the
 *   user is en route to /quiz/results — we don't want to trap them there).
 */
export function useBackButtonGuard(
  enabled: boolean,
  onTrigger: () => void,
): BackButtonGuard {
  /** Number of incoming popstate events the handler should let through
   *  silently before re-arming. Multi-step releases set this to N so the
   *  browser's N popstates from a `history.go(-N)` all pass through. */
  const disarmedCountRef = useRef(0);
  const onTriggerRef = useRef(onTrigger);
  // Keep the ref pointing at the latest callback so the popstate handler
  // (registered once) always calls the most-recent closure.
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    // Arm: push the sentinel so the next back press lands here first.
    window.history.pushState({ [SENTINEL_KEY]: true } as SentinelState, '');

    const handlePopState = (e: PopStateEvent) => {
      if (disarmedCountRef.current > 0) {
        // Caller consumed the guard via release() — let this popstate
        // through so the actual back-nav can proceed. Decrement so a
        // multi-step release lets exactly N popstates through.
        disarmedCountRef.current -= 1;
        return;
      }
      // Re-push so the URL stays put and the next back press still hits us.
      window.history.pushState({ [SENTINEL_KEY]: true } as SentinelState, '');
      onTriggerRef.current();
      // Suppress the no-op state change: nothing to mark; just no-op here.
      // (e is referenced to keep eslint happy and document the contract.)
      void e;
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Best-effort cleanup of our sentinel on unmount: if the current
      // top-of-stack entry IS our sentinel, pop it so we don't leak a
      // history entry that would silently absorb a future back press.
      // (After a confirmed-leave the top is whatever the router pushed,
      // not our sentinel — this branch then no-ops, which is fine.)
      if (isSentinel(window.history.state)) {
        disarmedCountRef.current = 1;
        window.history.back();
      }
    };
  }, [enabled]);

  const release = useCallback((extraDepth: number = 0) => {
    if (typeof window === 'undefined') return;
    const depth = 1 + Math.max(0, extraDepth);
    disarmedCountRef.current = depth;
    window.history.go(-depth);
  }, []);

  return { release };
}
