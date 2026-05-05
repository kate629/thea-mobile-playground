// Hoisted mocks for firebase/auth so we can spy on each named export.
// Avoid `requireActual` because jest's jsdom env crashes pulling in
// firebase/auth (undici → fastify/busboy → TextDecoder) before our test even
// runs. We re-stub only the surface accountAuth touches.
jest.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: jest.fn(() => ({ providerId: 'password' })) },
  GoogleAuthProvider: Object.assign(
    jest.fn().mockImplementation(() => ({ providerId: 'google.com' })),
    { credentialFromError: jest.fn(() => null) },
  ),
  OAuthProvider: (() => {
    class MockOAuthProvider {
      providerId: string;
      addScope: jest.Mock;
      constructor(providerId: string) {
        this.providerId = providerId;
        this.addScope = jest.fn();
      }
      static credentialFromError = jest.fn(() => null);
    }
    return MockOAuthProvider;
  })(),
  createUserWithEmailAndPassword: jest.fn(),
  getRedirectResult: jest.fn(),
  linkWithCredential: jest.fn(),
  linkWithPopup: jest.fn(),
  linkWithRedirect: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithCredential: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('../../callables', () => ({
  mintMergeToken: jest.fn(),
  mergeGiftFlow: jest.fn(),
}));

jest.mock('../../../firebaseConfig', () => ({
  auth: { currentUser: null },
}));

import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  linkWithCredential,
  linkWithPopup,
  linkWithRedirect,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

import { mergeGiftFlow, mintMergeToken } from '../../callables';
import {
  consumeAuthRedirectResult,
  isValidEmail,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../accountAuth';

const mockedLink = linkWithCredential as jest.Mock;
const mockedCreate = createUserWithEmailAndPassword as jest.Mock;
const mockedSignIn = signInWithEmailAndPassword as jest.Mock;
const mockedSignInCred = signInWithCredential as jest.Mock;
const mockedMint = mintMergeToken as unknown as jest.Mock;
const mockedMerge = mergeGiftFlow as unknown as jest.Mock;
const mockedLinkPopup = linkWithPopup as jest.Mock;
const mockedLinkRedirect = linkWithRedirect as jest.Mock;
const mockedSignInPopup = signInWithPopup as jest.Mock;
const mockedSignInRedirect = signInWithRedirect as jest.Mock;
const mockedGetRedirect = getRedirectResult as jest.Mock;
const mockedAppleCredFromError = OAuthProvider.credentialFromError as jest.Mock;
const mockedGoogleCredFromError = GoogleAuthProvider.credentialFromError as jest.Mock;

/**
 * `isMobileUserAgent` reads `navigator.userAgent`. jsdom's default UA is a
 * desktop string, so it returns false. Use this helper to flip to mobile for
 * a single test, restoring the original UA on cleanup.
 */
function withMobileUA(): () => void {
  const original = navigator.userAgent;
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    configurable: true,
  });
  return () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: original,
      configurable: true,
    });
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Each test sees a fresh sessionStorage so the redirect-marker assertions
  // aren't polluted by a previous test's state.
  sessionStorage.clear();
});

const REDIRECT_MARKER_KEY = 'thea:authRedirectStarted';

const anonUser: any = { uid: 'anon-1', isAnonymous: true };
const realUser: any = { uid: 'real-1', isAnonymous: false };

function authWith(user: any): any {
  return { currentUser: user };
}

