/**
 * Tests for the Meta CAPI client. Network calls are mocked — we just verify
 * payload shape, the same-origin endpoint URL, and the bot/error guards.
 */
import { generateEventId, sendCapiEvent } from '../metaCapi';

const mockIsBot = jest.fn<boolean, []>();
jest.mock('../botDetect', () => ({ isBot: () => mockIsBot() }));

describe('generateEventId', () => {
  test('returns a non-empty string', () => {
    const id = generateEventId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(8);
  });

  test('returns a different id on each call', () => {
    const a = generateEventId();
    const b = generateEventId();
    expect(a).not.toBe(b);
  });
});

describe('sendCapiEvent', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    mockIsBot.mockReturnValue(false);
    // Clear cookies between tests to keep fbp/fbc behavior deterministic.
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  test('posts to /api/meta-capi same-origin endpoint', () => {
    sendCapiEvent('PageView', 'evt-123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/meta-capi');
  });

  test('uses keepalive flag (survives page unload)', () => {
    sendCapiEvent('PageView', 'evt-123');
    const opts = fetchMock.mock.calls[0][1];
    expect(opts.keepalive).toBe(true);
    expect(opts.method).toBe('POST');
  });

  test('payload includes required fields', () => {
    sendCapiEvent('PageView', 'evt-123');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.event_name).toBe('PageView');
    expect(body.event_id).toBe('evt-123');
    expect(body.event_source_url).toContain('http');
  });

  test('omits fbp/fbc when no cookies present', () => {
    sendCapiEvent('PageView', 'evt-123');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.fbp).toBeUndefined();
    expect(body.fbc).toBeUndefined();
  });

  test('reads _fbp cookie when present', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '_fbp=fb.1.1635789876.123456789; other=x',
    });
    sendCapiEvent('PageView', 'evt-123');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.fbp).toBe('fb.1.1635789876.123456789');
  });

  test('synthesizes _fbc from fbclid query param when cookie missing', () => {
    // jsdom default href is "http://localhost/"; we patch search.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?fbclid=ABC123XYZ' },
    });
    sendCapiEvent('PageView', 'evt-123');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.fbc).toMatch(/^fb\.1\.\d+\.ABC123XYZ$/);
  });

  test('passes hashed PII when provided', () => {
    sendCapiEvent('Lead', 'evt-123', {
      emailHash: 'sha256_email_hash_abc',
      phoneHash: 'sha256_phone_hash_def',
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.em).toBe('sha256_email_hash_abc');
    expect(body.ph).toBe('sha256_phone_hash_def');
  });

  test('passes custom_data when provided', () => {
    sendCapiEvent('ViewContent', 'evt-123', {
      customData: { content_ids: ['p_123'], value: 42, currency: 'USD' },
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.custom_data).toEqual({
      content_ids: ['p_123'],
      value: 42,
      currency: 'USD',
    });
  });

  test('no-op when isBot() returns true', () => {
    mockIsBot.mockReturnValue(true);
    sendCapiEvent('PageView', 'evt-123');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('swallows fetch rejection silently', async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error('network down')));
    expect(() => sendCapiEvent('PageView', 'evt-123')).not.toThrow();
    // Wait a tick for the .catch() to attach.
    await Promise.resolve();
  });
});
