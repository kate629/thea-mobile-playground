import { useEffect, useRef, useState } from 'react';
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