describe('isValidEmail', () => {
  test.each([
    ['mom@example.com', true],
    ['  spaces@trim.io  ', true],
    ['no-at-sign.com', false],
    ['no@dot', false],
    ['', false],
  ])('%s -> %s', (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});

describe('signUpWithEmail — anon happy path', () => {
  test('links the credential to the anon uid (uid preserved, no merge call)', async () => {
    const auth = authWith(anonUser);
    mockedLink.mockResolvedValueOnce({ user: { uid: 'anon-1' } });

    const result = await signUpWithEmail('mom@x.com', 'pw12345678', auth);

    expect(mockedLink).toHaveBeenCalledTimes(1);
    expect(mockedMint).not.toHaveBeenCalled();
    expect(mockedMerge).not.toHaveBeenCalled();
    expect(result.user.uid).toBe('anon-1');
  });
});

describe('signUpWithEmail — credential already in use', () => {
  test('mints token, signs in as existing user, then merges anon subtree', async () => {
    const auth = authWith(anonUser);
    const err = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLink.mockRejectedValueOnce(err);
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok-abc', expiresAt: Date.now() + 60_000 } });
    mockedSignIn.mockResolvedValueOnce({ user: realUser });

    const result = await signUpWithEmail('mom@x.com', 'pw12345678', auth);

    // Mint runs while we still have the anon currentUser captured.
    expect(mockedMint).toHaveBeenCalledTimes(1);
    expect(mockedSignIn).toHaveBeenCalledWith(auth, 'mom@x.com', 'pw12345678');
    expect(mockedMerge).toHaveBeenCalledWith({ fromUid: 'anon-1', token: 'tok-abc' });
    expect(result.user).toBe(realUser);
  });

  test('falls back to createUser when signIn rejects (account exists in another provider)', async () => {
    const auth = authWith(anonUser);
    const linkErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLink.mockRejectedValueOnce(linkErr);
    mockedMint.mockResolvedValueOnce({ data: { token: 't', expiresAt: 0 } });
    mockedSignIn.mockRejectedValueOnce(new Error('wrong password'));
    mockedCreate.mockResolvedValueOnce({ user: realUser });

    const result = await signUpWithEmail('mom@x.com', 'pw12345678', auth);

    expect(mockedCreate).toHaveBeenCalled();
    expect(result.user).toBe(realUser);
  });

  test('merge failure does not block the sign-in resolution', async () => {
    const auth = authWith(anonUser);
    const linkErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLink.mockRejectedValueOnce(linkErr);
    mockedMint.mockResolvedValueOnce({ data: { token: 't', expiresAt: 0 } });
    mockedSignIn.mockResolvedValueOnce({ user: realUser });
    mockedMerge.mockRejectedValueOnce(new Error('merge BE 500'));

    const result = await signUpWithEmail('mom@x.com', 'pw12345678', auth);

    expect(result.user).toBe(realUser);
  });
});

describe('signUpWithEmail — already permanent', () => {
  test('creates the user without any link or merge', async () => {
    const auth = authWith(realUser);
    mockedCreate.mockResolvedValueOnce({ user: realUser });

    await signUpWithEmail('new@x.com', 'pw12345678', auth);

    expect(mockedLink).not.toHaveBeenCalled();
    expect(mockedMint).not.toHaveBeenCalled();
    expect(mockedMerge).not.toHaveBeenCalled();
    expect(mockedCreate).toHaveBeenCalled();
  });
});

describe('signInWithEmail', () => {
  test('captures merge intent when signing in from anon', async () => {
    const auth = authWith(anonUser);
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok-x', expiresAt: 0 } });
    mockedSignIn.mockResolvedValueOnce({ user: realUser });

    await signInWithEmail('mom@x.com', 'pw12345678', auth);

    expect(mockedMint).toHaveBeenCalled();
    expect(mockedMerge).toHaveBeenCalledWith({ fromUid: 'anon-1', token: 'tok-x' });
  });

  test('does NOT mint a token when caller is already permanent', async () => {
    const auth = authWith(realUser);
    mockedSignIn.mockResolvedValueOnce({ user: realUser });

    await signInWithEmail('mom@x.com', 'pw12345678', auth);

    expect(mockedMint).not.toHaveBeenCalled();
    expect(mockedMerge).not.toHaveBeenCalled();
  });
});

describe('signInWithEmail — silent mint failure', () => {
  test('still signs the user in even when mintMergeToken throws', async () => {
    const auth = authWith(anonUser);
    mockedMint.mockRejectedValueOnce(new Error('emulator down'));
    mockedSignIn.mockResolvedValueOnce({ user: realUser });

    await signInWithEmail('mom@x.com', 'pw12345678', auth);

    expect(mockedSignIn).toHaveBeenCalled();
    expect(mockedMerge).not.toHaveBeenCalled();
  });
});

describe('signInWithCredential dependency surface', () => {
  // Sanity: ensure we expose the mock so other tests can reach for it if
  // we expand the suite — keeps the mock surface consistent.
  test('mock is wired', () => {
    expect(typeof mockedSignInCred.mockReset).toBe('function');
  });
});

describe('signInWithApple', () => {
  test('anon happy path: linkWithPopup, no merge, uid preserved', async () => {
    const auth = authWith(anonUser);
    mockedLinkPopup.mockResolvedValueOnce({ user: { uid: 'anon-1' } });

    const result = await signInWithApple(auth);

    expect(mockedLinkPopup).toHaveBeenCalledTimes(1);
    expect(mockedLinkRedirect).not.toHaveBeenCalled();
    expect(mockedMint).not.toHaveBeenCalled();
    expect(mockedMerge).not.toHaveBeenCalled();
    expect(result?.user.uid).toBe('anon-1');
  });

  test('anon mobile path: linkWithRedirect, returns null, no popup methods called', async () => {
    const restoreUA = withMobileUA();
    try {
      const auth = authWith(anonUser);
      mockedLinkRedirect.mockResolvedValueOnce(undefined);

      const result = await signInWithApple(auth);

      expect(mockedLinkRedirect).toHaveBeenCalledTimes(1);
      expect(mockedLinkPopup).not.toHaveBeenCalled();
      expect(mockedSignInPopup).not.toHaveBeenCalled();
      expect(result).toBeNull();
    } finally {
      restoreUA();
    }
  });

  test('anon credential-already-in-use → mint → signInWithCredential → merge', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce({ providerId: 'apple.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok-apple', expiresAt: 0 } });
    mockedSignInCred.mockResolvedValueOnce({ user: realUser });

    const result = await signInWithApple(auth);

    expect(mockedMint).toHaveBeenCalledTimes(1);
    expect(mockedSignInCred).toHaveBeenCalledWith(auth, { providerId: 'apple.com' });
    expect(mockedMerge).toHaveBeenCalledWith({ fromUid: 'anon-1', token: 'tok-apple' });
    expect(result?.user).toBe(realUser);
  });

  test('anon credential-already-in-use, mint fails → still signs in, no merge', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce({ providerId: 'apple.com' });
    mockedMint.mockRejectedValueOnce(new Error('emulator down'));
    mockedSignInCred.mockResolvedValueOnce({ user: realUser });

    const result = await signInWithApple(auth);

    expect(mockedSignInCred).toHaveBeenCalled();
    expect(mockedMerge).not.toHaveBeenCalled();
    expect(result?.user).toBe(realUser);
  });

  test('anon credential-already-in-use, merge fails → still resolves with signed-in user', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce({ providerId: 'apple.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok-x', expiresAt: 0 } });
    mockedSignInCred.mockResolvedValueOnce({ user: realUser });
    mockedMerge.mockRejectedValueOnce(new Error('merge BE 500'));

    const result = await signInWithApple(auth);

    expect(result?.user).toBe(realUser);
  });

  test('anon credential-already-in-use, no recoverable credential → falls through to fresh signInWithPopup', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce(null);
    mockedGoogleCredFromError.mockReturnValueOnce(null);
    mockedSignInPopup.mockResolvedValueOnce({ user: realUser });

    const result = await signInWithApple(auth);

    expect(mockedSignInCred).not.toHaveBeenCalled();
    expect(mockedSignInPopup).toHaveBeenCalledTimes(1);
    expect(result?.user).toBe(realUser);
  });

  test('anon non-in-use error → rethrows (e.g. popup-closed-by-user)', async () => {
    const auth = authWith(anonUser);
    const cancelErr = Object.assign(new Error('cancel'), {
      code: 'auth/popup-closed-by-user',
    });
    mockedLinkPopup.mockRejectedValueOnce(cancelErr);

    await expect(signInWithApple(auth)).rejects.toBe(cancelErr);
    expect(mockedSignInCred).not.toHaveBeenCalled();
    expect(mockedSignInPopup).not.toHaveBeenCalled();
  });

  test('already-permanent path: signInWithPopup, no link, no merge', async () => {
    const auth = authWith(realUser);
    mockedSignInPopup.mockResolvedValueOnce({ user: realUser });

    await signInWithApple(auth);

    expect(mockedLinkPopup).not.toHaveBeenCalled();
    expect(mockedLinkRedirect).not.toHaveBeenCalled();
    expect(mockedMint).not.toHaveBeenCalled();
    expect(mockedMerge).not.toHaveBeenCalled();
    expect(mockedSignInPopup).toHaveBeenCalledTimes(1);
  });

  test('already-permanent mobile path: signInWithRedirect, returns null', async () => {
    const restoreUA = withMobileUA();
    try {
      const auth = authWith(realUser);
      mockedSignInRedirect.mockResolvedValueOnce(undefined);

      const result = await signInWithApple(auth);

      expect(mockedSignInRedirect).toHaveBeenCalledTimes(1);
      expect(mockedSignInPopup).not.toHaveBeenCalled();
      expect(result).toBeNull();
    } finally {
      restoreUA();
    }
  });

  test('onMergeStatus fires "merging" before signInWithCredential and "merged" after success', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    const events: string[] = [];
    const onMergeStatus = jest.fn((s: string) => {
      events.push(`status:${s}`);
    });
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce({ providerId: 'apple.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok', expiresAt: 0 } });
    mockedSignInCred.mockImplementationOnce(async () => {
      events.push('signInWithCredential');
      return { user: realUser };
    });
    mockedMerge.mockImplementationOnce(async () => {
      events.push('mergeGiftFlow');
    });

    await signInWithApple(auth, onMergeStatus);

    expect(events).toEqual([
      'status:merging',
      'signInWithCredential',
      'mergeGiftFlow',
      'status:merged',
    ]);
  });

  test('onMergeStatus fires "failed" when merge rejects', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    const onMergeStatus = jest.fn();
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce({ providerId: 'apple.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok', expiresAt: 0 } });
    mockedSignInCred.mockResolvedValueOnce({ user: realUser });
    mockedMerge.mockRejectedValueOnce(new Error('merge fail'));

    await signInWithApple(auth, onMergeStatus);

    expect(onMergeStatus).toHaveBeenCalledWith('merging');
    expect(onMergeStatus).toHaveBeenCalledWith('failed');
  });

  test('onMergeStatus fires "idle" when signInWithCredential rejects after merging flip', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    const onMergeStatus = jest.fn();
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce({ providerId: 'apple.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok', expiresAt: 0 } });
    mockedSignInCred.mockRejectedValueOnce(new Error('credential rejected'));

    await expect(signInWithApple(auth, onMergeStatus)).rejects.toThrow('credential rejected');
    expect(onMergeStatus).toHaveBeenCalledWith('merging');
    expect(onMergeStatus).toHaveBeenCalledWith('idle');
  });
});

