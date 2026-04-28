import { renderHook, act } from '@testing-library/react';
import {
  useFriendPreviews,
  createFirestoreFriendPreviewLoader,
  getFirestoreFriendPreviewLoader,
  __resetFriendPreviewLoaderCache,
} from '../useFriendPreviews';
import { AuthState, FriendPreviewLoader } from '../types';

// Mock firestore so the factory can be exercised without a live Firebase app.
jest.mock('firebase/firestore', () => ({
  __esModule: true,
  onSnapshot: jest.fn(),
  collection: jest.fn(() => ({ __collection: true })),
  query: jest.fn((...args) => ({ __query: args })),
  where: jest.fn((...args) => ({ __where: args })),
}));

jest.mock('../../../../firebaseConfig', () => ({
  __esModule: true,
  db: { __fakeDb: true },
  auth: { currentUser: null },
  ensureAuth: jest.fn(),
}));

const firestore = jest.requireMock('firebase/firestore') as {
  onSnapshot: jest.Mock;
  collection: jest.Mock;
  query: jest.Mock;
  where: jest.Mock;
};

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

describe('createFirestoreFriendPreviewLoader', () => {
  beforeEach(() => {
    firestore.onSnapshot.mockReset();
    firestore.collection.mockClear();
    firestore.query.mockClear();
    firestore.where.mockClear();
    __resetFriendPreviewLoaderCache();
  });

  it('subscribes to giftActivity filtered by state==SAVED and maps productSnapshot.imageUrl', () => {
    let onNext: ((snap: unknown) => void) | undefined;
    firestore.onSnapshot.mockImplementation((_q, next) => {
      onNext = next;
      return () => {};
    });

    const loader = createFirestoreFriendPreviewLoader('uid-1');
    const cb = jest.fn();
    const unsub = loader.subscribe('rid-7', cb);

    expect(firestore.collection).toHaveBeenCalledWith(
      { __fakeDb: true },
      'theaWebUser',
      'uid-1',
      'recipient',
      'rid-7',
      'giftActivity',
    );
    expect(firestore.where).toHaveBeenCalledWith('state', '==', 'SAVED');

    // Simulate a Firestore snapshot with three saved items, one with no image.
    const fakeSnap = {
      forEach: (fn: (d: { data: () => unknown }) => void) => {
        fn({ data: () => ({ productSnapshot: { imageUrl: 'a.jpg' } }) });
        fn({ data: () => ({ productSnapshot: { imageUrl: 'b.jpg' } }) });
        fn({ data: () => ({ productSnapshot: {} }) });
      },
    };
    onNext!(fakeSnap);
    expect(cb).toHaveBeenCalledWith(['a.jpg', 'b.jpg']);

    expect(typeof unsub).toBe('function');
  });

  it('passes through an empty list to the callback on Firestore error', () => {
    let onError: ((err: Error) => void) | undefined;
    firestore.onSnapshot.mockImplementation((_q, _next, err) => {
      onError = err;
      return () => {};
    });

    const loader = createFirestoreFriendPreviewLoader('uid-1');
    const cb = jest.fn();
    loader.subscribe('rid-7', cb);

    onError!(new Error('permission denied'));
    expect(cb).toHaveBeenCalledWith([]);
  });

  it('caches loader instances per uid', () => {
    const a1 = getFirestoreFriendPreviewLoader('uid-A');
    const a2 = getFirestoreFriendPreviewLoader('uid-A');
    const b = getFirestoreFriendPreviewLoader('uid-B');
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });
});
