/**
 * Thin, typed wrappers around `window.gtag` for the Google Analytics 4 events
 * theaWeb fires. The gtag.js snippet itself is loaded by `public/index.html`;
 * these helpers exist for the same reasons as `metaPixel.ts`:
 *
 *   - Centralize the "is gtag actually loaded yet?" + bot-detection guards so
 *     callers don't sprinkle the same `typeof` check at every fire site.
 *   - Give each event a typed param interface so we don't quietly drift the
 *     vocabulary across surfaces.
 *   - Defer every fire to `requestIdleCallback` so analytics never blocks
 *     paint, INP, or LCP (analytics handoff §16 perf budget rule #1).
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
import { fireWhenIdle } from './idleCallback';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function canFire(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag !== 'undefined' && !isBot();
}

/** Inner fire — called inside `fireWhenIdle`. Skips when the page is bot-driven. */
function emit(eventName: string, params: Record<string, unknown>): void {
  if (!canFire()) return;
  window.gtag?.('event', eventName, params);
}

// --- Page view --------------------------------------------------------------

export type PageType = 'home' | 'quiz' | 'results' | 'guide' | 'board' | 'other';

export interface GaPageViewParams {
  /** Coarse classification of the route. Drives the dashboard's "% sessions on
   *  guide" and "quiz funnel" filters. */
  page_type: PageType;
  /** Set on guide pages (slug, e.g. `mothers_day`). Undefined elsewhere. */
  occasion?: string;
  /** Per-session counter of guide visits. 1 on first guide hit, 2 on second... */
  guide_visit_number?: number;
}

/**
 * Standard GA4 page_view. Fired by `usePageTracking` on every route change.
 * Enriched with page_type / occasion / guide_visit_number per analytics §3a.
 */
export function gaPageView(params: GaPageViewParams): void {
  fireWhenIdle(() =>
    emit('page_view', {
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      page_path:
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '',
      page_type: params.page_type,
      ...(params.occasion !== undefined ? { occasion: params.occasion } : {}),
      ...(params.guide_visit_number !== undefined
        ? { guide_visit_number: params.guide_visit_number }
        : {}),
    }),
  );
}

// --- Quiz funnel ------------------------------------------------------------

/** Surfaces that initiate quiz entry. Spec §11.1. */
export type QuizEntryPoint =
  | 'homepage_hero'
  | 'sticky_homepage'
  | 'sticky_occasion'
  | 'banner_mothers_day'
  | 'search_pill'
  | 'board_redirect'
  | 'direct';

export interface GaQuizStartParams {
  entry_point: QuizEntryPoint;
  /** Set when entry_point is sticky_occasion or banner_mothers_day. */
  occasion?: string;
}

/** Fired when the user enters the quiz funnel (route mount or SearchPill). */
export function gaQuizStart(params: GaQuizStartParams): void {
  fireWhenIdle(() => emit('quiz_start', { ...params }));
}

export type QuizFlowType = 'first_time' | 'new_recipient';

export interface GaQuizSearchSubmittedParams {
  occasion?: string;
  relationship?: string;
  age_bucket?: string;
  interest_count?: number;
  /** Whether the freeform "tell us more" field was filled in. */
  has_freeform?: boolean;
  /** From recipient.gender — `'female' | 'male' | 'other' | undefined`. */
  gender?: string;
  /** Carousel session id (joins to Firestore for the rollup table). */
  session_id?: string;
  /** Anon user OR signed-in user adding a NEW recipient. */
  flow_type?: QuizFlowType;
  entry_point?: QuizEntryPoint;
}

/** Custom event — fired when the quiz submit callable resolves successfully. */
export function gaQuizSearchSubmitted(params: GaQuizSearchSubmittedParams): void {
  fireWhenIdle(() => emit('quiz_search_submitted', { ...params }));
}

export interface GaQuizResultsViewedParams {
  occasion?: string;
  relationship?: string;
  age_bucket?: string;
  interest_count?: number;
  carousel_count: number;
  product_count: number;
  /** Carousel session id (joins to Firestore). */
  session_id?: string;
}

