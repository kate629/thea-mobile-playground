import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { theme } from '../../../theme';

// --- Mocks ----------------------------------------------------------------
//
// The page composes many heavy children (animated carousels, the live
// Firestore listeners, the auth modal, etc.). For this regression test we
// only care about the auth-gating behavior of `handleMarkPurchased`. Stub
// every dep down to a tiny shape that exposes the ONE thing the assertion
// cares about: clicking a "mark purchased" button on the rendered page.

// Mock router params + navigate so the page renders.
jest.mock('react-router-dom', () => ({
  useParams: () => ({ recipientId: 'rcp-1', recommendationId: 'rec-1' }),
  useNavigate: () => jest.fn(),
}));

// Stub firebaseConfig — we control `auth.currentUser` per test by mutating
// the exported object after import.
jest.mock('../../../firebaseConfig', () => ({
  auth: { currentUser: null as null | { isAnonymous: boolean } },
  db: {},
  ensureAuth: jest.fn(),
}));

// Capture recordActivity + requestSignIn calls. The mocks are declared
// inside the factory (rather than via a top-level `const`) because Jest
// hoists `jest.mock` ABOVE both import statements AND top-level `const`
// declarations — referencing an outer `mockX` variable can land in TDZ
// when the mocked module is first required. We expose `__getMock()` /
// `__captured()` accessors instead so the tests can read mock state.

jest.mock('../../callables', () => {
  const fn = jest.fn(() => Promise.resolve({ data: { ok: true } }));
  return {
    recordActivity: fn,
    __getMockRecordActivity: () => fn,
  };
});

jest.mock('../../auth/AuthGateContext', () => {
  const state: { onAuthed?: () => void | Promise<void> } = {};
  const fn = jest.fn();
  return {
    useAuthGate: () => ({ requestSignIn: fn }),
    __getMockRequestSignIn: () => fn,
    __getCapturedOnAuthed: () => state.onAuthed,
    __setCapturedOnAuthed: (cb: (() => void | Promise<void>) | undefined) => {
      state.onAuthed = cb;
    },
    __resetCaptured: () => {
      state.onAuthed = undefined;
    },
  };
});

// HeaderAccountMenu touches Firebase auth — replace with an inert stub.
jest.mock('../../auth/HeaderAccountMenu', () => ({
  HeaderAccountMenu: () => null,
}));

// useLeaveWarning + useBackButtonGuard + useRedirectOnSignOut pull in
// firebase/auth via firebaseConfig, which crashes jsdom (undici/TextDecoder
// chain). Stub the hooks down to inert shapes so the page tree mounts.
jest.mock('../../hooks/useLeaveWarning', () => {
  const RESULT = {
    open: false,
    requestLeave: jest.fn(),
    confirmLeave: jest.fn(),
    cancelLeave: jest.fn(),
    isSignedIn: false,
  };
  return {
    useLeaveWarning: () => RESULT,
  };
});

// Stubbed because the page wires it for browser back-button + swipe-back
// (bug #62). The hook attaches a real popstate listener; in tests we don't
// exercise it, so an inert mock keeps the page tree quiet.
jest.mock('../../hooks/useBackButtonGuard', () => ({
  useBackButtonGuard: jest.fn(),
}));

jest.mock('../../hooks/useRedirectOnSignOut', () => ({
  useRedirectOnSignOut: jest.fn(),
}));

// Time-to-first-result hook calls performance.getEntriesByName, which jsdom
// doesn't fully implement. Inert stub keeps the page tree quiet.
jest.mock('../../hooks/useTimeToFirstResult', () => ({
  useTimeToFirstResult: jest.fn(),
}));

// useRegenerate pulls in firebaseFunctions → firebase/functions → undici chain.
jest.mock('../../hooks/useRegenerate', () => {
  const RESULT = {
    state: { status: 'idle' },
    regenerate: jest.fn(() => Promise.resolve()),
    reset: jest.fn(),
  };
  return {
    useRegenerate: () => RESULT,
  };
});

