import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth, useDb } from '../firebase/FirebaseContext';
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
//
// Tracks uid even though the carouselSessions/{id} path is uid-less: the
// listener's auth token rotates on link/upgrade, and Firestore rules
// re-evaluate against the new uid. Re-binding on swap flushes any stale
// token state.
export function useCarouselSession(carouselSessionId: string | undefined): UseCarouselSessionResult {
  const auth = useAuth();
  const db = useDb();
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [session, setSession] = useState<CarouselSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      const nextUid = user?.uid ?? null;
      setUid((prev) => {
        if (prev === nextUid) return prev;
        setSession(null);
        setLoading(true);
        setError(null);
        return nextUid;
      });
    });
  }, [auth]);

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
  }, [uid, carouselSessionId, db]);

  return { session, loading, error };
}
