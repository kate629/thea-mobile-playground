import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { ResultsDiscoverTab } from './ResultsDiscoverTab';
import { theme } from '../../../theme';

const renderInTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const FAKE_CHILDREN = <div data-testid="fake-carousels">carousels</div>;

describe('ResultsDiscoverTab', () => {
  test('renders children carousels', () => {
    renderInTheme(
      <ResultsDiscoverTab summary={{ saves: 1, dismissed: 0 }} onRefresh={() => {}}>
        {FAKE_CHILDREN}
      </ResultsDiscoverTab>,
    );
    expect(screen.getByTestId('fake-carousels')).toBeInTheDocument();
  });

  test('renders the SummaryCard Refresh CTA when onRefresh + summary are wired', () => {
    renderInTheme(
      <ResultsDiscoverTab summary={{ saves: 3, dismissed: 2 }} onRefresh={() => {}}>
        {FAKE_CHILDREN}
      </ResultsDiscoverTab>,
    );
    // SummaryCard CTA — the canonical refresh affordance. The earlier sticky
    // floating button was removed per sheet bug #55 (Kate flagged it as
    // visually disconnected from the rest of the page).
    expect(
      screen.getByRole('button', { name: 'Refresh my picks' }),
    ).toBeInTheDocument();
  });

  test('clicking the SummaryCard Refresh fires onRefresh', async () => {
    const onRefresh = jest.fn();
    renderInTheme(
      <ResultsDiscoverTab summary={{ saves: 3, dismissed: 2 }} onRefresh={onRefresh}>
        {FAKE_CHILDREN}
      </ResultsDiscoverTab>,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh my picks' }),
    );
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test('refreshing=true: SummaryCard Refresh swaps to disabled "Refreshing…" loading state in place', () => {
    renderInTheme(
      <ResultsDiscoverTab
        refreshing
        summary={{ saves: 3, dismissed: 2 }}
        onRefresh={() => {}}
      >
        {FAKE_CHILDREN}
      </ResultsDiscoverTab>,
    );
    // Carousels stay rendered (no skeleton swap)
    expect(screen.getByTestId('fake-carousels')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Refreshing/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    // Idle-state label is gone — no double-render
    expect(
      screen.queryByRole('button', { name: 'Refresh my picks' }),
    ).not.toBeInTheDocument();
  });

  test('refreshing=true: clicking the disabled button does not fire onRefresh', async () => {
    const onRefresh = jest.fn();
    renderInTheme(
      <ResultsDiscoverTab
        refreshing
        summary={{ saves: 3, dismissed: 2 }}
        onRefresh={onRefresh}
      >
        {FAKE_CHILDREN}
      </ResultsDiscoverTab>,
    );
    const button = screen.getByRole('button', { name: /Refreshing/ });
    await userEvent.click(button);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  test('renders empty-state card when empty=true and not refreshing', () => {
    renderInTheme(
      <ResultsDiscoverTab empty summary={{ saves: 0, dismissed: 4 }} onRefresh={() => {}}>
        {null}
      </ResultsDiscoverTab>,
    );
    expect(
      screen.getByText('No gifts match this price filter.'),
    ).toBeInTheDocument();
  });

  test('hides empty-state card during refreshing', () => {
    renderInTheme(
      <ResultsDiscoverTab
        empty
        refreshing
        summary={{ saves: 0, dismissed: 4 }}
        onRefresh={() => {}}
      >
        {null}
      </ResultsDiscoverTab>,
    );
    expect(
      screen.queryByText('No gifts match this price filter.'),
    ).not.toBeInTheDocument();
  });

});
