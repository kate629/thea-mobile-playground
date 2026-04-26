import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useSubmitGiftFlow } from '../useSubmitGiftFlow';
import type { QuizAnswers } from '../../../components/landing/quiz/useQuizFlow';

// --- Mocks ----------------------------------------------------------------

const mockEnsureAuth = jest.fn<Promise<string>, []>();
const mockSubmitGiftFlow = jest.fn<Promise<{ data: any }>, [unknown]>();

jest.mock('../../../firebaseConfig', () => ({
  ensureAuth: () => mockEnsureAuth(),
  db: {},
  auth: {},
}));

jest.mock('../../callables', () => ({
  submitGiftFlow: (payload: unknown) => mockSubmitGiftFlow(payload),
}));

// --- Test harness ---------------------------------------------------------

const ANSWERS: QuizAnswers = {
  relationship: 'Mom',
  age: 50,
  interests: ['gardening'],
  moreAbout: '',
  gender: 'female',
};

interface HarnessProps {
  onReady?: (api: ReturnType<typeof useSubmitGiftFlow>) => void;
}

const Harness: React.FC<HarnessProps> = ({ onReady }) => {
  const api = useSubmitGiftFlow();
  React.useEffect(() => {
    onReady?.(api);
  });
  return <div data-testid="status">{api.state.status}</div>;
};

const renderHarness = () => {
  let api: ReturnType<typeof useSubmitGiftFlow> | null = null;
  render(<Harness onReady={(a) => (api = a)} />);
  if (!api) throw new Error('hook not initialized');
  return { getApi: () => api! };
};

beforeEach(() => {
  mockEnsureAuth.mockReset();
  mockSubmitGiftFlow.mockReset();
});

// --- Tests ----------------------------------------------------------------

describe('useSubmitGiftFlow', () => {
  test('starts in idle state', () => {
    renderHarness();
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  test('idle → submitting → ready on success', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    mockSubmitGiftFlow.mockResolvedValue({
      data: { recipientId: 'r1', recommendationId: 'rec1', status: 'PROCESSING' },
    });

    const { getApi } = renderHarness();

    await act(async () => {
      await getApi().submit(ANSWERS);
    });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'));
    expect(mockEnsureAuth).toHaveBeenCalledTimes(1);
    expect(mockSubmitGiftFlow).toHaveBeenCalledTimes(1);
    const callArg = mockSubmitGiftFlow.mock.calls[0][0] as any;
    expect(callArg.recipient.relationship).toBe('MOM');
    expect(callArg.mode).toBe('FAST');
  });

  test('idle → submitting → error on callable rejection', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    const boom = new Error('network down');
    mockSubmitGiftFlow.mockRejectedValue(boom);

    const { getApi } = renderHarness();

    await act(async () => {
      await getApi()
        .submit(ANSWERS)
        .catch(() => undefined);
    });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('error'));
  });

  test('rejects double-fire while in flight', async () => {
    let resolveAuth: (uid: string) => void = () => {};
    mockEnsureAuth.mockImplementation(() => new Promise((r) => (resolveAuth = r)));
    mockSubmitGiftFlow.mockResolvedValue({
      data: { recipientId: 'r1', recommendationId: 'rec1', status: 'PROCESSING' },
    });

    const { getApi } = renderHarness();

    let firstPromise: Promise<unknown> | null = null;
    act(() => {
      firstPromise = getApi().submit(ANSWERS);
    });

    await expect(getApi().submit(ANSWERS)).rejects.toThrow(/already in flight/i);

    // Let the first call complete to clean up.
    await act(async () => {
      resolveAuth('uid-1');
      await firstPromise;
    });
  });

  test('reset() returns to idle from error', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    mockSubmitGiftFlow.mockRejectedValue(new Error('nope'));

    const { getApi } = renderHarness();

    await act(async () => {
      await getApi()
        .submit(ANSWERS)
        .catch(() => undefined);
    });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('error'));

    act(() => {
      getApi().reset();
    });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('idle'));
  });
});
