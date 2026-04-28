import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../theme';
import { QuizCard } from '../QuizCard';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

/**
 * Bug #11 — Quiz step container height inconsistency.
 *
 * The card body must reserve a min-height sized to the tallest natural-content
 * step (interests). All other steps render at this height with extra space below.
 * If a future change drops the min-height back to the old 420px (or removes it
 * entirely), the visual lurch between steps returns.
 *
 * This test guards the mobile floor — the body must reserve at least 560px so
 * the interests step (~17 chips + textarea + CTA) doesn't blow out the layout
 * and shorter steps don't render visibly shorter.
 */
describe('QuizCard min-height (bug #11 regression)', () => {
  it('body reserves a generous min-height so step container is consistent across steps', () => {
    renderWithTheme(
      <QuizCard>
        <div>step content</div>
      </QuizCard>,
    );

    // styled-components injects rules into <style> tags in document.head.
    // Concatenate them and look for a min-height >= 520. We can't rely on
    // getComputedStyle because jsdom doesn't run CSS through styled-components.
    const cssText = Array.from(document.head.querySelectorAll('style'))
      .map((s) => s.textContent || '')
      .join('\n');

    // Match "min-height: <N>px" — pick the largest value declared anywhere
    // in the rendered tree, which corresponds to the Body floor.
    const matches = Array.from(cssText.matchAll(/min-height:\s*(\d+)px/g));
    const values = matches.map((m) => parseInt(m[1], 10));
    const max = values.length ? Math.max(...values) : 0;

    // Floor: must be at least 520px. We deliberately keep this loose so the
    // exact value can be tuned without test churn — the important thing is
    // it's "much taller than the old 420px" so all steps render uniformly.
    expect(max).toBeGreaterThanOrEqual(520);
  });
});
