import React from 'react';
import { render, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../theme';
import { ResultsCarousel } from '../ResultsCarousel';
import { SAMPLE_RESULTS_CAROUSELS } from '../sampleResultsData';

/**
 * Tests for the carousel_visible / carousel_scroll instrumentation added to
 * ResultsCarousel. The shared IntersectionObserver is mocked here too.
 *
 * Note: useCarouselImpression caches its observer at module scope across the
 * whole jest suite. The first test in the suite that mounts a tracked
 * component will create the observer and capture its callback into
 * `lastObserverCallback`; subsequent mounts piggyback on that observer.
 */

type IOEntry = { target: Element; isIntersecting: boolean };
let lastObserverCallback:
  | ((entries: IOEntry[], obs: IntersectionObserver) => void)
  | null = null;

class MockIntersectionObserver {
  callback: (entries: IOEntry[], obs: IntersectionObserver) => void;
  observed: Set<Element>;
  constructor(cb: (entries: IOEntry[], obs: IntersectionObserver) => void) {
    this.callback = cb;
    this.observed = new Set();
    lastObserverCallback = cb;
  }
  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  (window as unknown as { IntersectionObserver: typeof IntersectionObserver })
    .IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

// Fire idle callbacks synchronously so emitted GA events land in `gtag` mock.
jest.mock('../../../../theaWeb/lib/idleCallback', () => ({
  fireWhenIdle: (fn: () => void) => fn(),
}));
jest.mock('../../../../theaWeb/lib/botDetect', () => ({ isBot: () => false }));

const SAMPLE_PRODUCTS = SAMPLE_RESULTS_CAROUSELS[0].products;
const slots = SAMPLE_PRODUCTS.map((p) => ({
  item: p,
  state: 'idle' as const,
  liked: false,
}));

function renderTracked(opts: {
  trackingEnabled: boolean;
  carouselIndex?: number;
  totalCarousels?: number;
  carouselSessionId?: string;
}) {
  return render(
    <ThemeProvider theme={theme}>
      <ResultsCarousel
        title="Plants for Mom"
        slots={slots}
        carouselIndex={opts.carouselIndex}
        totalCarousels={opts.totalCarousels}
        carouselSessionId={opts.carouselSessionId}
        trackingEnabled={opts.trackingEnabled}
      />
    </ThemeProvider>,
  );
}

function fireAllVisibilityForLastRender() {
  // Walk the observed set and fire intersecting=true for each. Since multiple
  // tests may have mounted into the same observer, we just fire for everything
  // currently observed; the once-per-element gate inside the hook handles
  // any duplicates from prior tests.
  const observer = (lastObserverCallback as unknown) as null | ((
    entries: IOEntry[],
    obs: IntersectionObserver,
  ) => void);
  if (!observer) return;
  const targets = Array.from(
    document.querySelectorAll('[data-tracked-section], section, div'),
  );
  observer(
    targets.map((target) => ({ target, isIntersecting: true })),
    {} as IntersectionObserver,
  );
}

describe('ResultsCarousel analytics', () => {
  let gtag: jest.Mock;

  beforeEach(() => {
    gtag = jest.fn();
    (window as unknown as { gtag?: unknown }).gtag = gtag;
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  test('does NOT fire carousel_visible when trackingEnabled=false', () => {
    renderTracked({ trackingEnabled: false, carouselIndex: 0, totalCarousels: 5 });
    act(() => fireAllVisibilityForLastRender());
    const visibleCalls = gtag.mock.calls.filter(
      (c) => c[0] === 'event' && c[1] === 'carousel_visible',
    );
    expect(visibleCalls).toHaveLength(0);
  });

  test('does NOT fire when carouselIndex / totalCarousels missing even if trackingEnabled=true', () => {
    renderTracked({ trackingEnabled: true });
    act(() => fireAllVisibilityForLastRender());
    const visibleCalls = gtag.mock.calls.filter(
      (c) => c[0] === 'event' && c[1] === 'carousel_visible',
    );
    expect(visibleCalls).toHaveLength(0);
  });

  test('fires carousel_visible with carousel_session_id when fully wired', () => {
    renderTracked({
      trackingEnabled: true,
      carouselIndex: 2,
      totalCarousels: 7,
      carouselSessionId: 'sess-abc',
    });
    act(() => fireAllVisibilityForLastRender());
    const visibleCalls = gtag.mock.calls.filter(
      (c) => c[0] === 'event' && c[1] === 'carousel_visible',
    );
    expect(visibleCalls.length).toBeGreaterThanOrEqual(1);
    const lastParams = visibleCalls[visibleCalls.length - 1][2];
    expect(lastParams).toMatchObject({
      carousel_name: 'Plants for Mom',
      carousel_index: 2,
      total_carousels: 7,
      total_cards: slots.length,
      carousel_session_id: 'sess-abc',
    });
    // No `occasion` param on results-page carousels
    expect(lastParams.occasion).toBeUndefined();
  });
});