/** Custom event — fired once when the results page first lands a COMPLETED session. */
export function gaQuizResultsViewed(params: GaQuizResultsViewedParams): void {
  fireWhenIdle(() => emit('quiz_results_viewed', { ...params }));
}

// --- Carousel impression / scroll ------------------------------------------

export interface GaCarouselVisibleParams {
  /** Display title of the carousel (used as the dashboard segment). */
  carousel_name: string;
  /** Zero-based ordinal of this carousel within the page. */
  carousel_index: number;
  /** Total carousels on the page (denominator for "saw N of M" reports). */
  total_carousels: number;
  /** Card count in this specific carousel. */
  total_cards: number;
  /** On guide pages — the slug. On results pages — undefined. */
  occasion?: string;
  /** On results pages — the carouselSession id. On guide pages — undefined. */
  session_id?: string;
}

/** Fired once per session per carousel when ≥50% of the carousel is in view. */
export function gaCarouselVisible(params: GaCarouselVisibleParams): void {
  fireWhenIdle(() => emit('carousel_visible', { ...params }));
}

export interface GaCarouselScrollParams extends GaCarouselVisibleParams {
  /** Number of cards the user has revealed via horizontal scroll. */
  cards_visible: number;
  /** Threshold crossed: 25 / 50 / 75 / 100. */
  percent_seen: 25 | 50 | 75 | 100;
}

/**
 * Fired on each 25/50/75/100% horizontal-scroll threshold within a carousel.
 * Throttled (200ms minimum) at the listener; this helper has no rate-limiting.
 */
export function gaCarouselScroll(params: GaCarouselScrollParams): void {
  fireWhenIdle(() => emit('carousel_scroll', { ...params }));
}

// --- Promotion (banner) -----------------------------------------------------

export interface GaPromotionParams {
  /** Stable identifier for this banner placement. e.g. `md_quiz_cta`. */
  promotion_id: string;
  /** Human-friendly label. e.g. `Mother's Day quiz CTA`. */
  promotion_name: string;
  /** Versioned creative reference. e.g. `mothers_day_banner_v1`. */
  creative_name: string;
  /** Where on the page. e.g. `occasion_mothers_day_mid_carousel`. */
  location_id: string;
}

/** Fired when the banner enters viewport (≥50% visible). */
export function gaViewPromotion(params: GaPromotionParams): void {
  fireWhenIdle(() => emit('view_promotion', { ...params }));
}

/** Fired when the banner CTA is clicked. */
export function gaSelectPromotion(params: GaPromotionParams): void {
  fireWhenIdle(() => emit('select_promotion', { ...params }));
}

// --- Product clicks ---------------------------------------------------------

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
  fireWhenIdle(() => {
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
  });
}

export interface GaProductClickParams {
  product_id: string;
  product_name: string;
  brand?: string;
  price?: number;
  destination_url: string;
  /** On guide pages — the slug. */
  occasion?: string;
  carousel_name: string;
  /** Zero-based card position within the carousel. */
  card_position: number;
}

/**
 * Fired alongside `select_item` for guide-page clicks (occasion-page CTR
 * reporting needs the v6 dashboard event name). On the results page, the
 * companion event is `quiz_results_product_click` (Tier 1b).
 */
export function gaProductClick(params: GaProductClickParams): void {
  fireWhenIdle(() => emit('product_click', { ...params }));
}

// --- Homepage tile ----------------------------------------------------------

export interface GaOccasionCardClickParams {
  occasion: string;
}

/**
 * Fired when a tile in the homepage occasion grid is clicked.
 *
 * Deliberately NOT wrapped in fireWhenIdle: the OccasionTile renders as a
 * plain `<a href>` which triggers a same-tab hard navigation. A deferred
 * fire risks executing AFTER the page begins unloading — at which point
 * `window.gtag` may already be torn down and the event is lost. The cost of
 * firing inline is a single ~0.1ms gtag call on the main thread, which is
 * imperceptible; the alternative (lost events) is much worse for the
 * dashboard's homepage-tile CTR metric.
 */
export function gaOccasionCardClick(params: GaOccasionCardClickParams): void {
  if (!canFire()) return;
  window.gtag?.('event', 'occasion_card_click', { ...params });
}
