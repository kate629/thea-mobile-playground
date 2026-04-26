import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db, ensureAuth } from '../../firebaseConfig';
import type { Recommendation } from '../schemas';

interface UseRecommendationDocResult {
  doc: Recommendation | null;
  loading: boolean;
  error: Error | null;
}

// Subscribes to the recommendation doc at
// `theaWebUser/{uid}/recipient/{recipientId}/recommendation/{recommendationId}`.
// Renders progressively from each snapshot — never gates paint on terminal status.
export function useRecommendationDoc(
  recipientId: string | undefined,
  recommendationId: string | undefined,
): UseRecommendationDocResult {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
      .then((uid) => {
        if (cancelled) return;
        const ref = doc(
          db,
          'theaWebUser',
          uid,
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
  }, [recipientId, recommendationId]);

  return { doc: recommendation, loading, error };
}