describe('signInWithGoogle (regression after refactor)', () => {
  test('anon happy path still uses linkWithPopup', async () => {
    const auth = authWith(anonUser);
    mockedLinkPopup.mockResolvedValueOnce({ user: { uid: 'anon-1' } });

    const result = await signInWithGoogle(auth);

    expect(mockedLinkPopup).toHaveBeenCalledTimes(1);
    expect(result?.user.uid).toBe('anon-1');
  });

  test('credential-already-in-use → recovers via OAuthProvider.credentialFromError first', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    // OAuth extractor handles Google credentials too — it should fire first.
    mockedAppleCredFromError.mockReturnValueOnce({ providerId: 'google.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok-g', expiresAt: 0 } });
    mockedSignInCred.mockResolvedValueOnce({ user: realUser });

    const result = await signInWithGoogle(auth);

    expect(mockedAppleCredFromError).toHaveBeenCalled();
    expect(mockedSignInCred).toHaveBeenCalled();
    expect(mockedMerge).toHaveBeenCalledWith({ fromUid: 'anon-1', token: 'tok-g' });
    expect(result?.user).toBe(realUser);
  });

  test('credential-already-in-use → falls back to GoogleAuthProvider.credentialFromError when OAuthProvider returns null', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedLinkPopup.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce(null);
    mockedGoogleCredFromError.mockReturnValueOnce({ providerId: 'google.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok-g2', expiresAt: 0 } });
    mockedSignInCred.mockResolvedValueOnce({ user: realUser });

    const result = await signInWithGoogle(auth);

    expect(mockedGoogleCredFromError).toHaveBeenCalled();
    expect(mockedSignInCred).toHaveBeenCalled();
    expect(result?.user).toBe(realUser);
  });
});

