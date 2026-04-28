import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useRecommendationDoc } from '../useRecommendationDoc';
import { MergeStateProvider, useSetMergeStatus } from '../../auth/MergeStateContext';

// --- Mocks ----------------------------------------------------------------

const mockEnsureAuth: jest.Mock = jest.fn();
const mockOnSnapshot: jest.Mock = jest.fn();
const mockDoc: jest.Mock = jest.fn(() => 'doc-ref');
const mockOnAuthStateChanged: jest.Mock = jest.fn();

// `auth.currentUser` is read by the hook for its initial uid; let the
// individual tests poke at a shared object we can mutate between renders.
const mutableAuth: { currentUser: { uid: string } | null } = { currentUser: null };

jest.mock('../../../firebaseConfig', () => ({
  ensureAuth: () => mockEnsureAuth(),
  db: {},
  // Use a getter so the hook reads the latest mutated value at render time
  // rather than a snapshot taken when the mock was first evaluated.
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

// --- Test harness ---------------------------------------------------------

interface HarnessProps {
  recipientId: string | undefined;
  recommendationId: string | undefined;
  onState?: (state: ReturnType<typeof useRecommendationDoc>) => void;
}

const Harness: React.FC<HarnessProps> = ({ recipientId, recommendationId, onState }) => {
  const state = useRecommendationDoc(recipientId, recommendationId);
  React.useEffect(() => {
    onState?.(state);
  });
  return null;
};

beforeEach(() => {
  mockEnsureAuth.mockReset();
  mockOnSnapshot.mockReset();
  mockDoc.mockReset();
  mockOnAuthStateChanged.mockReset();
  mockDoc.mockImplementation(() => 'doc-ref');
  mockOnAuthStateChanged.mockImplementation(() => () => {});
  mutableAuth.currentUser = null;
});

// --- Tests ----------------------------------------------------------------

describe('useRecommendationDoc', () => {
  test('subscribes under the resolved uid path on mount', async () => {
    mockEnsureAuth.mockResolvedValue('anon-uid');
    const unsub = jest.fn();
    mockOnSnapshot.mockImplementation((_ref, _onNext) => unsub);

    render(<Harness recipientId="r1" recommendationId="rec1" />);

    await waitFor(() => expect(mockDoc).toHaveBeenCalled());
    expect(mockDoc).toHaveBeenCalledWith(
      {},
      'theaWebUser',
      'anon-uid',
      'recipient',
      'r1',
      'recommendation',
      'rec1',
    );
  });

  test('snapshot with data populates the doc state', async () => {
    mockEnsureAuth.mockResolvedValue('anon-uid');
    let snapNext: ((snap: { exists: () => boolean; data: () => unknown }) => void) | null = null;
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      snapNext = onNext;
      return () => {};
    });

    let latest: ReturnType<typeof useRecommendationDoc> | null = null;
    render(
      <Harness
        recipientId="r1"
        recommendationId="rec1"
        onState={(s) => (latest = s)}
      />,
    );

    await waitFor(() => expect(snapNext).not.toBeNull());

    await act(async () => {
      snapNext!({
        exists: () => true,
        data: () => ({ status: 'COMPLETED', input: { occasion: 'birthday' } }),
      });
    });

    expect(latest!.doc).toEqual({ status: 'COMPLETED', input: { occasion: 'birthday' } });
    expect(latest!.loading).toBe(false);
  });

  // The regression test for the bug that took prod blank — without the
  // onAuthStateChanged effect, this fails because the listener stays bound
  // to the anon uid path and never re-binds under the permanent uid.
  test('REGRESSION: re-subscribes under the new uid when auth state changes (anon → permanent merge)', async () => {
    mockEnsureAuth.mockResolvedValueOnce('anon-uid').mockResolvedValueOnce('permanent-uid');
    let authChangeCb: ((user: { uid: string; isAnonymous: boolean } | null) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authChangeCb = cb;
      return () => {};
    });
    const anonUnsub = jest.fn();
    const permUnsub = jest.fn();
    mockOnSnapshot
      .mockImplementationOnce(() => anonUnsub)
      .mockImplementationOnce(() => permUnsub);

    render(<Harness recipientId="r1" recommendationId="rec1" />);

    // First subscription is under anon uid.
    await waitFor(() => expect(mockDoc).toHaveBeenCalledTimes(1));
    expect(mockDoc).toHaveBeenLastCalledWith(
      {},
      'theaWebUser',
      'anon-uid',
      'recipient',
      'r1',
      'recommendation',
      'rec1',
    );

    // mergeGiftFlow swaps uid; auth listener fires.
    await act(async () => {
      authChangeCb!({ uid: 'permanent-uid', isAnonymous: false });
    });

    // Old listener torn down, new one bound under permanent uid.
    expect(anonUnsub).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockDoc).toHaveBeenCalledTimes(2));
    expect(mockDoc).toHaveBeenLastCalledWith(
      {},
      'theaWebUser',
      'permanent-uid',
      'recipient',
      'r1',
      'recommendation',
      'rec1',
    );
  });

  /**
   * Sheet bug #58: while mergeGiftFlow is fanning out the anon → permanent
   * subtree, the new uid's path is empty and the old path is being deleted.
   * The gate must hold the prior doc + skip resubscription so the page
   * doesn't render "we couldn't find this recommendation" mid-merge.
   */
  test('REGRESSION (#58): does NOT re-subscribe while mergeStatus is "merging"', async () => {
    mockEnsureAuth.mockResolvedValueOnce('anon-uid').mockResolvedValueOnce('permanent-uid');
    let authChangeCb: ((user: { uid: string; isAnonymous: boolean } | null) => void) | null = null;
    let firstSnapNext:
      | ((snap: { exists: () => boolean; data: () => unknown }) => void)
      | null = null;
    const anonUnsub = jest.fn();
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authChangeCb = cb;
      return () => {};
    });
    mockOnSnapshot.mockImplementationOnce((_ref, onNext) => {
      firstSnapNext = onNext;
      return anonUnsub;
    });

    let setMerge: (s: 'idle' | 'merging' | 'merged' | 'failed') => void = () => undefined;
    const SetterProbe: React.FC = () => {
      setMerge = useSetMergeStatus();
      return null;
    };
    let latest: ReturnType<typeof useRecommendationDoc> | null = null;
    render(
      <MergeStateProvider safetyTimeoutMs={60000}>
        <SetterProbe />
        <Harness
          recipientId="r1"
          recommendationId="rec1"
          onState={(s) => (latest = s)}
        />
      </MergeStateProvider>,
    );

    // Hydrate the anon doc so we have prior state to hold during the merge.
    await waitFor(() => expect(firstSnapNext).not.toBeNull());
    await act(async () => {
      firstSnapNext!({ exists: () => true, data: () => ({ status: 'COMPLETED' }) });
    });
    expect(latest!.doc).toEqual({ status: 'COMPLETED' });
    expect(mockDoc).toHaveBeenCalledTimes(1);

    // Sign-in flow flips status BEFORE auth, then auth flips uid. With the
    // gate in place, the second `doc()` call should NOT happen yet.
    await act(async () => {
      setMerge('merging');
    });
    await act(async () => {
      authChangeCb!({ uid: 'permanent-uid', isAnonymous: false });
    });

    expect(mockDoc).toHaveBeenCalledTimes(1); // still only the anon subscription
    expect(latest!.doc).toEqual({ status: 'COMPLETED' }); // prior doc held
  });

  test('REGRESSION (#58): re-subscribes under permanent uid when mergeStatus flips merging → merged', async () => {
    mockEnsureAuth.mockResolvedValueOnce('anon-uid').mockResolvedValueOnce('permanent-uid');
    let authChangeCb: ((user: { uid: string; isAnonymous: boolean } | null) => void) | null = null;
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authChangeCb = cb;
      return () => {};
    });
    mockOnSnapshot
      .mockImplementationOnce(() => () => {})
      .mockImplementationOnce(() => () => {});

    let setMerge: (s: 'idle' | 'merging' | 'merged' | 'failed') => void = () => undefined;
    const SetterProbe: React.FC = () => {
      setMerge = useSetMergeStatus();
      return null;
    };
    render(
      <MergeStateProvider safetyTimeoutMs={60000}>
        <SetterProbe />
        <Harness recipientId="r1" recommendationId="rec1" />
      </MergeStateProvider>,
    );

    await waitFor(() => expect(mockDoc).toHaveBeenCalledTimes(1));

    await act(async () => setMerge('merging'));
    await act(async () => {
      authChangeCb!({ uid: 'permanent-uid', isAnonymous: false });
    });
    expect(mockDoc).toHaveBeenCalledTimes(1); // gated

    await act(async () => setMerge('merged'));
    await waitFor(() => expect(mockDoc).toHaveBeenCalledTimes(2));
    expect(mockDoc).toHaveBeenLastCalledWith(
      {},
      'theaWebUser',
      'permanent-uid',
      'recipient',
      'r1',
      'recommendation',
      'rec1',
    );
  });

  test('uid change resets the doc state to null + loading=true', async () => {
    mockEnsureAuth.mockResolvedValueOnce('anon-uid').mockResolvedValueOnce('permanent-uid');
    let authChangeCb: ((user: { uid: string; isAnonymous: boolean } | null) => void) | null = null;
    let firstSnapNext: ((snap: { exists: () => boolean; data: () => unknown }) => void) | null =
      null;
    mockOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authChangeCb = cb;
      return () => {};
    });
    mockOnSnapshot
      .mockImplementationOnce((_ref, onNext) => {
        firstSnapNext = onNext;
        return () => {};
      })
      .mockImplementationOnce(() => () => {});

    let latest: ReturnType<typeof useRecommendationDoc> | null = null;
    render(
      <Harness
        recipientId="r1"
        recommendationId="rec1"
        onState={(s) => (latest = s)}
      />,
    );

    await waitFor(() => expect(firstSnapNext).not.toBeNull());

    await act(async () => {
      firstSnapNext!({
        exists: () => true,
        data: () => ({ status: 'COMPLETED' }),
      });
    });
    expect(latest!.doc).not.toBeNull();
    expect(latest!.loading).toBe(false);

    // Auth swap clears prior render state so the page never shows the old
    // subtree's data against the new auth context.
    await act(async () => {
      authChangeCb!({ uid: 'permanent-uid', isAnonymous: false });
    });
    expect(latest!.doc).toBeNull();
    expect(latest!.loading).toBe(true);
  });
});
