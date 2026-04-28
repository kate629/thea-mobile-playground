/**
 * Thin, typed wrappers around `window.gtag` for the Google Analytics 4 events
 * theaWeb fires. The gtag.js snippet itself is loaded by `public/index.html`;
 * these helpers exist for the same reasons as `metaPixel.ts`:
 *
 *   - Centralize the "is gtag actually loaded yet?" + bot-detection guards so
 *     callers don't sprinkle the same `typeof` check at every fire site.
 *   - Give each event a typed param interface so we don't quietly drift the
 *     vocabulary across surfaces.
 *   - Keep params PII-free (no name, email, uid, recipientId).
 *
 * Property ID G-KV1K3W6CLJ (set in public/index.html). Reused from the old
 * givethea.com codebase so historical funnel data stays continuous through
 * the DNS cutover.
 *
 * Custom event names use snake_case to match GA4 convention. `select_item` is
 * GA4's standard recommended event for "user clicked a product card" and is
 * the analogue of Meta's `ViewContent`.
 */
import { isBot } from './botDetect';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function canFire(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag !== 'undefined' && !isBot();
}

/** Standard GA4 page_view. Fired by `usePageTracking` on every route change. */
export function gaPageView(): void {
  if (!canFire()) return;
  window.gtag?.('event', 'page_view', {
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
  });
}

/** Anonymized funnel params — kept PII-free deliberately. Mirrors metaPixel shape. */
export interface GaQuizSearchSubmittedParams {
  occasion?: string;
  relationship?: string;
  age_bucket?: string;
  interest_count?: number;
}

/** Custom event — fired when the quiz submit callable resolves successfully. */
export function gaQuizSearchSubmitted(params: GaQuizSearchSubmittedParams): void {
  if (!canFire()) return;
  window.gtag?.('event', 'quiz_search_submitted', params);
}

export interface GaQuizResultsViewedParams {
  occasion?: string;
  relationship?: string;
  age_bucket?: string;
  interest_count?: number;
  carousel_count: number;
  product_count: number;
}

/** Custom event — fired once when the results page first lands a COMPLETED session. */
export function gaQuizResultsViewed(params: GaQuizResultsViewedParams): void {
  if (!canFire()) return;
  window.gtag?.('event', 'quiz_results_viewed', params);
}

export interface GaSelectItemParams {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  currency?: string;
}

/**
 * Standard GA4 select_item — fired when a user clicks a product card to open
 * the affiliate URL. GA4's recommended-event shape uses an `items` array.
 */
export function gaSelectItem(params: GaSelectItemParams): void {
  if (!canFire()) return;
  const { item_id, item_name, item_category, price, currency } = params;
  window.gtag?.('event', 'select_item', {
    item_list_name: item_category ?? 'quiz_results',
    items: [
      {
        item_id,
        item_name,
        ...(item_category !== undefined ? { item_category } : {}),
        ...(price !== undefined ? { price } : {}),
      },
    ],
    ...(currency !== undefined ? { currency } : {}),
  });
}
