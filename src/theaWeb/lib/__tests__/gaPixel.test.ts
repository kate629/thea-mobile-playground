import {
  gaPageView,
  gaQuizResultsViewed,
  gaQuizSearchSubmitted,
  gaSelectItem,
} from '../gaPixel';

const mockIsBot = jest.fn<boolean, []>();

jest.mock('../botDetect', () => ({
  isBot: () => mockIsBot(),
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
    test('fires gtag("event", "page_view") with page_location + page_path', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...ORIGINAL_LOCATION,
          href: 'https://example.com/quiz?step=2',
          pathname: '/quiz',
          search: '?step=2',
        },
        writable: true,
      });
      gaPageView();
      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
        page_location: 'https://example.com/quiz?step=2',
        page_path: '/quiz?step=2',
      });
    });

    test('no-op when gtag is undefined', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;
      expect(() => gaPageView()).not.toThrow();
    });

    test('no-op when isBot() returns true', () => {
      mockIsBot.mockReturnValue(true);
      gaPageView();
      expect(gtag).not.toHaveBeenCalled();
    });
  });

  describe('gaQuizSearchSubmitted', () => {
    test('fires custom event with anonymized funnel params', () => {
      gaQuizSearchSubmitted({
        occasion: 'BIRTHDAY',
        relationship: 'MOM',
        age_bucket: '50s',
        interest_count: 3,
      });
      expect(gtag).toHaveBeenCalledWith('event', 'quiz_search_submitted', {
        occasion: 'BIRTHDAY',
        relationship: 'MOM',
        age_bucket: '50s',
        interest_count: 3,
      });
    });

    test('no-op when gtag is undefined', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;
      expect(() => gaQuizSearchSubmitted({})).not.toThrow();
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
      });
      expect(gtag).toHaveBeenCalledWith('event', 'quiz_results_viewed', {
        occasion: 'JUST_BECAUSE',
        relationship: 'PARTNER',
        age_bucket: '30s',
        interest_count: 2,
        carousel_count: 4,
        product_count: 32,
      });
    });

    test('no-op when gtag is undefined', () => {
      delete (window as unknown as { gtag?: unknown }).gtag;
      expect(() =>
        gaQuizResultsViewed({ carousel_count: 0, product_count: 0 }),
      ).not.toThrow();
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
      // Soft guard — never include name/email/uid/recipientId in pixel params.
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
});