describe('consumeAuthRedirectResult', () => {
  test('success path returns result.user inside the wrapper', async () => {
    const auth = authWith(anonUser);
    mockedGetRedirect.mockResolvedValueOnce({ user: realUser });

    const result = await consumeAuthRedirectResult(auth);

    expect(result.user).toBe(realUser);
    expect(mockedSignInCred).not.toHaveBeenCalled();
  });

  test('null result returns user=null inside the wrapper', async () => {
    const auth = authWith(anonUser);
    mockedGetRedirect.mockResolvedValueOnce(null);

    const result = await consumeAuthRedirectResult(auth);

    expect(result.user).toBeNull();
  });

  test('Apple credential-already-in-use → recovers via OAuthProvider extractor + merges', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedGetRedirect.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce({ providerId: 'apple.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok-r', expiresAt: 0 } });
    mockedSignInCred.mockResolvedValueOnce({ user: realUser });

    const result = await consumeAuthRedirectResult(auth);

    expect(result.user).toBe(realUser);
    expect(mockedMerge).toHaveBeenCalledWith({ fromUid: 'anon-1', token: 'tok-r' });
  });

  test('Google credential-already-in-use still recoverable (regression check after rename)', async () => {
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedGetRedirect.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce(null);
    mockedGoogleCredFromError.mockReturnValueOnce({ providerId: 'google.com' });
    mockedMint.mockResolvedValueOnce({ data: { token: 'tok-rg', expiresAt: 0 } });
    mockedSignInCred.mockResolvedValueOnce({ user: realUser });

    const result = await consumeAuthRedirectResult(auth);

    expect(result.user).toBe(realUser);
  });

  test('credential-already-in-use with no recoverable credential surfaces errorCode (no rethrow)', async () => {
    // Phase 2 change: instead of rethrowing — which left the AuthGate root
    // useEffect to swallow the error in a generic console.error and gave the
    // user no signal — we now return the wrapper with `errorCode` populated.
    // The gate fires `auth_redirect_lost` telemetry on this branch.
    const auth = authWith(anonUser);
    const inUseErr = Object.assign(new Error('in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockedGetRedirect.mockRejectedValueOnce(inUseErr);
    mockedAppleCredFromError.mockReturnValueOnce(null);
    mockedGoogleCredFromError.mockReturnValueOnce(null);

    const result = await consumeAuthRedirectResult(auth);

    expect(result.user).toBeNull();
    expect(result.errorCode).toBe('auth/credential-already-in-use');
  });

  test('non-in-use rejection rethrows', async () => {
    const auth = authWith(anonUser);
    const otherErr = Object.assign(new Error('boom'), {
      code: 'auth/network-request-failed',
    });
    mockedGetRedirect.mockRejectedValueOnce(otherErr);

    await expect(consumeAuthRedirectResult(auth)).rejects.toBe(otherErr);
  });
});

