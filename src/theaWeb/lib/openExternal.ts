// Centralized helper for navigating to an external URL (typically Sovrn-
// wrapped affiliate redirects from a product card). Branches behavior by
// runtime context:
//
//   - In-app browsers (IG/FB webview): same-window navigation via
//     `window.location.href`. WKWebView's handling of `window.open(_, '_blank')`
//     is unreliable — sometimes silently blocked, sometimes pops the system
//     browser breaking session continuity. Same-window nav always works,
//     and the user wanted to leave the site anyway (they're heading to a
//     merchant page).
//
//   - Everywhere else: `window.open(url, '_blank', 'noopener,noreferrer')`
//     to preserve the existing new-tab behavior on desktop and regular
//     mobile browsers.
//
// Single import + single call site keeps the branching decision out of every
// component that handles a product click.

import { isInAppBrowser } from './inAppBrowser';

export function openExternal(url: string): void {
  if (!url) return;
  if (isInAppBrowser()) {
    window.location.href = url;
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
