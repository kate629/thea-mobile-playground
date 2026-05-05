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

// --- User identity ---------------------------------------------------------

const GA_PROPERTY_ID = 'G-KV1K3W6CLJ';

/**
 * Wire the Firebase UID into GA4 via TWO separate channels. Both are needed;
 * neither alone is sufficient for end-to-end per-user analysis.
 *
 *   1. `gtag('config', GA_ID, { user_id })` — GA4's built-in User-ID feature.
 *      Used by GA4 internally to stitch sessions across devices and time for
 *      the same person. NOT exposed as a queryable custom dimension (the
 *      property name `user_id` is reserved by GA4).
 *
 *   2. `gtag('set', 'user_properties', { thea_uid })` — sets a custom
 *      user-scoped property which IS queryable as `customUser:thea_uid` in
 *      the Data API once registered as a custom dimension in GA4 Admin.
 *      The dimension was registered 2026-05-05 with property name `thea_uid`.
 *
 * Why `thea_uid` and not e.g. `firebase_uid`? GA4 reserves these prefixes:
 *   - `firebase_*` (Firebase SDK integration)
 *   - `google_*`   (Google integrations)
 *   - `ga_*`       (GA4 internal)
 *   - `_*`         (leading underscore — GA4 internal)
 * Custom dimensions on those prefixes get rejected with "User property name
 * is not allowed." See `~/git/thea/.claude/rules/gotchas.md` for the full
 * trap explanation.
 *
 * Re-firing for the SAME uid is idempotent at gtag, but the caller (the
 * `useGaUserIdentity` hook) still de-dups on uid change to avoid extra work.
 *
 * IMPORTANT: passing `null` clears BOTH user_id and thea_uid (e.g. on
 * signOut). Without this, GA4 would continue stamping subsequent events
 * with the previous UID even after auth state cleared — leaking the prior
 * user's identifier across browsing sessions on shared devices.
 *
 * `send_page_view: false` mirrors the initial config in `public/index.html`
 * so this re-config never accidentally fires a phantom page_view on every
 * auth state change (auth resolves can re-fire several times per session).
 */
export function gaSetUserId(uid: string | null): void {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') return;
  window.gtag('config', GA_PROPERTY_ID, {
    user_id: uid,
    send_page_view: false,
  });
  window.gtag('set', 'user_properties', {
    thea_uid: uid,
  });
}

/** Firebase Auth provider IDs we expect at the signup boundary. */
export type SignUpMethod =
  | 'password'
  | 'google.com'
  | 'apple.com'
  | 'facebook.com'
  | 'unknown';

export interface GaSignUpParams {
  /** Firebase provider id captured from `user.providerData[0].providerId`. */
  method: SignUpMethod | string;
}

/**
 * Standard GA4 `sign_up` event. Fired exactly once per Firebase UID at the
 * moment the user transitions from anonymous-or-null to a real account.
 *
 * The detection lives in `useGaUserIdentity`, NOT in any individual signup
 * UI handler — there are multiple entry points (heart-tap modal, header
 * button, sticky-footer button, mobile Google redirect callback) and
 * instrumenting each one risks (a) missing future entry points and (b)
 * double-firing when handlers chain through one another. Watching the auth
 * state transition catches every path for free.
 */
