import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../theme';
import { QuizThemeLogo } from './QuizThemeLogo';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('QuizThemeLogo', () => {
  it('renders the brand wordmark', () => {
    renderWithTheme(<QuizThemeLogo onClick={() => {}} />);
    expect(screen.getByRole('button', { name: 'Home' })).toHaveTextContent('thea');
  });

  it('calls onClick when pressed (does not navigate by itself)', async () => {
    const onClick = jest.fn();
    renderWithTheme(<QuizThemeLogo onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
