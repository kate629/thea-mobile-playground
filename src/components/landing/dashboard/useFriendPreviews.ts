import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, type Firestore } from 'firebase/firestore';
import { useDb } from '../../../theaWeb/firebase/FirebaseContext';
import { giftActivityCollectionPath } from '../../../theaWeb/schemas/paths';
import { AuthState, DashboardPerson, FriendPreviewLoader } from './types';

export interface FriendPreviewsSlice {
  /** personId → top-N image URLs. */
  previews: Record<string, string[]>;
  /** personId → true once the first snapshot has resolved. */
  resolved: Record<string, boolean>;
}

/**
 * Auth-aware preview hook. Skips ALL subscription work when `authState`
 * is anything other than `signed-in` — verified by the unit test that
 * asserts the loader's `subscribe` is never called pre-auth.
 *
 * When auth state flips to `signed-in`, subscribes to every person in
 * `people` exactly once. When `people` changes (id added, removed, or a
 * person's `currentRecommendationId` flips), subscriptions are torn down
 * and re-created so the waterfall re-evaluates against the new active
 * recommendation.
 */
export function useFriendPreviews(
  authState: AuthState,
  people: DashboardPerson[],
  loader: FriendPreviewLoader,
): FriendPreviewsSlice {
  const [previews, setPreviews] = useState<Record<string, string[]>>({});
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  // Per-person bookkeeping: the active unsubscribe + the recommendationId we
  // subscribed against. When the recommendationId changes we tear down the
  // old subscription so the waterfall re-evaluates with the new carousel.
  const subsRef = useRef<
    Map<string, { unsub: () => void; currentRecommendationId: string | undefined }>
  >(new Map());

  // Joined into a string so the effect's dep is content-equal across
  // renders that pass a fresh array reference with the same contents.
  // Includes recommendationId so a flip re-subscribes.
  const peopleKey = people
    .map((p) => `${p.id}::${p.currentRecommendationId ?? ''}`)
    .sort()
    .join(',');

  useEffect(() => {
    if (authState.status !== 'signed-in') {
      // Tear down any active subscriptions; clear maps. Functional updaters
      // return the SAME reference when already empty so React bails out and
      // we don't trigger a re-render → effect → state-write loop.
      subsRef.current.forEach((entry) => entry.unsub());
      subsRef.current.clear();
      setPreviews((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      setResolved((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    const desired = new Set(people.map((p) => p.id));
    // Unsubscribe ids that left the desired set.
    subsRef.current.forEach((entry, id) => {
      if (!desired.has(id)) {
        entry.unsub();
        subsRef.current.delete(id);
      }
    });

    // Subscribe (or re-subscribe on recommendationId change).
    people.forEach((person) => {
      const existing = subsRef.current.get(person.id);
      if (
        existing &&
        existing.currentRecommendationId === person.currentRecommendationId
      ) {
        return; // already subscribed against the right recommendation
      }
      if (existing) {
        existing.unsub();
      }
      const unsub = loader.subscribe(person.id, person.currentRecommendationId, (urls) => {
        setPreviews((prev) => ({ ...prev, [person.id]: urls.slice(0, 4) }));
        setResolved((prev) => (prev[person.id] ? prev : { ...prev, [person.id]: true }));
      });
      subsRef.current.set(person.id, {
        unsub,
        currentRecommendationId: person.currentRecommendationId,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.status, peopleKey, loader]);

  // Clean up on unmount.
  useEffect(() => {
    const subs = subsRef.current;
    return () => {
      subs.forEach((entry) => entry.unsub());
      subs.clear();
    };
  }, []);

  return { previews, resolved };
}

/**
 * Build a `FriendPreviewLoader` that runs the sheet bug #61 waterfall:
 *
 *   1. `carouselSessions/{uid}_{recommendationId}` — top 4 product images
 *      from the recipient's currently-active recommendation. Skipped when
 *      `currentRecommendationId` is undefined.
 *   2. `theaWebUser/{uid}/recipient/{rid}/giftActivity` filtered to
 *      `state == 'SAVED'` — top 4 frozen `productSnapshot.imageUrl`s.
 *   3. Same path filtered to `state == 'PURCHASED'`.
 *   4. Empty (caller renders the emoji fallback).
 *
 * All three sources are subscribed concurrently; the loader emits the
 * highest-priority non-empty result on each fire. The first source that
 * has 4 images wins — but if recommendation generation hasn't populated
 * carousels yet (or the user has no SAVED items), the next layer fills in.
 */
export function createFirestoreFriendPreviewLoader(
  uid: string,
  firestore: Firestore,
): FriendPreviewLoader {
  return {
    subscribe: (recipientId, currentRecommendationId, cb) => {
      let recommendedImages: string[] = [];
      let savedImages: string[] = [];
      let purchasedImages: string[] = [];

      const emit = () => {
        if (recommendedImages.length > 0) {
          cb(recommendedImages);
        } else if (savedImages.length > 0) {
          cb(savedImages);
        } else if (purchasedImages.length > 0) {
          cb(purchasedImages);
        } else {
          cb([]);
        }
      };

      const unsubs: Array<() => void> = [];

      // 1. Carousel session — only when there's an active recommendation.
      if (currentRecommendationId) {
        const sessionRef = doc(
          firestore,
          'carouselSessions',
          `${uid}_${currentRecommendationId}`,
        );
        unsubs.push(
          onSnapshot(
            sessionRef,
            (snap) => {
              recommendedImages = snap.exists()
                ? extractCarouselImages(snap.data() as CarouselSessionDoc)
                : [];
              emit();
            },
            () => {
              recommendedImages = [];
              emit();
            },
          ),
        );
      }

      // 2/3. Gift activity — single listener, bucket by state in JS so we
      // only open one subscription per recipient instead of two.
      const activityCol = collection(
        firestore,
        ...giftActivityCollectionPath(uid, recipientId),
      );
      unsubs.push(
        onSnapshot(
          activityCol,
          (snap) => {
            const saved: string[] = [];
            const purchased: string[] = [];
            snap.forEach((d) => {
              const data = d.data() as {
                state?: string;
                productSnapshot?: { imageUrl?: string };
              };
              const url = data.productSnapshot?.imageUrl;
              if (!url) return;
              if (data.state === 'SAVED') saved.push(url);
              else if (data.state === 'PURCHASED') purchased.push(url);
            });
            savedImages = saved;
            purchasedImages = purchased;
            emit();
          },
          () => {
            // On permission errors, treat as empty so the waterfall falls
            // through cleanly rather than spinning.
            savedImages = [];
            purchasedImages = [];
            emit();
          },
        ),
      );

      return () => unsubs.forEach((u) => u());
    },
  };
}

interface CarouselSessionProduct {
  images?: string[];
  images_cdn?: string[];
  images_cdn_mobile?: string[];
}

interface CarouselSessionDoc {
  carousels?: Record<string, { products?: CarouselSessionProduct[] }>;
}

/**
 * Walk the carousel session's nested products and return up to 4 image
 * URLs. Tries `images[0]` first (canonical), falls back to `images_cdn[0]`
 * and `images_cdn_mobile[0]` per the recommendation schema — old sessions
 * may have CDN-variant slots populated without the canonical `images`
 * field, so reading only `images` would silently return empty for them
 * (the original source of sheet bug #61's emoji-only tiles for old boards).
 */
function extractCarouselImages(session: CarouselSessionDoc): string[] {
  const out: string[] = [];
  const carousels = session.carousels ?? {};
  for (const carousel of Object.values(carousels)) {
    for (const product of carousel.products ?? []) {
      const url =
        product.images?.[0] ??
        product.images_cdn?.[0] ??
        product.images_cdn_mobile?.[0];
      if (url) {
        out.push(url);
        if (out.length >= 4) return out;
      }
    }
  }
  return out;
}

/**
 * Stable cached loader per uid. Multiple components reading the same uid
 * share one loader instance so `useFriendPreviews`'s effect (which depends
 * on loader identity) doesn't re-fire on every render.
 */
const loaderCache = new Map<string, FriendPreviewLoader>();
export function getFirestoreFriendPreviewLoader(
  uid: string,
  firestore: Firestore,
): FriendPreviewLoader {
  let loader = loaderCache.get(uid);
  if (!loader) {
    loader = createFirestoreFriendPreviewLoader(uid, firestore);
    loaderCache.set(uid, loader);
  }
  return loader;
}

/** Test helper. */
export function __resetFriendPreviewLoaderCache(): void {
  loaderCache.clear();
}

/**
 * `useMemo` wrapper that returns a stable loader bound to the current uid.
 * Returns `null` when there is no signed-in uid yet — callers should pass
 * the `signed-out` AuthState so `useFriendPreviews` no-ops.
 */
export function useFirestoreFriendPreviewLoader(
  uid: string | null,
): FriendPreviewLoader | null {
  const db = useDb();
  return useMemo(() => (uid ? getFirestoreFriendPreviewLoader(uid, db) : null), [uid, db]);
}
