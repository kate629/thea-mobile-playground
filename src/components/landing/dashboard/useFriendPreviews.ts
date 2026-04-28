import { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import { db as defaultDb } from '../../../firebaseConfig';
import { giftActivityCollectionPath } from '../../../theaWeb/schemas/paths';
import { AuthState, FriendPreviewLoader } from './types';

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
 * When auth state flips to `signed-in`, subscribes to every personId in
 * `personIds` exactly once. When `personIds` changes, removed ids are
 * unsubscribed, new ids are added.
 */
export function useFriendPreviews(
  authState: AuthState,
  personIds: string[],
  loader: FriendPreviewLoader,
): FriendPreviewsSlice {
  const [previews, setPreviews] = useState<Record<string, string[]>>({});
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const subsRef = useRef<Map<string, () => void>>(new Map());

  // Joined into a string so the effect's dep is content-equal across
  // renders that pass a fresh array reference with the same ids. Without
  // this the effect re-runs every render, which combined with state writes
  // produces an infinite render loop.
  const personIdsKey = personIds.slice().sort().join(',');

  useEffect(() => {
    if (authState.status !== 'signed-in') {
      // Tear down any active subscriptions; clear maps. The hook returns
      // empty maps until auth flips back to signed-in. Functional updaters
      // return the SAME reference when already empty so React bails out and
      // we don't trigger a re-render → effect → state-write loop.
      subsRef.current.forEach((unsub) => unsub());
      subsRef.current.clear();
      setPreviews((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      setResolved((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    const desired = new Set(personIds);
    // Unsubscribe ids that left the desired set.
    subsRef.current.forEach((unsub, id) => {
      if (!desired.has(id)) {
        unsub();
        subsRef.current.delete(id);
      }
    });

    // Subscribe to ids we don't yet track.
    personIds.forEach((id) => {
      if (subsRef.current.has(id)) return;
      const unsub = loader.subscribe(id, (urls) => {
        setPreviews((prev) => ({ ...prev, [id]: urls.slice(0, 4) }));
        setResolved((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
      });
      subsRef.current.set(id, unsub);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.status, personIdsKey, loader]);

  // Clean up on unmount.
  useEffect(() => {
    const subs = subsRef.current;
    return () => {
      subs.forEach((unsub) => unsub());
      subs.clear();
    };
  }, []);

  return { previews, resolved };
}

/**
 * Build a `FriendPreviewLoader` that subscribes to a signed-in user's
 * `theaWebUser/{uid}/recipient/{recipientId}/giftActivity` subcollection
 * filtered to `state == 'SAVED'`, mapping each doc to its frozen
 * `productSnapshot.imageUrl`.
 *
 * The image URL is read off the giftActivity doc itself — no second
 * fetch into `product/{id}` is needed, because `theaWebRecordActivity`
 * freezes the productSnapshot at heart time. This keeps the homepage
 * grid to a single per-recipient subscription.
 */
export function createFirestoreFriendPreviewLoader(
  uid: string,
  firestore: Firestore = defaultDb,
): FriendPreviewLoader {
  return {
    subscribe: (recipientId, cb) => {
      const ref = collection(
        firestore,
        ...giftActivityCollectionPath(uid, recipientId),
      );
      const q = query(ref, where('state', '==', 'SAVED'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const urls: string[] = [];
          snap.forEach((d) => {
            const data = d.data() as {
              productSnapshot?: { imageUrl?: string };
            };
            const url = data.productSnapshot?.imageUrl;
            if (url) urls.push(url);
          });
          cb(urls);
        },
        () => {
          // On permission errors, treat as empty (resolved with no images)
          // so the tile renders the emoji fallback rather than spinning.
          cb([]);
        },
      );
      return unsub;
    },
  };
}

/**
 * Stable cached loader per uid. Multiple components reading the same uid
 * share one loader instance so `useFriendPreviews`'s effect (which depends
 * on loader identity) doesn't re-fire on every render.
 */
const loaderCache = new Map<string, FriendPreviewLoader>();
export function getFirestoreFriendPreviewLoader(uid: string): FriendPreviewLoader {
  let loader = loaderCache.get(uid);
  if (!loader) {
    loader = createFirestoreFriendPreviewLoader(uid);
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
  return useMemo(() => (uid ? getFirestoreFriendPreviewLoader(uid) : null), [uid]);
}
