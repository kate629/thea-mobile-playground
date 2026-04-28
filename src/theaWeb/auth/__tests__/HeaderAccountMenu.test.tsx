// Hoisted mocks: keep firebase/auth out of jsdom (its undici/TextDecoder chain
// crashes the test runner) and stub the firebaseConfig auth instance so the
// component's listeners never fire real Firebase code. Capture both
// observers in arrays so tests can drive them deterministically.
const idTokenListeners: Array<(user: any) => void> = [];
const authStateListeners: Array<(user: any) => void> = [];
jest.mock('firebase/auth', () => ({
  onIdTokenChanged: (_auth: unknown, cb: (user: any) => void) => {
    idTokenListeners.push(cb);
    return () => {
      const i = idTokenListeners.indexOf(cb);
      if (i >= 0) idTokenListeners.splice(i, 1);
    };
  },
  onAuthStateChanged: (_auth: unknown, cb: (user: any) => void) => {
    authStateListeners.push(cb);
    return () => {
      const i = authStateListeners.indexOf(cb);
      if (i >= 0) authStateListeners.splice(i, 1);
    };
  },
  signOut: () => Promise.resolve(),
}));

beforeEach(() => {
  idTokenListeners.length = 0;
  authStateListeners.length = 0;
});

jest.mock('../../../firebaseConfig', () => ({
  auth: { currentUser: null },
}));

jest.mock('../accountAuth', () => ({
  signOutUser: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { AuthGateContext } from '../AuthGateContext';
import { HeaderAccountMenu } from '../HeaderAccountMenu';
import { signOutUser } from '../accountAuth';
import { theme } from '../../../theme';

const permanentUser = {
  uid: 'perm-uid',
  isAnonymous: false,
  displayName: 'Kate',
  email: 'kate@example.com',
  photoURL: null,
} as never;

function renderWithGate(
  child: React.ReactNode,
  gate: { requestSignIn: jest.Mock } | null = { requestSignIn: jest.fn() },
) {
  return render(
    <ThemeProvider theme={theme}>
      <AuthGateContext.Provider value={gate as never}>{child}</AuthGateContext.Provider>
    </ThemeProvider>,
  );
}

describe('HeaderAccountMenu', () => {
  beforeEach(() => {
    (signOutUser as jest.Mock).mockClear();
  });

  test('anonymous user sees the Sign in pill and clicking it requests sign-in', () => {
    const gate = { requestSignIn: jest.fn() };
    renderWithGate(<HeaderAccountMenu userOverride={null} />, gate);
    const pill = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(pill);
    expect(gate.requestSignIn).toHaveBeenCalledWith({ mode: 'signin' });
  });

  test('renders without crashing when AuthGateProvider is absent (Sign in becomes a no-op)', () => {
    render(
      <ThemeProvider theme={theme}>
        <HeaderAccountMenu userOverride={null} />
      </ThemeProvider>,
    );
    const pill = screen.getByRole('button', { name: /sign in/i });
    // Should not throw — the click is a no-op when no gate is mounted.
    expect(() => fireEvent.click(pill)).not.toThrow();
  });

  test('permanent user sees an avatar with the displayName initial', () => {
    renderWithGate(<HeaderAccountMenu userOverride={permanentUser} />);
    const avatar = screen.getByRole('button', { name: /account menu/i });
    expect(avatar.textContent).toBe('K');
  });

  test('clicking the avatar opens the dropdown with a Log out item', () => {
    renderWithGate(<HeaderAccountMenu userOverride={permanentUser} />);
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument();
    // Spec: ONLY Log out — no Settings, no Profile.
    expect(screen.queryByRole('menuitem', { name: /settings/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /profile/i })).toBeNull();
  });

  test('clicking Log out calls signOutUser', async () => {
    renderWithGate(<HeaderAccountMenu userOverride={permanentUser} />);
    fireEvent.click(screen.getByRole('button', { name: /account menu/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /log out/i }));
    expect(signOutUser).toHaveBeenCalledTimes(1);
  });

  test('dropdown opens by default when defaultMenuOpen is set', () => {
    renderWithGate(
      <HeaderAccountMenu userOverride={permanentUser} defaultMenuOpen />,
    );
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument();
  });

  test('flips to avatar when the User is mutated in place and the listener fires with the SAME ref (linkWithPopup case)', async () => {
    // Reproduces the production bug PR #53 missed: linkWithPopup mutates the
    // existing User object (uid preserved, isAnonymous flips false) and fires
    // the listener with the SAME reference. The old `setUser(next)` would
    // bail out via Object.is and skip the re-render. The fix derives `user`
    // from `authInstance.currentUser` on each render and uses a tick reducer
    // to force the re-render regardless of reference identity.
    const anon: any = { uid: 'abc', isAnonymous: true };
    const auth: any = { currentUser: anon };
    const { getByRole, queryByRole } = render(
      <ThemeProvider theme={theme}>
        <AuthGateContext.Provider value={{ requestSignIn: jest.fn() } as never}>
          <HeaderAccountMenu authInstance={auth} />
        </AuthGateContext.Provider>
      </ThemeProvider>,
    );
    expect(getByRole('button', { name: /sign in/i })).toBeTruthy();

    // Simulate linkWithPopup mutating the existing user in place.
    anon.isAnonymous = false;
    expect(idTokenListeners.length).toBe(1);
    await act(async () => {
      idTokenListeners[0](anon);
    });

    expect(getByRole('button', { name: /account menu/i })).toBeTruthy();
    expect(queryByRole('button', { name: /sign in/i })).toBeNull();
  });

  test('cold-load: subscribing before IndexedDB-restore picks up the restored user via onAuthStateChanged', async () => {
    // Reproduces the screenshot Kate hit on 2026-04-27: page loaded while
    // currentUser was still null (Firebase auth-restore in flight), the
    // header rendered "Sign in," then restore fired onAuthStateChanged but
    // not onIdTokenChanged (timing). With both listeners subscribed and a
    // fresh read of `currentUser` on render, the avatar appears.
    const auth: any = { currentUser: null };
    const { getByRole, queryByRole } = render(
      <ThemeProvider theme={theme}>
        <AuthGateContext.Provider value={{ requestSignIn: jest.fn() } as never}>
          <HeaderAccountMenu authInstance={auth} />
        </AuthGateContext.Provider>
      </ThemeProvider>,
    );
    expect(getByRole('button', { name: /sign in/i })).toBeTruthy();
    expect(authStateListeners.length).toBe(1);

    auth.currentUser = { uid: 'abc', isAnonymous: false, displayName: 'Kate' };
    await act(async () => {
      authStateListeners[0](auth.currentUser);
    });

    expect(getByRole('button', { name: /account menu/i })).toBeTruthy();
    expect(queryByRole('button', { name: /sign in/i })).toBeNull();
  });
});
