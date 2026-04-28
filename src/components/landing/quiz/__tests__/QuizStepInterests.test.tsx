import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../theme';
import { QuizStepInterests, QuizInterestPill } from '../QuizStepInterests';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const PILLS: QuizInterestPill[] = [
  { label: 'Books', emoji: '📚 ' },
  { label: 'Cooking', emoji: '🍳 ' },
  { label: 'Travel', emoji: '✈️ ' },
];

const baseProps = {
  title: 'What does she like?',
  pills: PILLS,
  selectedInterests: [] as string[],
  onToggleInterest: jest.fn(),
  textareaValue: '',
  textareaPlaceholder: 'Tell us about her',
  onTextareaChange: jest.fn(),
  onSubmit: jest.fn(),
  canSubmit: false,
};

describe('QuizStepInterests', () => {
  it('renders the title and all pills', () => {
    renderWithTheme(<QuizStepInterests {...baseProps} />);
    expect(screen.getByText('What does she like?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Books/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cooking/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Travel/ })).toBeInTheDocument();
  });

  it('renders the submit CTA', () => {
    renderWithTheme(<QuizStepInterests {...baseProps} />);
    expect(screen.getByRole('button', { name: /Show me my gifts/ })).toBeInTheDocument();
  });

  /**
   * Bug #13 — Interest chips don't fit in fewer rows.
   *
   * The pill horizontal padding was reduced from 16px -> 10px and the gap from
   * 8px -> 6px so more chips fit per row at 375px viewport. If a future change
   * inflates these back, the CTA falls below the fold on mobile.
   */
  it('uses tight chip horizontal padding so chips pack into fewer rows (bug #13 regression)', () => {
    renderWithTheme(<QuizStepInterests {...baseProps} />);

    // jsdom doesn't compute styled-components rules. Inspect the injected
    // <style> tags directly to confirm the chip padding stays tight.
    const cssText = Array.from(document.head.querySelectorAll('style'))
      .map((s) => s.textContent || '')
      .join('\n');

    // Pill rule should declare "padding: 8px 10px" (or tighter horizontal).
    // Match any "padding: <v> <h>px" with h <= 12.
    const match = cssText.match(/padding:\s*(\d+)px\s+(\d+)px/);
    expect(match).not.toBeNull();
    const horizontal = parseInt(match![2], 10);
    expect(horizontal).toBeLessThanOrEqual(12);
  });
});
