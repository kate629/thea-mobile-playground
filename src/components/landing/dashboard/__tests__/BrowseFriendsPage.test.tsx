import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../theme';
import { BrowseFriendsPage } from '../BrowseFriendsPage';
import { PLACEHOLDER_SEGMENTS } from '../constants';
import { ME_TILE_ID, AuthState } from '../types';
import { SAMPLE_DASHBOARD_PEOPLE } from '../sampleDashboardData';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const basePill = {
  segments: PLACEHOLDER_SEGMENTS,
  onSegmentClick: () => {},
  onSparkleClick: () => {},
  canSearch: false,
};

describe('BrowseFriendsPage auth-state branching', () => {
  it('renders the sign-in CTA and a "Sign in" header action when signed-out', () => {
    const onRequestSignIn = jest.fn();
    const authState: AuthState = { status: 'signed-out', onRequestSignIn };

    renderWithTheme(
      <BrowseFriendsPage
        authState={authState}
        stickyPill={false}
        pill={basePill}
        grid={{ people: [], previews: {}, resolved: {}, meId: ME_TILE_ID }}
      />,
    );

    expect(screen.getByText('Sign in to see your people')).toBeInTheDocument();
    // Two "Sign in" buttons total: the header ghost button + the primary CTA inside the card.
    const signIn = screen.getAllByRole('button', { name: 'Sign in' });
    expect(signIn.length).toBeGreaterThanOrEqual(2);
    // The friend grid heading should NOT render in signed-out mode.
    expect(screen.queryByText('Browse my friends')).not.toBeInTheDocument();
  });

  it('renders the friend grid heading and tiles when signed-in', () => {
    const authState: AuthState = {
      status: 'signed-in',
      user: { uid: 'u1', initial: 'M', displayName: 'Manuel' },
    };

    renderWithTheme(
      <BrowseFriendsPage
        authState={authState}
        stickyPill={false}
        pill={basePill}
        grid={{
          people: SAMPLE_DASHBOARD_PEOPLE,
          previews: {},
          resolved: Object.fromEntries(SAMPLE_DASHBOARD_PEOPLE.map((p) => [p.id, true])),
          meId: ME_TILE_ID,
        }}
      />,
    );

    expect(screen.getByText('Browse my friends')).toBeInTheDocument();
    expect(screen.getByLabelText('Open your closet')).toBeInTheDocument();
    expect(screen.getByLabelText("Open Brother's closet")).toBeInTheDocument();
    expect(screen.getByLabelText('Add someone')).toBeInTheDocument();
    // No sign-in CTA card in signed-in mode.
    expect(screen.queryByText('Sign in to see your people')).not.toBeInTheDocument();
  });

  it('renders the loading skeleton when authState is loading', () => {
    const authState: AuthState = { status: 'loading' };

    renderWithTheme(
      <BrowseFriendsPage
        authState={authState}
        stickyPill={false}
        pill={basePill}
        grid={{ people: [], previews: {}, resolved: {}, meId: ME_TILE_ID }}
      />,
    );

    // No sign-in CTA, no friend tile labels.
    expect(screen.queryByText('Sign in to see your people')).not.toBeInTheDocument();
    expect(screen.queryByText('Browse my friends')).toBeInTheDocument();
    // The Add-someone tile is always present.
    expect(screen.getByLabelText('Add someone')).toBeInTheDocument();
  });
});
