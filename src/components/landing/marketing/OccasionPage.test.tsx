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
jest.mock('../../../firebaseConfig', () => ({
  __esModule: true,
  auth: { currentUser: null, onAuthStateChanged: () => () => {} },
  db: {},
  ensureAuth: jest.fn(),
  getAppInstance: () => ({}),
}));

// Stub deep children that aren't part of the gating contract — keeps the
// test focused on OccasionPage's own sticky-CTA wiring instead of the auth
// chain underneath SiteHeader.
jest.mock('../SiteHeader', () => ({
  __esModule: true,
  SiteHeader: () => null,
}));
jest.mock('./CarouselSection', () => ({
  __esModule: true,
  CarouselSection: () => null,
}));

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { OccasionPage } from './OccasionPage';
import { FirebaseProvider } from '../../../theaWeb/firebase/FirebaseContext';
import { theme } from '../../../theme';

const stubAuth = { currentUser: null } as unknown as Auth;
const stubDb = {} as Firestore;
const stubFirebaseValue = {
  auth: stubAuth,
  db: stubDb,
  ensureAuth: async () => 'test-uid',
};

const renderPage = (props: Partial<React.ComponentProps<typeof OccasionPage>> = {}) =>
  render(
    <FirebaseProvider value={stubFirebaseValue}>
      <ThemeProvider theme={theme}>
        <OccasionPage
          title="Birthday Gifts"
          sections={[]}
          authInstance={stubAuth}
          {...props}
        />
      </ThemeProvider>
    </FirebaseProvider>,
  );

/**
 * Sheet bug #59 — Sign-in still rendering after login on the sticky CTA.
 * OccasionPage gained the same auth-aware slot as LandingPage; this is the
 * regression hook for the occasion-page surface.
 */
describe('OccasionPage — sticky CTA Sign-in slot gating (bug #59)', () => {
  it('renders Sign-in slot in both sticky surfaces when signed-out + onSignInClick supplied', () => {
    renderPage({ authOverride: 'signed-out', onSignInClick: () => undefined });
    const mobile = screen.getByTestId('sticky-primary-cta-mobile');
    const desktop = screen.getByTestId('sticky-primary-cta-desktop');
    expect(within(mobile).queryByRole('button', { name: 'Sign in', hidden: true })).toBeInTheDocument();
    expect(within(desktop).queryByRole('button', { name: 'Sign in', hidden: true })).toBeInTheDocument();
  });

  it('hides Sign-in slot in both sticky surfaces when signed-in (bug #59)', () => {
    renderPage({ authOverride: 'signed-in', onSignInClick: () => undefined });
    const mobile = screen.getByTestId('sticky-primary-cta-mobile');
    const desktop = screen.getByTestId('sticky-primary-cta-desktop');
    expect(within(mobile).queryByRole('button', { name: 'Sign in', hidden: true })).not.toBeInTheDocument();
    expect(within(desktop).queryByRole('button', { name: 'Sign in', hidden: true })).not.toBeInTheDocument();
  });

  it('hides Sign-in slot during the auth-bootstrap window (ready=false)', () => {
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

/**
 * `midCarouselSlot` is the hook OccasionRoute uses to render the
 * Mother's-Day quiz banner between the 2nd and 3rd carousels. The slot
 * itself is occasion-agnostic — only the route wires it up for MD.
 */
describe('OccasionPage — midCarouselSlot', () => {
  const fakeSection = (slug: string) => ({
    title: `Section ${slug}`,
    slug,
    products: [],
  });

  it('renders the slot when there are 2+ sections', () => {
    renderPage({
      authOverride: 'signed-out',
      sections: [fakeSection('a'), fakeSection('b'), fakeSection('c')],
      midCarouselSlot: <div data-testid="mid-slot">slot</div>,
    });
    expect(screen.getByTestId('mid-slot')).toBeInTheDocument();
  });

  it('renders nothing extra when midCarouselSlot is omitted', () => {
    renderPage({
      authOverride: 'signed-out',
      sections: [fakeSection('a'), fakeSection('b'), fakeSection('c')],
    });
    expect(screen.queryByTestId('mid-slot')).not.toBeInTheDocument();
  });

  it('does not render the slot when there are fewer than 2 sections', () => {
    renderPage({
      authOverride: 'signed-out',
      sections: [fakeSection('a')],
      midCarouselSlot: <div data-testid="mid-slot">slot</div>,
    });
    expect(screen.queryByTestId('mid-slot')).not.toBeInTheDocument();
  });
});
