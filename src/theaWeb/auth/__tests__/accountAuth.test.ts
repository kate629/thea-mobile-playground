// Hoisted mocks for firebase/auth so we can spy on each named export.
// Avoid `requireActual` because jest's jsdom env crashes pulling in
// firebase/auth (undici → fastify/busboy → TextDecoder) before our test even
// runs. We re-stub only the surface accountAuth touches.
jest.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: jest.fn(() => ({ providerId: 'password' })) },
  GoogleAuthProvider: Object.assign(
    jest.fn().mockImplementation(() => ({ providerId: 'google.com' })),
    { credentialFromError: jest.fn(() => ({ providerId: 'google.com' })) },
  ),
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
  createUserWithEmailAndPassword,
  linkWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { mergeGiftFlow, mintMergeToken } from '../../callables';
import {
  isValidEmail,
  signUpWithEmail,
  signInWithEmail,
} from '../accountAuth';

const mockedLink = linkWithCredential as jest.Mock;
const mockedCreate = createUserWithEmailAndPassword as jest.Mock;
const mockedSignIn = signInWithEmailAndPassword as jest.Mock;
const mockedSignInCred = signInWithCredential as jest.Mock;
const mockedMint = mintMergeToken as unknown as jest.Mock;
const mockedMerge = mergeGiftFlow as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

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
