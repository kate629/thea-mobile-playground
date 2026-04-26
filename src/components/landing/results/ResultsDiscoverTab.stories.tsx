import React from 'react';
import { ResultsDiscoverTab } from './ResultsDiscoverTab';
import { ResultsCarousel } from './ResultsCarousel';
import { SAMPLE_RESULTS_CAROUSELS } from './sampleResultsData';

export default {
  title: 'Surfaces/Results/ResultsDiscoverTab',
  component: ResultsDiscoverTab,
};

const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: '#fff', padding: 16, maxWidth: 1400, margin: '0 auto' }}>
    {children}
  </div>
);

const carouselSlots = (sectionIdx: number) =>
  SAMPLE_RESULTS_CAROUSELS[sectionIdx].products.map((p) => ({
    item: p,
    state: 'idle' as const,
    liked: false,
  }));

const renderCarousels = () =>
  SAMPLE_RESULTS_CAROUSELS.map((section, i) => (
    <ResultsCarousel
      key={section.id}
      title={section.title}
      slots={carouselSlots(i)}
      isFirstCarousel={i === 0}
    />
  ));

export const WithCarousels = {
  render: () => (
    <Wrap>
      <ResultsDiscoverTab summary={{ saves: 3, dismissed: 2 }}>
        {renderCarousels()}
      </ResultsDiscoverTab>
    </Wrap>
  ),
};

export const EmptyDueToPriceFilter = {
  render: () => (
    <Wrap>
      <ResultsDiscoverTab empty summary={{ saves: 0, dismissed: 4 }}>
        {null}
      </ResultsDiscoverTab>
    </Wrap>
  ),
};

export const Sparse = {
  render: () => (
    <Wrap>
      <ResultsDiscoverTab sparse summary={{ saves: 5, dismissed: 8 }}>
        <ResultsCarousel
          title={SAMPLE_RESULTS_CAROUSELS[0].title}
          slots={carouselSlots(0).slice(0, 2)}
          isFirstCarousel
        />
      </ResultsDiscoverTab>
    </Wrap>
  ),
};

export const Refreshing = {
  render: () => (
    <Wrap>
      <ResultsDiscoverTab refreshing>{renderCarousels()}</ResultsDiscoverTab>
    </Wrap>
  ),
};

export const WithEndOfSessionCard = {
  render: () => (
    <Wrap>
      <ResultsDiscoverTab summary={{ saves: 7, dismissed: 4 }}>
        {renderCarousels()}
      </ResultsDiscoverTab>
    </Wrap>
  ),
};
