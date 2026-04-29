import { renderHook, act } from '@testing-library/react';
import {
  useFriendPreviews,
  createFirestoreFriendPreviewLoader,
  getFirestoreFriendPreviewLoader,
  __resetFriendPreviewLoaderCache,
} from '../useFriendPreviews';
import { AuthState, DashboardPerson, FriendPreviewLoader } from '../types';

// Mock firestore so the factory can be exercised without a live Firebase app.
jest.mock('firebase/firestore', () => ({
  __esModule: true,
  onSnapshot: jest.fn(),
  collection: jest.fn(() => ({ __collection: true })),
  doc: jest.fn(() => ({ __doc: true })),
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
  doc: jest.Mock;
};

type LoaderCallback = (urls: string[]) => void;
type SubscribeKey = string; // `${personId}::${currentRecommendationId ?? ''}`

function makeMockLoader() {
  const callbacks = new Map<SubscribeKey, LoaderCallback>();
  const subscribeMock = jest.fn();
  const unsubscribeMock = jest.fn();
  const loader: FriendPreviewLoader = {
    subscribe: (personId, currentRecommendationId, cb) => {
      const key: SubscribeKey = `${personId}::${currentRecommendationId ?? ''}`;
      subscribeMock(personId, currentRecommendationId);
      callbacks.set(key, cb);
      return () => {
        unsubscribeMock(personId, currentRecommendationId);
        callbacks.delete(key);
      };
    },
  };
  return { loader, subscribeMock, unsubscribeMock, callbacks };
}

const personFromId = (id: string, currentRecommendationId?: string): DashboardPerson => ({
  id,
  name: id,
  emoji: '🎁',
  currentRecommendationId,
});

const SignedIn: AuthState = {
  status: 'signed-in',
  user: { uid: 'u1', initial: 'A' },
};
const SignedOut: AuthState = { status: 'signed-out', onRequestSignIn: () => {} };
const Loading: AuthState = { status: 'loading' };

describe('useFriendPreviews', () => {
  it('does NOT call loader.subscribe when authState is loading', () => {
    const { loader, subscribeMock } = makeMockLoader();
    renderHook(() =>
      useFriendPreviews(Loading, [personFromId('p1'), personFromId('p2')], loader),
    );
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('does NOT call loader.subscribe when authState is signed-out', () => {
    const { loader, subscribeMock } = makeMockLoader();
    renderHook(() =>
      useFriendPreviews(SignedOut, [personFromId('p1'), personFromId('p2')], loader),
    );
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('returns empty maps when not signed-in', () => {
    const { loader } = makeMockLoader();
    const { result } = renderHook(() =>
      useFriendPreviews(SignedOut, [personFromId('p1')], loader),
    );
    expect(result.current.previews).toEqual({});
    expect(result.current.resolved).toEqual({});
  });

  it('subscribes once per person when signed-in and populates previews/resolved', () => {
    const { loader, subscribeMock, callbacks } = makeMockLoader();
    const { result } = renderHook(() =>
      useFriendPreviews(SignedIn, [personFromId('p1', 'r1'), personFromId('p2')], loader),
    );

    expect(subscribeMock).toHaveBeenCalledTimes(2);
    expect(subscribeMock).toHaveBeenCalledWith('p1', 'r1');
    expect(subscribeMock).toHaveBeenCalledWith('p2', undefined);

    act(() => callbacks.get('p1::r1')!(['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg']));
    expect(result.current.previews.p1).toEqual(['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg']);
    expect(result.current.resolved.p1).toBe(true);
    expect(result.current.resolved.p2).toBeUndefined();

    act(() => callbacks.get('p2::')!([]));
    expect(result.current.previews.p2).toEqual([]);
    expect(result.current.resolved.p2).toBe(true);
  });

  it('tears down subscriptions and clears state when auth flips from signed-in to signed-out', () => {
    const { loader, unsubscribeMock, callbacks } = makeMockLoader();

    const initialProps: { auth: AuthState } = { auth: SignedIn };
    const { result, rerender } = renderHook(
      ({ auth }: { auth: AuthState }) =>
        useFriendPreviews(auth, [personFromId('p1', 'r1')], loader),
      { initialProps },
    );

    act(() => callbacks.get('p1::r1')!(['a.jpg']));
    expect(result.current.resolved.p1).toBe(true);

    rerender({ auth: SignedOut });
    expect(unsubscribeMock).toHaveBeenCalledWith('p1', 'r1');
    expect(result.current.previews).toEqual({});
    expect(result.current.resolved).toEqual({});
  });

  it('unsubscribes ids that are removed from people', () => {
    const { loader, subscribeMock, unsubscribeMock } = makeMockLoader();
    const { rerender } = renderHook(
      ({ people }: { people: DashboardPerson[] }) =>
        useFriendPreviews(SignedIn, people, loader),
      { initialProps: { people: [personFromId('p1'), personFromId('p2')] } },
    );

    expect(subscribeMock).toHaveBeenCalledTimes(2);

    rerender({ people: [personFromId('p1')] });
    expect(unsubscribeMock).toHaveBeenCalledWith('p2', undefined);
    expect(unsubscribeMock).not.toHaveBeenCalledWith('p1', undefined);
  });

  it('re-subscribes when a person\'s currentRecommendationId changes', () => {
    const { loader, subscribeMock, unsubscribeMock } = makeMockLoader();
    const { rerender } = renderHook(
      ({ people }: { people: DashboardPerson[] }) =>
        useFriendPreviews(SignedIn, people, loader),
      { initialProps: { people: [personFromId('p1', 'r-old')] } },
    );

    expect(subscribeMock).toHaveBeenCalledTimes(1);
    expect(subscribeMock).toHaveBeenCalledWith('p1', 'r-old');

    rerender({ people: [personFromId('p1', 'r-new')] });
    expect(unsubscribeMock).toHaveBeenCalledWith('p1', 'r-old');
    expect(subscribeMock).toHaveBeenCalledWith('p1', 'r-new');
  });
});

describe('createFirestoreFriendPreviewLoader (sheet bug #61 waterfall)', () => {
  beforeEach(() => {
    firestore.onSnapshot.mockReset();
    firestore.collection.mockClear();
    firestore.doc.mockClear();
    __resetFriendPreviewLoaderCache();
  });

  /**
   * Each loader subscription opens up to 2 Firestore listeners — one on
   * the carouselSession (when there's an active recommendation) and one
   * on the giftActivity collection. The loader's `cb` fires with the
   * highest-priority non-empty source: carousel → SAVED → PURCHASED → empty.
   */
  function captureSnapshots() {
    const handlers: Array<{ onNext: (snap: unknown) => void; onError: (err: Error) => void }> = [];
    firestore.onSnapshot.mockImplementation((_target, onNext, onError) => {
      handlers.push({ onNext, onError });
      return () => {};
    });
    return handlers;
  }

  function fakeCarouselSnap(carousels: Record<string, { products?: Array<{ images?: string[] }> }>) {
    return {
      exists: () => true,
      data: () => ({ carousels }),
    };
  }

  function fakeMissingSnap() {
    return { exists: () => false, data: () => ({}) };
  }

  function fakeActivitySnap(
    items: Array<{ state?: string; productSnapshot?: { imageUrl?: string } }>,
  ) {
    return {
      forEach: (fn: (d: { data: () => unknown }) => void) => {
        items.forEach((item) => fn({ data: () => item }));
      },
    };
  }

  it('uses carousel images when the recommendation has products (top of waterfall)', () => {
    const handlers = captureSnapshots();
    const loader = createFirestoreFriendPreviewLoader('u1', { __fakeDb: true } as never);
    const cb = jest.fn();
    loader.subscribe('rid', 'rec1', cb);

    // Two listeners: carouselSession + giftActivity.
    expect(handlers.length).toBe(2);
    expect(firestore.doc).toHaveBeenCalledWith(
      { __fakeDb: true },
      'carouselSessions',
      'u1_rec1',
    );

    // Carousel fires with 4 products spread over two carousels.
    handlers[0].onNext(
      fakeCarouselSnap({
        c1: {
          products: [{ images: ['a.jpg'] }, { images: ['b.jpg'] }],
        },
        c2: {
          products: [{ images: ['c.jpg'] }, { images: ['d.jpg'] }, { images: ['e.jpg'] }],
        },
      }),
    );

    expect(cb).toHaveBeenLastCalledWith(['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg']);
  });

  it('falls back to SAVED when carousel is empty', () => {
    const handlers = captureSnapshots();
    const loader = createFirestoreFriendPreviewLoader('u1', { __fakeDb: true } as never);
    const cb = jest.fn();
    loader.subscribe('rid', 'rec1', cb);

    // Carousel: missing.
    handlers[0].onNext(fakeMissingSnap());
    // Activity: 2 SAVED.
    handlers[1].onNext(
      fakeActivitySnap([
        { state: 'SAVED', productSnapshot: { imageUrl: 'saved-a.jpg' } },
        { state: 'SAVED', productSnapshot: { imageUrl: 'saved-b.jpg' } },
      ]),
    );

    expect(cb).toHaveBeenLastCalledWith(['saved-a.jpg', 'saved-b.jpg']);
  });

  it('falls back to PURCHASED when carousel + SAVED are both empty', () => {
    const handlers = captureSnapshots();
    const loader = createFirestoreFriendPreviewLoader('u1', { __fakeDb: true } as never);
    const cb = jest.fn();
    loader.subscribe('rid', 'rec1', cb);

    handlers[0].onNext(fakeMissingSnap());
    handlers[1].onNext(
      fakeActivitySnap([
        // No SAVED, just PURCHASED.
        { state: 'PURCHASED', productSnapshot: { imageUrl: 'p-a.jpg' } },
      ]),
    );

    expect(cb).toHaveBeenLastCalledWith(['p-a.jpg']);
  });

  it('emits empty when nothing is available (caller renders emoji fallback)', () => {
    const handlers = captureSnapshots();
    const loader = createFirestoreFriendPreviewLoader('u1', { __fakeDb: true } as never);
    const cb = jest.fn();
    loader.subscribe('rid', 'rec1', cb);

    handlers[0].onNext(fakeMissingSnap());
    handlers[1].onNext(fakeActivitySnap([])); // no SAVED, no PURCHASED, no DISMISSED

    expect(cb).toHaveBeenLastCalledWith([]);
  });

  it("doesn't open a carousel listener when currentRecommendationId is undefined", () => {
    const handlers = captureSnapshots();
    const loader = createFirestoreFriendPreviewLoader('u1', { __fakeDb: true } as never);
    const cb = jest.fn();
    loader.subscribe('rid', undefined, cb);

    // Only one listener — giftActivity. Carousel is skipped.
    expect(handlers.length).toBe(1);
    expect(firestore.doc).not.toHaveBeenCalled();

    handlers[0].onNext(
      fakeActivitySnap([
        { state: 'SAVED', productSnapshot: { imageUrl: 'saved-a.jpg' } },
      ]),
    );
    expect(cb).toHaveBeenLastCalledWith(['saved-a.jpg']);
  });

  it('flips back to SAVED if the carousel disappears (e.g. session deleted)', () => {
    const handlers = captureSnapshots();
    const loader = createFirestoreFriendPreviewLoader('u1', { __fakeDb: true } as never);
    const cb = jest.fn();
    loader.subscribe('rid', 'rec1', cb);

    // Initial: carousel has data, SAVED has data — carousel wins.
    handlers[0].onNext(
      fakeCarouselSnap({
        c1: { products: [{ images: ['carousel-a.jpg'] }] },
      }),
    );
    handlers[1].onNext(
      fakeActivitySnap([
        { state: 'SAVED', productSnapshot: { imageUrl: 'saved-a.jpg' } },
      ]),
    );
    expect(cb).toHaveBeenLastCalledWith(['carousel-a.jpg']);

    // Carousel becomes empty (e.g. regenerate fails or session is wiped).
    handlers[0].onNext(fakeMissingSnap());
    expect(cb).toHaveBeenLastCalledWith(['saved-a.jpg']);
  });

  it('treats a Firestore error on either listener as empty for that source', () => {
    const handlers = captureSnapshots();
    const loader = createFirestoreFriendPreviewLoader('u1', { __fakeDb: true } as never);
    const cb = jest.fn();
    loader.subscribe('rid', 'rec1', cb);

    handlers[0].onError(new Error('permission denied on carouselSessions'));
    handlers[1].onError(new Error('permission denied on giftActivity'));
    expect(cb).toHaveBeenLastCalledWith([]);
  });

  it('falls back to images_cdn[0] when canonical images is missing on the product', () => {
    const handlers = captureSnapshots();
    const loader = createFirestoreFriendPreviewLoader('u1', { __fakeDb: true } as never);
    const cb = jest.fn();
    loader.subscribe('rid', 'rec1', cb);

    handlers[0].onNext(
      fakeCarouselSnap({
        c1: {
          products: [
            // Old session shape — no canonical `images`, just images_cdn.
            { images_cdn: ['cdn-a.jpg'] } as never,
            { images_cdn_mobile: ['cdn-mobile-b.jpg'] } as never,
          ],
        },
      }),
    );

    expect(cb).toHaveBeenLastCalledWith(['cdn-a.jpg', 'cdn-mobile-b.jpg']);
  });

  it('caches loader instances per uid', () => {
    const a1 = getFirestoreFriendPreviewLoader('uid-A', { __fakeDb: true } as never);
    const a2 = getFirestoreFriendPreviewLoader('uid-A', { __fakeDb: true } as never);
    const b = getFirestoreFriendPreviewLoader('uid-B', { __fakeDb: true } as never);
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });
});
