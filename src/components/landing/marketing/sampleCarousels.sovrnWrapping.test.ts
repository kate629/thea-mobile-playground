/**
 * Regression test: every product URL in every static occasion-guide carousel
 * must be Sovrn-wrapped before clicks reach the merchant. Discovered
 * 2026-04-29: the original guide files shipped with raw merchant URLs, so
 * occasion-guide product clicks bypassed Sovrn entirely (~$0 affiliate
 * revenue per click). PR #90 wrapped all 512 URLs at source-file level via
 * `scripts/wrap_occasion_guide_urls.py`.
 *
 * This test prevents the same bug from regressing — if anyone adds a new
 * occasion-guide product with a raw merchant URL, this test fails the build
 * and points the author at the wrapping script. The script is idempotent
 * so re-running on a mixed file (some wrapped, some not) wraps only the
 * raw ones and skips the rest.
 */

import { SAMPLE_BIRTHDAY_SECTIONS } from './sampleBirthdayCarousels';
import { SAMPLE_MOTHERS_DAY_SECTIONS } from './sampleMothersDayCarousels';
import { SAMPLE_FATHERS_DAY_SECTIONS } from './sampleFathersDayCarousels';
import { SAMPLE_ANNIVERSARY_SECTIONS } from './sampleAnniversaryCarousels';
import { SAMPLE_HOUSEWARMING_SECTIONS } from './sampleHousewarmingCarousels';
import { SAMPLE_NEW_BABY_SECTIONS } from './sampleNewBabyCarousels';
import { SAMPLE_GRADUATION_SECTIONS } from './sampleGraduationCarousels';

const GUIDES: Array<[string, ReturnType<typeof Array.of<unknown>>]> = [
  ['birthday', SAMPLE_BIRTHDAY_SECTIONS],
  ['mothers_day', SAMPLE_MOTHERS_DAY_SECTIONS],
  ['fathers_day', SAMPLE_FATHERS_DAY_SECTIONS],
  ['anniversary', SAMPLE_ANNIVERSARY_SECTIONS],
  ['housewarming', SAMPLE_HOUSEWARMING_SECTIONS],
  ['new_baby', SAMPLE_NEW_BABY_SECTIONS],
  ['graduation', SAMPLE_GRADUATION_SECTIONS],
];

/** Sovrn redirect host used by the BE's mint_affiliate_url + the
 *  pre-encode script. Hardcoded here intentionally — the test would fail
 *  the build if the URL pattern shifted, which is what we want. */
const SOVRN_REDIRECT_PREFIX = 'https://redirect.viglink.com?key=';
/** Sovrn's legacy short-link host. A handful of sample products were
 *  manually short-linked before the bulk wrap; those are valid too. */
const SOVRN_SHORT_PREFIX = 'https://sovrn.co/';

function isSovrnWrapped(url: string): boolean {
  return url.startsWith(SOVRN_REDIRECT_PREFIX) || url.startsWith(SOVRN_SHORT_PREFIX);
}

describe('Static occasion guides — every product URL must be Sovrn-wrapped', () => {
  for (const [guideName, sections] of GUIDES) {
    describe(guideName, () => {
      for (const section of sections as Array<{
        slug: string;
        title: string;
        products: Array<{ id: string; title: string; productUrl: string }>;
      }>) {
        describe(`section "${section.slug}"`, () => {
          for (const product of section.products) {
            // One assertion per product so a regression on a single product
            // names that exact product in the failure output.
            it(`${product.id} (${product.title.slice(0, 40)}) — productUrl is Sovrn-wrapped`, () => {
              expect(product.productUrl).toBeTruthy();
              if (!isSovrnWrapped(product.productUrl)) {
                throw new Error(
                  `Raw merchant URL found: ${product.productUrl}\n` +
                    `\nFix: re-run the wrapping script:\n` +
                    `    python3 scripts/wrap_occasion_guide_urls.py --execute\n` +
                    `(idempotent — wraps any new raw URLs, skips already-wrapped)`,
                );
              }
            });
          }
        });
      }
    });
  }

  // Sanity: total count across all guides should be in the right ballpark
  // (~500 products). If we ever drop below 100 something has gone very wrong.
  it('all guides combined: at least 400 products checked', () => {
    const total = GUIDES.reduce((acc, [, sections]) => {
      const s = sections as Array<{ products: unknown[] }>;
      return acc + s.reduce((a, sec) => a + sec.products.length, 0);
    }, 0);
    expect(total).toBeGreaterThanOrEqual(400);
  });
});

describe('Sovrn-wrapped URL shape', () => {
  // Pick the first product across all guides as a sample to verify the
  // wrapped form decodes back to a valid http(s) URL.
  const firstProduct = (() => {
    for (const [, sections] of GUIDES) {
      const ss = sections as Array<{ products: Array<{ productUrl: string }> }>;
      for (const sec of ss) {
        if (sec.products.length > 0) return sec.products[0];
      }
    }
    return null;
  })();

  it('wrapped URL decodes back to a valid http(s) merchant URL', () => {
    expect(firstProduct).not.toBeNull();
    const wrapped = firstProduct!.productUrl;
    if (wrapped.startsWith(SOVRN_SHORT_PREFIX)) {
      // sovrn.co short links are opaque — can't decode without an API call.
      // Skip the decode check for these; the prefix match is enough.
      return;
    }
    const url = new URL(wrapped);
    expect(url.hostname).toBe('redirect.viglink.com');
    expect(url.searchParams.get('key')).toMatch(/^[a-z0-9]+$/);
    const u = url.searchParams.get('u');
    expect(u).toBeTruthy();
    const decoded = decodeURIComponent(u!);
    expect(decoded).toMatch(/^https?:\/\//);
  });
});
