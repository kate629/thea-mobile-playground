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
