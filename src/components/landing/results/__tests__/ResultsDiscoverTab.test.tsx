import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { theme } from '../../../../theme';
import { ResultsDiscoverTab } from '../ResultsDiscoverTab';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const SUMMARY_HINT = 'The more you react, the better your picks.';

describe('ResultsDiscoverTab', () => {
  /**
   * Bug #35 regression. During PROCESSING the page renders skeleton
   * carousels, but the SummaryHint copy underneath ("The more you react,
   * the better your picks.") would still appear with no products above it
   * — reading as a broken page. The page now passes `showSummary={false}`
   * during PROCESSING; this test pins that wiring at the component layer.
   */
  it('hides the SummaryHint when showSummary is false (loading state, bug #35)', () => {
    renderWithTheme(
      <ResultsDiscoverTab
        summary={{ saves: 0, dismissed: 0 }}
        showSummary={false}
        onRefresh={() => {}}
      >
        <div>skeleton row</div>
      </ResultsDiscoverTab>,
    );

    expect(screen.queryByText(SUMMARY_HINT)).not.toBeInTheDocument();
    // Refresh CTA also hidden — the whole summary card shouldn't render.
    expect(
      screen.queryByRole('button', { name: /refresh my picks/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the SummaryHint when showSummary is true with products', () => {
    renderWithTheme(
      <ResultsDiscoverTab
        summary={{ saves: 2, dismissed: 1 }}
        showSummary={true}
        onRefresh={() => {}}
      >
        <div>real product carousel</div>
      </ResultsDiscoverTab>,
    );

    expect(screen.getByText(SUMMARY_HINT)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /refresh my picks/i }),
    ).toBeInTheDocument();
  });

  it('defaults showSummary to true so existing callers keep their summary', () => {
    // ResultsPageAnimated.tsx + Storybook callers don't pass showSummary;
    // they should keep rendering the summary card (no behavior change).
    renderWithTheme(
      <ResultsDiscoverTab
        summary={{ saves: 0, dismissed: 0 }}
        onRefresh={() => {}}
      >
        <div>real product carousel</div>
      </ResultsDiscoverTab>,
    );

    expect(screen.getByText(SUMMARY_HINT)).toBeInTheDocument();
  });

  it('omits the summary card entirely when no summary prop is given', () => {
    renderWithTheme(
      <ResultsDiscoverTab onRefresh={() => {}}>
        <div>real product carousel</div>
      </ResultsDiscoverTab>,
    );

    expect(screen.queryByText(SUMMARY_HINT)).not.toBeInTheDocument();
  });
});
