import { useEffect, useRef, useState } from 'react';

/** Drives a "just liked" exit animation queue keyed off rising-edge
 *  transitions of the BE-owned `liked` Set. The Set is the authoritative
 *  state from the Firestore listener (`useGiftActivities`), so on hydration
 *  it arrives already-populated. We must NOT animate that initial wave —
 *  every persisted save would slide out, leaving white gaps.
 *
 *  Seed signal is `hydrated`. The baseline is (re-)seeded whenever
 *  `hydrated` flips:
 *  - false → true on first hydration of an epoch (initial mount, or after
 *    uid swap which resets `hydrated` back to false in useGiftActivities)
 *  - true → false on uid swap, prepping for the next re-hydration
 *
 *  Between seedings, any id in `liked` not in the previous baseline is
 *  "newly liked" and gets queued for the slide-out animation duration.
 *
 *  Lives at page-level (not inside the carousel) so it survives carousel
 *  unmounts on tab switch (Discover ↔ Saved). */
export function useExitAnimationQueue(
  liked: Set<string>,
  hydrated: boolean,
  durationMs: number,
): Set<string> {
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const prevLikedRef = useRef<Set<string>>(new Set());
  const wasHydratedRef = useRef(false);

  useEffect(() => {
    if (wasHydratedRef.current !== hydrated) {
      prevLikedRef.current = new Set(liked);
      wasHydratedRef.current = hydrated;
      return;
    }

    const newlyLiked: string[] = [];
    liked.forEach((id) => {
      if (!prevLikedRef.current.has(id)) newlyLiked.push(id);
    });
    prevLikedRef.current = new Set(liked);
    if (newlyLiked.length === 0) return;

    setExitingIds((prev) => {
      const next = new Set(prev);
      newlyLiked.forEach((id) => next.add(id));
      return next;
    });

    const timers = newlyLiked.map((id) =>
      setTimeout(() => {
        setExitingIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, durationMs),
    );
    return () => timers.forEach(clearTimeout);
  }, [liked, hydrated, durationMs]);

  return exitingIds;
}
