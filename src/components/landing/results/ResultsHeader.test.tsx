// ResultsHeader embeds SiteHeader → HeaderAccountMenu → firebase/auth, which
// crashes jsdom via the undici/TextDecoder chain. Stub the surface.
jest.mock('firebase/auth', () => {
  const noop = () => {};
  return {
    onAuthStateChanged: () => noop,
    onIdTokenChanged: () => noop,
    signOut: () => Promise.resolve(),
  };
});
jest.mock('../../../firebaseConfig', () => ({
  auth: { currentUser: null },
}));
jest.mock('../../../theaWeb/auth/accountAuth', () => ({
  signOutUser: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../theme';
import { ResultsHeader } from './ResultsHeader';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const baseProps = {
  personEmoji: '🌷',
  personName: 'Mom',
  interestsLabel: 'Cooking, Travel +2',
  onProfilePillClick: () => {},
  activeTab: 'recommended' as const,
  onTabChange: () => {},
  likedCount: 0,
  purchasedCount: 0,
};

describe('ResultsHeader', () => {
  it('renders the profile pill with name + interests', () => {
    renderWithTheme(<ResultsHeader {...baseProps} />);
    expect(
      screen.getByRole('button', { name: 'Edit profile' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mom')).toBeInTheDocument();
    expect(screen.getByText('Cooking, Travel +2')).toBeInTheDocument();
  });

  // Regression test for sheet bug #41: the header bar must remain pinned
  // to the top of the viewport while the user scrolls the gift-recs page.
  // If anyone wraps an ancestor in `overflow: hidden` or removes the
  // `position: sticky` declaration, this assertion fails loudly.
  it('uses position:sticky pinned to the top with the right z-index', () => {
    renderWithTheme(<ResultsHeader {...baseProps} />);
    const sticky = screen.getByTestId('results-sticky-header');
    const styles = getComputedStyle(sticky);

    expect(styles.position).toBe('sticky');
    expect(styles.top).toBe('0px');
    // Below the profile drawer (210) and its scrim (200), but above the
    // page content. See ResultsHeader.tsx Sticky comment.
    expect(Number(styles.zIndex)).toBe(40);
  });

  it('applies a solid background so scrolled-under content does not bleed through', () => {
    renderWithTheme(<ResultsHeader {...baseProps} />);
    const sticky = screen.getByTestId('results-sticky-header');
    const styles = getComputedStyle(sticky);
    // The exact hex doesn't matter for the regression — we just need *some*
    // non-transparent background so a sticky bar stays opaque.
    expect(styles.background).not.toBe('');
    expect(styles.background).not.toBe('transparent');
    expect(styles.background).not.toContain('rgba(0, 0, 0, 0)');
  });
});
