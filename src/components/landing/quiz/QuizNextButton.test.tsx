import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../theme';
import { QuizNextButton } from './QuizNextButton';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('QuizNextButton', () => {
  it('renders the label', () => {
    renderWithTheme(<QuizNextButton label="Show me my gifts" />);
    expect(
      screen.getByRole('button', { name: 'Show me my gifts' }),
    ).toBeInTheDocument();
  });

  it('calls onClick when pressed', async () => {
    const onClick = jest.fn();
    renderWithTheme(<QuizNextButton label="Show me my gifts" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show me my gifts' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = jest.fn();
    renderWithTheme(
      <QuizNextButton label="Show me my gifts" onClick={onClick} disabled />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show me my gifts' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  // Regression test for the rust-gradient CTA fix: the enabled background
  // must come from `theme.gradient.cta` (matches the homepage Find-a-gift
  // primary button) — not the prior gold `#f1a805`.
  it('uses the rust gradient (theme.gradient.cta) for the enabled background', () => {
    renderWithTheme(<QuizNextButton label="Show me my gifts" />);
    // styled-components injects a <style> tag in document.head. Read it
    // directly — jsdom doesn't resolve background through computed style for
    // styled-components rules, but the raw stylesheet is exact.
    const styleText = Array.from(document.querySelectorAll('style'))
      .map((node) => node.textContent || '')
      .join('\n');
    expect(styleText).toMatch(/linear-gradient/);
    expect(styleText).not.toMatch(/#f1a805/i);
  });
});
