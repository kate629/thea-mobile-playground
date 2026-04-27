import { useCallback, useMemo, useState } from 'react';
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

const DISMISS_HOLD_MS = 250;  // matches source line 430

/** Presenter for a single carousel. Owns only the dismiss animation queue —
 *  exit ("just liked") animations are driven by `exitingIds` from the caller
 *  so they survive carousel remounts. Renders hidden products while their
 *  animation is in flight so the slot finishes its transform before falling
 *  out of the DOM. */
export function useResultsCarousel(
  products: ResultsProductCardItem[],
  opts: UseResultsCarouselOptions,
): {
  slots: ResultsCarouselSlot[];
  dismiss: (id: string) => void;
} {
  const { isLiked, isDismissed, isPurchased, exitingIds, isHeartFilled } = opts;

  const [dismissingIds, setDismissingIds] = useState<Set<string>>(() => new Set());

  const dismiss = useCallback((id: string) => {
    setDismissingIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, DISMISS_HOLD_MS);
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
