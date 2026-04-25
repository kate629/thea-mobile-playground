import React from 'react';
import { ResultsPurchasedGrid } from './ResultsPurchasedGrid';
import { SAMPLE_PURCHASED_ITEMS } from './sampleResultsData';

export default {
  title: 'Landing/Results/ResultsPurchasedGrid',
  component: ResultsPurchasedGrid,
};

const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: '#fff', padding: 16, maxWidth: 1400, margin: '0 auto' }}>
    {children}
  </div>
);

export const Empty = {
  render: () => (
    <Wrap>
      <ResultsPurchasedGrid items={[]} personName="Mom" />
    </Wrap>
  ),
};

export const Filled = {
  render: () => (
    <Wrap>
      <ResultsPurchasedGrid items={SAMPLE_PURCHASED_ITEMS} personName="Mom" />
    </Wrap>
  ),
};
