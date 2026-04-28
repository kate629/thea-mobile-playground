import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../theme';
import { ResultsCarousel } from '../ResultsCarousel';
import { SAMPLE_RESULTS_CAROUSELS } from '../sampleResultsData';

/**
 * Bug #18 — mobile peekaboo regression.
 *
 * CSS scroll-snap can't be exercised in jsdom (no real scroll-snap engine,
 * no layout). Reasonable assertion: the styled-components <style> tags
 * injected on render contain the scroll-snap declarations we shipped, so a
 * future refactor that drops them would fail this test.
 */
describe('ResultsCarousel mobile peekaboo (bug #18)', () => {
  // Render once and snapshot the injected CSS. styled-components in jsdom
  // dedupes by component-id across renders, so successive renders may inject
  // nothing if a previous test already mounted the component — snapshotting
  // up front avoids order-dependence.
  let css = '';

  beforeAll(() => {
    const products = SAMPLE_RESULTS_CAROUSELS[0].products;
    render(
      <ThemeProvider theme={theme}>
        <ResultsCarousel
          title="TEST"
          slots={products.map((p) => ({ item: p, state: 'idle' as const, liked: false }))}
        />
      </ThemeProvider>
    );
    // styled-components in dev/jest injects via the CSSOM (sheet.insertRule),
    // so <style> textContent is empty — read out of cssRules instead.
    const chunks: string[] = [];
    Array.from(document.styleSheets).forEach((sheet) => {
      let rules: CSSRuleList | null = null;
      try {
        rules = sheet.cssRules;
      } catch {
        // Cross-origin or detached stylesheet — skip.
      }
      if (!rules) return;
      Array.from(rules).forEach((rule) => chunks.push(rule.cssText));
    });
    css = chunks.join('\n');
  });

  it('emits scroll-snap-type on the scroller (gated to mobile)', () => {
    expect(css).toMatch(/scroll-snap-type:\s*x\s+mandatory/);
  });

  it('emits scroll-snap-align on each slot (gated to mobile)', () => {
    expect(css).toMatch(/scroll-snap-align:\s*start/);
  });

  it('confines the mobile peekaboo rules to <=639px viewports', () => {
    // The new mobile-gated blocks live inside @media (max-width: 639px). At
    // least one such block must exist so we don't regress the desktop layout.
    expect(css).toMatch(/@media\s*\(\s*max-width:\s*639px\s*\)/);
  });
});
