import { normalizeCarouselSession } from '../normalizeCarouselSession';

describe('normalizeCarouselSession', () => {
  test('returns null for null/undefined input', () => {
    expect(normalizeCarouselSession(null)).toBeNull();
    expect(normalizeCarouselSession(undefined)).toBeNull();
  });

  test('maps lowercase agent status to UPPERCASE FE enum', () => {
    expect(normalizeCarouselSession({ status: 'complete' })?.status).toBe('COMPLETED');
    expect(normalizeCarouselSession({ status: 'error' })?.status).toBe('FAILED');
    expect(normalizeCarouselSession({ status: 'processing' })?.status).toBe('PROCESSING');
    // Intermediate agent states (searching/curating/finalizing) all collapse
    // to PROCESSING — the FE only cares about terminal vs in-flight.
    expect(normalizeCarouselSession({ status: 'searching' })?.status).toBe('PROCESSING');
    expect(normalizeCarouselSession({ status: 'finalizing' })?.status).toBe('PROCESSING');
    expect(normalizeCarouselSession({ status: 'curating' })?.status).toBe('PROCESSING');
  });

  test('maps snake_case carousel_order to camelCase', () => {
    const result = normalizeCarouselSession({
      status: 'processing',
      carousel_order: ['coffee', 'books'],
    });
    expect(result?.carouselOrder).toEqual(['coffee', 'books']);
  });

  test('per-carousel display_name → displayName, products passthrough', () => {
    const result = normalizeCarouselSession({
      status: 'complete',
      carousel_order: ['coffee'],
      carousels: {
        coffee: {
          display_name: 'Coffee Lovers',
          source_type: 'chip_driven', // dropped by munger
          status: 'complete', // dropped by munger
          products: [
            { id: 'p1', title: 'French Press', price: 35 },
            { id: 'p2', title: 'Espresso Cups', price: 25 },
          ],
          product_count: 2, // dropped by munger
        },
      },
    });
    expect(result?.carousels.coffee).toEqual({
      displayName: 'Coffee Lovers',
      products: [
        { id: 'p1', title: 'French Press', price: 35 },
        { id: 'p2', title: 'Espresso Cups', price: 25 },
      ],
    });
  });

  test('error_message and pipeline_timing.total_ms are surfaced', () => {
    const result = normalizeCarouselSession({
      status: 'error',
      error_message: 'agent crashed',
      pipeline_timing: { total_ms: 12345 },
    });
    expect(result?.errorMessage).toBe('agent crashed');
    expect(result?.pipelineTimingMs).toBe(12345);
  });

  test('missing carousels/order yields safe defaults', () => {
    const result = normalizeCarouselSession({ status: 'processing' });
    expect(result?.carousels).toEqual({});
    expect(result?.carouselOrder).toEqual([]);
  });

  test('empty products array means skeleton — paint chrome, render skeleton tiles', () => {
    const result = normalizeCarouselSession({
      status: 'processing',
      carousel_order: ['books'],
      carousels: { books: { display_name: 'Books', products: [] } },
    });
    expect(result?.carousels.books.products).toEqual([]);
    expect(result?.carousels.books.displayName).toBe('Books');
  });

  test('non-string entries in carousel_order are filtered out', () => {
    const result = normalizeCarouselSession({
      status: 'processing',
      carousel_order: ['coffee', null, 42, 'books'],
    });
    expect(result?.carouselOrder).toEqual(['coffee', 'books']);
  });
});
