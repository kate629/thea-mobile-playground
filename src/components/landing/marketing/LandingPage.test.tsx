// Mock firebase modules at the top — jsdom crashes pulling firebase/auth's
// undici dependency, and any module-level Firebase init explodes without
// REACT_APP_FIREBASE_* env vars (handbook gotcha #12).
jest.mock('firebase/auth', () => ({
  __esModule: true,
  onAuthStateChanged: jest.fn(() => () => {}),
  onIdTokenChanged: jest.fn(() => () => {}),
}));
jest.mock('firebase/firestore', () => ({
  __esModule: true,
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => () => {}),
}));
jest.mock('firebase/functions', () => ({
  __esModule: true,
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => () => Promise.resolve({ data: {} })),
}));

// Stub deep children that aren't part of the gating contract — keeps the
// test focused on LandingPage's own sticky-CTA wiring instead of the auth
// chain underneath SiteHeader / friends-list subscriptions.
jest.mock('../SiteHeader', () => ({
  __esModule: true,
  SiteHeader: () => null,
}));
jest.mock('./BrowseMyFriendsSection', () => ({
  __esModule: true,
  BrowseMyFriendsSection: () => null,
}));
jest.mock('../../../theaWeb/auth/HeaderAccountMenu', () => ({
  __esModule: true,
  HeaderAccountMenu: () => null,
}));
jest.mock('../../../firebaseConfig', () => ({
  __esModule: true,
  auth: { currentUser: null, onAuthStateChanged: () => () => {} },
  db: {},
  ensureAuth: jest.fn(),
  getAppInstance: () => ({}),
}));

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { LandingPage, FrozenHeroSlot } from './LandingPage';
import { FirebaseProvider } from '../../../theaWeb/firebase/FirebaseContext';
import { theme } from '../../../theme';

const stubAuth = { currentUser: null } as unknown as Auth;
const stubDb = {} as Firestore;
const stubFirebaseValue = {
  auth: stubAuth,
  db: stubDb,
  ensureAuth: async () => 'test-uid',
};

const renderPage = (props: Partial<React.ComponentProps<typeof LandingPage>> = {}) =>
  render(
    <MemoryRouter>
      <FirebaseProvider value={stubFirebaseValue}>
        <ThemeProvider theme={theme}>
          <LandingPage
            heroSlot={<FrozenHeroSlot scenarioIndex={0} />}
            authInstance={stubAuth}
            {...props}
          />
        </ThemeProvider>
      </FirebaseProvider>
    </MemoryRouter>,
  );

/**
 * The signed-in/out gating on the StickyPrimaryCta's signInSlot is the
 * regression hook for sheet bug #59 — Sign-in still rendering after login.
 * Each surface (mobile footer + desktop top bar) must hide its slot when
 * the user is signed in, render it when signed out, and hide it during
 * the brief auth-bootstrap window so we don't flash-then-yank.
 */
describe('LandingPage — sticky CTA Sign-in slot gating (bug #59)', () => {
  it('renders Sign-in slot in both sticky surfaces when signed-out + onSignInClick supplied', () => {
    renderPage({ authOverride: 'signed-out', onSignInClick: () => undefined });
    const mobile = screen.getByTestId('sticky-primary-cta-mobile');
    const desktop = screen.getByTestId('sticky-primary-cta-desktop');
    expect(within(mobile).queryByRole('button', { name: 'Sign in', hidden: true })).toBeInTheDocument();
    expect(within(desktop).queryByRole('button', { name: 'Sign in', hidden: true })).toBeInTheDocument();
  });

  it('does NOT render the StickyPrimaryCta at all when signed-in (sheet bug #66 supersedes #59 here)', () => {
    // Signed-in users get the sticky SearchPill chrome instead of the
    // "Find a gift" sticky CTA — the CTA was redundant since the
    // SearchPill is itself the search action.
    renderPage({ authOverride: 'signed-in', onSignInClick: () => undefined });
    expect(screen.queryByTestId('sticky-primary-cta-mobile')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sticky-primary-cta-desktop')).not.toBeInTheDocument();
  });

  it('hides Sign-in slot during the auth-bootstrap window (ready=false)', () => {
    // While `ready` is false we deliberately render nothing in the slot —
    // better to omit briefly than to flash a Sign-in button and yank it
    // once the listener resolves.
    renderPage({ authOverride: 'loading', onSignInClick: () => undefined });
    const mobile = screen.getByTestId('sticky-primary-cta-mobile');
    expect(within(mobile).queryByRole('button', { name: 'Sign in', hidden: true })).not.toBeInTheDocument();
  });

  it('omits Sign-in slot when no onSignInClick is provided (no callback to wire)', () => {
    renderPage({ authOverride: 'signed-out' });
    const mobile = screen.getByTestId('sticky-primary-cta-mobile');
    expect(within(mobile).queryByRole('button', { name: 'Sign in', hidden: true })).not.toBeInTheDocument();
  });
});

describe('LandingPage — signed-in sticky search chrome (bug #66)', () => {
  it('renders the sticky chrome wrapper when signed-in', () => {
    renderPage({ authOverride: 'signed-in' });
    expect(screen.getByTestId('signed-in-stuck-search-bar')).toBeInTheDocument();
  });

  it('does NOT render the sticky chrome wrapper when signed-out', () => {
    renderPage({ authOverride: 'signed-out' });
    expect(screen.queryByTestId('signed-in-stuck-search-bar')).not.toBeInTheDocument();
  });

  it('does NOT render the sticky chrome wrapper during the auth-bootstrap window', () => {
    // While `ready` is false the marketing hero (signed-out branch) renders;
    // the sticky search chrome only mounts once the user is confirmed signed-in.
    renderPage({ authOverride: 'loading' });
    expect(screen.queryByTestId('signed-in-stuck-search-bar')).not.toBeInTheDocument();
  });

  it('renders the StickyPrimaryCta for signed-out users (chrome split)', () => {
    // Signed-out users still get the original "Find a gift" sticky CTA —
    // they have no SearchPill to make sticky.
    renderPage({ authOverride: 'signed-out', onSignInClick: () => undefined });
    expect(screen.getByTestId('sticky-primary-cta-mobile')).toBeInTheDocument();
    expect(screen.queryByTestId('signed-in-stuck-search-bar')).not.toBeInTheDocument();
  });
});
