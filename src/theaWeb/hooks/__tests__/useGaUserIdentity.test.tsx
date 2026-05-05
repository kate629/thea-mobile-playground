import React from 'react';
import { render } from '@testing-library/react';
import type { Auth, User } from 'firebase/auth';

import { useGaUserIdentity } from '../useGaUserIdentity';

// Capture the latest auth-state callbacks so tests can drive them.
// Jest hoists `jest.mock` factories above imports — only `mock`-prefixed
// names from the surrounding scope can be referenced from inside.
// We mock BOTH onAuthStateChanged and onIdTokenChanged because the hook
// subscribes to both (linkWithCredential is silent on the former).
let mockLastAuthCallback: ((user: User | null) => void) | null = null;
let mockLastTokenCallback: ((user: User | null) => void) | null = null;
const mockUnsubscribe = jest.fn();
const mockUnsubscribeToken = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: User | null) => void) => {
    mockLastAuthCallback = cb;
    return mockUnsubscribe;
  },
  onIdTokenChanged: (_auth: unknown, cb: (user: User | null) => void) => {
    mockLastTokenCallback = cb;
    return mockUnsubscribeToken;
  },
}));

// FirebaseContext.useAuth() returns a fake auth instance — we just need a
// stable object reference; the mock above ignores it.
const fakeAuth = {} as Auth;
jest.mock('../../firebase/FirebaseContext', () => ({
  useAuth: () => fakeAuth,
}));

// Fire idle callbacks synchronously so the sign_up event lands in the gtag
// mock immediately. Mirrors usePageTracking.test pattern.
jest.mock('../../lib/idleCallback', () => ({
  fireWhenIdle: (fn: () => void) => fn(),
}));

// Bot detection off by default — sign_up beacon is real-user instrumentation.
jest.mock('../../lib/botDetect', () => ({ isBot: () => false }));

function Probe() {
  useGaUserIdentity();
  return null;
}

function makeUser(opts: {
  uid: string;
  isAnonymous: boolean;
  providerId?: string;
}): User {
  return {
    uid: opts.uid,
    isAnonymous: opts.isAnonymous,
    providerData: opts.providerId ? [{ providerId: opts.providerId }] : [],
  } as unknown as User;
}

