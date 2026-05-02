import React from 'react';
import { ResultsCarousel } from './ResultsCarousel';
import { useResultsCarousel } from './useResultsCarousel';
import { ResultsProductCardItem } from './types';

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
  /** Position of this carousel within the page (0-indexed) — analytics. */
  carouselIndex?: number;
  totalCarousels?: number;
  carouselSessionId?: string;
  /** True only when session.status === 'COMPLETED' upstream — see ResultsCarousel for why. */
  trackingEnabled?: boolean;
}

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
  return (
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
      carouselIndex={carouselIndex}
      totalCarousels={totalCarousels}
      carouselSessionId={carouselSessionId}
      trackingEnabled={trackingEnabled}
    />
  );
};
