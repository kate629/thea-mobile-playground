import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ResultsCarouselSlot } from './ResultsCarousel';
import { ResultsProductCardItem } from './types';

export interface UseResultsCarouselOptions {
  /** Persisted likes only — see anon-heart fix. Pending anon hearts must NOT
   *  hide products from the carousel before sign-in. */
  isLiked: (id: string) => boolean;
  isDismissed: (id: string) => boolean;
  isPurchased: (id: string) => boolean;
  /** Bonus: caller-controlled `liked` flag rendered on each card.
   *  Defaults to `isLiked(id)` if omitted. */
  isHeartFilled?: (id: string) => boolean;
}

const EXITING_HOLD_MS = 1100; // matches source line 310
const DISMISS_HOLD_MS = 250;  // matches source line 430

/** Pure-state hook owning the exit + dismiss animation queues for a single
 *  carousel. Renders the hidden products only while their exit animation is
 *  still in flight, so the slot finishes its transform before falling out
 *  of the DOM. */
export function useResultsCarousel(
  products: ResultsProductCardItem[],
  opts: UseResultsCarouselOptions,
): {
  slots: ResultsCarouselSlot[];
  dismiss: (id: string) => void;
} {
  const { isLiked, isDismissed, isPurchased, isHeartFilled } = opts;

  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(() => new Set());
  const prevLikedRef = useRef<Set<string>>(new Set());

  // Detect rising-edge of `liked` — when a product flips from unliked to
  // liked, queue it for exit animation.
  useEffect(() => {
    const newlyLiked: string[] = [];
    products.forEach((p) => {
      if (isLiked(p.id) && !prevLikedRef.current.has(p.id)) newlyLiked.push(p.id);
    });
    prevLikedRef.current = new Set(products.filter((p) => isLiked(p.id)).map((p) => p.id));
    if (newlyLiked.length === 0) return;
    setExitingIds((prev) => {
      const next = new Set(prev);
      newlyLiked.forEach((id) => next.add(id));
      return next;
    });
    const timers = newlyLiked.map((id) =>
      setTimeout(() => {
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, EXITING_HOLD_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [products, isLiked]);

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
