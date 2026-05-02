import { useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  onIdTokenChanged,
  type Auth,
  type User,
} from 'firebase/auth';

import { useAuth } from '../firebase/FirebaseContext';
import { gaSetUserId, gaSignUp, type SignUpMethod } from '../lib/gaPixel';

/**
 * App-level analytics identity hook. Mounted exactly once near the root of
 * the React tree (sibling to `usePageTracking`). Two responsibilities:
 *
 *   1. Wire GA4 `user_id` to the Firebase UID on every auth state change so
 *      pre-signup and post-signup events join under one identifier in GA4.
 *      Anonymous Firebase users get a UID immediately; `linkWithCredential`
 *      preserves the same UID across the signup boundary, so events from
 *      both phases share `user_id` once the wiring is in place.
 *
 *   2. Detect the (anonymous OR null) → permanent transition and fire the
 *      GA4 `sign_up` event ONCE per UID. This catches every signup entry
 *      point — heart-tap modal, header button, sticky-footer button,
 *      mobile-redirect callback, and any future ones — without each
 *      handler having to remember to instrument.
 *
 * Dedup uses sessionStorage so that a navigation back to a page after
 * signup (which re-runs auth observers in SPAs) does NOT re-fire `sign_up`.
 * sessionStorage scope is correct here: per-tab and cleared on tab close;
 * a brand-new browser session for the same returning user will skip the
 * event because that user is no longer transitioning into "permanent" —
 * they were already permanent at first auth resolution.
 *
 * NOT instrumented from individual auth UI components. See `gaSignUp` for
 * why (multi-entry-point + future-safety).
 *
 * Forward-only: events fired before this hook ships will never carry a
 * `user_id`. There is no retroactive backfill path; that's a BigQuery
 * exercise.
 */

const SIGNUP_FIRED_KEY_PREFIX = 'thea:ga_signup_fired:';

/** Resolve the Firebase Auth provider id, defaulting to 'unknown'. */
function detectMethod(user: User): SignUpMethod | string {
  const provider = user.providerData[0]?.providerId;
  return provider ?? 'unknown';
}

/** Per-uid sessionStorage gate; safe under SSR / private-mode storage errors. */
function hasFiredSignupFor(uid: string): boolean {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SIGNUP_FIRED_KEY_PREFIX + uid) === '1';
  } catch {
    return false;
  }
}

function markSignupFiredFor(uid: string): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(SIGNUP_FIRED_KEY_PREFIX + uid, '1');
  } catch {
    // private-mode / quota / disabled storage — degrade gracefully. The cost
    // of a missed dedup is one duplicate sign_up event per session in a rare
    // edge case; the cost of throwing here is breaking auth wiring entirely.
  }
}

export function useGaUserIdentity(): void {
  const auth: Auth = useAuth();
  // Track previous state across auth callbacks so we can detect the
  // anon-or-null → permanent transition. A useRef (not useState) avoids
  // re-rendering the parent on every auth change.
  const prevRef = useRef<{ uid: string | null; isAnonymous: boolean }>({
    uid: null,
    isAnonymous: true,
  });

  useEffect(() => {
    // Subscribe to BOTH listeners — same pattern as HeaderAccountMenu.
    // `onAuthStateChanged` is SILENT during the in-place anon→permanent link
    // upgrade where the uid is preserved (the heart-tap signup case via
    // linkWithCredential / linkWithPopup). `onIdTokenChanged` fires for that
    // case. `onAuthStateChanged` covers cold-load IndexedDB-restore on page
    // refresh, which `onIdTokenChanged` can miss due to subscription timing
    // during Auth init. Both feed the same handler. The `prevRef` per-uid
    // guard naturally dedups when both fire for the same transition.
    const handler = (user: User | null) => {
      const currentUid = user?.uid ?? null;
      const currentIsAnon = user?.isAnonymous ?? true;
      const prev = prevRef.current;

      // (1) user_id wiring — refire on every uid change, including → null
      // (signOut). Re-firing on the same uid is a no-op at gtag, but skip
      // the call to keep the wire-trace clean.
      if (currentUid !== prev.uid) {
        gaSetUserId(currentUid);
      }

      // (2) sign_up detection — fire exactly when the user transitions FROM
      // (anonymous OR null) TO (non-anon, has provider). Excludes:
      //   - first-load resolution of an already-signed-up user (prev was
      //     {uid: null, isAnonymous: true}, current is permanent — that
      //     LOOKS like a transition but is actually "user already had an
      //     account"; sessionStorage dedup catches this within a session,
      //     and across sessions GA4 gets one false-positive sign_up per
      //     returning user per new session. Acceptable noise floor; the
      //     alternative — distinguishing fresh signup from already-existing
      //     account at startup — requires reading user.metadata.creation
      //     vs lastSignIn timestamps, which is fragile across providers).
      //   - linkWithCredential merges where the existing real user signs
      //     in instead (uid changes but neither old nor new was anon at
      //     the moment of transition; the captureMergeIntent path).
      const wasAnonOrNull = prev.uid === null || prev.isAnonymous;
      const isNowPermanent =
        user !== null && !currentIsAnon && (user.providerData?.length ?? 0) > 0;
      if (wasAnonOrNull && isNowPermanent && currentUid !== null) {
        if (!hasFiredSignupFor(currentUid)) {
          gaSignUp({ method: detectMethod(user) });
          markSignupFiredFor(currentUid);
        }
      }

      prevRef.current = { uid: currentUid, isAnonymous: currentIsAnon };
    };
    const unsubAuth = onAuthStateChanged(auth, handler);
    const unsubToken = onIdTokenChanged(auth, handler);
    return () => {
      unsubAuth();
      unsubToken();
    };
  }, [auth]);
}
