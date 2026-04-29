/**
 * Thin, typed wrappers around `window.fbq` for the Meta pixel events theaWeb
 * fires. The pixel snippet itself is loaded by `public/index.html`; these
 * helpers exist to:
 *
 *   - Centralize the "is fbq actually loaded yet?" + bot-detection guards so
 *     callers don't sprinkle the same `typeof` check at every fire site.
 *   - Give each event a typed param interface so we don't quietly drift the
 *     vocabulary across surfaces.
 *   - Defer every fire to `requestIdleCallback` so analytics never blocks
 *     paint, INP, or LCP (analytics handoff §16 perf budget rule #1).
 *   - Keep params PII-free (no name, email, uid, recipientId). Funnel
 *     anonymized params only — Kate may tweak the shape before paid spend.
 *
 * Pixel ID 2511117595971258 (set in public/index.html).
 */
import { isBot } from './botDetect';
import { fireWhenIdle } from './idleCallback';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function canFire(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq !== 'undefined' && !isBot();
}

/** Standard PageView. Fired by `usePageTracking` on every route change. */
export function metaPageView(): void {
  fireWhenIdle(() => {
    if (!canFire()) return;
    window.fbq?.('track', 'PageView');
  });
}

/** Anonymized funnel params — kept PII-free deliberately. */
export interface QuizSearchSubmittedParams {
  occasion?: string;
  relationship?: string;
  age_bucket?: string;
  interest_count?: number;
  /** Whether the freeform "tell us more" field was filled in. */
  has_freeform?: boolean;
  /** From recipient.gender. */
  gender?: string;
}

/** Custom event — fired when the quiz submit callable resolves successfully. */
export function metaQuizSearchSubmitted(params: QuizSearchSubmittedParams): void {
  fireWhenIdle(() => {
    if (!canFire()) return;
    window.fbq?.('trackCustom', 'QuizSearchSubmitted', params);
  });
}

export interface QuizResultsViewedParams {
  occasion?: string;
  relationship?: string;
  age_bucket?: string;
  interest_count?: number;
  carousel_count: number;
  product_count: number;
}

/** Custom event — fired once when the results page first lands a COMPLETED session. */
export function metaQuizResultsViewed(params: QuizResultsViewedParams): void {
  fireWhenIdle(() => {
    if (!canFire()) return;
    window.fbq?.('trackCustom', 'QuizResultsViewed', params);
  });
}

export interface ViewContentParams {
  content_name: string;
  content_ids: string[];
  content_category?: string;
  value?: number;
  currency?: string;
}

/** Standard ViewContent. Fired when a user clicks a product card to open the affiliate URL. */
export function metaViewContent(params: ViewContentParams): void {
  fireWhenIdle(() => {
    if (!canFire()) return;
    window.fbq?.('track', 'ViewContent', params);
  });
}

export interface PromoClickParams {
  promotion_id: string;
  promotion_name: string;
  creative_name: string;
  location_id: string;
}

/**
 * Custom event — Meta mirror of GA4 `select_promotion`. Fired when a banner
 * CTA is clicked. Useful for Meta audience modeling on quiz-engaged users
 * coming from a specific creative.
 */
export function metaPromoClick(params: PromoClickParams): void {
  fireWhenIdle(() => {
    if (!canFire()) return;
    window.fbq?.('trackCustom', 'PromoClick', params);
  });
}

/**
 * Bucketize a numeric age into the coarse buckets we report on. Keeps the
 * pixel param low-cardinality (helpful for Meta's audience modeling) and
 * matches the old codebase's analytics shape.
 */
export function ageBucket(age: number | undefined): string | undefined {
  if (age == null || Number.isNaN(age)) return undefined;
  if (age < 13) return 'under_13';
  if (age < 20) return 'teen';
  if (age < 30) return '20s';
  if (age < 40) return '30s';
  if (age < 50) return '40s';
  if (age < 60) return '50s';
  if (age < 70) return '60s';
  return '70_plus';
}
