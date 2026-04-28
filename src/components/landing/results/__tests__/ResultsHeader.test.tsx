// ResultsHeader now embeds SiteHeader → HeaderAccountMenu, which imports
// firebase/auth and crashes jsdom via undici/TextDecoder. Stub the surface.
jest.mock('firebase/auth', () => {
  const noop = () => {};
  return {
    onAuthStateChanged: () => noop,
    onIdTokenChanged: () => noop,
    signOut: () => Promise.resolve(),
  };
});
jest.mock('../../../../firebaseConfig', () => ({
  auth: { currentUser: null },
}));
jest.mock('../../../../theaWeb/auth/accountAuth', () => ({
  signOutUser: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../theme';
import { ResultsHeader } from '../ResultsHeader';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const baseProps = {
  personEmoji: '🌷',
  personName: 'Mom',
  interestsLabel: 'Cooking, Travel +2',
  onProfilePillClick: () => {},
  onTabChange: () => {},
  activeTab: 'recommended' as const,
  likedCount: 0,
  purchasedCount: 0,
};

describe('ResultsHeader (post header-consistency refactor)', () => {
  it('renders the SiteHeader thea wordmark above the profile pill', () => {
    renderWithTheme(<ResultsHeader {...baseProps} />);
    // Single thea wordmark — sourced from the embedded SiteHeader (no separate
    // results-page wordmark anymore).
    const wordmarks = screen.getAllByText('thea');
    expect(wordmarks).toHaveLength(1);
    expect(wordmarks[0].tagName).toBe('A');
  });

  it('renders the default Sign in CTA when no rightActions are passed', () => {
    renderWithTheme(<ResultsHeader {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders the rightActions slot in place of the default Sign in', () => {
    renderWithTheme(
      <ResultsHeader
        {...baseProps}
        rightActions={<button type="button">Account</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
  });

  it('still renders the profile pill, tab bar, and badges', () => {
    renderWithTheme(
      <ResultsHeader
        {...baseProps}
        likedCount={3}
        purchasedCount={2}
        activeTab="liked"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Edit profile' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mom')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Purchased')).toBeInTheDocument();
  });
});
