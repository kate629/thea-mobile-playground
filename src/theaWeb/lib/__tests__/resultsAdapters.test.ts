import {
  carouselsToSections,
  productToCardItem,
  recipientHeaderProps,
} from '../resultsAdapters';
import type { CarouselSession, Recommendation, RecommendationProduct } from '../../schemas';

const baseDoc = (overrides: Partial<Recommendation> = {}): Recommendation =>
  ({
    recommendationId: 'rec1',
    isActive: true,
    input: { occasion: 'JUST_BECAUSE', interests: [], freeform: '' },
    recipientSnapshot: {
      name: 'Mom',
      relationship: 'MOM',
      isMe: false,
    },
    status: 'PROCESSING',
    mode: 'THOUGHTFUL',
    carouselSessionId: 'uid_rec1',
    _schemaVersion: 1,
    createdAt: null as never,
    updatedAt: null as never,
    ...overrides,
  } as Recommendation);

describe('recipientHeaderProps', () => {
  test('uses snapshot emoji when present', () => {
    const r = recipientHeaderProps(
      baseDoc({
        recipientSnapshot: { name: 'Bestie', relationship: 'FRIEND', isMe: false, emoji: '🎉' },
      }),
    );
    expect(r.personEmoji).toBe('🎉');
    expect(r.personName).toBe('Bestie');
  });

  test('falls back to relationship-based emoji when snapshot omits one', () => {
    expect(recipientHeaderProps(baseDoc()).personEmoji).toBe('🌷'); // Mom
    expect(
      recipientHeaderProps(
        baseDoc({ recipientSnapshot: { name: 'Dad', relationship: 'DAD', isMe: false } }),
      ).personEmoji,
    ).toBe('⛳');
    expect(
      recipientHeaderProps(
        baseDoc({ recipientSnapshot: { name: 'Pal', relationship: 'FRIEND', isMe: false } }),
      ).personEmoji,
    ).toBe('🤝');
  });

  test('isMe overrides relationship and uses Me! emoji', () => {
    const r = recipientHeaderProps(
      baseDoc({ recipientSnapshot: { name: 'Me', relationship: 'OTHER', isMe: true } }),
    );
    expect(r.personEmoji).toBe('🙋');
    expect(r.personName).toBe('Me');
  });

  test('unknown relationship falls back to sparkle', () => {
    const r = recipientHeaderProps(
      baseDoc({
        // @ts-expect-error — covering a defensive path
        recipientSnapshot: { name: 'X', relationship: 'COWORKER', isMe: false },
      }),
    );
    expect(r.personEmoji).toBe('✨');
  });

  test('interestsLabel handles 0/1/2/3+ interests', () => {
    expect(recipientHeaderProps(baseDoc()).interestsLabel).toBe('No interests yet');
    expect(
      recipientHeaderProps(baseDoc({ input: { occasion: 'JUST_BECAUSE', interests: ['cooking'], freeform: '' } }))
        .interestsLabel,
    ).toBe('Cooking');
    expect(
      recipientHeaderProps(
        baseDoc({ input: { occasion: 'JUST_BECAUSE', interests: ['cooking', 'plants'], freeform: '' } }),
      ).interestsLabel,
    ).toBe('Cooking, Plants');
    expect(
      recipientHeaderProps(
        baseDoc({
          input: { occasion: 'JUST_BECAUSE', interests: ['cooking', 'plants', 'books', 'travel'], freeform: '' },
        }),
      ).interestsLabel,
    ).toBe('Cooking, Plants +2');
  });
});