describe('useGaUserIdentity', () => {
  let gtag: jest.Mock;

  beforeEach(() => {
    gtag = jest.fn();
    (window as unknown as { gtag?: unknown }).gtag = gtag;
    mockLastAuthCallback = null;
    mockLastTokenCallback = null;
    mockUnsubscribe.mockReset();
    mockUnsubscribeToken.mockReset();
    sessionStorage.clear();
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  test('sets gtag user_id AND thea_uid user property on every uid change including null', () => {
    render(<Probe />);
    expect(mockLastAuthCallback).toBeTruthy();

    // Anonymous user lands first — TWO gtag calls per uid change:
    //   1. config call with user_id (GA4 User-ID feature)
    //   2. set call with thea_uid user property (queryable custom dimension)
    mockLastAuthCallback!(makeUser({ uid: 'anon-1', isAnonymous: true }));
    expect(gtag).toHaveBeenCalledWith('config', 'G-KV1K3W6CLJ', {
      user_id: 'anon-1',
      send_page_view: false,
    });
    expect(gtag).toHaveBeenCalledWith('set', 'user_properties', {
      thea_uid: 'anon-1',
    });

    // Same uid → no extra calls (caller dedups in the hook)
    gtag.mockClear();
    mockLastAuthCallback!(makeUser({ uid: 'anon-1', isAnonymous: true }));
    expect(gtag).not.toHaveBeenCalled();

    // signOut → null uid → BOTH calls clear prior identity
    mockLastAuthCallback!(null);
    expect(gtag).toHaveBeenCalledWith('config', 'G-KV1K3W6CLJ', {
      user_id: null,
      send_page_view: false,
    });
    expect(gtag).toHaveBeenCalledWith('set', 'user_properties', {
      thea_uid: null,
    });
  });

  test('fires sign_up exactly once on anon → permanent transition', () => {
    render(<Probe />);
    // Start anon
    mockLastAuthCallback!(makeUser({ uid: 'u-1', isAnonymous: true }));
    // Filter to just sign_up calls
    const signUpCallsBefore = gtag.mock.calls.filter((c) => c[0] === 'event' && c[1] === 'sign_up');
    expect(signUpCallsBefore).toHaveLength(0);

    // Transition to permanent (linkWithCredential preserves uid)
    mockLastAuthCallback!(
      makeUser({ uid: 'u-1', isAnonymous: false, providerId: 'password' }),
    );
    const signUpCalls = gtag.mock.calls.filter((c) => c[0] === 'event' && c[1] === 'sign_up');
    expect(signUpCalls).toHaveLength(1);
    expect(signUpCalls[0][2]).toEqual({ method: 'password' });

    // Subsequent auth callbacks for the same permanent user → no additional sign_up
    mockLastAuthCallback!(
      makeUser({ uid: 'u-1', isAnonymous: false, providerId: 'password' }),
    );
    const signUpCallsAfter = gtag.mock.calls.filter((c) => c[0] === 'event' && c[1] === 'sign_up');
    expect(signUpCallsAfter).toHaveLength(1);
  });

  test('captures provider id for Google sign-in', () => {
    render(<Probe />);
    mockLastAuthCallback!(makeUser({ uid: 'u-2', isAnonymous: true }));
    mockLastAuthCallback!(
      makeUser({ uid: 'u-2', isAnonymous: false, providerId: 'google.com' }),
    );
    const signUpCalls = gtag.mock.calls.filter((c) => c[0] === 'event' && c[1] === 'sign_up');
    expect(signUpCalls).toHaveLength(1);
    expect(signUpCalls[0][2]).toEqual({ method: 'google.com' });
  });

  test('does not re-fire sign_up across re-mount thanks to sessionStorage dedup', () => {
    const { unmount } = render(<Probe />);
    mockLastAuthCallback!(makeUser({ uid: 'u-3', isAnonymous: true }));
    mockLastAuthCallback!(
      makeUser({ uid: 'u-3', isAnonymous: false, providerId: 'password' }),
    );
    expect(
      gtag.mock.calls.filter((c) => c[0] === 'event' && c[1] === 'sign_up'),
    ).toHaveLength(1);

    // Re-mount the hook (e.g. SPA navigation re-running observers)
    unmount();
    gtag.mockClear();
    render(<Probe />);
    mockLastAuthCallback!(makeUser({ uid: 'u-3', isAnonymous: true }));
    mockLastAuthCallback!(
      makeUser({ uid: 'u-3', isAnonymous: false, providerId: 'password' }),
    );
    // user_id config still happens (it's idempotent + cheap), but sign_up
    // is gated by sessionStorage and should NOT fire a second time.
    expect(
      gtag.mock.calls.filter((c) => c[0] === 'event' && c[1] === 'sign_up'),
    ).toHaveLength(0);
  });

  test('does not throw when gtag is undefined', () => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    expect(() => {
      render(<Probe />);
      mockLastAuthCallback!(makeUser({ uid: 'u-4', isAnonymous: true }));
      mockLastAuthCallback!(
        makeUser({ uid: 'u-4', isAnonymous: false, providerId: 'password' }),
      );
    }).not.toThrow();
  });

  test('unsubscribes BOTH onAuthStateChanged and onIdTokenChanged on unmount', () => {
    const { unmount } = render(<Probe />);
    expect(mockUnsubscribe).not.toHaveBeenCalled();
    expect(mockUnsubscribeToken).not.toHaveBeenCalled();
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeToken).toHaveBeenCalledTimes(1);
  });

  test('fires sign_up via onIdTokenChanged for the linkWithCredential path (uid preserved)', () => {
    // Heart-tap signup: anonymous user upgrades via linkWithCredential. Firebase
    // Auth keeps the uid the same and does NOT fire onAuthStateChanged in this
    // case — only onIdTokenChanged fires. The hook must catch this path or it
    // misses the most common signup flow on Thea.
    render(<Probe />);
    // First, the anonymous user resolves through onAuthStateChanged
    mockLastAuthCallback!(makeUser({ uid: 'u-link', isAnonymous: true }));
    expect(
      gtag.mock.calls.filter((c) => c[0] === 'event' && c[1] === 'sign_up'),
    ).toHaveLength(0);

    // linkWithCredential succeeds — onAuthStateChanged is silent. Only
    // onIdTokenChanged fires. Same uid, isAnonymous now false.
    mockLastTokenCallback!(
      makeUser({ uid: 'u-link', isAnonymous: false, providerId: 'password' }),
    );
    const signUpCalls = gtag.mock.calls.filter(
      (c) => c[0] === 'event' && c[1] === 'sign_up',
    );
    expect(signUpCalls).toHaveLength(1);
    expect(signUpCalls[0][2]).toEqual({ method: 'password' });
  });

  test('does not double-fire when both listeners report the same transition', () => {
    // Cold-load IndexedDB-restore: both onAuthStateChanged AND onIdTokenChanged
    // can fire for the same transition. The per-uid sessionStorage gate +
    // prevRef state must dedup.
    render(<Probe />);
    mockLastAuthCallback!(makeUser({ uid: 'u-dup', isAnonymous: true }));
    mockLastTokenCallback!(
      makeUser({ uid: 'u-dup', isAnonymous: false, providerId: 'password' }),
    );
    mockLastAuthCallback!(
      makeUser({ uid: 'u-dup', isAnonymous: false, providerId: 'password' }),
    );
    const signUpCalls = gtag.mock.calls.filter(
      (c) => c[0] === 'event' && c[1] === 'sign_up',
    );
    expect(signUpCalls).toHaveLength(1);
  });
});
