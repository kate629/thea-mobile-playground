import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useRegenerate } from '../useRegenerate';
import type { Recommendation } from '../../schemas';

// --- Mocks ----------------------------------------------------------------

const mockEnsureAuth = jest.fn<Promise<string>, []>();
const mockSubmitGiftFlow = jest.fn<Promise<{ data: any }>, [unknown]>();
const mockGetCarouselFeed = jest.fn<Promise<unknown>, [unknown]>();
const mockGetFastCarouselFeed = jest.fn<Promise<unknown>, [unknown]>();

jest.mock('../../../firebaseConfig', () => ({
  ensureAuth: () => mockEnsureAuth(),
  db: {},
  auth: {},
}));

jest.mock('../../../firebaseFunctions', () => ({
  getCarouselFeed: (args: unknown) => mockGetCarouselFeed(args),
  getFastCarouselFeed: (args: unknown) => mockGetFastCarouselFeed(args),
  functions: {},
}));

jest.mock('../../callables', () => ({
  submitGiftFlow: (payload: unknown) => mockSubmitGiftFlow(payload),
}));

// --- Test fixture ---------------------------------------------------------

const RECOMMENDATION: Recommendation = {
  recommendationId: 'old-rec',
  isActive: true,
  input: {
    occasion: 'BIRTHDAY',
    occasionLabel: undefined,
    interests: ['gardening', 'cooking'],
    freeform: 'Loves succulents.',
  },
  recipientSnapshot: {
    name: 'Mom',
    emoji: '🌸',
    relationship: 'MOM',
    gender: 'FEMALE',
    age: 60,
    isMe: false,
  },
  status: 'COMPLETED',
  mode: 'THOUGHTFUL',
  carouselSessionId: 'uid-1_old-rec',
  _schemaVersion: 1,
  // Timestamps unused in the regenerate request — cast to satisfy the type.
} as Recommendation;

// --- Test harness ---------------------------------------------------------

interface HarnessProps {
  onReady?: (api: ReturnType<typeof useRegenerate>) => void;
}

const Harness: React.FC<HarnessProps> = ({ onReady }) => {
  const api = useRegenerate();
  React.useEffect(() => {
    onReady?.(api);
  });
  return <div data-testid="status">{api.state.status}</div>;
};

const renderHarness = () => {
  let api: ReturnType<typeof useRegenerate> | null = null;
  render(<Harness onReady={(a) => (api = a)} />);
  if (!api) throw new Error('hook not initialized');
  return { getApi: () => api! };
};

beforeEach(() => {
  mockEnsureAuth.mockReset();
  mockSubmitGiftFlow.mockReset();
  mockGetCarouselFeed.mockReset();
  mockGetFastCarouselFeed.mockReset();
  mockGetCarouselFeed.mockResolvedValue({});
  mockGetFastCarouselFeed.mockResolvedValue({});
});

// --- Tests ----------------------------------------------------------------

describe('useRegenerate', () => {
  test('starts in idle state', () => {
    renderHarness();
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  test('idle → regenerating → ready on success; replays the snapshot + kicks off pipeline', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    mockSubmitGiftFlow.mockResolvedValue({
      data: {
        recipientId: 'r1',
        recommendationId: 'new-rec',
        carouselSessionId: 'uid-1_new-rec',
        status: 'PROCESSING',
      },
    });

    const { getApi } = renderHarness();

    await act(async () => {
      await getApi().regenerate({ recipientId: 'r1', recommendation: RECOMMENDATION });
    });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'));
    expect(mockSubmitGiftFlow).toHaveBeenCalledTimes(1);

    // Submit replays the recipient + quiz input from the snapshot, including
    // the pre-existing recipientId (BE treats this as update + new rec).
    const callArg = mockSubmitGiftFlow.mock.calls[0][0] as any;
    expect(callArg.recipient.recipientId).toBe('r1');
    expect(callArg.recipient.relationship).toBe('MOM');
    expect(callArg.recipient.age).toBe(60);
    expect(callArg.recipient.isMe).toBe(false);
    expect(callArg.input.occasion).toBe('BIRTHDAY');
    expect(callArg.input.interests).toEqual(['gardening', 'cooking']);
    expect(callArg.input.freeform).toBe('Loves succulents.');
    expect(callArg.mode).toBe('THOUGHTFUL');

    // THOUGHTFUL mode kicks off the thoughtful pipeline (not fast) with the
    // BE-provided carouselSessionId.
    expect(mockGetCarouselFeed).toHaveBeenCalledTimes(1);
    expect(mockGetFastCarouselFeed).not.toHaveBeenCalled();
    const kickArg = mockGetCarouselFeed.mock.calls[0][0] as any;
    expect(kickArg.session_id).toBe('uid-1_new-rec');
    expect(kickArg.recipient_relationship).toBe('PARENT');
  });

  test('idle → regenerating → error on callable rejection', async () => {
    mockEnsureAuth.mockResolvedValue('uid-1');
    mockSubmitGiftFlow.mockRejectedValue(new Error('network down'));

    const { getApi } = renderHarness();

    await act(async () => {
      await getApi()
        .regenerate({ recipientId: 'r1', recommendation: RECOMMENDATION })
        .catch(() => undefined);
    });

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('error'));
  });

  test('rejects double-fire while in flight', async () => {
    let resolveAuth: (uid: string) => void = () => {};
    mockEnsureAuth.mockImplementation(() => new Promise((r) => (resolveAuth = r)));
    mockSubmitGiftFlow.mockResolvedValue({
      data: {
        recipientId: 'r1',
        recommendationId: 'new-rec',
        carouselSessionId: 'uid-1_new-rec',
        status: 'PROCESSING',
      },
    });

    const { getApi } = renderHarness();

    let firstPromise: Promise<unknown> | null = null;
    act(() => {
      firstPromise = getApi().regenerate({
        recipientId: 'r1',
        recommendation: RECOMMENDATION,
      });
    });

    await expect(
      getApi().regenerate({ recipientId: 'r1', recommendation: RECOMMENDATION }),
    ).rejects.toThrow(/already in flight/i);

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
        .regenerate({ recipientId: 'r1', recommendation: RECOMMENDATION })
        .catch(() => undefined);
    });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('error'));

    act(() => {
      getApi().reset();
    });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('idle'));
  });
});