describe('productToCardItem', () => {
  const base: RecommendationProduct = {
    id: 'p1',
    title: 'Title',
    price: 25,
    brand: 'Brand',
    url: 'https://example.com',
  };

  test('prefers mobile CDN, then desktop CDN, then raw images', () => {
    expect(productToCardItem({ ...base, images_cdn_mobile: ['m'], images_cdn: ['d'], images: ['r'] }).imageUrl).toBe('m');
    expect(productToCardItem({ ...base, images_cdn: ['d'], images: ['r'] }).imageUrl).toBe('d');
    expect(productToCardItem({ ...base, images: ['r'] }).imageUrl).toBe('r');
    expect(productToCardItem(base).imageUrl).toBe('');
  });

  test('passes through identifying fields and url', () => {
    const c = productToCardItem(base);
    expect(c).toMatchObject({ id: 'p1', title: 'Title', price: 25, brand: 'Brand', productUrl: 'https://example.com' });
  });

  test('prefers affiliateUrl over plain url when present (bug #30)', () => {
    const wrapped = 'https://redirect.viglink.com?key=k&u=https%3A%2F%2Fexample.com&cuid=p1';
    const c = productToCardItem({ ...base, affiliateUrl: wrapped });
    expect(c.productUrl).toBe(wrapped);
  });

  test('falls back to plain url when affiliateUrl is absent (bug #30)', () => {
    const c = productToCardItem(base);  // no affiliateUrl
    expect(c.productUrl).toBe('https://example.com');
  });
});

describe('carouselsToSections', () => {
  const baseInput = baseDoc().input;
  const baseSnapshot = baseDoc().recipientSnapshot;

  test('honors carouselOrder, skips missing keys, maps products', () => {
    const session: CarouselSession = {
      status: 'PROCESSING',
      carouselOrder: ['gardening', 'ghost', 'cooking'],
      carousels: {
        gardening: {
          displayName: 'Green Thumb',
          products: [{ id: 'p1', title: 'Watering Can', price: 12, images: ['x'] }],
        },
        cooking: { displayName: 'The Kitchen', products: [] },
      },
    };
    const sections = carouselsToSections(session, baseInput, baseSnapshot);
    expect(sections.map((s) => s.id)).toEqual(['gardening', 'cooking']);
    // Both names are 2-word and not in catalog, so the friendly-name fallback
    // returns the agent's displayName as-is (last-resort path).
    expect(sections[0]).toMatchObject({ title: 'Green Thumb' });
    expect(sections[0].products[0]).toMatchObject({ id: 'p1', imageUrl: 'x' });
    expect(sections[1].products).toHaveLength(0);
  });

  test('preserves carousel ordering across the friendly rename', () => {
    const session: CarouselSession = {
      status: 'COMPLETE',
      carouselOrder: ['c_outdoors', 'c_books', 'c_cooking'],
      carousels: {
        c_outdoors: {
          displayName: 'BACKYARD & BEYOND',
          products: [{ id: 'a', title: 'Tent', price: 100, carousel_tags: ['outdoors'] }],
        },
        c_books: {
          displayName: 'ALWAYS LEARNING',
          products: [{ id: 'b', title: 'Novel', price: 15, carousel_tags: ['books'] }],
        },
        c_cooking: {
          displayName: 'IN THE KITCHEN',
          products: [{ id: 'c', title: 'Pan', price: 40, carousel_tags: ['cooking'] }],
        },
      },
    };
    const input: Recommendation['input'] = {
      occasion: 'BIRTHDAY',
      interests: ['Outdoors', 'Books', 'Cooking'],
      freeform: '',
    };
    const snapshot: Recommendation['recipientSnapshot'] = {
      name: 'Mom',
      relationship: 'MOM',
      isMe: false,
    };
    const sections = carouselsToSections(session, input, snapshot);
    expect(sections.map((s) => s.id)).toEqual(['c_outdoors', 'c_books', 'c_cooking']);
  });

  test('chip with no override + no special case falls through to BE displayName unchanged', () => {
    // The dynamic-title resolver does NOT title-case. If the BE writes
    // ALL CAPS, it ships ALL CAPS — fixing voice is the BE's job (or comes
    // through the override map for known chips). The previous PR #64 had
    // an opinionated title-case fallback; we removed it to match the OLD
    // repo's logic.
    const session: CarouselSession = {
      status: 'COMPLETE',
      carouselOrder: ['mystery'],
      carousels: {
        mystery: {
          displayName: 'Cosmic Mystery Box',
          products: [{ id: 'p1', title: 'Thing', price: 10 }],
        },
      },
    };
    const sections = carouselsToSections(session, baseInput, baseSnapshot);
    expect(sections[0].title).toBe('Cosmic Mystery Box');
  });
});
