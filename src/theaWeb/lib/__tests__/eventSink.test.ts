import {
  flush,
  logEvent,
  _peekQueueForTesting,
  _resetEventSinkForTesting,
} from '../eventSink';

const mockIsBot = jest.fn<boolean, []>();

jest.mock('../botDetect', () => ({
  isBot: () => mockIsBot(),
}));

const mockLogEvents = jest.fn<Promise<unknown>, [unknown]>();
jest.mock('../../callables', () => ({
  logEvents: (req: unknown) => mockLogEvents(req),
}));

describe('eventSink', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    _resetEventSinkForTesting();
    mockIsBot.mockReset();
    mockIsBot.mockReturnValue(false);
    mockLogEvents.mockReset();
    mockLogEvents.mockResolvedValue({ accepted: 0, rejected: 0 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('queues events with a unique event_id and ISO event_ts_client', () => {
    logEvent('product_impression', { product_id: 'p1' });
    logEvent('product_impression', { product_id: 'p2' });
    const queued = _peekQueueForTesting();
    expect(queued).toHaveLength(2);
    expect(queued[0].event_id).not.toBe(queued[1].event_id);
    expect(queued[0].event_id.length).toBeGreaterThan(8);
    // ISO 8601 sanity (Z or offset suffix).
    expect(queued[0].event_ts_client).toMatch(/T\d{2}:\d{2}:\d{2}/);
    expect(queued[0].event_name).toBe('product_impression');
    expect(queued[0].properties).toEqual({ product_id: 'p1' });
  });

  test('flushes when batch size hits 10', () => {
    for (let i = 0; i < 10; i++) {
      logEvent('product_impression', { product_id: `p${i}` });
    }
    expect(mockLogEvents).toHaveBeenCalledTimes(1);
    const call = mockLogEvents.mock.calls[0][0] as { events: unknown[] };
    expect(call.events).toHaveLength(10);
    expect(_peekQueueForTesting()).toHaveLength(0);
  });

  test('flushes after 5 seconds elapsed', () => {
    logEvent('product_impression', { product_id: 'p1' });
    expect(mockLogEvents).not.toHaveBeenCalled();
    jest.advanceTimersByTime(5_000);
    expect(mockLogEvents).toHaveBeenCalledTimes(1);
  });

  test('flushes on visibilitychange → hidden', () => {
    logEvent('product_impression', { product_id: 'p1' });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(mockLogEvents).toHaveBeenCalledTimes(1);
  });

  test('flushes on pagehide', () => {
    logEvent('product_impression', { product_id: 'p1' });
    window.dispatchEvent(new Event('pagehide'));
    expect(mockLogEvents).toHaveBeenCalledTimes(1);
  });

  test('drops events when bot detected — no queue, no fire', () => {
    mockIsBot.mockReturnValue(true);
    logEvent('product_impression', { product_id: 'p1' });
    expect(_peekQueueForTesting()).toHaveLength(0);
    void flush();
    expect(mockLogEvents).not.toHaveBeenCalled();
  });

  test('swallows callable failures so callers never see exceptions', async () => {
    mockLogEvents.mockRejectedValueOnce(new Error('nope'));
    logEvent('product_impression', { product_id: 'p1' });
    await expect(flush()).resolves.toBeUndefined();
  });

  test('flush is a no-op when the queue is empty', async () => {
    await flush();
    expect(mockLogEvents).not.toHaveBeenCalled();
  });

  // --- Never-throws contract ----------------------------------------------
  // These tests exist to prove the explicit guarantee: a logging error must
  // not break the user's session. If you add behavior to logEvent or flush
  // that can throw, you must also add a test here that demonstrates the new
  // failure mode is contained.

  test('logEvent never throws even if isBot throws', () => {
    mockIsBot.mockImplementation(() => {
      throw new Error('botDetect went sideways');
    });
    expect(() => logEvent('product_impression', { product_id: 'p1' })).not.toThrow();
    // No queue entry — we bailed before push.
    expect(_peekQueueForTesting()).toHaveLength(0);
  });

  test('logEvent never throws even if properties contains a poison-toString', () => {
    const poison = {} as Record<string, unknown>;
    Object.defineProperty(poison, 'badKey', {
      enumerable: true,
      get() {
        throw new Error('lol');
      },
    });
    expect(() => logEvent('product_impression', poison)).not.toThrow();
  });

  test('flush never throws when JSON.stringify fails (circular property)', async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    logEvent('product_impression', { ref: circular });
    await expect(flush()).resolves.toBeUndefined();
    expect(mockLogEvents).not.toHaveBeenCalled();
  });

  test('flush never throws when the callable throws synchronously', async () => {
    mockLogEvents.mockImplementationOnce(() => {
      throw new Error('sync boom');
    });
    logEvent('product_impression', { product_id: 'p1' });
    await expect(flush()).resolves.toBeUndefined();
  });

  test('flush never throws when the callable rejects async', async () => {
    mockLogEvents.mockRejectedValueOnce(new Error('async boom'));
    logEvent('product_impression', { product_id: 'p1' });
    await expect(flush()).resolves.toBeUndefined();
  });

  test('events queued mid-flush land in the next batch, not dropped', async () => {
    // Make the in-flight call take a tick so we can queue after it starts.
    type Resolver = (v: unknown) => void;
    const resolverHolder: { fn: Resolver | null } = { fn: null };
    mockLogEvents.mockImplementationOnce(
      () => new Promise<unknown>((res) => { resolverHolder.fn = res; }),
    );
    logEvent('product_impression', { product_id: 'p1' });
    const flushPromise = flush();
    // First batch is in-flight; queue should be drained...
    expect(_peekQueueForTesting()).toHaveLength(0);
    // ...but a fresh event landing now stays for the next batch.
    logEvent('product_impression', { product_id: 'p2' });
    expect(_peekQueueForTesting()).toHaveLength(1);
    resolverHolder.fn?.({ accepted: 1, rejected: 0 });
    await flushPromise;
    expect(mockLogEvents).toHaveBeenCalledTimes(1);
    expect(_peekQueueForTesting()).toHaveLength(1);
  });
});
