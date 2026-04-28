import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { metaPageView } from '../lib/metaPixel';

/**
 * Fires Meta pixel `PageView` on every react-router location change. Mounted
 * once at the App root so SPA route changes — which don't reload the page and
 * so don't fire the pixel snippet's implicit PageView — still get attributed.
 *
 * Note: the boilerplate in `public/index.html` deliberately does NOT call
 * `fbq('track','PageView')` after init. This hook owns every PageView fire
 * (initial load + every subsequent route change), so we get exactly one
 * PageView per visited URL — no double-counting.
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    metaPageView();
  }, [location.pathname, location.search]);
}
