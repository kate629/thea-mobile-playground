import React, { useRef } from 'react';
import { render, act } from '@testing-library/react';
import { useCarouselImpression } from '../useCarouselImpression';

// Captures the last IntersectionObserver instance + its callback so tests
// can simulate intersection events.
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

// Note: we don't reset lastObserverCallback between tests. The hook caches a
// single module-scoped IntersectionObserver across the whole test suite (by
// design — that's the perf rule), so only the FIRST `new IntersectionObserver`
// call captures a callback. Resetting in afterEach would null out the only
// reference to the live observer's callback, breaking subsequent tests.

function Probe({ onVisible, enabled = true }: { onVisible: () => void; enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useCarouselImpression(ref, onVisible, enabled);
  return <div ref={ref} data-testid="probe" />;
}

describe('useCarouselImpression', () => {
  test('fires onVisible once when the element intersects', () => {
    const onVisible = jest.fn();
    const { getByTestId } = render(<Probe onVisible={onVisible} />);
    const el = getByTestId('probe');

    act(() => {
      lastObserverCallback?.(
        [{ target: el, isIntersecting: true }],
        {} as IntersectionObserver,
      );
    });

    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  test('does not fire on non-intersecting entries', () => {
    const onVisible = jest.fn();
    const { getByTestId } = render(<Probe onVisible={onVisible} />);
    const el = getByTestId('probe');

    act(() => {
      lastObserverCallback?.(
        [{ target: el, isIntersecting: false }],
        {} as IntersectionObserver,
      );
    });

    expect(onVisible).not.toHaveBeenCalled();
  });

  test('does not double-fire on repeated intersections', () => {
    const onVisible = jest.fn();
    const { getByTestId } = render(<Probe onVisible={onVisible} />);
    const el = getByTestId('probe');

    act(() => {
      lastObserverCallback?.(
        [{ target: el, isIntersecting: true }],
        {} as IntersectionObserver,
      );
    });
    act(() => {
      lastObserverCallback?.(
        [{ target: el, isIntersecting: true }],
        {} as IntersectionObserver,
      );
    });

    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  test('does not register when enabled is false', () => {
    const onVisible = jest.fn();
    const { getByTestId } = render(<Probe onVisible={onVisible} enabled={false} />);
    const el = getByTestId('probe');

    act(() => {
      lastObserverCallback?.(
        [{ target: el, isIntersecting: true }],
        {} as IntersectionObserver,
      );
    });

    expect(onVisible).not.toHaveBeenCalled();
  });
});
