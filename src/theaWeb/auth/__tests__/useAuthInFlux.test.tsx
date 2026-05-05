// Hoisted mocks: keep firebase/auth out of jsdom's reach (it crashes on
// undici/TextDecoder). Capture the listener so tests can drive token
// transitions deterministically. Mirrors the pattern in useIsSignedIn.test.
const idTokenListeners: Array<(user: any) => void> = [];
jest.mock('firebase/auth', () => ({
  onIdTokenChanged: (_auth: unknown, cb: (user: any) => void) => {
    idTokenListeners.push(cb);
    return () => {
      const i = idTokenListeners.indexOf(cb);
      if (i >= 0) idTokenListeners.splice(i, 1);
    };
  },
}));

// FirebaseContext defaults reach into firebaseConfig.js → undici. Replace
// the useAuth read with a stub so the hook stays firebase-free.
const stubAuth: any = { currentUser: { uid: 'a1', isAnonymous: true } };
jest.mock('../../firebase/FirebaseContext', () => ({
  __esModule: true,
  useAuth: () => stubAuth,
}));

import React from 'react';
import { act, renderHook } from '@testing-library/react';

import { useAuthInFlux } from '../useAuthInFlux';
import { MergeStateProvider, useSetMergeStatus } from '../MergeStateContext';

beforeEach(() => {
  idTokenListeners.length = 0;
  stubAuth.currentUser = { uid: 'a1', isAnonymous: true };
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MergeStateProvider safetyTimeoutMs={60_000}>{children}</MergeStateProvider>
);

describe('useAuthInFlux', () => {
  test('returns false when auth is settled and merge is idle', () => {
    const { result } = renderHook(() => useAuthInFlux(4000), { wrapper: Wrapper });
    expect(result.current).toBe(false);
  });

  test('returns true while mergeStatus is "merging"', () => {
    let setMerge: (s: 'idle' | 'merging' | 'merged' | 'failed') => void = () => undefined;
    const { result } = renderHook(
      () => {
        setMerge = useSetMergeStatus();
        return useAuthInFlux(4000);
      },
      { wrapper: Wrapper },
    );

    expect(result.current).toBe(false);

    act(() => {
      setMerge('merging');
    });
    expect(result.current).toBe(true);
  });

  test('stays true for graceMs after mergeStatus transitions to "merged"', () => {
    let setMerge: (s: 'idle' | 'merging' | 'merged' | 'failed') => void = () => undefined;
    const { result } = renderHook(
      () => {
        setMerge = useSetMergeStatus();
        return useAuthInFlux(4000);
      },
      { wrapper: Wrapper },
    );

    act(() => {
      setMerge('merging');
    });
    act(() => {
      setMerge('merged');
    });
    // Still in flux during the post-merge propagation window.
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current).toBe(false);
  });

  test('flips to true when isAnonymous changes (linkWithRedirect happy path)', () => {
    const { result } = renderHook(() => useAuthInFlux(4000), { wrapper: Wrapper });
    expect(result.current).toBe(false);

    // anon → permanent, same uid (linkWithRedirect upgrades in place)
    act(() => {
      idTokenListeners.forEach((cb) =>
        cb({ uid: 'a1', isAnonymous: false }),
      );
    });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current).toBe(false);
  });

  test('flips to true when uid changes (cross-account merge)', () => {
    const { result } = renderHook(() => useAuthInFlux(4000), { wrapper: Wrapper });

    act(() => {
      idTokenListeners.forEach((cb) =>
        cb({ uid: 'p1', isAnonymous: false }),
      );
    });
    expect(result.current).toBe(true);
  });

  test('does NOT flip to true on a token-refresh-only event (uid + isAnonymous unchanged)', () => {
    const { result } = renderHook(() => useAuthInFlux(4000), { wrapper: Wrapper });

    // Same uid, same isAnonymous — Firebase fires onIdTokenChanged on
    // periodic token refresh, which is not an auth transition we care
    // about. Without filtering, every refresh would flash a spinner.
    act(() => {
      idTokenListeners.forEach((cb) =>
        cb({ uid: 'a1', isAnonymous: true }),
      );
    });
    expect(result.current).toBe(false);
  });

  test('extends the grace window when a second auth change fires before the first expires', () => {
    const { result } = renderHook(() => useAuthInFlux(4000), { wrapper: Wrapper });

    act(() => {
      idTokenListeners.forEach((cb) =>
        cb({ uid: 'a1', isAnonymous: false }),
      );
    });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(true);

    // Second change at the 2s mark — grace window should reset to 4s,
    // not run out at the 4s-from-first mark.
    act(() => {
      idTokenListeners.forEach((cb) =>
        cb({ uid: 'p1', isAnonymous: false }),
      );
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(false);
  });

  test('clears the timer on unmount (no setState after unmount)', () => {
    const { result, unmount } = renderHook(() => useAuthInFlux(4000), {
      wrapper: Wrapper,
    });

    act(() => {
      idTokenListeners.forEach((cb) =>
        cb({ uid: 'a1', isAnonymous: false }),
      );
    });
    expect(result.current).toBe(true);

    unmount();

    // Advancing timers after unmount must not throw / warn — the cleanup
    // closes the timer ref before it can fire.
    expect(() => {
      jest.advanceTimersByTime(10_000);
    }).not.toThrow();
  });
});
