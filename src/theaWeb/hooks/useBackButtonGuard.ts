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
  /** Disarms the guard and actually navigates back one step.
   *  Wire to the leave-warning AlertDialog's primary "Leave" action so
   *  confirming the warning lets the original back-nav proceed. */
  release: () => void;
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
  const disarmedRef = useRef(false);
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
      if (disarmedRef.current) {
        // Caller consumed the guard via release() — let this popstate
        // through so the actual back-nav can proceed.
        disarmedRef.current = false;
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
        disarmedRef.current = true;
        window.history.back();
      }
    };
  }, [enabled]);

  const release = useCallback(() => {
    if (typeof window === 'undefined') return;
    disarmedRef.current = true;
    window.history.back();
  }, []);

  return { release };
}