// Replace the recommendation doc + carousel session + activity hooks with
// trivial fixtures. The page just needs `doc` non-null + at least one
// product in `sections` for the discover body to render carousels.
jest.mock('../../hooks/useRecommendationDoc', () => {
  const FAKE_DOC = {
    id: 'rec-1',
    recipientId: 'rcp-1',
    recommendationId: 'rec-1',
    carouselSessionId: 'sess-1',
    recipientSnapshot: {
      name: 'Jordan',
      emoji: '🎁',
      relationship: 'friend',
      ageRange: '30s',
      gender: 'any',
    },
    input: {
      occasion: 'BIRTHDAY',
      occasionLabel: 'Birthday',
      interests: [],
      vibes: [],
      priceMin: 25,
      priceMax: 200,
    },
    occasion: 'BIRTHDAY',
    status: 'COMPLETED',
    isActive: true,
  };
  const state: { doc: unknown; loading: boolean; error: Error | null } = {
    doc: FAKE_DOC,
    loading: false,
    error: null,
  };
  return {
    useRecommendationDoc: () => state,
    __setRecDocState: (next: Partial<typeof state>) => {
      Object.assign(state, next);
    },
    __resetRecDocState: () => {
      state.doc = FAKE_DOC;
      state.loading = false;
      state.error = null;
    },
  };
});

jest.mock('../../auth/useAuthInFlux', () => {
  const state = { value: false };
  return {
    useAuthInFlux: () => state.value,
    __setAuthInFlux: (v: boolean) => {
      state.value = v;
    },
    __resetAuthInFlux: () => {
      state.value = false;
    },
  };
});

jest.mock('../../hooks/useCarouselSession', () => {
  const FAKE_SESSION = { status: 'COMPLETED', carousels: [] };
  const RESULT = { session: FAKE_SESSION, error: null };
  return {
    useCarouselSession: () => RESULT,
  };
});

// Frozen empties keep referential identity stable across renders — without
// this, the page's useEffects (which depend on `liked`, `sections`, etc.)
// re-fire every render, and the `setPendingLikedIds` / `setPixelResultsFired`
// calls inside trip React's "Maximum update depth" guard. Refs are
// constructed inside the factory closure because jest hoists `jest.mock`
// above the top-level statements in the file.
jest.mock('../../hooks/useGiftActivities', () => {
  const EMPTY_SET = new Set<string>();
  const EMPTY_DETAILS: never[] = [];
  const FAKE_GIFT_ACTIVITIES = {
    liked: EMPTY_SET,
    dismissed: EMPTY_SET,
    purchased: EMPTY_SET,
    likedDetails: EMPTY_DETAILS,
    dismissedDetails: EMPTY_DETAILS,
    purchasedDetails: EMPTY_DETAILS,
    hydrated: true,
    error: null,
  };
  return {
    useGiftActivities: () => FAKE_GIFT_ACTIVITIES,
  };
});

jest.mock('../../hooks/useExitAnimationQueue', () => {
  const EMPTY_SET = new Set<string>();
  return {
    useExitAnimationQueue: () => EMPTY_SET,
  };
});

// Mock the adapter so we can ignore the carousel session shape and still
// surface a single product the test can click on.
jest.mock('../../lib/resultsAdapters', () => {
  const FAKE_ITEM = {
    id: 'prod-1',
    title: 'Cozy Throw Blanket',
    description: 'soft + warm',
    imageUrl: '',
    productUrl: '',
    brand: 'Test',
    price: '',
  };
  const FAKE_SECTIONS = [
    { id: 'c1', title: 'Cozy gifts', products: [FAKE_ITEM] },
  ];
  const FAKE_HEADER = {
    personName: 'Jordan',
    personEmoji: '🎁',
    occasion: 'Birthday',
    age: '30s',
    relationship: 'Friend',
  };
  return {
    carouselsToSections: () => FAKE_SECTIONS,
    recipientHeaderProps: () => FAKE_HEADER,
    isSessionReadyToDisplay: () => true,
    mergeHeaderWithDraft: (header: Record<string, unknown>) => header,
  };
});

// Stub ResultsPage / ResultsDiscoverTab / ResultsCarouselAnimated to a
// minimal pass-through that exposes a "mark purchased" button per item.
jest.mock('../../../components/landing/results/ResultsPage', () => ({
  ResultsPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="results-page">{children}</div>
  ),
}));

jest.mock('../../../components/landing/results/ResultsDiscoverTab', () => ({
  ResultsDiscoverTab: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="discover-tab">{children}</div>
  ),
}));

