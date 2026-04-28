import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useDb } from '../firebase/FirebaseContext';
import { normalizeCarouselSession } from '../lib/normalizeCarouselSession';
import type { CarouselSession } from '../schemas';

interface UseCarouselSessionResult {
  session: CarouselSession | null;
  loading: boolean;
  error: Error | null;
}

// Subscribes to the agent's carouselSessions doc and normalizes its snake_case
// shape into the typed CarouselSession the components consume. Renders
// progressively from each snapshot — never gates paint on terminal status.
//
// Why this is separate from useRecommendationDoc: the agent's progressive
// writes land in carouselSessions, not in the recommendation doc. The
// recommendation doc owns user-scoped metadata (input, recipientSnapshot,
// status); the session doc owns carousel chrome + product stream.
export function useCarouselSession(carouselSessionId: string | undefined): UseCarouselSessionResult {
  const db = useDb();
  const [session, setSession] = useState<CarouselSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!carouselSessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = doc(db, 'carouselSessions', carouselSessionId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const normalized = snap.exists() ? normalizeCarouselSession(snap.data()) : null;
        setSession(normalized);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [carouselSessionId, db]);

  return { session, loading, error };
}