export function gaSignUp(params: GaSignUpParams): void {
  fireWhenIdle(() => emit('sign_up', { ...params }));
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

/**
 * Custom event — fired exactly once when the React tree first commits a
 * frame to the DOM. Distinguishes "page literally never rendered" (no
 * event) from "page rendered but user bounced" (event fires). Critical
 * for bounce attribution: a Meta-reported "Landing Page View" without a
 * matching `page_first_render` indicates the React app failed to mount,
 * which happens in some IG/FB webviews.
 */
export function gaFirstRender(): void {
  fireWhenIdle(() =>
    emit('page_first_render', {
      page_path:
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '',
    }),
  );
}

export interface GaQuizSearchSubmittedParams {
  occasion?: string;
  relationship?: string;
  age_range?: string;
  interest_count?: number;
  /** Whether the freeform "tell us more" field was filled in. */
  has_freeform?: boolean;
  /** From recipient.gender — `'female' | 'male' | 'other' | undefined`. */
  gender?: string;
  /** Carousel session id (joins to Firestore for the rollup table). */
  carousel_session_id?: string;
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
  age_range?: string;
  interest_count?: number;
  carousel_count: number;
  product_count: number;
  /** Carousel session id (joins to Firestore). */
  carousel_session_id?: string;
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
  carousel_session_id?: string;
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

// --- Save / dismiss / regenerate (Tier 1b) ---------------------------------

/**
 * Common shape for `product_saved` and `product_dismissed`. The full quiz-input
 * cohort fields are duplicated on every event so the dashboard can group save
 * rate by occasion / relationship / age / gender without joining against the
 * carouselSession doc. The `regenerate_count` lets us answer "are users more
 * likely to save after refreshing their picks?"
 */
export interface GaProductReactionParams {
  product_id: string;
  product_name: string;
  brand?: string;
  price?: number;
  /** Carousel section title the product was in. */
  carousel_name: string;
  /** Zero-based card position within the carousel. */
  card_position: number;
  /** Recipient + occasion cohort fields (from the recommendation doc). */
  relationship?: string;
  occasion?: string;
  gender?: string;
  age_range?: string;
  /** Number of times the user has regenerated picks in this session. 0 if
   *  they're acting on the original results, 1+ after a refresh. */
  regenerate_count: number;
  /** Carousel session id (joins to Firestore for the rollup). */
  carousel_session_id?: string;
}

/** Fired when the user hearts a product on the results page. */
export function gaProductSaved(params: GaProductReactionParams): void {
  fireWhenIdle(() => emit('product_saved', { ...params }));
}

/** Fired when the user dismisses a product on the results page. */
export function gaProductDismissed(params: GaProductReactionParams): void {
  fireWhenIdle(() => emit('product_dismissed', { ...params }));
}

/** Source of a regenerate request — drawer "Update picks" vs sticky "Refresh my picks". */
export type RegeneratePath = 'update_picks_from_drawer' | 'refresh_my_picks_button';

export interface GaRegenerateRecommendationsParams {
  path: RegeneratePath;
  relationship?: string;
  occasion?: string;
  /** Number of carousels in the prior result (denominator for "how much
   *  picks-set changed" analyses). */
  prior_carousel_count: number;
  /** Carousel session id of the recommendation that's being regenerated. */
  carousel_session_id?: string;
}

/**
 * Fired when the user clicks "Update picks" or "Refresh my picks." Just the
 * click event — `_completed` and `_failed` companion events are deferred to
 * Tier 2 (they need funnel-completion analysis we don't have a dashboard for
 * yet). Click-only is enough to denominate the "did this user enter a
 * regenerated state" cohort for save/dismiss-rate comparisons.
 */
export function gaRegenerateRecommendations(
  params: GaRegenerateRecommendationsParams,
): void {
  fireWhenIdle(() => emit('regenerate_recommendations', { ...params }));
}

// --- Results-page product click (v6 dashboard parity) ----------------------

export interface GaQuizResultsProductClickParams {
  product_id: string;
  product_name: string;
  brand?: string;
  price?: number;
  destination_url: string;
  carousel_name: string;
  card_position: number;
  /** Recipient + occasion fields from the recommendation. */
  relationship?: string;
  occasion?: string;
  /** Carousel session id (joins to Firestore + ties click back to the
   *  specific recommendation cohort the dashboard analyses). */
  carousel_session_id?: string;
}

/**
 * Fired alongside the existing `select_item` (kept for GA4 Enhanced Ecommerce)
 * when a user clicks a product on the results page. The v6 dashboard's SQL
 * queries by event name `quiz_results_product_click`; this event is the
 * dashboard-parity companion. See spec §11.11 (decision 12.1).
 */
export function gaQuizResultsProductClick(
  params: GaQuizResultsProductClickParams,
): void {
  fireWhenIdle(() => emit('quiz_results_product_click', { ...params }));
}

// --- Time to first result (LCP-anchored, per §14) --------------------------

export interface GaTimeToFirstResultParams {
  /** T(LCP on results) − T(submit click). The headline metric Kate cares about. */
  time_to_first_result_ms: number;
  /** Sub-timing: T(submitGiftFlow callable resolves) − T(submit click). */
  submit_callable_ms: number;
  /** Sub-timing: T(carouselSession === COMPLETED) − T(submit-callable resolve). */
  agent_phase_ms: number;
  /** Sub-timing: T(LCP on results page) − T(navigate to results). */
  nav_to_lcp_ms: number;
  /** Cohort fields. */
  occasion?: string;
  relationship?: string;
  /** Carousel session id (joins to Firestore for the rollup). */
  carousel_session_id?: string;
}

/**
 * Fired exactly once per recommendation — when the results page captures its
 * Largest Contentful Paint entry. The four sub-timings split the total felt
 * latency into BE submit, agent, and FE-render-to-paint phases so optimization
 * effort can target the biggest contributor. See spec §14.
 *
 * NOTE: this event is anchored to the BROWSER's LCP entry, not the FE's
 * "ready to render" decision. `quiz_results_viewed` already fires on the
 * latter; the two events together let the dashboard distinguish "we thought
 * the page was ready" from "the user actually saw content."
 */
export function gaTimeToFirstResult(params: GaTimeToFirstResultParams): void {
  fireWhenIdle(() => emit('time_to_first_result_ms', { ...params }));
}
