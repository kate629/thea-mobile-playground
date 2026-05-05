import { useEffect, useRef, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';

import { useAuth } from '../firebase/FirebaseContext';
import { useMergeStatus } from './MergeStateContext';

/**
 * "Auth is in flux" — true when a sign-in / link / merge / uid-swap is in
 * progress or has just completed. Consumers use this to defer "no doc"
 * empty-state UIs until listeners have had a chance to re-bind under the
 * new auth state.
 *
 * Why this matters:
 * - On the cross-account merge path, `mergeStatus` is the canonical signal,
 *   but it only flips during the active merge. The post-merge propagation
 *   window (Firestore listeners reattaching, snapshot round-trip) leaves
 *   `mergeStatus === 'merged'` while the page briefly sees `!doc`.
 * - On the link-redirect happy path (anon uid is upgraded in-place), there
 *   is no merge, so `mergeStatus` stays 'idle', but `currentUser` flips
 *   `isAnonymous: true → false` and `onIdTokenChanged` fires. During that
 *   beat the page can also flash an empty state if a snapshot rate-races
 *   the token refresh.
 *
 * The hook combines both signals plus a small grace window after either
 * fires, so consumers can render a spinner during the entire transition
 * instead of a misleading "we couldn't find this" message.
 */
export function useAuthInFlux(graceMs = 4000): boolean {
  const auth = useAuth();
  const mergeStatus = useMergeStatus();
  const [recent, setRecent] = useState(false);
  const prevUidRef = useRef<string | null>(auth.currentUser?.uid ?? null);
  const prevAnonRef = useRef<boolean | null>(
    auth.currentUser?.isAnonymous ?? null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGrace = (): void => {
    setRecent(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setRecent(false);
      timerRef.current = null;
    }, graceMs);
  };

  // Auth-state changes: uid swap (cross-account merge) or anon-flip
  // (linkWithRedirect / linkWithPopup upgrading an anon user in place).
  // onIdTokenChanged fires for both, plus token refreshes — we filter so
  // refreshes alone don't trigger the spinner.
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, (user) => {
      const nextUid = user?.uid ?? null;
      const nextAnon = user?.isAnonymous ?? null;
      const uidChanged = nextUid !== prevUidRef.current;
      const anonChanged = nextAnon !== prevAnonRef.current;
      if (!uidChanged && !anonChanged) return;
      prevUidRef.current = nextUid;
      prevAnonRef.current = nextAnon;
      startGrace();
    });
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  // Merge-state lifecycle: cover both the active merge and the propagation
  // window after it completes.
  useEffect(() => {
    if (mergeStatus === 'merging' || mergeStatus === 'merged') {
      startGrace();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergeStatus]);

  return recent || mergeStatus === 'merging';
}
