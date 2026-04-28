import {
  firstCarouselImageUrls,
  liveImagesFromSession,
  occasionSampleImages,
  quizDisplayOccasionToEnum,
} from '../loadingAmbientImages';
import type { CarouselSession } from '../../schemas';

const baseSession = (overrides: Partial<CarouselSession> = {}): CarouselSession => ({
  status: 'PROCESSING',
  carouselOrder: [],
  carousels: {},
  ...overrides,
});

describe('liveImagesFromSession', () => {
  test('returns empty array when session is null', () => {
    expect(liveImagesFromSession(null)).toEqual([]);
  });

  test('returns empty array when no carousels populated yet', () => {
    expect(liveImagesFromSession(baseSession())).toEqual([]);
  });

  test('flattens products from all carousels in carouselOrder (bug #57)', () => {
    const session = baseSession({
      carouselOrder: ['c1', 'c2'],
      carousels: {
        c1: {
          displayName: 'X',
          products: [
            { id: 'a', title: 't', price: 10, images: ['raw-a'], images_cdn: ['cdn-a'] },
            { id: 'b', title: 't', price: 10, images: ['raw-b'] },
          ],
        },
        c2: {
          displayName: 'Y',
          products: [
            { id: 'c', title: 't', price: 10, images_cdn_mobile: ['m-c'] },
          ],
        },
      },
    });
    const images = liveImagesFromSession(session);
    expect(images).toEqual([
      { original: 'raw-a', cdn: 'cdn-a', cdnMobile: undefined },
      { original: 'raw-b', cdn: undefined, cdnMobile: undefined },
      { original: 'm-c', cdn: undefined, cdnMobile: 'm-c' },
    ]);
  });

  test('skips products with no usable image', () => {
    const session = baseSession({
      carouselOrder: ['c1'],
      carousels: {
        c1: {
          displayName: 'X',
          products: [
            { id: 'noimg', title: 't', price: 10 },
            { id: 'has', title: 't', price: 10, images: ['raw'] },
          ],
        },
      },
    });
    expect(liveImagesFromSession(session).map((i) => i.original)).toEqual(['raw']);
  });

  test('respects carouselOrder, skips keys missing from carousels', () => {
    const session = baseSession({
      carouselOrder: ['c1', 'missing', 'c2'],
      carousels: {
        c1: { displayName: 'X', products: [{ id: 'a', title: 't', price: 10, images: ['a'] }] },
        c2: { displayName: 'Y', products: [{ id: 'b', title: 't', price: 10, images: ['b'] }] },
      },
    });
    expect(liveImagesFromSession(session).map((i) => i.original)).toEqual(['a', 'b']);
  });
});

describe('firstCarouselImageUrls', () => {
  test('returns empty array when session is null', () => {
    expect(firstCarouselImageUrls(null, 3)).toEqual([]);
  });

  test('returns empty array when first carousel is missing', () => {
    const session = baseSession({ carouselOrder: ['ghost'], carousels: {} });
    expect(firstCarouselImageUrls(session, 3)).toEqual([]);
  });

  test('takes first N products of FIRST carousel only — bug #50 preload gate', () => {
    const session = baseSession({
      carouselOrder: ['first', 'second'],
      carousels: {
        first: {
          displayName: 'A',
          products: [
            { id: '1', title: 't', price: 10, images: ['r1'] },
            { id: '2', title: 't', price: 10, images: ['r2'] },
            { id: '3', title: 't', price: 10, images: ['r3'] },
            { id: '4', title: 't', price: 10, images: ['r4'] },
          ],
        },
        second: {
          displayName: 'B',
          products: [{ id: '5', title: 't', price: 10, images: ['r5'] }],
        },
      },
    });
    expect(firstCarouselImageUrls(session, 3)).toEqual(['r1', 'r2', 'r3']);
  });

  test('uses same preference order as productToCardItem (cdnMobile > cdn > raw)', () => {
    const session = baseSession({
      carouselOrder: ['first'],
      carousels: {
        first: {
          displayName: 'A',
          products: [
            {
              id: '1',
              title: 't',
              price: 10,
              images: ['raw'],
              images_cdn: ['cdn'],
              images_cdn_mobile: ['mobile'],
            },
          ],
        },
      },
    });
    expect(firstCarouselImageUrls(session, 1)).toEqual(['mobile']);
  });

  test('filters falsy URLs', () => {
    const session = baseSession({
      carouselOrder: ['first'],
      carousels: {
        first: {
          displayName: 'A',
          products: [
            { id: '1', title: 't', price: 10 }, // no images at all
            { id: '2', title: 't', price: 10, images: ['r2'] },
          ],
        },
      },
    });
    expect(firstCarouselImageUrls(session, 3)).toEqual(['r2']);
  });
});

describe('occasionSampleImages', () => {
  test('returns empty array when occasion is undefined', () => {
    expect(occasionSampleImages(undefined)).toEqual([]);
  });

  test('returns curated MOTHERS_DAY products for MOTHERS_DAY occasion (bug #57)', () => {
    const images = occasionSampleImages('MOTHERS_DAY');
    expect(images.length).toBeGreaterThan(10);
    // Most entries should have CDN-hosted Firebase Storage URLs;
    // a few raw/external URLs are acceptable as long as the field is set.
    expect(images.every((i) => typeof i.original === 'string' && i.original.length > 0)).toBe(true);
    const cdnHostedCount = images.filter((i) => i.original.includes('firebasestorage')).length;
    expect(cdnHostedCount).toBeGreaterThan(0);
  });

  test('returns curated BIRTHDAY products for BIRTHDAY occasion', () => {
    const images = occasionSampleImages('BIRTHDAY');
    expect(images.length).toBeGreaterThan(10);
  });

  test('returns curated FATHERS_DAY products for FATHERS_DAY occasion', () => {
    const images = occasionSampleImages('FATHERS_DAY');
    expect(images.length).toBeGreaterThan(0);
  });

  test('returns empty array for occasions with no curated guide', () => {
    // JUST_BECAUSE / CHRISTMAS / VALENTINES_DAY / WEDDING / THANK_YOU /
    // OTHER aren't in the SAMPLE_SECTIONS_BY_OCCASION map. Caller falls
    // back to the global sample set.
    expect(occasionSampleImages('JUST_BECAUSE')).toEqual([]);
    expect(occasionSampleImages('CHRISTMAS')).toEqual([]);
    expect(occasionSampleImages('OTHER')).toEqual([]);
  });
});

describe('quizDisplayOccasionToEnum', () => {
  test('maps quiz display strings to wire enums (bug #57 — Mother\'s Day)', () => {
    expect(quizDisplayOccasionToEnum("Mother's Day")).toBe('MOTHERS_DAY');
    expect(quizDisplayOccasionToEnum("Father's Day")).toBe('FATHERS_DAY');
    expect(quizDisplayOccasionToEnum('Birthday')).toBe('BIRTHDAY');
    expect(quizDisplayOccasionToEnum('Anniversary')).toBe('ANNIVERSARY');
    expect(quizDisplayOccasionToEnum('New Baby')).toBe('NEW_BABY');
    expect(quizDisplayOccasionToEnum('Just Because')).toBe('JUST_BECAUSE');
    expect(quizDisplayOccasionToEnum('Thank You')).toBe('THANK_YOU');
  });

  test('returns undefined for unrecognized or empty input', () => {
    expect(quizDisplayOccasionToEnum(undefined)).toBeUndefined();
    expect(quizDisplayOccasionToEnum('')).toBeUndefined();
    expect(quizDisplayOccasionToEnum('Halloween')).toBeUndefined();
  });
});
