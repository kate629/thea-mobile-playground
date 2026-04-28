import React from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { useRedirectOnSignOut } from '../useRedirectOnSignOut';

const mockOnAuthStateChanged: jest.Mock = jest.fn();
const mockNavigate = jest.fn();

const mutableAuth: { currentUser: { uid: string; isAnonymous: boolean } | null } = {
  currentUser: null,
};

jest.mock('../../../firebaseConfig', () => ({
  ensureAuth: () => Promise.resolve('uid'),
  db: {},
  get auth() {
    return mutableAuth;
  },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const Harness: React.FC<{ to?: string }> = ({ to }) => {
  useRedirectOnSignOut(to);
  return null;
};

beforeEach(() => {
  mockOnAuthStateChanged.mockReset();
  mockNavigate.mockReset();
  mutableAuth.currentUser = null;
});

describe('useRedirectOnSignOut', () => {
  test('navigates home when permanent user signs out', () => {
    mutableAuth.currentUser = { uid: 'perm-uid', isAnonymous: false };
    let cb: ((user: typeof mutableAuth.currentUser) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, fn) => {
      cb = fn;
      return () => {};
    });

    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );

    act(() => {
      cb!(null);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  test('navigates home when permanent user falls back to a fresh anon (re-signed-in)', () => {
    mutableAuth.currentUser = { uid: 'perm-uid', isAnonymous: false };
    let cb: ((user: typeof mutableAuth.currentUser) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, fn) => {
      cb = fn;
      return () => {};
    });

    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );

    act(() => {
      cb!({ uid: 'anon-uid-2', isAnonymous: true });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  test('does NOT navigate on initial anon → permanent transition (sign-in)', () => {
    mutableAuth.currentUser = { uid: 'anon-uid', isAnonymous: true };
    let cb: ((user: typeof mutableAuth.currentUser) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, fn) => {
      cb = fn;
      return () => {};
    });

    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );

    // First-load: anon user signs in.
    act(() => {
      cb!({ uid: 'perm-uid', isAnonymous: false });
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('does NOT navigate on anon → anon (no-op auth ticks)', () => {
    let cb: ((user: typeof mutableAuth.currentUser) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, fn) => {
      cb = fn;
      return () => {};
    });

    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );

    act(() => {
      cb!({ uid: 'anon-uid', isAnonymous: true });
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('honors a custom destination', () => {
    mutableAuth.currentUser = { uid: 'perm-uid', isAnonymous: false };
    let cb: ((user: typeof mutableAuth.currentUser) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, fn) => {
      cb = fn;
      return () => {};
    });

    render(
      <MemoryRouter>
        <Harness to="/custom-home" />
      </MemoryRouter>,
    );

    act(() => {
      cb!(null);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/custom-home', { replace: true });
  });
});
