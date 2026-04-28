import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { useAuth, useDb, useEnsureAuth } from '../firebase/FirebaseContext';
import { useMergeStatus } from '../auth/MergeStateContext';
import type { Recommendation } from '../schemas';

interface UseRecommendationDocResult {
  doc: Recommendation | null;
  loading: boolean;
  error: Error | null;
}

// Subscribes to the recommendation doc at
// `theaWebUser/{uid}/recipient/{recipientId}/recommendation/{recommendationId}`.
// Renders progressively from each snapshot — never gates paint on terminal status.
//
// uid is tracked reactively: on auth-state change (anon → permanent via
// linkWithPopup, or cross-account merge that swaps uid) the listener re-binds
// against the new uid's subtree. Without this, mergeGiftFlow's delete of the
// anon source doc fires `!exists()` on the old subscription and the page
// renders "couldn't find this recommendation" — same root cause as the
// useGiftActivities pattern this mirrors.
export function useRecommendationDoc(
  recipientId: string | undefined,
  recommendationId: string | undefined,
): UseRecommendationDocResult {
  const auth = useAuth();
  const db = useDb();
  const ensureAuth = useEnsureAuth();
  const mergeStatus = useMergeStatus();
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const prevMergeStatusRef = useRef(mergeStatus);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      const nextUid = user?.uid ?? null;
      setUid((prev) => {
        if (prev === nextUid) return prev;
        return nextUid;
      });
    });
  }, [auth]);

  useEffect(() => {
    if (!recipientId || !recommendationId) {
      setLoading(false);
      return;
    }

    // Sheet bug #58: while the anon → permanent merge is in flight the
    // permanent uid's subtree is empty (mergeGiftFlow hasn't run yet) and
    // the anon subtree is being deleted. Subscribing now would render
    // "we couldn't find this recommendation" between auth-flip and merge-
    // complete. Hold the prior doc state instead — when mergeStatus flips
    // to 'merged'/'failed'/'idle' this effect re-runs and binds at the
    // permanent uid.
    if (mergeStatus === 'merging') {
      prevMergeStatusRef.current = mergeStatus;
      return;
    }

    // When resuming after a merge, the new uid's doc is a 1:1 copy of the
    // old uid's. Keep the prior doc visible until the new listener fires —
    // a few hundred ms of stale-but-identical data is invisible, while a
    // reset-to-loading would flash a spinner mid-page right after sign-in.
    const resumingAfterMerge = prevMergeStatusRef.current === 'merging';
    prevMergeStatusRef.current = mergeStatus;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    if (!resumingAfterMerge) {
      setRecommendation(null);
      setLoading(true);
      setError(null);
    }

    ensureAuth()
      .then((resolvedUid) => {
        if (cancelled) return;
        const ref = doc(
          db,
          'theaWebUser',
          resolvedUid,
          'recipient',
          recipientId,
          'recommendation',
          recommendationId,
        );
        unsubscribe = onSnapshot(
          ref,
          (snap) => {
            if (cancelled) return;
            setRecommendation(snap.exists() ? (snap.data() as Recommendation) : null);
            setLoading(false);
          },
          (err) => {
            if (cancelled) return;
            setError(err);
            setLoading(false);
          },
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [uid, recipientId, recommendationId, db, ensureAuth, mergeStatus]);

  return { doc: recommendation, loading, error };
}
