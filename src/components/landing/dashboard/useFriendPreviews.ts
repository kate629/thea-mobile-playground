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

  useEffect(() => {
    if (authState.status !== 'signed-in') {
      // Tear down any active subscriptions; clear maps. The hook returns
      // empty maps until auth flips back to signed-in.
      subsRef.current.forEach((unsub) => unsub());
      subsRef.current.clear();
      setPreviews({});
      setResolved({});
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
  }, [authState.status, personIds, loader]);

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
