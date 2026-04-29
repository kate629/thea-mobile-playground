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
import { fireEvent, render, screen } from '@testing-library/react';
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
//
// The mock captures the args passed to useLeaveWarning so tests can assert on
// the destination string. Args are captured to a local in the factory and
// exposed via a synthetic export — pulling them out via `jest.requireMock`
// below. (Jest hoists `jest.mock()` above all imports, so an outer `const`
// referenced by name would still be undefined when the factory runs.)
jest.mock('../../hooks/useLeaveWarning', () => {
  let lastArgs: unknown[] = [];
  // Modal open state is mutable so tests can flip it via __setOpen and verify
  // the AlertDialog renders + the primary button wires through correctly.
  const state = {
    open: true,
    confirmLeave: jest.fn(),
    cancelLeave: jest.fn(),
  };
  const reset = () => {
    lastArgs = [];
    state.open = true;
    state.confirmLeave.mockClear();
    state.cancelLeave.mockClear();
  };
  return {
    useLeaveWarning: (...args: unknown[]) => {
      lastArgs = args;
      return {
        open: state.open,
        requestLeave: () => undefined,
        confirmLeave: state.confirmLeave,
        cancelLeave: state.cancelLeave,
        isSignedIn: false,
      };
    },
    __getLastArgs: () => lastArgs,
    __getState: () => state,
    __reset: reset,
  };
});
jest.mock('../../hooks/useBackButtonGuard', () => {
  const release = jest.fn();
  const reset = () => release.mockClear();
  return {
    useBackButtonGuard: () => ({ release }),
    __getRelease: () => release,
    __reset: reset,
  };
});

const useLeaveWarningMock = jest.requireMock('../../hooks/useLeaveWarning') as {
  __getLastArgs: () => unknown[];
  __getState: () => {
    confirmLeave: jest.Mock;
    cancelLeave: jest.Mock;
    open: boolean;
  };
  __reset: () => void;
};
const useBackButtonGuardMock = jest.requireMock('../../hooks/useBackButtonGuard') as {
  __getRelease: () => jest.Mock;
  __reset: () => void;
};

describe('QuizPage', () => {
  beforeEach(() => {
    useLeaveWarningMock.__reset();
    useBackButtonGuardMock.__reset();
  });

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

  /**
   * Leave-warning destination should match the entrypoint's path so the user
   * returns to where they came from instead of always landing on '/' (the
   * pre-fix behavior — surfaced by the Mother's Day occasion-page banner).
   * Entrypoints pass `location.state.from` when navigating to /quiz.
   */
  test('uses location.state.from as the leave-warning destination', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter
          initialEntries={[{ pathname: '/quiz', state: { from: '/occasion/mothers_day' } }]}
        >
          <QuizPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(useLeaveWarningMock.__getLastArgs()).toEqual(['/occasion/mothers_day']);
  });

  test("falls back to '/' when no entrypoint state is provided (direct visit)", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/quiz']}>
          <QuizPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(useLeaveWarningMock.__getLastArgs()).toEqual(['/']);
  });

  /**
   * Scroll-restoration on confirm-leave: when the user came from inside the
   * app (entry-point set `state.from`), the Leave button must pop the history
   * stack via guard.release(1) instead of pushing a new navigate(to). Pushing
   * loses scroll position; popping triggers browser-native scroll restore.
   */
  test('confirm-leave from in-app entry pops history stack (release(1)), not navigate', async () => {
    const { findByRole } = render(
      <ThemeProvider theme={theme}>
        <MemoryRouter
          initialEntries={[{ pathname: '/quiz', state: { from: '/occasion/mothers_day' } }]}
        >
          <QuizPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
    // The mock holds open=true; the AlertDialog renders. Find Leave + click.
    const leaveBtn = await findByRole('button', { name: /leave/i });
    fireEvent.click(leaveBtn);

    expect(useBackButtonGuardMock.__getRelease()).toHaveBeenCalledWith(1);
    // The hook's confirmLeave (which navigates) must NOT be called for the
    // in-app path — that would push a new entry and lose scroll position.
    expect(useLeaveWarningMock.__getState().confirmLeave).not.toHaveBeenCalled();
    // Modal closes via cancelLeave so it doesn't flash during the pop.
    expect(useLeaveWarningMock.__getState().cancelLeave).toHaveBeenCalledTimes(1);
  });

  test('confirm-leave from direct visit falls back to leaveWarning.confirmLeave (navigate)', async () => {
    const { findByRole } = render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/quiz']}>
          <QuizPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
    const leaveBtn = await findByRole('button', { name: /leave/i });
    fireEvent.click(leaveBtn);

    // No in-app entry to pop back to — use the navigate-to-fallback path.
    expect(useBackButtonGuardMock.__getRelease()).not.toHaveBeenCalled();
    expect(useLeaveWarningMock.__getState().confirmLeave).toHaveBeenCalledTimes(1);
  });
});
