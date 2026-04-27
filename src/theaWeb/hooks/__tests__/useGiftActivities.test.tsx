import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useGiftActivities } from '../useGiftActivities';

// --- Mocks ----------------------------------------------------------------

const mockEnsureAuth: jest.Mock = jest.fn();
const mockOnSnapshot: jest.Mock = jest.fn();
const mockCollection: jest.Mock = jest.fn(() => 'collection-ref');
const mockOnAuthStateChanged: jest.Mock = jest.fn();

jest.mock('../../../firebaseConfig', () => ({
  ensureAuth: () => mockEnsureAuth(),
  db: {},
  auth: { currentUser: null },
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

// --- Test harness ---------------------------------------------------------

interface HarnessProps {
  recipientId: string | undefined;
  onState?: (state: ReturnType<typeof useGiftActivities>) => void;
}

const Harness: React.FC<HarnessProps> = ({ recipientId, onState }) => {
  const state = useGiftActivities(recipientId);
  React.useEffect(() => {
    onState?.(state);
  });
  return null;
};

interface FakeDoc {
  id: string;
  data: () => { state: string };
}
const docOf = (id: string, state: string): FakeDoc => ({
  id,
  data: () => ({ state }),
});
const snapOf = (docs: FakeDoc[]) => ({ forEach: (fn: (d: FakeDoc) => void) => docs.forEach(fn) });

beforeEach(() => {
  mockEnsureAuth.mockReset();
  mockOnSnapshot.mockReset();
  mockCollection.mockReset();
  mockOnAuthStateChanged.mockReset();
  mockCollection.mockImplementation(() => 'collection-ref');
  mockOnAuthStateChanged.mockImplementation(() => () => {});
});

// --- Tests ----------------------------------------------------------------

describe('useGiftActivities', () => {
  test('snapshot with mixed states populates the three Sets', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    let snapNext: ((snap: any) => void) | null = null;
    const unsub = jest.fn();
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      snapNext = onNext;
      return unsub;
    });

    let latest: ReturnType<typeof useGiftActivities> | null = null;
    render(<Harness recipientId="r1" onState={(s) => (latest = s)} />);

    await waitFor(() => expect(snapNext).not.toBeNull());

    await act(async () => {
      snapNext!(
        snapOf([
          docOf('p1', 'SAVED'),
          docOf('p2', 'SAVED'),
          docOf('p3', 'DISMISSED'),
          docOf('p4', 'PURCHASED'),
        ]),
      );
    });

    await waitFor(() => expect(latest!.hydrated).toBe(true));
    expect(Array.from(latest!.liked).sort()).toEqual(['p1', 'p2']);
    expect(Array.from(latest!.dismissed)).toEqual(['p3']);
    expect(Array.from(latest!.purchased)).toEqual(['p4']);
    expect(latest!.error).toBeNull();
  });

  test('empty snapshot hydrates with three empty Sets', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    let snapNext: ((snap: any) => void) | null = null;
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      snapNext = onNext;
      return () => {};
    });

    let latest: ReturnType<typeof useGiftActivities> | null = null;
    render(<Harness recipientId="r1" onState={(s) => (latest = s)} />);

    await waitFor(() => expect(snapNext).not.toBeNull());
    await act(async () => {
      snapNext!(snapOf([]));
    });

    await waitFor(() => expect(latest!.hydrated).toBe(true));
    expect(latest!.liked.size).toBe(0);
    expect(latest!.dismissed.size).toBe(0);
    expect(latest!.purchased.size).toBe(0);
  });

  test('uid change clears previous Sets and re-subscribes', async () => {
    mockEnsureAuth.mockResolvedValueOnce('uid-1').mockResolvedValueOnce('uid-2');
    const subs: Array<{ next: (snap: any) => void; unsub: jest.Mock }> = [];
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      const unsub = jest.fn();
      subs.push({ next: onNext, unsub });
      return unsub;
    });
    let authListener: ((user: any) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authListener = cb;
      return () => {};
    });

    let latest: ReturnType<typeof useGiftActivities> | null = null;
    render(<Harness recipientId="r1" onState={(s) => (latest = s)} />);

    await waitFor(() => expect(subs.length).toBe(1));
    await act(async () => {
      subs[0].next(snapOf([docOf('p1', 'SAVED')]));
    });
    await waitFor(() => expect(latest!.liked.has('p1')).toBe(true));

    // uid swap → reset, re-subscribe.
    await act(async () => {
      authListener!({ uid: 'uid-2' });
    });

    await waitFor(() => expect(subs.length).toBe(2));
    expect(subs[0].unsub).toHaveBeenCalled();
    // Old Sets cleared until the new sub fires.
    expect(latest!.liked.size).toBe(0);
    expect(latest!.hydrated).toBe(false);

    await act(async () => {
      subs[1].next(snapOf([docOf('p9', 'SAVED')]));
    });
    await waitFor(() => expect(latest!.liked.has('p9')).toBe(true));
    expect(latest!.liked.has('p1')).toBe(false);
  });

  test('listener error surfaces without crashing', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    let errCb: ((err: Error) => void) | null = null;
    mockOnSnapshot.mockImplementation((_ref, _onNext, onError) => {
      errCb = onError;
      return () => {};
    });

    let latest: ReturnType<typeof useGiftActivities> | null = null;
    render(<Harness recipientId="r1" onState={(s) => (latest = s)} />);

    await waitFor(() => expect(errCb).not.toBeNull());
    await act(async () => {
      errCb!(new Error('permission-denied'));
    });

    await waitFor(() => expect(latest!.error).toBeInstanceOf(Error));
    expect(latest!.error!.message).toBe('permission-denied');
  });

  test('content-equal snapshots reuse the same Set reference (memoization)', async () => {
    // The page's exit-animation rising-edge effect, the carousel's slots
    // useMemo, and every isLiked useCallback all depend on the Set
    // reference. If the listener pushes new Set instances on every snapshot
    // — including no-op deliveries — every downstream memo invalidates and
    // we cascade re-renders for free. Verify identity is stable when
    // contents are unchanged.
    mockEnsureAuth.mockResolvedValue('uid-1');
    let snapNext: ((snap: any) => void) | null = null;
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      snapNext = onNext;
      return () => {};
    });

    const seen: Array<ReturnType<typeof useGiftActivities>> = [];
    render(<Harness recipientId="r1" onState={(s) => seen.push(s)} />);

    await waitFor(() => expect(snapNext).not.toBeNull());

    await act(async () => {
      snapNext!(snapOf([docOf('p1', 'SAVED'), docOf('p2', 'DISMISSED')]));
    });
    await waitFor(() => expect(seen[seen.length - 1].liked.has('p1')).toBe(true));
    const likedRefAfterFirst = seen[seen.length - 1].liked;
    const dismissedRefAfterFirst = seen[seen.length - 1].dismissed;

    // Second snapshot, same contents (different doc-iteration order even).
    await act(async () => {
      snapNext!(snapOf([docOf('p2', 'DISMISSED'), docOf('p1', 'SAVED')]));
    });

    const likedRefAfterSecond = seen[seen.length - 1].liked;
    const dismissedRefAfterSecond = seen[seen.length - 1].dismissed;
    expect(likedRefAfterSecond).toBe(likedRefAfterFirst);
    expect(dismissedRefAfterSecond).toBe(dismissedRefAfterFirst);
  });

  test('snapshots with changed contents produce a new Set reference', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    let snapNext: ((snap: any) => void) | null = null;
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      snapNext = onNext;
      return () => {};
    });

    const seen: Array<ReturnType<typeof useGiftActivities>> = [];
    render(<Harness recipientId="r1" onState={(s) => seen.push(s)} />);

    await waitFor(() => expect(snapNext).not.toBeNull());
    await act(async () => {
      snapNext!(snapOf([docOf('p1', 'SAVED')]));
    });
    await waitFor(() => expect(seen[seen.length - 1].liked.has('p1')).toBe(true));
    const before = seen[seen.length - 1].liked;

    await act(async () => {
      snapNext!(snapOf([docOf('p1', 'SAVED'), docOf('p2', 'SAVED')]));
    });
    const after = seen[seen.length - 1].liked;
    expect(after).not.toBe(before);
    expect(after.has('p2')).toBe(true);
  });

  test('unsubscribes on unmount', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    const unsub = jest.fn();
    mockOnSnapshot.mockImplementation(() => unsub);

    const { unmount } = render(<Harness recipientId="r1" />);

    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalled());
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});