// Phase 2 introduces a sessionStorage marker written immediately before any
// signInWithRedirect / linkWithRedirect call. The marker lets the post-redirect
// AuthGate distinguish "no redirect was ever in flight" from "we initiated a
// redirect and the credential was lost between provider and return" — Bug 2's
// detection signal. These tests fail on master (no marker is written today)
// and pass once Phase 2 adds the writes inside `signInWithOAuthProvider`.
describe('redirect-marker — written before mobile redirect (Bug 2 detection)', () => {
  test('anon mobile linkWithRedirect via signInWithApple writes the marker with provider=apple', async () => {
    const restoreUA = withMobileUA();
    try {
      const auth = authWith(anonUser);
      mockedLinkRedirect.mockResolvedValueOnce(undefined);

      await signInWithApple(auth);

      const raw = sessionStorage.getItem(REDIRECT_MARKER_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.provider).toBe('apple');
      expect(typeof parsed.ts).toBe('number');
    } finally {
      restoreUA();
    }
  });

  test('anon mobile linkWithRedirect via signInWithGoogle writes the marker with provider=google', async () => {
    const restoreUA = withMobileUA();
    try {
      const auth = authWith(anonUser);
      mockedLinkRedirect.mockResolvedValueOnce(undefined);

      await signInWithGoogle(auth);

      const raw = sessionStorage.getItem(REDIRECT_MARKER_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.provider).toBe('google');
    } finally {
      restoreUA();
    }
  });

  test('non-anon mobile signInWithRedirect via signInWithApple writes the marker', async () => {
    const restoreUA = withMobileUA();
    try {
      const auth = authWith(realUser);
      mockedSignInRedirect.mockResolvedValueOnce(undefined);

      await signInWithApple(auth);

      const raw = sessionStorage.getItem(REDIRECT_MARKER_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.provider).toBe('apple');
    } finally {
      restoreUA();
    }
  });

  test('desktop popup path does NOT write the marker (no redirect, no need)', async () => {
    // Desktop UA — withMobileUA NOT called.
    const auth = authWith(anonUser);
    mockedLinkPopup.mockResolvedValueOnce({ user: realUser });

    await signInWithApple(auth);

    expect(sessionStorage.getItem(REDIRECT_MARKER_KEY)).toBeNull();
  });
});

