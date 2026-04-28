import React from 'react';
import { ResultsProductCard } from './ResultsProductCard';
import { SAMPLE_RESULTS_CAROUSELS } from './sampleResultsData';

export default {
  title: 'Surfaces/Results/ResultsProductCard',
  component: ResultsProductCard,
};

const item = SAMPLE_RESULTS_CAROUSELS[0].products[0];

const wrap = (node: React.ReactNode) => (
  <div style={{ width: 240, padding: 16, background: '#fff' }}>{node}</div>
);

export const Idle = {
  render: () => wrap(<ResultsProductCard item={item} liked={false} />),
};

export const Liked = {
  render: () => wrap(<ResultsProductCard item={item} liked />),
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [liked, setLiked] = React.useState(false);
    return wrap(
      <ResultsProductCard
        item={item}
        liked={liked}
        onSaveClick={() => setLiked((v) => !v)}
        onDismiss={() => alert('Dismissed')}
        onMarkPurchased={() => alert('Marked purchased')}
      />,
    );
  },
};

/**
 * Card rendered at the size of a real mobile carousel slot (~150px). Pairs
 * with the bug #21 fix — the overflow menu must clamp inside the card
 * boundary even when the card is narrow. Use the Live variant below to open
 * the menu interactively.
 */
export const MobileSlot = {
  render: () => (
    <div style={{ width: 150, padding: 16, background: '#fff', overflow: 'hidden' }}>
      <ResultsProductCard item={item} liked={false} />
    </div>
  ),
};

export const MobileSlotLive = {
  parameters: { happo: false },
  render: () => (
    <div style={{ width: 150, padding: 16, background: '#fff', overflow: 'hidden' }}>
      <ResultsProductCard
        item={item}
        liked={false}
        onMarkPurchased={() => alert('Marked purchased')}
      />
    </div>
  ),
};