jest.mock('../../../components/landing/results/ResultsCarouselAnimated', () => ({
  ResultsCarouselAnimated: ({
    products,
    onMarkPurchased,
    onSaveClick,
  }: {
    products: Array<{ id: string }>;
    onMarkPurchased?: (item: { id: string }) => void;
    onSaveClick?: (item: { id: string }) => void;
  }) => (
    <div>
      {products.map((p) => (
        <div key={p.id}>
          <button
            data-testid={`mark-${p.id}`}
            onClick={() => onMarkPurchased?.(p)}
          >
            mark purchased
          </button>
          <button
            data-testid={`save-${p.id}`}
            onClick={() => onSaveClick?.(p)}
          >
            save
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../../../components/landing/results/ResultsCarousel', () => ({
  SkeletonResultsCarousel: () => null,
}));

jest.mock('../../../components/landing/results/ResultsSavedGrid', () => ({
  ResultsSavedGrid: () => null,
}));

jest.mock('../../../components/landing/results/ResultsPurchasedGrid', () => ({
  ResultsPurchasedGrid: () => null,
}));

// ProfileDrawer reads styled theme values inside its <Backdrop>/<Drawer>
// tree even when closed (drawer={open:false} still renders the slot). It
// also wires up a portal + escape-key listener that have nothing to do with
// the auth/heart flow under test. Stub it to a no-op.
jest.mock('../../../components/landing/results/ProfileDrawer', () => ({
  ProfileDrawer: () => null,
}));

// AlertDialog (used by useLeaveWarning's leave-confirmation modal) renders
// even when open=false because the Bootstrap Modal it wraps mounts its DOM
// portal eagerly. Stub it.
jest.mock('../../../components/ui/AlertDialog', () => ({
  AlertDialog: () => null,
}));

// --- Imports under test ---------------------------------------------------

// Pulled after mocks are registered so the page picks up the stubs.
import RecommendationResultsPage from '../RecommendationResultsPage';
import { auth } from '../../../firebaseConfig';
import * as callablesMock from '../../callables';
import * as authGateMock from '../../auth/AuthGateContext';
import * as recDocMock from '../../hooks/useRecommendationDoc';
import * as authInFluxMock from '../../auth/useAuthInFlux';

const mockRecordActivity = (
  callablesMock as unknown as { __getMockRecordActivity: () => jest.Mock }
).__getMockRecordActivity();
const mockRequestSignIn = (
  authGateMock as unknown as { __getMockRequestSignIn: () => jest.Mock }
).__getMockRequestSignIn();
const getCapturedOnAuthed = (
  authGateMock as unknown as { __getCapturedOnAuthed: () => (() => void | Promise<void>) | undefined }
).__getCapturedOnAuthed;
const resetCaptured = (
  authGateMock as unknown as { __resetCaptured: () => void }
).__resetCaptured;

beforeEach(() => {
  // CRA's default Jest config has `resetMocks: true`, which wipes mock
  // implementations (not just call history) between tests. Re-install
  // the impls every time so the assertions can rely on them.
  mockRecordActivity.mockImplementation(() =>
    Promise.resolve({ data: { ok: true } }),
  );
  mockRequestSignIn.mockImplementation(
    (options?: { mode?: string; onAuthed?: () => void | Promise<void> }) => {
      // Stash onAuthed back in the mock module's state so the test can
      // pull it out via __getCapturedOnAuthed().
      (
        authGateMock as unknown as {
          __setCapturedOnAuthed: (cb: (() => void | Promise<void>) | undefined) => void;
        }
      ).__setCapturedOnAuthed(options?.onAuthed);
    },
  );
  resetCaptured();
  // Reset the recommendation-doc + auth-in-flux mock state so each test
  // starts from "doc present, auth settled".
  (
    recDocMock as unknown as { __resetRecDocState: () => void }
  ).__resetRecDocState();
  (
    authInFluxMock as unknown as { __resetAuthInFlux: () => void }
  ).__resetAuthInFlux();
  // Reset to anonymous-by-default — tests opt into "real user" explicitly.
  (auth as { currentUser: null | { isAnonymous: boolean } }).currentUser = {
    isAnonymous: true,
  };
});

const setRecDocState = (next: { doc?: unknown; loading?: boolean; error?: Error | null }): void => {
  (
    recDocMock as unknown as {
      __setRecDocState: (n: { doc?: unknown; loading?: boolean; error?: Error | null }) => void;
    }
  ).__setRecDocState(next);
};
const setAuthInFlux = (v: boolean): void => {
  (
    authInFluxMock as unknown as { __setAuthInFlux: (v: boolean) => void }
  ).__setAuthInFlux(v);
};

// Bug 1 post-fix invariants. The fix shape: anon clicks on heart /
// mark-purchased fire recordActivity immediately under the current uid;
// the modal still opens for anon as a conversion nudge but is no longer
// load-bearing for the save. mergeGiftFlow (already wired) migrates the
// giftActivity into the permanent uid on sign-in. Killing the in-memory
// onAuthed-callback dependency is what makes the mobile redirect path
// work — the React tree can be torn down by the post-OAuth tab reload
// without losing the save.
describe('RecommendationResultsPage — heart save (Bug 1 post-fix invariants)', () => {
  test('anon click on heart fires recordActivity immediately under the anon uid', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecommendationResultsPage />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId('save-prod-1'));

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    expect(mockRecordActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-1',
        state: 'SAVED',
        recipientIds: ['rcp-1'],
      }),
    );
  });

  test('anon click on heart opens the sign-in modal as a conversion nudge with no onAuthed gate', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecommendationResultsPage />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId('save-prod-1'));

    expect(mockRequestSignIn).toHaveBeenCalledTimes(1);
    expect(mockRequestSignIn).toHaveBeenCalledWith({ mode: 'signup' });
    // Critical: the save must NOT depend on a callback firing post-auth.
    // That dependency is what mobile redirect destroys (Bug 1).
    expect(getCapturedOnAuthed()).toBeUndefined();
  });

  test('signed-in click on heart fires recordActivity and does not open the modal', () => {
    (auth as { currentUser: null | { isAnonymous: boolean } }).currentUser = {
      isAnonymous: false,
    };

    render(
      <ThemeProvider theme={theme}>
        <RecommendationResultsPage />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId('save-prod-1'));

    expect(mockRequestSignIn).not.toHaveBeenCalled();
    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    expect(mockRecordActivity).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'prod-1', state: 'SAVED' }),
    );
  });
});

