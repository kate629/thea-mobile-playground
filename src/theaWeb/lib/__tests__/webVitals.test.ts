import type { Metric } from 'web-vitals';

const mockGtag = jest.fn();
const mockIsBot = jest.fn<boolean, []>();
// `mock`-prefixed names are required for jest.mock() factory references
// (Jest hoists the mock above all imports; our test variables can't yet
// exist in module scope when the factory runs).
const mockGetCLS = jest.fn();
const mockGetFID = jest.fn();
const mockGetFCP = jest.fn();
const mockGetLCP = jest.fn();
const mockGetTTFB = jest.fn();

jest.mock('../botDetect', () => ({ isBot: () => mockIsBot() }));
jest.mock('../idleCallback', () => ({
  fireWhenIdle: (fn: () => void) => fn(),
}));
jest.mock(
  'web-vitals',
  () => ({
    getCLS: mockGetCLS,
    getFID: mockGetFID,
    getFCP: mockGetFCP,
    getLCP: mockGetLCP,
    getTTFB: mockGetTTFB,
  }),
  { virtual: true },
);

beforeEach(() => {
  mockGtag.mockReset();
  mockIsBot.mockReset();
  mockIsBot.mockReturnValue(false);
  mockGetCLS.mockReset();
  mockGetFID.mockReset();
  mockGetFCP.mockReset();
  mockGetLCP.mockReset();
  mockGetTTFB.mockReset();
  (window as unknown as { gtag?: unknown }).gtag = mockGtag;
});

afterEach(() => {
  delete (window as unknown as { gtag?: unknown }).gtag;
});

function lcp(value: number): Metric {
  return {
    name: 'LCP' as const,
    value,
    id: 'v3-1234',
    delta: value,
    entries: [],
    rating: 'good' as const,
    navigationType: 'navigate' as const,
  };
}

describe('initWebVitals', () => {
  test('registers all five observers', async () => {
    const { initWebVitals } = await import('../webVitals');
    initWebVitals();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockGetCLS).toHaveBeenCalledTimes(1);
    expect(mockGetFID).toHaveBeenCalledTimes(1);
    expect(mockGetFCP).toHaveBeenCalledTimes(1);
    expect(mockGetLCP).toHaveBeenCalledTimes(1);
    expect(mockGetTTFB).toHaveBeenCalledTimes(1);
  });

  test('skips when bot is detected', async () => {
    mockIsBot.mockReturnValue(true);
    jest.resetModules();
    const { initWebVitals } = await import('../webVitals');
    initWebVitals();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
  });

  test('fires gtag with correct shape on LCP "good" reading', async () => {
    jest.resetModules();
    const { initWebVitals } = await import('../webVitals');
    initWebVitals();
    await new Promise((r) => setTimeout(r, 0));
    const cb = mockGetLCP.mock.calls[0][0] as (m: Metric) => void;
    cb(lcp(2200));
    expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', expect.objectContaining({
      metric_name: 'LCP',
      metric_value: 2200,
      metric_rating: 'good',
      metric_id: 'v3-1234',
    }));
  });

  test('rates LCP buckets per Google thresholds', async () => {
    jest.resetModules();
    const { initWebVitals } = await import('../webVitals');
    initWebVitals();
    await new Promise((r) => setTimeout(r, 0));
    const cb = mockGetLCP.mock.calls[0][0] as (m: Metric) => void;
    cb(lcp(2400));
    cb(lcp(3000));
    cb(lcp(5000));
    const ratings = mockGtag.mock.calls.map(
      (c) => (c[2] as { metric_rating: string }).metric_rating,
    );
    expect(ratings).toEqual(['good', 'needs-improvement', 'poor']);
  });

  test('rounds CLS to 3 decimals (it is a unitless float, not ms)', async () => {
    jest.resetModules();
    const { initWebVitals } = await import('../webVitals');
    initWebVitals();
    await new Promise((r) => setTimeout(r, 0));
    const cb = mockGetCLS.mock.calls[0][0] as (m: Metric) => void;
    cb({
      name: 'CLS' as const,
      value: 0.0876543,
      id: 'cls-1',
      delta: 0,
      entries: [],
      rating: 'good' as const,
      navigationType: 'navigate' as const,
    });
    expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', expect.objectContaining({
      metric_name: 'CLS',
      metric_value: 0.088,
    }));
  });
});
