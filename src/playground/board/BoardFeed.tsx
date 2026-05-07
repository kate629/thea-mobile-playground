import React from 'react';
import styled from 'styled-components';
import { ResultsProductCard } from '../../components/landing/results/ResultsProductCard';
import type { ResultsProductCardItem } from '../../components/landing/results/types';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 8px;
  padding: 8px 4px 120px; /* bottom padding clears the sticky Saved panel */
`;

// Hide the X dismiss button only inside the playground BoardFeed — the shared
// ResultsProductCard component stays untouched so the upstream port-back diff
// is clean. Targets the iOS-HIG hit-area button by aria-label.
const CardWrap = styled.div`
  & button[aria-label='Remove item'] { display: none !important; }
`;

interface BoardFeedProps {
  products: ResultsProductCardItem[];
  isLiked: (id: string) => boolean;
  onSaveClick: (item: ResultsProductCardItem, sourceEl: HTMLElement | null) => void;
  onProductClick: (item: ResultsProductCardItem) => void;
  onMarkPurchased?: (item: ResultsProductCardItem) => void;
}

export const BoardFeed: React.FC<BoardFeedProps> = ({
  products,
  isLiked,
  onSaveClick,
  onProductClick,
  onMarkPurchased,
}) => (
  <Grid>
    {products.map((p, i) => (
      <CardWrap key={p.id} data-product-id={p.id}>
        <ResultsProductCard
          item={p}
          liked={isLiked(p.id)}
          priority={i < 2}
          onClick={() => onProductClick(p)}
          onSaveClick={() => {
            const el = document.querySelector<HTMLElement>(
              `[data-product-id="${p.id}"] img`,
            );
            onSaveClick(p, el);
          }}
          onMarkPurchased={onMarkPurchased ? () => onMarkPurchased(p) : undefined}
        />
      </CardWrap>
    ))}
  </Grid>
);
