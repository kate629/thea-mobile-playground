import React from 'react';
import { ResultsPage } from './ResultsPage';
import { ResultsDiscoverTab } from './ResultsDiscoverTab';
import { ResultsCarousel } from './ResultsCarousel';
import { ResultsSavedGrid } from './ResultsSavedGrid';
import { ResultsPurchasedGrid } from './ResultsPurchasedGrid';
import { Button } from '../../ui/Button';
import {
  SAMPLE_RESULTS_CAROUSELS,
  SAMPLE_SAVED_ITEMS,
  SAMPLE_PURCHASED_ITEMS,
} from './sampleResultsData';

export default {
  title: 'Surfaces/Results/ResultsPage',
  component: ResultsPage,
};

const baseHeader = {
  personEmoji: '🌷',
  personName: 'Mom',
  interestsLabel: 'Cooking, Travel +2',
  onProfilePillClick: () => {},
  onTabChange: () => {},
  rightActions: <Button label="Account" variant="ghost" size="md" />,
};

const carouselSlots = (idx: number) =>
  SAMPLE_RESULTS_CAROUSELS[idx].products.map((p) => ({
    item: p,
    state: 'idle' as const,
    liked: false,
  }));

export const DiscoverTab = {
  render: () => (
    <ResultsPage
      {...baseHeader}
      activeTab="recommended"
      likedCount={3}
      purchasedCount={0}
    >
      <ResultsDiscoverTab summary={{ saves: 3, dismissed: 2 }}>
        {SAMPLE_RESULTS_CAROUSELS.map((section, i) => (
          <ResultsCarousel
            key={section.id}
            title={section.title}
            slots={carouselSlots(i)}
            isFirstCarousel={i === 0}
          />
        ))}
      </ResultsDiscoverTab>
    </ResultsPage>
  ),
};

export const SavedTabFilled = {
  render: () => (
    <ResultsPage
      {...baseHeader}
      activeTab="liked"
      likedCount={SAMPLE_SAVED_ITEMS.length}
      purchasedCount={SAMPLE_PURCHASED_ITEMS.length}
    >
      <ResultsSavedGrid items={SAMPLE_SAVED_ITEMS} />
    </ResultsPage>
  ),
};

export const PurchasedTabFilled = {
  render: () => (
    <ResultsPage
      {...baseHeader}
      activeTab="purchased"
      likedCount={SAMPLE_SAVED_ITEMS.length}
      purchasedCount={SAMPLE_PURCHASED_ITEMS.length}
    >
      <ResultsPurchasedGrid items={SAMPLE_PURCHASED_ITEMS} personName="Mom" />
    </ResultsPage>
  ),
};

export const SavedTabEmpty = {
  render: () => (
    <ResultsPage
      {...baseHeader}
      activeTab="liked"
      likedCount={0}
      purchasedCount={0}
    >
      <ResultsSavedGrid items={[]} />
    </ResultsPage>
  ),
};

export const Refreshing = {
  render: () => (
    <ResultsPage
      {...baseHeader}
      activeTab="recommended"
      likedCount={3}
      purchasedCount={0}
    >
      <ResultsDiscoverTab refreshing>
        {SAMPLE_RESULTS_CAROUSELS.map((section, i) => (
          <ResultsCarousel
            key={section.id}
            title={section.title}
            slots={carouselSlots(i)}
            isFirstCarousel={i === 0}
          />
        ))}
      </ResultsDiscoverTab>
    </ResultsPage>
  ),
};
