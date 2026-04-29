// Detects whether the current user-agent is an in-app browser (webview)
// embedded inside a social/messaging app. Used to branch behavior that
// historically broke in WKWebView/WebView contexts — most notably
// `window.open(url, '_blank')` for affiliate-redirect product clicks,
// which IG and FB webviews handle inconsistently (sometimes silently
// blocked, sometimes pops out to system browser breaking the session).
//
// Reference: https://developers.facebook.com/docs/sharing/webmasters/messenger
//
// IG/FB UA tokens (current as of 2026-04):
//   - Instagram:  `Instagram <version>` substring
//   - Facebook:   `FBAN/<app>;FBAV/<version>` (mobile native), `FBAV/...` for newer
//   - Messenger:  `FBAN/MessengerForiOS|MessengerLiteForiOS`
//
// We're conservative — only flagging known social-app UAs, not all webviews.
// A misfire would degrade `window.open` to `location.href` for a non-webview
// user, which is mildly annoying (loses the new-tab) but not broken.
//
// `userAgent` arg lets tests inject without monkey-patching navigator.

const SOCIAL_WEBVIEW_PATTERNS: ReadonlyArray<RegExp> = [
  /Instagram/i,
  /\bFBAN\b/, // Facebook for iOS / Android
  /\bFBAV\b/, // Facebook app version
  /\bFB_IAB\b/, // Facebook in-app browser (Android)
  /\bFBIOS\b/,
];

export function isInAppBrowser(userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): boolean {
  if (!userAgent) return false;
  return SOCIAL_WEBVIEW_PATTERNS.some((p) => p.test(userAgent));
}
