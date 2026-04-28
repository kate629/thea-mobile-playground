import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth, useDb, useEnsureAuth } from '../firebase/FirebaseContext';
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
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      const nextUid = user?.uid ?? null;
      setUid((prev) => {
        if (prev === nextUid) return prev;
        // Reset between uids so the page never renders the prior subtree's
        // doc against the new auth context. The next effect run rebinds.
        setRecommendation(null);
        setLoading(true);
        setError(null);
        return nextUid;
      });
    });
  }, [auth]);

  useEffect(() => {
    if (!recipientId || !recommendationId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    setLoading(true);
    setError(null);

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
  }, [uid, recipientId, recommendationId, db, ensureAuth]);

  return { doc: recommendation, loading, error };
}
