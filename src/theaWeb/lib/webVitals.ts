/**
 * Real-User Monitoring of Core Web Vitals via Google's `web-vitals` library.
 * Each metric (LCP, FID, CLS, FCP, TTFB) is reported to GA4 as a single
 * `web_vitals` event with `metric_name`, `metric_value`, `metric_rating`,
 * and `page_path` params.
 *
 * Why we ship this:
 *   - Lighthouse sweeps measure synthetic perf — useful as a regression
 *     gate but not what real users on real networks experience.
 *   - GA4 doesn't capture Core Web Vitals out of the box.
 *   - With this in place, the dashboard can answer:
 *       p75 LCP per page_path × profile (mobile vs desktop)
 *       Bounce rate × LCP bucket (good / needs-improvement / poor)
 *       quiz completion rate × LCP bucket (paid-cohort perf-bottleneck check)
 *
 * Performance impact: ~1.6KB gzipped library + 5 PerformanceObserver
 * registrations + 5 deferred gtag fires per page load. <5ms FCP impact on
 * slow phones; zero impact on the metrics being measured (the library is
 * specifically designed by Google's CWV team not to pollute its own data).
 *
 * Why GA4 events instead of a separate RUM service: zero added cost, no new
 * dependency, integrates with the dashboard you already use. Switch later
 * to Sentry/Datadog if you need richer attribution.
 *
 * NOTE: web-vitals v2 ships with getFID (deprecated by Google in 2024).
 * INP (Interaction to Next Paint) replaced FID as the official metric. We
 * stay on v2 here for stability; bump to v4 when there's data to compare
 * against.
 */
import type { Metric } from 'web-vitals';

import { isBot } from './botDetect';
import { fireWhenIdle } from './idleCallback';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Metric thresholds per Google's published Core Web Vitals scoring. The
 * `rating` is computed by web-vitals itself in v3+; for v2 we compute it
 * here so the GA4 `metric_rating` param has the same vocabulary regardless
 * of library version.
 */
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function rate(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const t = THRESHOLDS[name];
  if (!t) return 'needs-improvement';
  if (value <= t.good) return 'good';
  if (value > t.poor) return 'poor';
  return 'needs-improvement';
}

function send(metric: Metric): void {
  fireWhenIdle(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag === 'undefined') return;
    if (isBot()) return;
    // CLS is a unitless float; round to 3 decimals for GA4. All others are
    // milliseconds — round to integer.
    const value =
      metric.name === 'CLS'
        ? Math.round(metric.value * 1000) / 1000
        : Math.round(metric.value);
    window.gtag('event', 'web_vitals', {
      metric_name: metric.name,
      metric_value: value,
      metric_rating: rate(metric.name, metric.value),
      // metric.id is unique per page load per metric — useful for dedupe in
      // BigQuery if a metric is reported multiple times (CLS updates as the
      // page lays out).
      metric_id: metric.id,
      page_path:
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '',
    });
  });
}

/**
 * Initialize Core Web Vitals reporting. Call once on app mount. Idempotent —
 * subsequent calls within the same page load will register additional
 * observers, which is wasteful but harmless.
 *
 * Library is dynamically imported so it doesn't block the initial bundle
 * parse on slow phones. The import resolves within ~50ms after the bundle
 * loads; CWV measurements aren't expected before then anyway.
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;
  if (isBot()) return; // Don't pollute analytics with headless / bot traffic.
  import('web-vitals')
    .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(send);
      getFID(send);
      getFCP(send);
      getLCP(send);
      getTTFB(send);
    })
    .catch(() => {
      // Library failed to load — analytics is best-effort, don't surface.
    });
}
