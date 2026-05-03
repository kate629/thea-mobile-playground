import React, { useRef } from 'react';
import { render, act } from '@testing-library/react';

import {
  useProductImpression,
  _resetProductImpressionForTesting,
} from '../useProductImpression';

const mockLogEvent = jest.fn();
jest.mock('../../lib/eventSink', () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

// IntersectionObserver mock that captures the callback so tests can drive
// entry/exit events directly. Mirrors the pattern in useCarouselImpression.test.
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
    .IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

beforeEach(() => {
  mockLogEvent.mockReset();
  _resetProductImpressionForTesting();
  lastObserverCallback = null;
});

const PARAMS = {
  sessionId: 'sess-1',
  productId: 'prod-1',
  recommendationId: 'rec-1',
  recipientId: 'rcp-1',
  carouselName: 'For Mom',
  cardPosition: 0,
};

interface ProbeProps {
  params?: typeof PARAMS;
  enabled?: boolean;
}

const Probe: React.FC<ProbeProps> = ({ params = PARAMS, enabled = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  useProductImpression(ref, params, enabled);
  return <div ref={ref} data-testid="card" />;
};

function fire(entries: IOEntry[]) {
  act(() => {
    lastObserverCallback?.(entries, {} as IntersectionObserver);
  });
}

describe('useProductImpression', () => {
  test('fires product_impression on EXIT with dwell_ms', () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId('card');
    const t0 = performance.now();
    fire([{ target: el, isIntersecting: true }]);
    // Mock the elapsed dwell by spying on performance.now BEFORE the exit fire.
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(t0 + 1500);
    fire([{ target: el, isIntersecting: false }]);
    nowSpy.mockRestore();

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    const [name, props] = mockLogEvent.mock.calls[0];
    expect(name).toBe('product_impression');
    expect(props).toMatchObject({
      session_id: 'sess-1',
      product_id: 'prod-1',
      recommendation_id: 'rec-1',
      recipient_id: 'rcp-1',
      carousel_name: 'For Mom',
      card_position: 0,
      cycle: 1,
    });
    expect(props.dwell_ms).toBeGreaterThanOrEqual(1000);
  });

  test('filters scroll-throughs (dwell < 250ms) — no event', () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId('card');
    const t0 = performance.now();
    fire([{ target: el, isIntersecting: true }]);
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(t0 + 100);
    fire([{ target: el, isIntersecting: false }]);
    nowSpy.mockRestore();
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  test('caps dwell_ms at 60000 for background-tab pollution', () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId('card');
    const t0 = performance.now();
    fire([{ target: el, isIntersecting: true }]);
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(t0 + 999_999);
    fire([{ target: el, isIntersecting: false }]);
    nowSpy.mockRestore();

    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    const [, props] = mockLogEvent.mock.calls[0];
    expect(props.dwell_ms).toBe(60_000);
  });

  test('caps cycles at 3 per (sessionId, productId)', () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId('card');
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      fire([{ target: el, isIntersecting: true }]);
      const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(t0 + 1000);
      fire([{ target: el, isIntersecting: false }]);
      nowSpy.mockRestore();
    }
    // Cycles 1-3 fire; 4 + 5 are suppressed.
    expect(mockLogEvent).toHaveBeenCalledTimes(3);
    const cycles = mockLogEvent.mock.calls.map((c) => (c[1] as { cycle: number }).cycle);
    expect(cycles).toEqual([1, 2, 3]);
  });

  test('does not double-fire while continuously visible', () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId('card');
    fire([{ target: el, isIntersecting: true }]);
    fire([{ target: el, isIntersecting: true }]);
    expect(mockLogEvent).not.toHaveBeenCalled(); // Still in-flight, no exit yet.
  });

  test('flushes in-flight dwell on visibilitychange → hidden', () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId('card');
    const t0 = performance.now();
    fire([{ target: el, isIntersecting: true }]);
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(t0 + 800);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    nowSpy.mockRestore();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });

  test('flushes in-flight dwell on pagehide', () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId('card');
    const t0 = performance.now();
    fire([{ target: el, isIntersecting: true }]);
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(t0 + 800);
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    nowSpy.mockRestore();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });

  test('fires final exit-equivalent event on unmount of a visible card', () => {
    const { getByTestId, unmount } = render(<Probe />);
    const el = getByTestId('card');
    const t0 = performance.now();
    fire([{ target: el, isIntersecting: true }]);
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(t0 + 600);
    unmount();
    nowSpy.mockRestore();
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });

  test('does not register when enabled is false', () => {
    render(<Probe enabled={false} />);
    expect(mockLogEvent).not.toHaveBeenCalled();
  });
});
