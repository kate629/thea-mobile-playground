import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ResultsCarouselSlot } from './ResultsCarousel';
import { ResultsProductCardItem } from './types';

export interface UseResultsCarouselOptions {
  /** Source of truth for the liked filter. The hook does NOT watch this for
   *  rising-edge transitions — exit animations are driven imperatively by
   *  the page-level click handler (which owns auth gating + commit timing)
   *  via `exitingIds`. Watching `isLiked` here would conflate "user just
   *  clicked" with "BE says liked", and break on carousel remount where
   *  every persisted like would re-animate. */
  isLiked: (id: string) => boolean;
  isDismissed: (id: string) => boolean;
  isPurchased: (id: string) => boolean;
  /** Caller-owned set of ids currently mid-exit-animation. Lifted out of
   *  this hook so it survives tab-switch unmounts (Kate report 2026-04-26:
   *  "white gaps between cards where I've liked a product when I jump
   *  between Discover and Saved"). */
  exitingIds: Set<string>;
  /** Bonus: caller-controlled `liked` flag rendered on each card.
   *  Defaults to `isLiked(id)` if omitted. */
  isHeartFilled?: (id: string) => boolean;
}

// Safety-net timeout: if the BE write fails or the Firestore listener
// never fires, force-clear after this long so the user isn't permanently
// stuck without the card. Generous because the happy path is bounded by
// `isDismissed(id)` flipping true, which we explicitly watch below.
const DISMISS_SAFETY_TIMEOUT_MS = 5000;

/** Presenter for a single carousel. Owns only the dismiss animation queue —
 *  exit ("just liked") animations are driven by `exitingIds` from the caller
 *  so they survive carousel remounts. Renders hidden products while their
 *  animation is in flight so the slot finishes its transform before falling
 *  out of the DOM.
 *
 *  Dismiss flicker (sheet bug #19): a previous version cleared
 *  `dismissingIds` on a fixed 250ms timer, which is shorter than the
 *  Firestore-listener round-trip. After 250ms the slot would transition
 *  from `'dismissing'` (hidden) back to `'idle'` (visible) for a beat,
 *  then re-hide once the listener caught up. The fix is to keep the entry
 *  in `dismissingIds` until `isDismissed(id)` returns true (BE confirmed),
 *  with a long safety timeout for write-failure cases. The slot stays in
 *  `'dismissing'` state — and thus visually hidden — across the entire
 *  optimistic→confirmed window. */
export function useResultsCarousel(
  products: ResultsProductCardItem[],
  opts: UseResultsCarouselOptions,
): {
  slots: ResultsCarouselSlot[];
  dismiss: (id: string) => void;
} {
  const { isLiked, isDismissed, isPurchased, exitingIds, isHeartFilled } = opts;

  const [dismissingIds, setDismissingIds] = useState<Set<string>>(() => new Set());

  // Safety-net timers per id. We don't drop on a fixed short interval (that
  // was the flicker bug); we wait for `isDismissed(id)` to flip true. The
  // timer is purely a write-failure recovery so a stuck id eventually
  // returns to view. Tracked in a ref so it survives renders without
  // triggering them.
  const safetyTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setDismissingIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Schedule the safety-net force-clear. If `isDismissed(id)` flips true
    // first (the happy path), the effect below clears the entry and we
    // cancel this timer in the same pass.
    if (safetyTimers.current.has(id)) {
      clearTimeout(safetyTimers.current.get(id));
    }
    safetyTimers.current.set(
      id,
      setTimeout(() => {
        setDismissingIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        safetyTimers.current.delete(id);
      }, DISMISS_SAFETY_TIMEOUT_MS),
    );
  }, []);

  // Once the BE listener confirms the dismiss (`isDismissed(id)` returns
  // true), drop the optimistic entry. The slot then either gets filtered
  // out entirely (hidden) or — if some product re-enters the visible set
  // for an unrelated reason — at least no longer renders in 'dismissing'
  // state.
  useEffect(() => {
    setDismissingIds((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set(prev);
      prev.forEach((id) => {
        if (isDismissed(id)) {
          next.delete(id);
          changed = true;
          // Cancel the safety timer — we got the BE confirm in time.
          const t = safetyTimers.current.get(id);
          if (t) {
            clearTimeout(t);
            safetyTimers.current.delete(id);
          }
        }
      });
      return changed ? next : prev;
    });
  }, [isDismissed]);

  // Clean up any in-flight safety timers on unmount.
  useEffect(() => {
    const timers = safetyTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const slots = useMemo<ResultsCarouselSlot[]>(() => {
    return products
      .filter((p) => {
        const isHidden = isLiked(p.id) || isPurchased(p.id) || isDismissed(p.id);
        const isAnimatingOut = exitingIds.has(p.id) || dismissingIds.has(p.id);
        return !isHidden || isAnimatingOut;
      })
      .map((p) => {
        const exiting = exitingIds.has(p.id);
        const dismissing = dismissingIds.has(p.id);
        const state = exiting ? 'exiting' : dismissing ? 'dismissing' : 'idle';
        return {
          item: p,
          state,
          liked: isHeartFilled ? isHeartFilled(p.id) : isLiked(p.id),
        } as const;
      });
  }, [products, isLiked, isDismissed, isPurchased, exitingIds, dismissingIds, isHeartFilled]);

  return { slots, dismiss };
}
