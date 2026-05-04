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

jest.mock('../SiteHeader', () => ({
  __esModule: true,
  SiteHeader: () => null,
}));

const mockGaProductClick = jest.fn();
const mockMetaViewContent = jest.fn();
jest.mock('../../../theaWeb/lib/gaPixel', () => ({
  __esModule: true,
  gaProductClick: (...args: unknown[]) => mockGaProductClick(...args),
}));
jest.mock('../../../theaWeb/lib/metaPixel', () => ({
  __esModule: true,
  metaViewContent: (...args: unknown[]) => mockMetaViewContent(...args),
}));

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { TeacherAppreciationPage } from './TeacherAppreciationPage';
import { SAMPLE_TEACHER_APPRECIATION_PRODUCTS } from './sampleTeacherAppreciationProducts';
import { FirebaseProvider } from '../../../theaWeb/firebase/FirebaseContext';
import { theme } from '../../../theme';

const stubAuth = { currentUser: null } as unknown as Auth;
const stubDb = {} as Firestore;
const stubFirebaseValue = {
  auth: stubAuth,
  db: stubDb,
  ensureAuth: async () => 'test-uid',
};

const renderPage = (props: Partial<React.ComponentProps<typeof TeacherAppreciationPage>> = {}) =>
  render(
    <FirebaseProvider value={stubFirebaseValue}>
      <ThemeProvider theme={theme}>
        <TeacherAppreciationPage
          title="Teacher Appreciation Gifts"
          products={SAMPLE_TEACHER_APPRECIATION_PRODUCTS}
          authInstance={stubAuth}
          {...props}
        />
      </ThemeProvider>
    </FirebaseProvider>,
  );

beforeEach(() => {
  mockGaProductClick.mockClear();
  mockMetaViewContent.mockClear();
});

describe('TeacherAppreciationPage', () => {
  it('renders the H1 and one card per product', () => {
    renderPage({ authOverride: 'signed-out' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Teacher Appreciation Gifts' }),
    ).toBeInTheDocument();
    for (const product of SAMPLE_TEACHER_APPRECIATION_PRODUCTS) {
      expect(screen.getByText(product.title)).toBeInTheDocument();
    }
  });

  it('fires gaProductClick + metaViewContent when occasion is set and a card is clicked', async () => {
    const onProductClick = jest.fn();
    renderPage({
      authOverride: 'signed-out',
      occasion: 'teacher_appreciation',
      onProductClick,
    });

    const first = SAMPLE_TEACHER_APPRECIATION_PRODUCTS[0];
    await userEvent.click(screen.getByText(first.title));

    expect(mockGaProductClick).toHaveBeenCalledTimes(1);
    expect(mockGaProductClick).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: first.id,
        product_name: first.title,
        occasion: 'teacher_appreciation',
        carousel_name: 'Teacher Appreciation Gifts',
        card_position: 0,
      }),
    );
    expect(mockMetaViewContent).toHaveBeenCalledTimes(1);
    expect(onProductClick).toHaveBeenCalledWith(first, 0);
  });

  /* Same sticky-CTA Sign-in slot contract as OccasionPage (sheet bug #59). */
  describe('sticky CTA Sign-in slot gating', () => {
    it('shows Sign-in slot when signed-out + onSignInClick supplied', () => {
      renderPage({ authOverride: 'signed-out', onSignInClick: () => undefined });
      const mobile = screen.getByTestId('sticky-primary-cta-mobile');
      expect(
        within(mobile).queryByRole('button', { name: 'Sign in', hidden: true }),
      ).toBeInTheDocument();
    });

    it('hides Sign-in slot when signed-in', () => {
      renderPage({ authOverride: 'signed-in', onSignInClick: () => undefined });
      const mobile = screen.getByTestId('sticky-primary-cta-mobile');
      expect(
        within(mobile).queryByRole('button', { name: 'Sign in', hidden: true }),
      ).not.toBeInTheDocument();
    });

    it('hides Sign-in slot during the auth-bootstrap window (ready=false)', () => {
      renderPage({ authOverride: 'loading', onSignInClick: () => undefined });
      const mobile = screen.getByTestId('sticky-primary-cta-mobile');
      expect(
        within(mobile).queryByRole('button', { name: 'Sign in', hidden: true }),
      ).not.toBeInTheDocument();
    });
  });
});
