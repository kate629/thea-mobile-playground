import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../theme';
import { Button } from './Button';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('Button', () => {
  it('renders the label', () => {
    renderWithTheme(<Button label="Find a gift" />);
    expect(screen.getByRole('button', { name: 'Find a gift' })).toBeInTheDocument();
  });

  it('calls onClick when pressed', async () => {
    const onClick = jest.fn();
    renderWithTheme(<Button label="Find a gift" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Find a gift' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = jest.fn();
    renderWithTheme(<Button label="Find a gift" onClick={onClick} disabled />);
    await userEvent.click(screen.getByRole('button', { name: 'Find a gift' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders ghost variant without crashing', () => {
    renderWithTheme(<Button label="Sign in" variant="ghost" />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
