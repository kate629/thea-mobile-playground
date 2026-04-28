// QuizPage now renders SiteHeader → HeaderAccountMenu → firebase/auth. Stub
// the surface so jsdom doesn't crash on the undici/TextDecoder chain.
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
jest.mock('../../auth/accountAuth', () => ({
  signOutUser: jest.fn(() => Promise.resolve()),
}));
// QuizPage now calls useAuthGate() to wire SiteHeader's onSignInClick.
jest.mock('../../auth/AuthGateContext', () => ({
  useAuthGate: () => ({ requestSignIn: jest.fn() }),
  AuthGateContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import QuizPage from '../QuizPage';
import { SAMPLE_AMBIENT_IMAGES } from '../../../components/landing/quiz/sampleAmbientImages';
import { theme } from '../../../theme';

// Mock the heavy quiz card so we can assert the props QuizPage hands it
// without driving the full multi-step UI. The integration of the loading
// state itself is exercised by `QuizCardAnimated`'s flow + storybook.
jest.mock('../../../components/landing/quiz/QuizCardAnimated', () => ({
  QuizCardAnimated: (props: { loadingImages?: { original: string }[] }) => (
    <div
      data-testid="quiz-card-animated"
      data-loading-image-count={props.loadingImages?.length ?? 0}
      data-first-image={props.loadingImages?.[0]?.original ?? ''}
    />
  ),
}));

// useSubmitGiftFlow is exercised by its own test; here we just stub it.
jest.mock('../../hooks/useSubmitGiftFlow', () => ({
  useSubmitGiftFlow: () => ({
    state: { status: 'idle' },
    submit: jest.fn(),
    reset: jest.fn(),
  }),
}));

// useLeaveWarning + useBackButtonGuard pull in firebase/auth via firebaseConfig,
// which crashes jsdom (undici/TextDecoder chain — see handbook gotcha). Stub
// both so QuizPage's leave-warning wiring doesn't pull the real chain in.
jest.mock('../../hooks/useLeaveWarning', () => ({
  useLeaveWarning: () => ({
    open: false,
    requestLeave: jest.fn(),
    confirmLeave: jest.fn(),
    cancelLeave: jest.fn(),
  }),
}));
jest.mock('../../hooks/useBackButtonGuard', () => ({
  useBackButtonGuard: () => {},
}));

describe('QuizPage', () => {
  test('passes the sample ambient images into QuizCardAnimated for the loading state', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <QuizPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
    const node = screen.getByTestId('quiz-card-animated');
    // SAMPLE_AMBIENT_IMAGES is the fixed sample set wired into the in-flight
    // loading screen until live "products the algo is currently scoring"
    // is hooked up (tracked as a follow-up).
    expect(Number(node.getAttribute('data-loading-image-count'))).toBe(
      SAMPLE_AMBIENT_IMAGES.length,
    );
    expect(node.getAttribute('data-first-image')).toBe(SAMPLE_AMBIENT_IMAGES[0].original);
  });
});
