import {
  gaCarouselScroll,
  gaCarouselVisible,
  gaOccasionCardClick,
  gaPageView,
  gaProductClick,
  gaProductDismissed,
  gaProductSaved,
  gaQuizResultsProductClick,
  gaQuizResultsViewed,
  gaQuizSearchSubmitted,
  gaQuizStart,
  gaRegenerateRecommendations,
  gaSelectItem,
  gaSelectPromotion,
  gaTimeToFirstResult,
  gaViewPromotion,
} from '../gaPixel';

const mockIsBot = jest.fn<boolean, []>();

jest.mock('../botDetect', () => ({
  isBot: () => mockIsBot(),
}));

// Fire idle callbacks synchronously in tests so assertions can be sync. The
// production behavior (deferred via requestIdleCallback) is exercised by
// idleCallback.test.ts; here we only care that the right gtag calls happen
// with the right shape.
jest.mock('../idleCallback', () => ({
  fireWhenIdle: (fn: () => void) => fn(),
}));

describe('gaPixel', () => {
  let gtag: jest.Mock;
  const ORIGINAL_LOCATION = window.location;

  beforeEach(() => {
    gtag = jest.fn();
    (window as unknown as { gtag?: unknown }).gtag = gtag;
    mockIsBot.mockReset();
    mockIsBot.mockReturnValue(false);
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    Object.defineProperty(window, 'location', {
      value: ORIGINAL_LOCATION,
      writable: true,
    });
  });

  describe('gaPageView', () => {
    test('fires gtag("event", "page_view") with page_location + page_path + page_type', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...ORIGINAL_LOCATION,
          href: 'https://example.com/quiz?step=2',
          pathname: '/quiz',
          search: '?step=2',
        },
        writable: true,
      });
      gaPageView({ page_type: 'quiz' });
      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
        page_location: 'https://example.com/quiz?step=2',
        page_path: '/quiz?step=2',
        page_type: 'quiz',
      });
    });

    test('includes occasion + guide_visit_number on guide pages', () => {
      gaPageView({
        page_type: 'guide',
        occasion: 'mothers_day',
        guide_visit_number: 2,
      });
      const params = gtag.mock.calls[0][2] as Record<string, unknown>;
      expect(params.page_type).toBe('guide');
      expect(params.occasion).toBe('mothers_day');
      expect(params.guide_visit_number).toBe(2);
    });

    test('omits occasion / guide_visit_number when undefined', () => {
      gaPageView({ page_type: 'home' });
      const params = gtag.mock.calls[0][2] as Record<string, unknown>;
      expect(params).not.toHaveProperty('occasion');
      expect(params).not.toHaveProperty('guide_visit_number');
    });

    test('no-op when gtag is undefined', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;
      expect(() => gaPageView({ page_type: 'home' })).not.toThrow();
    });

    test('no-op when isBot() returns true', () => {
      mockIsBot.mockReturnValue(true);
      gaPageView({ page_type: 'home' });
      expect(gtag).not.toHaveBeenCalled();
    });
  });

  describe('gaQuizStart', () => {
    test('fires custom event with entry_point', () => {
      gaQuizStart({ entry_point: 'homepage_hero' });
      expect(gtag).toHaveBeenCalledWith('event', 'quiz_start', {
        entry_point: 'homepage_hero',
      });
    });

    test('includes occasion when entry_point is guide-derived', () => {
      gaQuizStart({ entry_point: 'sticky_occasion', occasion: 'mothers_day' });
      expect(gtag).toHaveBeenCalledWith('event', 'quiz_start', {
        entry_point: 'sticky_occasion',
        occasion: 'mothers_day',
      });
    });

    test('no-op when bot', () => {
      mockIsBot.mockReturnValue(true);
      gaQuizStart({ entry_point: 'direct' });
      expect(gtag).not.toHaveBeenCalled();
    });
  });

  describe('gaQuizSearchSubmitted', () => {
    test('fires custom event with full param shape', () => {
      gaQuizSearchSubmitted({
        occasion: 'BIRTHDAY',
        relationship: 'MOM',
        age_bucket: '50s',
        interest_count: 3,
        gender: 'female',
        has_freeform: true,
        session_id: 'sess_abc',
        flow_type: 'first_time',
        entry_point: 'homepage_hero',
      });
      expect(gtag).toHaveBeenCalledWith('event', 'quiz_search_submitted', {
        occasion: 'BIRTHDAY',
        relationship: 'MOM',
        age_bucket: '50s',
        interest_count: 3,
        gender: 'female',
        has_freeform: true,
        session_id: 'sess_abc',
        flow_type: 'first_time',
        entry_point: 'homepage_hero',
      });
    });

    test('no-op when bot', () => {
      mockIsBot.mockReturnValue(true);
      gaQuizSearchSubmitted({ occasion: 'BIRTHDAY' });
      expect(gtag).not.toHaveBeenCalled();
    });
  });

  describe('gaQuizResultsViewed', () => {
    test('fires custom event with carousel + product counts', () => {
      gaQuizResultsViewed({
        occasion: 'JUST_BECAUSE',
        relationship: 'PARTNER',
        age_bucket: '30s',
        interest_count: 2,
        carousel_count: 4,
        product_count: 32,
        session_id: 'sess_xyz',
      });
      expect(gtag).toHaveBeenCalledWith('event', 'quiz_results_viewed', {
        occasion: 'JUST_BECAUSE',
        relationship: 'PARTNER',
        age_bucket: '30s',
        interest_count: 2,
        carousel_count: 4,
        product_count: 32,
        session_id: 'sess_xyz',
      });
    });
  });

  describe('gaCarouselVisible', () => {
    test('fires with index/total and carousel name', () => {
      gaCarouselVisible({
        carousel_name: 'tiny fan club',
        carousel_index: 2,
        total_carousels: 8,
        total_cards: 12,
        occasion: 'mothers_day',
      });
      expect(gtag).toHaveBeenCalledWith('event', 'carousel_visible', {
        carousel_name: 'tiny fan club',
        carousel_index: 2,
        total_carousels: 8,
        total_cards: 12,
        occasion: 'mothers_day',
      });
    });
  });

  describe('gaCarouselScroll', () => {
    test('fires with cards_visible + percent_seen threshold', () => {
      gaCarouselScroll({
        carousel_name: 'sentimental grandma',
        carousel_index: 0,
        total_carousels: 8,
        total_cards: 10,
        cards_visible: 5,
        percent_seen: 50,
        occasion: 'mothers_day',
      });
      expect(gtag).toHaveBeenCalledWith('event', 'carousel_scroll', {
        carousel_name: 'sentimental grandma',
        carousel_index: 0,
        total_carousels: 8,
        total_cards: 10,
        cards_visible: 5,
        percent_seen: 50,
        occasion: 'mothers_day',
      });
    });
  });

  describe('gaSelectPromotion + gaViewPromotion', () => {
    const params = {
      promotion_id: 'md_quiz_cta',
      promotion_name: "Mother's Day quiz CTA",
      creative_name: 'mothers_day_banner_v1',
      location_id: 'occasion_mothers_day_mid_carousel',
    };

    test('view fires the standard view_promotion event', () => {
      gaViewPromotion(params);
      expect(gtag).toHaveBeenCalledWith('event', 'view_promotion', params);
    });

    test('select fires the standard select_promotion event', () => {
      gaSelectPromotion(params);
      expect(gtag).toHaveBeenCalledWith('event', 'select_promotion', params);
    });
  });

  describe('gaProductClick', () => {
    test('fires guide-shape product_click', () => {
      gaProductClick({
        product_id: 'p1',
        product_name: "Mother's Day Mug",
        brand: 'Sample Brand',
        price: 24,
        destination_url: 'https://example.com/mug?ref=sovrn',
        occasion: 'mothers_day',
        carousel_name: 'tiny fan club',
        card_position: 0,
      });
      expect(gtag).toHaveBeenCalledWith('event', 'product_click', expect.objectContaining({
        product_id: 'p1',
        carousel_name: 'tiny fan club',
        card_position: 0,
      }));
    });
  });

  describe('gaSelectItem', () => {
    test('fires standard select_item with items array', () => {
      gaSelectItem({
        item_id: 'prod_123',
        item_name: 'Hand-painted ceramic mug',
        item_category: 'Cozy mornings',
        price: 42,
        currency: 'USD',
      });
      expect(gtag).toHaveBeenCalledWith('event', 'select_item', {
        item_list_name: 'Cozy mornings',
        items: [
          {
            item_id: 'prod_123',
            item_name: 'Hand-painted ceramic mug',
            item_category: 'Cozy mornings',
            price: 42,
          },
        ],
        currency: 'USD',
      });
    });

    test('falls back to quiz_results when item_category is missing', () => {
      gaSelectItem({
        item_id: 'prod_123',
        item_name: 'X',
      });
      const args = gtag.mock.calls[0][2] as { item_list_name: string };
      expect(args.item_list_name).toBe('quiz_results');
    });

    test('does not include PII keys', () => {
      gaSelectItem({
        item_id: 'a',
        item_name: 'X',
      });
      const args = gtag.mock.calls[0][2] as Record<string, unknown>;
      expect(args).not.toHaveProperty('name');
      expect(args).not.toHaveProperty('email');
      expect(args).not.toHaveProperty('uid');
      expect(args).not.toHaveProperty('recipientId');
    });

    test('no-op when bot', () => {
      mockIsBot.mockReturnValue(true);
      gaSelectItem({ item_id: 'a', item_name: 'X' });
      expect(gtag).not.toHaveBeenCalled();
    });
  });

  describe('gaOccasionCardClick', () => {
    test('fires with occasion slug', () => {
      gaOccasionCardClick({ occasion: 'birthday' });
      expect(gtag).toHaveBeenCalledWith('event', 'occasion_card_click', {
        occasion: 'birthday',
      });
    });
  });

  describe('gaProductSaved + gaProductDismissed', () => {
    const params = {
      product_id: 'prod_123',
      product_name: 'Hand-painted ceramic mug',
      brand: 'Sample Brand',
      price: 42,
      carousel_name: 'tiny fan club',
      card_position: 2,
      relationship: 'MOM',
      occasion: 'mothers_day',
      gender: 'female',
      age_bucket: '50s',
      regenerate_count: 1,
      session_id: 'sess_abc',
    };

    test('product_saved fires with full cohort + product params', () => {
      gaProductSaved(params);
      expect(gtag).toHaveBeenCalledWith('event', 'product_saved', expect.objectContaining({
        product_id: 'prod_123',
        regenerate_count: 1,
        relationship: 'MOM',
      }));
    });

    test('product_dismissed fires with the same shape', () => {
      gaProductDismissed(params);
      expect(gtag).toHaveBeenCalledWith('event', 'product_dismissed', expect.objectContaining({
        product_id: 'prod_123',
        regenerate_count: 1,
      }));
    });

    test('regenerate_count=0 is preserved (not stripped as falsy)', () => {
      gaProductSaved({ ...params, regenerate_count: 0 });
      const call = gtag.mock.calls.find((c) => c[1] === 'product_saved');
      expect((call?.[2] as Record<string, unknown>).regenerate_count).toBe(0);
    });
  });

  describe('gaRegenerateRecommendations', () => {
    test('fires update_picks_from_drawer path with cohort + prior count', () => {
      gaRegenerateRecommendations({
        path: 'update_picks_from_drawer',
        relationship: 'MOM',
        occasion: 'mothers_day',
        prior_carousel_count: 6,
        session_id: 'sess_xyz',
      });
      expect(gtag).toHaveBeenCalledWith(
        'event',
        'regenerate_recommendations',
        expect.objectContaining({
          path: 'update_picks_from_drawer',
          prior_carousel_count: 6,
        }),
      );
    });

    test('fires refresh_my_picks_button path', () => {
      gaRegenerateRecommendations({
        path: 'refresh_my_picks_button',
        prior_carousel_count: 8,
      });
      const args = gtag.mock.calls.find(
        (c) => c[1] === 'regenerate_recommendations',
      )?.[2] as Record<string, unknown>;
      expect(args.path).toBe('refresh_my_picks_button');
    });
  });

  describe('gaQuizResultsProductClick', () => {
    test('fires v6-shaped event with session_id + cohort', () => {
      gaQuizResultsProductClick({
        product_id: 'p1',
        product_name: 'X',
        brand: 'B',
        price: 30,
        destination_url: 'https://example.com',
        carousel_name: 'tiny fan club',
        card_position: 0,
        relationship: 'MOM',
        occasion: 'mothers_day',
        session_id: 'sess_qrp',
      });
      expect(gtag).toHaveBeenCalledWith(
        'event',
        'quiz_results_product_click',
        expect.objectContaining({
          product_id: 'p1',
          session_id: 'sess_qrp',
        }),
      );
    });
  });

  describe('gaTimeToFirstResult', () => {
    test('fires LCP-anchored timing with all four sub-timings', () => {
      gaTimeToFirstResult({
        time_to_first_result_ms: 4823,
        submit_callable_ms: 1240,
        agent_phase_ms: 2810,
        nav_to_lcp_ms: 773,
        occasion: 'mothers_day',
        relationship: 'MOM',
        session_id: 'sess_lcp',
      });
      expect(gtag).toHaveBeenCalledWith(
        'event',
        'time_to_first_result_ms',
        expect.objectContaining({
          time_to_first_result_ms: 4823,
          submit_callable_ms: 1240,
          agent_phase_ms: 2810,
          nav_to_lcp_ms: 773,
        }),
      );
    });
  });
});
