import {
  ageBucket,
  metaPageView,
  metaPromoClick,
  metaQuizResultsViewed,
  metaQuizSearchSubmitted,
  metaViewContent,
} from '../metaPixel';

const mockIsBot = jest.fn<boolean, []>();

jest.mock('../botDetect', () => ({
  isBot: () => mockIsBot(),
}));

// Fire idle callbacks synchronously in tests; deferred behavior is exercised
// by idleCallback.test.ts.
jest.mock('../idleCallback', () => ({
  fireWhenIdle: (fn: () => void) => fn(),
}));

describe('metaPixel', () => {
  let fbq: jest.Mock;

  beforeEach(() => {
    fbq = jest.fn();
    (window as unknown as { fbq?: unknown }).fbq = fbq;
    mockIsBot.mockReset();
    mockIsBot.mockReturnValue(false);
  });

  afterEach(() => {
    delete (window as unknown as { fbq?: unknown }).fbq;
  });

  describe('metaPageView', () => {
    test('fires fbq("track", "PageView") for human visitors with fbq loaded', () => {
      metaPageView();
      expect(fbq).toHaveBeenCalledTimes(1);
      expect(fbq).toHaveBeenCalledWith('track', 'PageView');
    });

    test('no-op when fbq is undefined', () => {
      delete (window as unknown as { fbq?: unknown }).fbq;
      expect(() => metaPageView()).not.toThrow();
    });

    test('no-op when isBot() returns true', () => {
      mockIsBot.mockReturnValue(true);
      metaPageView();
      expect(fbq).not.toHaveBeenCalled();
    });
  });

  describe('metaQuizSearchSubmitted', () => {
    test('fires trackCustom with anonymized funnel params', () => {
      metaQuizSearchSubmitted({
        occasion: 'BIRTHDAY',
        relationship: 'MOM',
        age_bucket: '50s',
        interest_count: 3,
      });
      expect(fbq).toHaveBeenCalledWith('trackCustom', 'QuizSearchSubmitted', {
        occasion: 'BIRTHDAY',
        relationship: 'MOM',
        age_bucket: '50s',
        interest_count: 3,
      });
    });

    test('no-op when fbq is undefined', () => {
      delete (window as unknown as { fbq?: unknown }).fbq;
      expect(() => metaQuizSearchSubmitted({})).not.toThrow();
    });

    test('no-op when bot', () => {
      mockIsBot.mockReturnValue(true);
      metaQuizSearchSubmitted({ occasion: 'BIRTHDAY' });
      expect(fbq).not.toHaveBeenCalled();
    });
  });

  describe('metaQuizResultsViewed', () => {
    test('fires trackCustom with carousel + product counts', () => {
      metaQuizResultsViewed({
        occasion: 'JUST_BECAUSE',
        relationship: 'PARTNER',
        age_bucket: '30s',
        interest_count: 2,
        carousel_count: 4,
        product_count: 32,
      });
      expect(fbq).toHaveBeenCalledWith('trackCustom', 'QuizResultsViewed', {
        occasion: 'JUST_BECAUSE',
        relationship: 'PARTNER',
        age_bucket: '30s',
        interest_count: 2,
        carousel_count: 4,
        product_count: 32,
      });
    });

    test('no-op when fbq is undefined', () => {
      delete (window as unknown as { fbq?: unknown }).fbq;
      expect(() =>
        metaQuizResultsViewed({ carousel_count: 0, product_count: 0 }),
      ).not.toThrow();
    });
  });

  describe('metaViewContent', () => {
    test('fires standard ViewContent with content_name + content_ids', () => {
      metaViewContent({
        content_name: 'Hand-painted ceramic mug',
        content_ids: ['prod_123'],
        content_category: 'Cozy mornings',
        value: 42,
        currency: 'USD',
      });
      expect(fbq).toHaveBeenCalledWith('track', 'ViewContent', {
        content_name: 'Hand-painted ceramic mug',
        content_ids: ['prod_123'],
        content_category: 'Cozy mornings',
        value: 42,
        currency: 'USD',
      });
    });

    test('does not include PII keys in default param shape', () => {
      // Soft guard: tests are the place to remember Kate said never include
      // name / email / uid / recipientId in pixel params. The interface
      // doesn't expose those keys; this asserts the wrapper doesn't add any.
      metaViewContent({
        content_name: 'X',
        content_ids: ['a'],
      });
      const args = fbq.mock.calls[0][2] as Record<string, unknown>;
      expect(args).not.toHaveProperty('name');
      expect(args).not.toHaveProperty('email');
      expect(args).not.toHaveProperty('uid');
      expect(args).not.toHaveProperty('recipientId');
    });

    test('no-op when bot', () => {
      mockIsBot.mockReturnValue(true);
      metaViewContent({ content_name: 'X', content_ids: ['a'] });
      expect(fbq).not.toHaveBeenCalled();
    });
  });

  describe('metaPromoClick', () => {
    test('fires trackCustom("PromoClick", params)', () => {
      metaPromoClick({
        promotion_id: 'md_quiz_cta',
        promotion_name: "Mother's Day quiz CTA",
        creative_name: 'mothers_day_banner_v1',
        location_id: 'occasion_mothers_day_mid_carousel',
      });
      expect(fbq).toHaveBeenCalledWith('trackCustom', 'PromoClick', {
        promotion_id: 'md_quiz_cta',
        promotion_name: "Mother's Day quiz CTA",
        creative_name: 'mothers_day_banner_v1',
        location_id: 'occasion_mothers_day_mid_carousel',
      });
    });

    test('no-op when bot', () => {
      mockIsBot.mockReturnValue(true);
      metaPromoClick({
        promotion_id: 'a',
        promotion_name: 'b',
        creative_name: 'c',
        location_id: 'd',
      });
      expect(fbq).not.toHaveBeenCalled();
    });
  });

  describe('ageBucket', () => {
    test.each([
      [undefined, undefined],
      [10, 'under_13'],
      [16, 'teen'],
      [22, '20s'],
      [35, '30s'],
      [45, '40s'],
      [55, '50s'],
      [65, '60s'],
      [72, '70_plus'],
    ])('age %p → %p', (age, expected) => {
      expect(ageBucket(age as number | undefined)).toBe(expected);
    });
  });
});
