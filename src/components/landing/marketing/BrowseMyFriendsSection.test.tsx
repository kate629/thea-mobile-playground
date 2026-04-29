// Mock firebase BEFORE importing the component, otherwise jsdom crashes
// pulling firebase/auth → undici → fastify/busboy.
jest.mock('firebase/auth', () => ({
  __esModule: true,
  onAuthStateChanged: jest.fn(() => () => {}),
}));
jest.mock('firebase/firestore', () => ({
  __esModule: true,
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => () => {}),
}));
jest.mock('../../../firebaseConfig', () => ({
  __esModule: true,
  auth: { currentUser: null },
  db: {},
  ensureAuth: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { BrowseMyFriendsSection } from './BrowseMyFriendsSection';
import { theme } from '../../../theme';
import type { AuthState, DashboardPerson, FriendPreviewLoader } from '../dashboard/types';

const SignedIn: AuthState = {
  status: 'signed-in',
  user: { uid: 'u1', initial: 'A' },
};
const SignedOut: AuthState = {
  status: 'signed-out',
  onRequestSignIn: () => {},
};

function renderInRouter(ui: React.ReactElement, locationOut?: { current: string }) {
  function LocationProbe() {
    const loc = useLocation();
    if (locationOut) locationOut.current = loc.pathname;
    return null;
  }
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                {ui}
                <LocationProbe />
              </>
            }
          />
          <Route path="/board/:rid" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const SAMPLE_PEOPLE: DashboardPerson[] = [
  { id: 'r1', name: 'Mom', emoji: '🌷' },
  { id: 'r2', name: 'Brother', emoji: '✨' },
  { id: 'r3', name: 'Sister', emoji: '👯' },
];

const instantLoader: FriendPreviewLoader = {
  subscribe: (_personId, _currentRecommendationId, cb) => {
    cb([]);
    return () => {};
  },
};

describe('BrowseMyFriendsSection', () => {
  it('renders nothing when authState is signed-out', () => {
    const { container } = renderInRouter(
      <BrowseMyFriendsSection
        authOverride={SignedOut}
        peopleOverride={SAMPLE_PEOPLE}
        loaderOverride={instantLoader}
      />,
    );
    expect(container.querySelector('h2')).toBeNull();
  });

  it('renders heading + one tile per person when signed-in', () => {
    renderInRouter(
      <BrowseMyFriendsSection
        authOverride={SignedIn}
        peopleOverride={SAMPLE_PEOPLE}
        loaderOverride={instantLoader}
      />,
    );
    expect(screen.getByText('Browse my friends')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Open Mom's closet" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Open Brother's closet" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Open Sister's closet" })).toBeInTheDocument();
  });

  it('does NOT render an "Add someone" tile', () => {
    renderInRouter(
      <BrowseMyFriendsSection
        authOverride={SignedIn}
        peopleOverride={SAMPLE_PEOPLE}
        loaderOverride={instantLoader}
      />,
    );
    expect(screen.queryByRole('button', { name: /add/i })).toBeNull();
  });

  it('renders an empty-state message when signed-in user has zero friends', () => {
    renderInRouter(
      <BrowseMyFriendsSection
        authOverride={SignedIn}
        peopleOverride={[]}
        loaderOverride={instantLoader}
      />,
    );
    expect(screen.getByText(/no one yet/i)).toBeInTheDocument();
  });

  it('navigates to /board/:rid when a tile is clicked', async () => {
    const locationOut = { current: '' };
    renderInRouter(
      <BrowseMyFriendsSection
        authOverride={SignedIn}
        peopleOverride={SAMPLE_PEOPLE}
        loaderOverride={instantLoader}
      />,
      locationOut,
    );

    await userEvent.click(screen.getByRole('button', { name: "Open Mom's closet" }));
    expect(locationOut.current).toBe('/board/r1');
  });

  it('invokes onPersonClick override instead of navigating', async () => {
    const onPersonClick = jest.fn();
    renderInRouter(
      <BrowseMyFriendsSection
        authOverride={SignedIn}
        peopleOverride={SAMPLE_PEOPLE}
        loaderOverride={instantLoader}
        onPersonClick={onPersonClick}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: "Open Brother's closet" }));
    expect(onPersonClick).toHaveBeenCalledTimes(1);
    expect(onPersonClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r2', name: 'Brother' }),
    );
  });
});
