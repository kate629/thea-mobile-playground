import React from 'react';
import { render, act } from '@testing-library/react';
import { useTimeToFirstResult } from '../useTimeToFirstResult';

const mockGtag = jest.fn();

jest.mock('../../lib/idleCallback', () => ({
  fireWhenIdle: (fn: () => void) => fn(),
}));
jest.mock('../../lib/botDetect', () => ({ isBot: () => false }));

beforeEach(() => {
  mockGtag.mockReset();
  (window as unknown as { gtag?: unknown }).gtag = mockGtag;
});
afterEach(() => {
  delete (window as unknown as { gtag?: unknown }).gtag;
});

// Capture the most recent PerformanceObserver instance + its callback so
// tests can simulate LCP entries.
type MockEntry = { entryType: string; startTime: number };
let lastObserverCallback:
  | ((list: { getEntries: () => MockEntry[] }) => void)
  | null = null;

class MockPerformanceObserver {
  callback: (list: { getEntries: () => MockEntry[] }) => void;
  constructor(cb: (list: { getEntries: () => MockEntry[] }) => void) {
    this.callback = cb;
    lastObserverCallback = cb;
  }
  observe() {}
  disconnect() {}
  takeRecords() {
    return [] as MockEntry[];
  }
}

(window as unknown as { PerformanceObserver: typeof PerformanceObserver })
  .PerformanceObserver = MockPerformanceObserver as unknown as typeof PerformanceObserver;

// Stub performance.getEntriesByName + getEntriesByType for deterministic test inputs.
function setMarks(submitClick: number | null, submitCallable: number | null) {
  (performance as unknown as { getEntriesByName: (n: string) => MockEntry[] })
    .getEntriesByName = (name: string) => {
    if (name === 'thea-submit-click' && submitClick !== null) {
      return [{ entryType: 'mark', startTime: submitClick }];
    }
    if (name === 'thea-submit-callable-resolve' && submitCallable !== null) {
      return [{ entryType: 'mark', startTime: submitCallable }];
    }
    return [];
  };
}
function setExistingLcp(lcp: number | null) {
  (performance as unknown as { getEntriesByType: (t: string) => MockEntry[] })
    .getEntriesByType = (type: string) =>
      type === 'largest-contentful-paint' && lcp !== null
        ? [{ entryType: 'largest-contentful-paint', startTime: lcp }]
        : [];
}

function Probe(props: {
  isReady: boolean;
  occasion?: string;
  relationship?: string;
  sessionId?: string;
}) {
  useTimeToFirstResult(props);
  return null;
}

describe('useTimeToFirstResult', () => {
  test('fires once when isReady, marks, and LCP all present', () => {
    setMarks(100, 1100);
    setExistingLcp(5000);
    render(
      <Probe isReady={true} occasion="mothers_day" relationship="MOM" sessionId="sess_t1" />,
    );

    const calls = mockGtag.mock.calls.filter((c) => c[1] === 'time_to_first_result_ms');
    expect(calls).toHaveLength(1);
    const params = calls[0][2];
    expect(params.time_to_first_result_ms).toBe(4900); // 5000 - 100
    expect(params.submit_callable_ms).toBe(1000); // 1100 - 100
    expect(params.occasion).toBe('mothers_day');
    expect(params.carousel_session_id).toBe('sess_t1');
  });

  test('does not fire when submit marks are missing (deep link scenario)', () => {
    setMarks(null, null);
    setExistingLcp(5000);
    render(<Probe isReady={true} />);
    const calls = mockGtag.mock.calls.filter((c) => c[1] === 'time_to_first_result_ms');
    expect(calls).toHaveLength(0);
  });

  test('does not fire while isReady is still false', () => {
    setMarks(100, 1100);
    setExistingLcp(5000);
    render(<Probe isReady={false} />);
    const calls = mockGtag.mock.calls.filter((c) => c[1] === 'time_to_first_result_ms');
    expect(calls).toHaveLength(0);
  });

  test('does not double-fire if observer fires twice', () => {
    setMarks(100, 1100);
    setExistingLcp(null);
    render(<Probe isReady={true} occasion="mothers_day" />);
    expect(lastObserverCallback).toBeTruthy();
    act(() => {
      lastObserverCallback?.({
        getEntries: () => [{ entryType: 'largest-contentful-paint', startTime: 5000 }],
      });
    });
    act(() => {
      lastObserverCallback?.({
        getEntries: () => [{ entryType: 'largest-contentful-paint', startTime: 6000 }],
      });
    });
    const calls = mockGtag.mock.calls.filter((c) => c[1] === 'time_to_first_result_ms');
    expect(calls).toHaveLength(1);
  });
});
