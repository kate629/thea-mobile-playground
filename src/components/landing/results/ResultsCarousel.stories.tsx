import React from 'react';
import { ResultsCarousel } from './ResultsCarousel';
import { ResultsCarouselAnimated } from './ResultsCarouselAnimated';
import { SAMPLE_RESULTS_CAROUSELS } from './sampleResultsData';

export default {
  title: 'Surfaces/Results/ResultsCarousel',
  component: ResultsCarousel,
};

const Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: '#fff', padding: '16px 16px 24px', maxWidth: 1400, margin: '0 auto' }}>
    {children}
  </div>
);

const products = SAMPLE_RESULTS_CAROUSELS[0].products;

export const Default = {
  render: () => (
    <Wrap>
      <ResultsCarousel
        title={SAMPLE_RESULTS_CAROUSELS[0].title}
        slots={products.map((p) => ({ item: p, state: 'idle', liked: false }))}
        isFirstCarousel
      />
    </Wrap>
  ),
};

export const OneCardLiked = {
  render: () => (
    <Wrap>
      <ResultsCarousel
        title={SAMPLE_RESULTS_CAROUSELS[0].title}
        slots={products.map((p, i) => ({
          item: p,
          state: 'idle',
          liked: i === 0,
        }))}
      />
    </Wrap>
  ),
};

export const OneCardExiting = {
  render: () => (
    <Wrap>
      <ResultsCarousel
        title={SAMPLE_RESULTS_CAROUSELS[0].title}
        slots={products.map((p, i) => ({
          item: p,
          state: i === 1 ? 'exiting' : 'idle',
          liked: i === 1,
        }))}
      />
    </Wrap>
  ),
};

export const OneCardDismissing = {
  render: () => (
    <Wrap>
      <ResultsCarousel
        title={SAMPLE_RESULTS_CAROUSELS[0].title}
        slots={products.map((p, i) => ({
          item: p,
          state: i === 2 ? 'dismissing' : 'idle',
          liked: false,
        }))}
      />
    </Wrap>
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [liked, setLiked] = React.useState<Set<string>>(new Set());
    const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
    return (
      <Wrap>
        <ResultsCarouselAnimated
          title={SAMPLE_RESULTS_CAROUSELS[0].title}
          products={products}
          isFirstCarousel
          isLiked={(id) => liked.has(id)}
          isDismissed={(id) => dismissed.has(id)}
          isPurchased={() => false}
          exitingIds={new Set()}
          onSaveClick={(p) => {
            setLiked((prev) => {
              const next = new Set(prev);
              next.add(p.id);
              return next;
            });
          }}
          onDismissFinalize={(p) => {
            setDismissed((prev) => {
              const next = new Set(prev);
              next.add(p.id);
              return next;
            });
          }}
          onMarkPurchased={(p) => alert(`Marked ${p.title} purchased`)}
        />
      </Wrap>
    );
  },
};
