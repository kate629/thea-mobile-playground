// Hoisted mocks: keep firebase/auth out of jsdom's reach (it crashes on
// undici/TextDecoder). Capture the listener so tests can drive auth-state
// transitions deterministically.
const authStateListeners: Array<(user: any) => void> = [];
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: any) => void) => {
    authStateListeners.push(cb);
    return () => {
      const i = authStateListeners.indexOf(cb);
      if (i >= 0) authStateListeners.splice(i, 1);
    };
  },
}));

import { act, renderHook } from '@testing-library/react';
import { useIsSignedIn } from '../useIsSignedIn';

// Stub auth instance for the override-only tests — the override branches
// short-circuit before reading from `authInstance`, so a typed empty object
// is sufficient.
const stubAuth: any = { currentUser: null };

beforeEach(() => {
  authStateListeners.length = 0;
});

describe('useIsSignedIn', () => {
  test('authOverride="signed-in" returns ready+signedIn immediately', () => {
    const { result } = renderHook(() => useIsSignedIn('signed-in', stubAuth));
    expect(result.current).toEqual({ ready: true, signedIn: true });
    expect(authStateListeners.length).toBe(0); // listener not subscribed when override
  });

  test('authOverride="signed-out" returns ready, !signedIn', () => {
    const { result } = renderHook(() => useIsSignedIn('signed-out', stubAuth));
    expect(result.current).toEqual({ ready: true, signedIn: false });
  });

  test('authOverride="loading" returns !ready, !signedIn', () => {
    const { result } = renderHook(() => useIsSignedIn('loading', stubAuth));
    expect(result.current).toEqual({ ready: false, signedIn: false });
  });

  test('no override + no user: ready=false initially, flips to ready=true on first listener event', () => {
    const auth: any = { currentUser: null };
    const { result } = renderHook(() => useIsSignedIn(undefined, auth));
    expect(result.current).toEqual({ ready: false, signedIn: false });
    expect(authStateListeners.length).toBe(1);

    act(() => {
      authStateListeners[0](null);
    });

    expect(result.current).toEqual({ ready: true, signedIn: false });
  });

  test('no override + permanent user → ready, signedIn', () => {
    const permanent: any = { uid: 'p1', isAnonymous: false };
    const auth: any = { currentUser: permanent };
    const { result } = renderHook(() => useIsSignedIn(undefined, auth));

    act(() => {
      authStateListeners[0](permanent);
    });

    expect(result.current).toEqual({ ready: true, signedIn: true });
  });

  test('no override + anon user → ready, !signedIn (anon counts as signed-out for product purposes)', () => {
    const anon: any = { uid: 'a1', isAnonymous: true };
    const auth: any = { currentUser: anon };
    const { result } = renderHook(() => useIsSignedIn(undefined, auth));

    act(() => {
      authStateListeners[0](anon);
    });

    expect(result.current).toEqual({ ready: true, signedIn: false });
  });

  test('listener flips signedIn on anon → permanent upgrade', () => {
    const anon: any = { uid: 'u1', isAnonymous: true };
    const auth: any = { currentUser: anon };
    const { result } = renderHook(() => useIsSignedIn(undefined, auth));

    act(() => {
      authStateListeners[0](anon);
    });
    expect(result.current.signedIn).toBe(false);

    const permanent: any = { uid: 'u1', isAnonymous: false };
    act(() => {
      authStateListeners[0](permanent);
    });
    expect(result.current.signedIn).toBe(true);
  });

  test('listener flips signedIn on sign-out', () => {
    const permanent: any = { uid: 'p1', isAnonymous: false };
    const auth: any = { currentUser: permanent };
    const { result } = renderHook(() => useIsSignedIn(undefined, auth));

    act(() => {
      authStateListeners[0](permanent);
    });
    expect(result.current.signedIn).toBe(true);

    act(() => {
      authStateListeners[0](null);
    });
    expect(result.current.signedIn).toBe(false);
  });
});
