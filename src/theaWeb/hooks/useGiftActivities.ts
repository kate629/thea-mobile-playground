import { collection, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth, useDb, useEnsureAuth } from '../firebase/FirebaseContext';
import { giftActivityCollectionPath } from '../schemas/paths';

// Per-activity detail mirrored straight off the frozen `productSnapshot`. Used
// for two consumers: (1) preference primitives fed back into the recommendation
// algo (only needs title/brand), and (2) the Saved/Purchased grids, which need
// the visual fields too so they can render activities whose products are no
// longer in the current carousel sections (e.g. after a regenerate).
export interface GiftActivityDetail {
  id: string;
  title: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  productUrl?: string;
}

interface UseGiftActivitiesResult {
  liked: Set<string>;
  dismissed: Set<string>;
  purchased: Set<string>;
  likedDetails: GiftActivityDetail[];
  dismissedDetails: GiftActivityDetail[];
  purchasedDetails: GiftActivityDetail[];
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

// Same content-equality reuse trick for the detail arrays so callers that
// memoize on the array reference don't churn on identical re-deliveries.
function detailsEqual(a: GiftActivityDetail[], b: GiftActivityDetail[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.title !== y.title ||
      x.brand !== y.brand ||
      x.price !== y.price ||
      x.imageUrl !== y.imageUrl ||
      x.productUrl !== y.productUrl
    ) {
      return false;
    }
  }
  return true;
}

function reuseDetailsIfEqual(
  prev: GiftActivityDetail[],
  next: GiftActivityDetail[],
): GiftActivityDetail[] {
  return detailsEqual(prev, next) ? prev : next;
}

// Subscribes to `theaWebUser/{uid}/recipient/{recipientId}/giftActivity`.
// Each snapshot is split into three Sets keyed by `state`. The (uid, recipientId)
// pair is the cache key — on auth uid swap (anon → permanent via mergeGiftFlow)
// the state is reset and the listener re-binds so stale anon ids never bleed
// into the permanent uid's view.
export function useGiftActivities(
  recipientId: string | undefined,
): UseGiftActivitiesResult {
  const auth = useAuth();
  const db = useDb();
  const ensureAuth = useEnsureAuth();
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [purchased, setPurchased] = useState<Set<string>>(() => new Set());
  const [likedDetails, setLikedDetails] = useState<GiftActivityDetail[]>(() => []);
  const [dismissedDetails, setDismissedDetails] = useState<GiftActivityDetail[]>(() => []);
  const [purchasedDetails, setPurchasedDetails] = useState<GiftActivityDetail[]>(() => []);
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
        setLikedDetails([]);
        setDismissedDetails([]);
        setPurchasedDetails([]);
        setHydrated(false);
        setError(null);
        return nextUid;
      });
    });
  }, [auth]);

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
            const nextLikedDetails: GiftActivityDetail[] = [];
            const nextDismissedDetails: GiftActivityDetail[] = [];
            const nextPurchasedDetails: GiftActivityDetail[] = [];
            snap.forEach((d) => {
              const data = d.data() as {
                state?: string;
                productSnapshot?: {
                  title?: string;
                  brand?: string;
                  price?: number;
                  imageUrl?: string;
                  url?: string;
                };
              };
              const state = data.state;
              const snapshot = data.productSnapshot;
              const title = snapshot?.title ?? '';
              const detail: GiftActivityDetail = { id: d.id, title };
              if (snapshot?.brand) detail.brand = snapshot.brand;
              if (typeof snapshot?.price === 'number') detail.price = snapshot.price;
              if (snapshot?.imageUrl) detail.imageUrl = snapshot.imageUrl;
              if (snapshot?.url) detail.productUrl = snapshot.url;
              if (state === 'SAVED') {
                nextLiked.add(d.id);
                if (title) nextLikedDetails.push(detail);
              } else if (state === 'DISMISSED') {
                nextDismissed.add(d.id);
                if (title) nextDismissedDetails.push(detail);
              } else if (state === 'PURCHASED') {
                nextPurchased.add(d.id);
                if (title) nextPurchasedDetails.push(detail);
              }
            });
            setLiked((prev) => reuseIfEqual(prev, nextLiked));
            setDismissed((prev) => reuseIfEqual(prev, nextDismissed));
            setPurchased((prev) => reuseIfEqual(prev, nextPurchased));
            setLikedDetails((prev) => reuseDetailsIfEqual(prev, nextLikedDetails));
            setDismissedDetails((prev) => reuseDetailsIfEqual(prev, nextDismissedDetails));
            setPurchasedDetails((prev) => reuseDetailsIfEqual(prev, nextPurchasedDetails));
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
  }, [uid, recipientId, db, ensureAuth]);

  return {
    liked,
    dismissed,
    purchased,
    likedDetails,
    dismissedDetails,
    purchasedDetails,
    hydrated,
    error,
  };
}
