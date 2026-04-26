import { renderHook, act } from '@testing-library/react';
import { useAuthState } from '../useAuthState';
import { MockAuthAdapter } from '../mockAuth';

describe('useAuthState', () => {
  it('starts in loading and emits the adapter\'s initial state synchronously on mount', () => {
    const adapter = new MockAuthAdapter({ status: 'loading' });
    const { result } = renderHook(() => useAuthState(adapter));
    expect(result.current.status).toBe('loading');
  });

  it('transitions through the lifecycle as the adapter emits state', () => {
    const adapter = new MockAuthAdapter({ status: 'loading' });
    const { result } = renderHook(() => useAuthState(adapter));
    expect(result.current.status).toBe('loading');

    act(() => {
      adapter.setState({ status: 'signed-out', onRequestSignIn: () => {} });
    });
    expect(result.current.status).toBe('signed-out');

    act(() => {
      adapter.setState({
        status: 'signed-in',
        user: { uid: 'u1', initial: 'A' },
      });
    });
    expect(result.current.status).toBe('signed-in');
    if (result.current.status === 'signed-in') {
      expect(result.current.user.uid).toBe('u1');
    }
  });

  it('unsubscribes on unmount so post-unmount state changes do not throw', () => {
    const adapter = new MockAuthAdapter({ status: 'loading' });
    const { unmount } = renderHook(() => useAuthState(adapter));
    unmount();
    // Should not throw.
    adapter.setState({ status: 'signed-out', onRequestSignIn: () => {} });
  });
});
