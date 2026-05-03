import React, { useMemo, useRef } from 'react';
import { ResultsCarousel } from './ResultsCarousel';
import { useResultsCarousel } from './useResultsCarousel';
import { ResultsProductCardItem } from './types';
import { useProductImpression } from '../../../theaWeb/hooks/useProductImpression';

export interface ResultsCarouselImpressionContext {
  sessionId?: string;
  recommendationId?: string;
  recipientId?: string;
  /** Cohort fields propagated onto every per-card impression for join-free
   *  analysis in BigQuery. */
  relationship?: string;
  occasion?: string;
  ageRange?: string;
  gender?: string;
  regenerateCount?: number;
}

export interface ResultsCarouselAnimatedProps {
  title: string;
  products: ResultsProductCardItem[];
  isFirstCarousel?: boolean;
  /** Persisted likes — drives carousel filter. */
  isLiked: (id: string) => boolean;
  /** All likes including pending — drives heart-icon fill. Defaults to isLiked. */
  isHeartFilled?: (id: string) => boolean;
  isDismissed: (id: string) => boolean;
  isPurchased: (id: string) => boolean;
  /** Page-owned set of ids currently mid-exit-animation. Lifted out of the
   *  hook so the animation survives carousel remount on tab-switch. */
  exitingIds: Set<string>;
  onProductClick?: (item: ResultsProductCardItem) => void;
  onSaveClick?: (item: ResultsProductCardItem) => void;
  onDismissFinalize?: (item: ResultsProductCardItem) => void;
  onMarkPurchased?: (item: ResultsProductCardItem) => void;
  /** Ranker-telemetry context. Threaded through to per-card impression events
   *  alongside `card_position` and `carousel_name` so the BQ row carries
   *  every cohort dim without joining back to the recommendation doc. */
  impressionContext?: ResultsCarouselImpressionContext;
  /** Position of this carousel within the page (0-indexed) — analytics. */
  carouselIndex?: number;
  totalCarousels?: number;
  carouselSessionId?: string;
  /** True only when session.status === 'COMPLETED' upstream — see ResultsCarousel for why. */
  trackingEnabled?: boolean;
}

/**
 * Mounts the per-card impression hook with the given ref. Returns null —
 * the actual card is rendered by ResultsCarousel; this component exists
 * solely to give each card its own hook stack so we can register N cards
 * without violating the rules of hooks.
 */
const CardImpressionTracker: React.FC<{
  cardRef: React.RefObject<HTMLDivElement | null>;
  sessionId: string;
  productId: string;
  cardPosition: number;
  carouselName: string;
  context: ResultsCarouselImpressionContext;
}> = ({ cardRef, sessionId, productId, cardPosition, carouselName, context }) => {
  useProductImpression(cardRef, {
    sessionId,
    productId,
    cardPosition,
    carouselName,
    recommendationId: context.recommendationId,
    recipientId: context.recipientId,
    relationship: context.relationship,
    occasion: context.occasion,
    ageRange: context.ageRange,
    gender: context.gender,
    regenerateCount: context.regenerateCount,
  });
  return null;
};

export const ResultsCarouselAnimated: React.FC<ResultsCarouselAnimatedProps> = ({
  title,
  products,
  isFirstCarousel,
  isLiked,
  isHeartFilled,
  isDismissed,
  isPurchased,
  exitingIds,
  onProductClick,
  onSaveClick,
  onDismissFinalize,
  onMarkPurchased,
  impressionContext,
  carouselIndex,
  totalCarousels,
  carouselSessionId,
  trackingEnabled,
}) => {
  const { slots, dismiss } = useResultsCarousel(products, {
    isLiked,
    isDismissed,
    isPurchased,
    exitingIds,
    isHeartFilled,
  });

  // One ref per product id, persisted across renders. Trackers register with
  // these refs; ResultsCarousel attaches them to the card root via getCardRef.
  // Stale entries (cards that no longer exist) are pruned on each render so
  // the map doesn't grow unboundedly across carousel regenerates.
  const refMap = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());
  const enabled = !!impressionContext?.sessionId;

  const trackerEntries = useMemo(() => {
    if (!enabled) return [] as Array<{
      id: string;
      ref: React.RefObject<HTMLDivElement | null>;
      position: number;
    }>;
    const present = new Set<string>();
    const entries: Array<{
      id: string;
      ref: React.RefObject<HTMLDivElement | null>;
      position: number;
    }> = [];
    products.forEach((p, i) => {
      present.add(p.id);
      let ref = refMap.current.get(p.id);
      if (!ref) {
        ref = React.createRef<HTMLDivElement>();
        refMap.current.set(p.id, ref);
      }
      entries.push({ id: p.id, ref, position: i });
    });
    refMap.current.forEach((_, key) => {
      if (!present.has(key)) refMap.current.delete(key);
    });
    return entries;
  }, [products, enabled]);

  const getCardRef = enabled
    ? (productId: string) => refMap.current.get(productId)
    : undefined;

  return (
    <>
      {enabled && impressionContext?.sessionId
        ? trackerEntries.map((entry) => (
            <CardImpressionTracker
              key={entry.id}
              cardRef={entry.ref}
              sessionId={impressionContext.sessionId as string}
              productId={entry.id}
              cardPosition={entry.position}
              carouselName={title}
              context={impressionContext}
            />
          ))
        : null}
      <ResultsCarousel
        title={title}
        slots={slots}
        isFirstCarousel={isFirstCarousel}
        onProductClick={onProductClick}
        onSaveClick={onSaveClick}
        onDismiss={(item) => {
          dismiss(item.id);
          // Finalization timer fires inside the hook; caller's onDismissFinalize
          // is invoked from here AFTER the dismiss-animation hold so the parent
          // can mark the item as dismissed in its own state without flickering.
          setTimeout(() => onDismissFinalize?.(item), 250);
        }}
        onMarkPurchased={onMarkPurchased}
        getCardRef={getCardRef}
        carouselIndex={carouselIndex}
        totalCarousels={totalCarousels}
        carouselSessionId={carouselSessionId}
        trackingEnabled={trackingEnabled}
      />
    </>
  );
};
