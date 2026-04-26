import React from 'react';
import { ResultsSavedGrid } from './ResultsSavedGrid';
import { SAMPLE_SAVED_ITEMS } from './sampleResultsData';
import { Button } from '../../ui/Button';

export default {
  title: 'Surfaces/Results/ResultsSavedGrid',
  component: ResultsSavedGrid,
};

const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: '#fff', padding: 16, maxWidth: 1400, margin: '0 auto' }}>
    {children}
  </div>
);

export const Empty = {
  render: () => (
    <Wrap>
      <ResultsSavedGrid items={[]} />
    </Wrap>
  ),
};

export const Filled = {
  render: () => (
    <Wrap>
      <ResultsSavedGrid items={SAMPLE_SAVED_ITEMS} />
    </Wrap>
  ),
};

export const WithTopSlot = {
  render: () => (
    <Wrap>
      <ResultsSavedGrid
        items={SAMPLE_SAVED_ITEMS}
        topSlot={
          <div style={{ marginBottom: 16 }}>
            <Button label="Add custom item" variant="ghost" />
          </div>
        }
      />
    </Wrap>
  ),
};
