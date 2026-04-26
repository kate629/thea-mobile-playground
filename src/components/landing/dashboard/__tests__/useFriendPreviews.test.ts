import { renderHook, act } from '@testing-library/react';
import { useFriendPreviews } from '../useFriendPreviews';
import { AuthState, FriendPreviewLoader } from '../types';

function makeMockLoader() {
  const callbacks = new Map<string, (urls: string[]) => void>();
  const subscribeMock = jest.fn();
  const unsubscribeMock = jest.fn();
  const loader: FriendPreviewLoader = {
    subscribe: (personId, cb) => {
      subscribeMock(personId);
      callbacks.set(personId, cb);
      return () => {
        unsubscribeMock(personId);
        callbacks.delete(personId);
      };
    },
  };
  return { loader, subscribeMock, unsubscribeMock, callbacks };
}

const SignedIn: AuthState = {
  status: 'signed-in',
  user: { uid: 'u1', initial: 'A' },
};
const SignedOut: AuthState = { status: 'signed-out', onRequestSignIn: () => {} };
const Loading: AuthState = { status: 'loading' };

describe('useFriendPreviews', () => {
  it('does NOT call loader.subscribe when authState is loading', () => {
    const { loader, subscribeMock } = makeMockLoader();
    renderHook(() => useFriendPreviews(Loading, ['p1', 'p2'], loader));
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('does NOT call loader.subscribe when authState is signed-out', () => {
    const { loader, subscribeMock } = makeMockLoader();
    renderHook(() => useFriendPreviews(SignedOut, ['p1', 'p2'], loader));
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('returns empty maps when not signed-in', () => {
    const { loader } = makeMockLoader();
    const { result } = renderHook(() => useFriendPreviews(SignedOut, ['p1'], loader));
    expect(result.current.previews).toEqual({});
    expect(result.current.resolved).toEqual({});
  });

  it('subscribes once per personId when signed-in and populates previews/resolved', () => {
    const { loader, subscribeMock, callbacks } = makeMockLoader();
    const { result } = renderHook(() => useFriendPreviews(SignedIn, ['p1', 'p2'], loader));

    expect(subscribeMock).toHaveBeenCalledTimes(2);
    expect(subscribeMock).toHaveBeenCalledWith('p1');
    expect(subscribeMock).toHaveBeenCalledWith('p2');

    act(() => callbacks.get('p1')!(['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg']));
    expect(result.current.previews.p1).toEqual(['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg']);
    expect(result.current.resolved.p1).toBe(true);
    expect(result.current.resolved.p2).toBeUndefined();

    act(() => callbacks.get('p2')!([]));
    expect(result.current.previews.p2).toEqual([]);
    expect(result.current.resolved.p2).toBe(true);
  });

  it('tears down subscriptions and clears state when auth flips from signed-in to signed-out', () => {
    const { loader, unsubscribeMock, callbacks } = makeMockLoader();

    const initialProps: { auth: AuthState } = { auth: SignedIn };
    const { result, rerender } = renderHook(
      ({ auth }: { auth: AuthState }) => useFriendPreviews(auth, ['p1'], loader),
      { initialProps },
    );

    act(() => callbacks.get('p1')!(['a.jpg']));
    expect(result.current.resolved.p1).toBe(true);

    rerender({ auth: SignedOut });
    expect(unsubscribeMock).toHaveBeenCalledWith('p1');
    expect(result.current.previews).toEqual({});
    expect(result.current.resolved).toEqual({});
  });

  it('unsubscribes ids that are removed from personIds', () => {
    const { loader, subscribeMock, unsubscribeMock } = makeMockLoader();
    const { rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useFriendPreviews(SignedIn, ids, loader),
      { initialProps: { ids: ['p1', 'p2'] } },
    );

    expect(subscribeMock).toHaveBeenCalledTimes(2);

    rerender({ ids: ['p1'] });
    expect(unsubscribeMock).toHaveBeenCalledWith('p2');
    expect(unsubscribeMock).not.toHaveBeenCalledWith('p1');
  });
});