// Same post-fix invariants for mark-purchased — the same in-memory-callback
// trap exists on this handler today, with the same redirect-loss
// consequence on mobile. Phase 2 applies the same fix to handleMarkPurchased.
describe('RecommendationResultsPage — mark-purchased (Bug 1 post-fix invariants)', () => {
  test('anon click on mark-purchased fires recordActivity immediately under the anon uid', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecommendationResultsPage />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId('mark-prod-1'));

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    expect(mockRecordActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-1',
        state: 'PURCHASED',
        recipientIds: ['rcp-1'],
      }),
    );
  });

  test('anon click on mark-purchased opens the sign-in modal with no onAuthed gate', () => {
    render(
      <ThemeProvider theme={theme}>
        <RecommendationResultsPage />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId('mark-prod-1'));

    expect(mockRequestSignIn).toHaveBeenCalledTimes(1);
    expect(mockRequestSignIn).toHaveBeenCalledWith({ mode: 'signup' });
    expect(getCapturedOnAuthed()).toBeUndefined();
  });
});

// "doc not found" branch behavior. Phase 2a fix moved heart save off the
// in-memory onAuthed callback, so an anon user signing in mid-page now
// triggers a uid-flip / merge / linkWithRedirect-in-place transition. During
// that transition Firestore listeners briefly re-bind under the new auth
// state and a snapshot can return `!exists` for one beat. Without the
// authInFlux gate the page flashes "we couldn't find this recommendation"
// for that beat. With it, the spinner shows until the next snapshot lands.
describe('RecommendationResultsPage — doc-not-found branch', () => {
  test('renders the "couldn\'t find" alert when doc is null and auth is settled', () => {
    setRecDocState({ doc: null });
    setAuthInFlux(false);

    render(
      <ThemeProvider theme={theme}>
        <RecommendationResultsPage />
      </ThemeProvider>,
    );

    expect(screen.getByText(/couldn't find this recommendation/i)).toBeInTheDocument();
  });

  test('renders a spinner (NOT the alert) when doc is null but auth is in flux', () => {
    setRecDocState({ doc: null });
    setAuthInFlux(true);

    render(
      <ThemeProvider theme={theme}>
        <RecommendationResultsPage />
      </ThemeProvider>,
    );

    expect(screen.queryByText(/couldn't find this recommendation/i)).toBeNull();
    // react-bootstrap's <Spinner> renders a div with role="status".
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
