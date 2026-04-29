import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { gaPageView, type PageType } from '../lib/gaPixel';
import { metaPageView } from '../lib/metaPixel';

/**
 * Fires Meta pixel `PageView` and GA4 `page_view` on every react-router
 * location change. Mounted once at the App root so SPA route changes — which
 * don't reload the page and so don't fire either snippet's implicit page_view
 * — still get attributed.
 *
 * GA4 page_view is enriched with `page_type` (home/quiz/results/guide/board/
 * other), `occasion` (slug on /occasion/* pages), and `guide_visit_number`
 * (per-session counter — 1 on the first guide hit, 2 on the second, ...) so
 * the dashboard can compute "% sessions reaching guide", "guide repeat-view
 * rate", etc. without joining against the URL.
 *
 * Note: the boilerplate in `public/index.html` deliberately does NOT call
 * `fbq('track','PageView')` after init, and configures GA4 with
 * `send_page_view: false`. This hook owns every page_view fire (initial load
 * + every subsequent route change), so each pixel sees exactly one page_view
 * per visited URL — no double-counting.
 */
export function usePageTracking(): void {
  const location = useLocation();
  // sessionStorage-backed counter survives within-session SPA navigations and
  // page reloads but resets when the tab is closed — same scoping GA4 itself
  // uses for "session" by default. A useRef guards against double-increment
  // in StrictMode's mount → unmount → mount cycle.
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (lastTrackedPath.current === path) return;
    lastTrackedPath.current = path;

    const { pageType, occasion } = classify(path);

    let guideVisitNumber: number | undefined;
    if (pageType === 'guide') {
      guideVisitNumber = bumpGuideVisitCounter();
    }

    metaPageView();
    gaPageView({
      page_type: pageType,
      ...(occasion !== undefined ? { occasion } : {}),
      ...(guideVisitNumber !== undefined ? { guide_visit_number: guideVisitNumber } : {}),
    });
  }, [location.pathname, location.search]);
}

function classify(path: string): { pageType: PageType; occasion?: string } {
  if (path === '/') return { pageType: 'home' };
  if (path === '/quiz') return { pageType: 'quiz' };
  if (path.startsWith('/quiz/results/')) return { pageType: 'results' };
  if (path.startsWith('/board/')) return { pageType: 'board' };
  if (path.startsWith('/occasion/')) {
    return { pageType: 'guide', occasion: path.slice('/occasion/'.length) };
  }
  return { pageType: 'other' };
}

const GUIDE_VISIT_KEY = 'thea_guide_visit_count';

function bumpGuideVisitCounter(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const prev = window.sessionStorage?.getItem(GUIDE_VISIT_KEY);
    const next = (prev ? parseInt(prev, 10) : 0) + 1;
    window.sessionStorage?.setItem(GUIDE_VISIT_KEY, String(next));
    return next;
  } catch {
    // sessionStorage can throw in strict-mode iframes / private browsing.
    // Default to 1; this isn't load-bearing for funnel analysis.
    return 1;
  }
}
