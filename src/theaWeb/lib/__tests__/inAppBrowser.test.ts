import { isInAppBrowser } from '../inAppBrowser';

describe('isInAppBrowser', () => {
  test('detects Instagram iOS webview', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 305.0.0.32.110 (iPhone15,2; iOS 17_0; en_US; en; scale=3.00; 1170x2532; 543598384)',
      ),
    ).toBe(true);
  });

  test('detects Instagram Android webview', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (Linux; Android 13; SM-S918U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 Instagram 305.0.0.34.110 Android (33/13; 480dpi; 1080x2184; samsung; SM-S918U)',
      ),
    ).toBe(true);
  });

  test('detects Facebook iOS webview (FBAN/FBAV)', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/449.0.0.43.116;FBBV/567073824]',
      ),
    ).toBe(true);
  });

  test('detects Facebook Android in-app browser (FB_IAB)', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (Linux; Android 13; SM-S918U Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.66 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/449.0.0.36.71;]',
      ),
    ).toBe(true);
  });

  test('does NOT match regular mobile Safari', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(false);
  });

  test('does NOT match desktop Chrome', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      ),
    ).toBe(false);
  });

  test('does NOT match mobile Chrome on Android', () => {
    expect(
      isInAppBrowser(
        'Mozilla/5.0 (Linux; Android 13; SM-S918U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe(false);
  });

  test('returns false for empty UA string', () => {
    expect(isInAppBrowser('')).toBe(false);
  });

  test('falls back to navigator.userAgent when arg omitted (jest jsdom default)', () => {
    // jsdom's default UA does not match any social-app pattern.
    expect(isInAppBrowser()).toBe(false);
  });
});
