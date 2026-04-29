/* eslint-disable @typescript-eslint/no-explicit-any */
import { openExternal } from '../openExternal';

const IG_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 305.0.0.32.110';
const SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const setUA = (ua: string) => {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
};

describe('openExternal', () => {
  let openSpy: jest.SpyInstance;
  let originalLocation: Location;

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    originalLocation = window.location;
    // Replace location with a writable stub so we can assert .href assignments.
    delete (window as any).location;
    (window as any).location = { href: 'https://givethea.com/' };
  });

  afterEach(() => {
    openSpy.mockRestore();
    (window as any).location = originalLocation;
  });

  test('uses window.open(_, "_blank") on regular Safari', () => {
    setUA(SAFARI_UA);
    openExternal('https://redirect.viglink.com/?u=foo');
    expect(openSpy).toHaveBeenCalledWith(
      'https://redirect.viglink.com/?u=foo',
      '_blank',
      'noopener,noreferrer',
    );
    expect(window.location.href).toBe('https://givethea.com/');
  });

  test('uses window.location.href = url in IG webview (no new tab)', () => {
    setUA(IG_UA);
    openExternal('https://redirect.viglink.com/?u=bar');
    expect(openSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe('https://redirect.viglink.com/?u=bar');
  });

  test('no-ops on empty URL', () => {
    setUA(SAFARI_UA);
    openExternal('');
    expect(openSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe('https://givethea.com/');
  });
});
