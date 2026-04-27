import { collection, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth, db, ensureAuth } from '../../firebaseConfig';
import { giftActivityCollectionPath } from '../schemas/paths';

interface UseGiftActivitiesResult {
  liked: Set<string>;
  dismissed: Set<string>;
  purchased: Set<string>;
  hydrated: boolean;
  error: Error | null;
}

// Snapshots from Firestore arrive as a fresh Set each time, but content-
// equal snapshots (e.g. metadata-only updates, tab visibility re-deliveries)
// would otherwise churn `liked`/`dismissed`/`purchased` references and
// invalidate every downstream `useCallback`/`useMemo` — including the
// page's exit-animation rising-edge baseline. Compare contents and reuse
// the previous reference when nothing actually changed.
function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  let equal = true;
  a.forEach((x) => {
    if (!b.has(x)) equal = false;
  });
  return equal;
}

function reuseIfEqual(prev: Set<string>, next: Set<string>): Set<string> {
  return setsEqual(prev, next) ? prev : next;
}

// Subscribes to `theaWebUser/{uid}/recipient/{recipientId}/giftActivity`.
// Each snapshot is split into three Sets keyed by `state`. The (uid, recipientId)
// pair is the cache key — on auth uid swap (anon → permanent via mergeGiftFlow)
// the state is reset and the listener re-binds so stale anon ids never bleed
// into the permanent uid's view.
export function useGiftActivities(
  recipientId: string | undefined,
): UseGiftActivitiesResult {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [purchased, setPurchased] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      const nextUid = user?.uid ?? null;
      setUid((prev) => {
        if (prev === nextUid) return prev;
        setLiked(new Set());
        setDismissed(new Set());
        setPurchased(new Set());
        setHydrated(false);
        setError(null);
        return nextUid;
      });
    });
  }, []);

  useEffect(() => {
    if (!recipientId) {
      setHydrated(false);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    setError(null);

    ensureAuth()
      .then((resolvedUid) => {
        if (cancelled) return;
        const ref = collection(
          db,
          ...giftActivityCollectionPath(resolvedUid, recipientId),
        );
        unsubscribe = onSnapshot(
          ref,
          (snap) => {
            if (cancelled) return;
            const nextLiked = new Set<string>();
            const nextDismissed = new Set<string>();
            const nextPurchased = new Set<string>();
            snap.forEach((d) => {
              const state = (d.data() as { state?: string }).state;
              if (state === 'SAVED') nextLiked.add(d.id);
              else if (state === 'DISMISSED') nextDismissed.add(d.id);
              else if (state === 'PURCHASED') nextPurchased.add(d.id);
            });
            setLiked((prev) => reuseIfEqual(prev, nextLiked));
            setDismissed((prev) => reuseIfEqual(prev, nextDismissed));
            setPurchased((prev) => reuseIfEqual(prev, nextPurchased));
            setHydrated(true);
          },
          (err) => {
            if (cancelled) return;
            setError(err);
            setHydrated(true);
          },
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setHydrated(true);
      });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [uid, recipientId]);

  return { liked, dismissed, purchased, hydrated, error };
}
