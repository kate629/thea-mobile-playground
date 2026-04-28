import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate so we can assert it was called with the right path
// without coupling the test to a real router state machine.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock firebase auth + the id-token listener so we can flip the user's
// signed-in status synchronously inside tests. We model the listener as a
// no-op that returns an unsubscribe — the hook's initial state is sourced
// from `auth.currentUser?.isAnonymous`, which is enough to cover the
// skipWhenSignedIn branch deterministically.
const mockAuth: { currentUser: { isAnonymous: boolean } | null } = {
  currentUser: { isAnonymous: true },
};
jest.mock('../../../firebaseConfig', () => ({
  get auth() {
    return mockAuth;
  },
}));
jest.mock('firebase/auth', () => ({
  onIdTokenChanged: jest.fn(() => () => {}),
}));

// Import AFTER the mocks above so the hook resolves to the mocked modules.
// eslint-disable-next-line import/first
import { useLeaveWarning } from '../useLeaveWarning';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useLeaveWarning', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockAuth.currentUser = { isAnonymous: true };
  });

  it('starts closed', () => {
    const { result } = renderHook(() => useLeaveWarning(), { wrapper });
    expect(result.current.open).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('requestLeave opens the dialog without navigating', () => {
    const { result } = renderHook(() => useLeaveWarning(), { wrapper });
    act(() => result.current.requestLeave());
    expect(result.current.open).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('cancelLeave closes the dialog without navigating', () => {
    const { result } = renderHook(() => useLeaveWarning(), { wrapper });
    act(() => result.current.requestLeave());
    expect(result.current.open).toBe(true);

    act(() => result.current.cancelLeave());
    expect(result.current.open).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('confirmLeave closes the dialog AND navigates to "/" by default', () => {
    const { result } = renderHook(() => useLeaveWarning(), { wrapper });
    act(() => result.current.requestLeave());
    act(() => result.current.confirmLeave());
    expect(result.current.open).toBe(false);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('confirmLeave honors a custom destination', () => {
    const { result } = renderHook(() => useLeaveWarning('/somewhere-else'), {
      wrapper,
    });
    act(() => result.current.requestLeave());
    act(() => result.current.confirmLeave());
    expect(mockNavigate).toHaveBeenCalledWith('/somewhere-else');
  });

  it('action callbacks are stable across renders (memoized)', () => {
    const { result, rerender } = renderHook(() => useLeaveWarning(), {
      wrapper,
    });
    const first = {
      request: result.current.requestLeave,
      confirm: result.current.confirmLeave,
      cancel: result.current.cancelLeave,
    };
    rerender();
    expect(result.current.requestLeave).toBe(first.request);
    expect(result.current.confirmLeave).toBe(first.confirm);
    expect(result.current.cancelLeave).toBe(first.cancel);
  });

  describe('skipWhenSignedIn (bug #46)', () => {
    it('opens the dialog when anonymous, even with skipWhenSignedIn=true', () => {
      mockAuth.currentUser = { isAnonymous: true };
      const { result } = renderHook(
        () => useLeaveWarning('/', { skipWhenSignedIn: true }),
        { wrapper },
      );
      act(() => result.current.requestLeave());
      expect(result.current.open).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates directly without opening the dialog when signed-in and skipWhenSignedIn=true', () => {
      mockAuth.currentUser = { isAnonymous: false };
      const { result } = renderHook(
        () => useLeaveWarning('/', { skipWhenSignedIn: true }),
        { wrapper },
      );
      act(() => result.current.requestLeave());
      expect(result.current.open).toBe(false);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('still opens the dialog for signed-in users when skipWhenSignedIn is unset (default behavior preserved)', () => {
      mockAuth.currentUser = { isAnonymous: false };
      const { result } = renderHook(() => useLeaveWarning(), { wrapper });
      act(() => result.current.requestLeave());
      expect(result.current.open).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('honors custom destination when skipping for signed-in users', () => {
      mockAuth.currentUser = { isAnonymous: false };
      const { result } = renderHook(
        () => useLeaveWarning('/somewhere-else', { skipWhenSignedIn: true }),
        { wrapper },
      );
      act(() => result.current.requestLeave());
      expect(mockNavigate).toHaveBeenCalledWith('/somewhere-else');
    });

    it('treats null currentUser as not-signed-in (dialog still opens)', () => {
      mockAuth.currentUser = null;
      const { result } = renderHook(
        () => useLeaveWarning('/', { skipWhenSignedIn: true }),
        { wrapper },
      );
      act(() => result.current.requestLeave());
      expect(result.current.open).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // Bug #62: callers wiring `useBackButtonGuard` need to know whether the
  // user is signed-in so they can disable the guard for non-anonymous users.
  describe('isSignedIn return value (bug #62)', () => {
    it('returns false when currentUser is anonymous', () => {
      mockAuth.currentUser = { isAnonymous: true };
      const { result } = renderHook(() => useLeaveWarning(), { wrapper });
      expect(result.current.isSignedIn).toBe(false);
    });

    it('returns true when currentUser is non-anonymous', () => {
      mockAuth.currentUser = { isAnonymous: false };
      const { result } = renderHook(() => useLeaveWarning(), { wrapper });
      expect(result.current.isSignedIn).toBe(true);
    });

    it('returns false when currentUser is null', () => {
      mockAuth.currentUser = null;
      const { result } = renderHook(() => useLeaveWarning(), { wrapper });
      expect(result.current.isSignedIn).toBe(false);
    });
  });
});
