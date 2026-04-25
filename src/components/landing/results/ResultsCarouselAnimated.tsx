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
  onProductClick?: (item: ResultsProductCardItem) => void;
  onSaveClick?: (item: ResultsProductCardItem) => void;
  onDismissFinalize?: (item: ResultsProductCardItem) => void;
  onMarkPurchased?: (item: ResultsProductCardItem) => void;
}

export const ResultsCarouselAnimated: React.FC<ResultsCarouselAnimatedProps> = ({
  title,
  products,
  isFirstCarousel,
  isLiked,
  isHeartFilled,
  isDismissed,
  isPurchased,
  onProductClick,
  onSaveClick,
  onDismissFinalize,
  onMarkPurchased,
}) => {
  const { slots, dismiss } = useResultsCarousel(products, {
    isLiked,
    isDismissed,
    isPurchased,
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
    />
  );
};
