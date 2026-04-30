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
import { generateEventId, sendCapiEvent } from './metaCapi';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function canFire(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq !== 'undefined' && !isBot();
}

/**
 * Standard PageView. Fired by `usePageTracking` on every route change.
 *
 * NOTE: PageView is the attribution gate — it's the event Meta uses to
 * record a Landing Page View, which feeds the algorithm's optimization.
 * For this event we DO NOT defer via `fireWhenIdle`, deliberately:
 *
 * fast-bouncing paid-social users leave within 2-3 seconds of click. The
 * idle window often doesn't open in that timeframe on a busy mobile
 * webview, so a deferred PageView fire never reaches Meta even though
 * the user did render the page. Firing synchronously costs ~0.01ms (one
 * push to the fbq queue, since fbevents.js is still loading async at
 * this point) — zero CWV impact, but recovers the bouncer-attribution
 * Meta otherwise can't see.
 *
 * The CAPI mirror (server-side) uses the same `eventId` for dedup, so
 * Meta counts at most once per fire even if both arrive.
 */
export function metaPageView(): void {
  if (!canFire()) return;
  const eventId = generateEventId();
  // 4th arg `eventID` is Meta's documented FE→CAPI dedup key.
  window.fbq?.('track', 'PageView', {}, { eventID: eventId });
  sendCapiEvent('PageView', eventId);
}

/** Anonymized funnel params — kept PII-free deliberately. */
export interface QuizSearchSubmittedParams {
  occasion?: string;
  relationship?: string;
  age_range?: string;
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
  age_range?: string;
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

/** Standard ViewContent. Fired when a user clicks a product card to open the affiliate URL.
 *
 * Mirrored to CAPI (server-side) with shared `eventId` for dedup. ViewContent is
 * Thea's closest analog to a "purchase intent" signal pre-revenue (the click-out
 * goes through Sovrn affiliate); we want Meta to see this event reliably even
 * when iOS ATT or ad blockers stop the FE pixel from attributing it. */
export function metaViewContent(params: ViewContentParams): void {
  if (!canFire()) return;
  const eventId = generateEventId();
  fireWhenIdle(() => {
    window.fbq?.('track', 'ViewContent', params, { eventID: eventId });
  });
  sendCapiEvent('ViewContent', eventId, { customData: params });
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
