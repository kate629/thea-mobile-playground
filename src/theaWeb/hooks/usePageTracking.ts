import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { gaPageView } from '../lib/gaPixel';
import { metaPageView } from '../lib/metaPixel';

/**
 * Fires Meta pixel `PageView` and GA4 `page_view` on every react-router
 * location change. Mounted once at the App root so SPA route changes — which
 * don't reload the page and so don't fire either snippet's implicit page_view
 * — still get attributed.
 *
 * Note: the boilerplate in `public/index.html` deliberately does NOT call
 * `fbq('track','PageView')` after init, and configures GA4 with
 * `send_page_view: false`. This hook owns every page_view fire (initial load
 * + every subsequent route change), so each pixel sees exactly one page_view
 * per visited URL — no double-counting.
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    metaPageView();
    gaPageView();
  }, [location.pathname, location.search]);
}