describe('consumeAuthRedirectResult — return shape & marker handling', () => {
  test('clears the marker after a successful redirect-result', async () => {
    sessionStorage.setItem(
      REDIRECT_MARKER_KEY,
      JSON.stringify({ provider: 'apple', ts: Date.now() }),
    );
    const auth = authWith(anonUser);
    mockedGetRedirect.mockResolvedValueOnce({ user: realUser });

    await consumeAuthRedirectResult(auth);

    expect(sessionStorage.getItem(REDIRECT_MARKER_KEY)).toBeNull();
  });

  test('clears the marker even when getRedirectResult returns null (credential lost)', async () => {
    sessionStorage.setItem(
      REDIRECT_MARKER_KEY,
      JSON.stringify({ provider: 'google', ts: Date.now() }),
    );
    const auth = authWith(anonUser);
    mockedGetRedirect.mockResolvedValueOnce(null);

    await consumeAuthRedirectResult(auth);

    expect(sessionStorage.getItem(REDIRECT_MARKER_KEY)).toBeNull();
  });

  test('returns markerPresent=true when redirect was initiated (Bug 2 detection)', async () => {
    sessionStorage.setItem(
      REDIRECT_MARKER_KEY,
      JSON.stringify({ provider: 'apple', ts: Date.now() }),
    );
    const auth = authWith(anonUser);
    mockedGetRedirect.mockResolvedValueOnce(null);

    const result = (await consumeAuthRedirectResult(auth)) as unknown as {
      user: unknown;
      markerPresent: boolean;
    };

    expect(result).toMatchObject({ user: null, markerPresent: true });
  });

  test('returns markerPresent=false when no redirect was in flight (cold load)', async () => {
    // Note: NO sessionStorage marker preset.
    const auth = authWith(anonUser);
    mockedGetRedirect.mockResolvedValueOnce(null);

    const result = (await consumeAuthRedirectResult(auth)) as unknown as {
      user: unknown;
      markerPresent: boolean;
    };

    expect(result).toMatchObject({ user: null, markerPresent: false });
  });
});
