import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useCarouselSession } from '../useCarouselSession';

const mockOnSnapshot: jest.Mock = jest.fn();
const mockDoc: jest.Mock = jest.fn(() => 'doc-ref');
const mockOnAuthStateChanged: jest.Mock = jest.fn();

const mutableAuth: { currentUser: { uid: string } | null } = { currentUser: null };

jest.mock('../../../firebaseConfig', () => ({
  ensureAuth: () => Promise.resolve('uid'),
  db: {},
  get auth() {
    return mutableAuth;
  },
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

jest.mock('../../lib/normalizeCarouselSession', () => ({
  normalizeCarouselSession: (data: unknown) => data,
}));

const Harness: React.FC<{
  carouselSessionId: string | undefined;
  onState?: (state: ReturnType<typeof useCarouselSession>) => void;
}> = ({ carouselSessionId, onState }) => {
  const state = useCarouselSession(carouselSessionId);
  React.useEffect(() => {
    onState?.(state);
  });
  return null;
};

beforeEach(() => {
  mockOnSnapshot.mockReset();
  mockDoc.mockReset();
  mockOnAuthStateChanged.mockReset();
  mockDoc.mockImplementation(() => 'doc-ref');
  mockOnAuthStateChanged.mockImplementation(() => () => {});
  mutableAuth.currentUser = null;
});

describe('useCarouselSession', () => {
  test('REGRESSION: re-binds the snapshot listener when uid swaps (auth merge)', async () => {
    let authChangeCb: ((user: { uid: string } | null) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authChangeCb = cb;
      return () => {};
    });
    const firstUnsub = jest.fn();
    const secondUnsub = jest.fn();
    mockOnSnapshot
      .mockImplementationOnce(() => firstUnsub)
      .mockImplementationOnce(() => secondUnsub);

    render(<Harness carouselSessionId="sess-1" />);

    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalledTimes(1));

    // Swap auth state — even though the path is uid-less, we re-bind so the
    // listener picks up the rotated auth token.
    await act(async () => {
      authChangeCb!({ uid: 'permanent-uid' });
    });

    expect(firstUnsub).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalledTimes(2));
  });

  test('uid swap clears prior session state', async () => {
    let authChangeCb: ((user: { uid: string } | null) => void) | null = null;
    let snapNext: ((snap: { exists: () => boolean; data: () => unknown }) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authChangeCb = cb;
      return () => {};
    });
    mockOnSnapshot
      .mockImplementationOnce((_ref, onNext) => {
        snapNext = onNext;
        return () => {};
      })
      .mockImplementationOnce(() => () => {});

    let latest: ReturnType<typeof useCarouselSession> | null = null;
    render(<Harness carouselSessionId="sess-1" onState={(s) => (latest = s)} />);

    await waitFor(() => expect(snapNext).not.toBeNull());

    await act(async () => {
      snapNext!({ exists: () => true, data: () => ({ status: 'COMPLETED' }) });
    });
    expect(latest!.session).toEqual({ status: 'COMPLETED' });

    await act(async () => {
      authChangeCb!({ uid: 'permanent-uid' });
    });
    expect(latest!.session).toBeNull();
    expect(latest!.loading).toBe(true);
  });

  test('REGRESSION: sessionId swap resets session immediately (no stale-data flash)', async () => {
    // Without the reset, when carouselSessionId changes, the OLD session's
    // data renders for ~100-500ms while the new subscription waits for its
    // first snapshot. Reported by Kate during loading-state PR preview
    // testing — saw "items from a prior quiz session for a separate
    // person" briefly after navigating to a new results page.
    mockOnAuthStateChanged.mockImplementation(() => () => {});
    let firstSnapNext: ((s: { exists: () => boolean; data: () => unknown }) => void) | null = null;
    const firstUnsub = jest.fn();
    const secondUnsub = jest.fn();
    mockOnSnapshot
      .mockImplementationOnce((_ref, onNext) => {
        firstSnapNext = onNext;
        return firstUnsub;
      })
      .mockImplementationOnce(() => secondUnsub);

    let latest: ReturnType<typeof useCarouselSession> | null = null;
    const { rerender } = render(
      <Harness carouselSessionId="sess-1" onState={(s) => (latest = s)} />,
    );

    // First snapshot lands — session populated with sess-1's data.
    await waitFor(() => expect(firstSnapNext).not.toBeNull());
    await act(async () => {
      firstSnapNext!({ exists: () => true, data: () => ({ status: 'COMPLETED', tag: 'sess-1' }) });
    });
    expect(latest!.session).toEqual({ status: 'COMPLETED', tag: 'sess-1' });

    // Caller swaps to a different sessionId. Immediately (before the new
    // subscription's first snapshot arrives), session must be null —
    // otherwise the FE would briefly render sess-1's data under sess-2's
    // recipient header.
    rerender(<Harness carouselSessionId="sess-2" onState={(s) => (latest = s)} />);

    expect(firstUnsub).toHaveBeenCalledTimes(1);
    expect(latest!.session).toBeNull();
    expect(latest!.loading).toBe(true);
  });

  test('sessionId becoming undefined clears session (e.g. doc transitions through null)', async () => {
    mockOnAuthStateChanged.mockImplementation(() => () => {});
    let snapNext: ((s: { exists: () => boolean; data: () => unknown }) => void) | null = null;
    mockOnSnapshot.mockImplementationOnce((_ref, onNext) => {
      snapNext = onNext;
      return () => {};
    });

    let latest: ReturnType<typeof useCarouselSession> | null = null;
    const { rerender } = render(
      <Harness carouselSessionId="sess-1" onState={(s) => (latest = s)} />,
    );

    await waitFor(() => expect(snapNext).not.toBeNull());
    await act(async () => {
      snapNext!({ exists: () => true, data: () => ({ status: 'COMPLETED' }) });
    });
    expect(latest!.session).toEqual({ status: 'COMPLETED' });

    rerender(<Harness carouselSessionId={undefined} onState={(s) => (latest = s)} />);

    expect(latest!.session).toBeNull();
  });
});
