import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProductImage } from '../../components/landing/quiz/AmbientProductScroll';
import { SAMPLE_AMBIENT_IMAGES } from '../../components/landing/quiz/sampleAmbientImages';
import {
  firstCarouselImageUrls,
  liveImagesFromSession,
  occasionSampleImages,
} from '../lib/loadingAmbientImages';
import type { TheaWebOccasionEnum } from '../schemas';
import { useCarouselSession } from './useCarouselSession';
import { useImagesPreloaded } from './useImagesPreloaded';

// Bug #74 — defers navigation from a pre-results entry point (quiz, search
// pill, …) until the carousel agent has finished its curation phase AND the
// first carousel's first 3 images are decoded into the browser cache.
//
// The carousel agent runs in two phases (gotcha #17 in the handbook):
//   1. Streaming — `.extend()`s products into the session as Typesense
//      results arrive. `session.status === 'searching'`.
//   2. Curation — REPLACES the products list with the final curated picks.
//      `session.status === 'complete'` (CarouselSession normalizes that to
//      'COMPLETED').
//
// Without gating, an FE that subscribes mid-stream paints products that
// vanish moments later when curation rewrites the list — visible flicker.
// Gating render/navigation on `status === 'COMPLETED'` ensures everything
// the user sees is the final set.
//
// This hook centralizes the gate so we stop reintroducing the bug at every
// new entry point. Three call sites:
//   1. QuizPage (originally PR #77)
//   2. SearchPill on signed-in homepage (PR for bug #74)
//   3. Anything new that lands on /quiz/results/* after a fresh submit
//
// Usage:
//   const { liveImages, ready } = useDeferredNavToResults(pendingNav);
//   <QuizLoadingAnimated images={liveImages} /> when pendingNav is set;
//   the hook navigates internally once `ready` flips true.

export const DEFERRED_NAV_MAX_WAIT_MS = 30000;

// Minimum time the loading screen must stay visible after pendingNav is
// set. Without this, the playground (and warm-cache real users) can
// preload three small images so fast the user barely sees the loading
// screen at all — and definitely doesn't get to read the opening
// testimonial. 7000ms gives the testimonial its full 6s hold plus a
// beat of the rotating typewriter before the navigation fires.
export const DEFERRED_NAV_MIN_VISIBLE_MS = 7000;

export interface PendingNavigation {
  recipientId: string;
  recommendationId: string;
  carouselSessionId: string;
  /** Wire enum (e.g. 'MOTHERS_DAY'). Drives the per-occasion sample-ring
   *  fallback while the live session has no products yet. */
  occasion?: TheaWebOccasionEnum;
}

interface UseDeferredNavToResultsResult {
  /** Images for the ambient ring during the wait. Three layered states:
   *  1. Live products from the carousel session, once any have arrived.
   *  2. The per-occasion curated guide products, while the session is still
   *     empty (visually relevant to the user's quiz).
   *  3. The global SAMPLE_AMBIENT_IMAGES fallback when the occasion has no
   *     curated guide (JUST_BECAUSE / CHRISTMAS / OTHER / no occasion set).
   */
  liveImages: ProductImage[];
  /** True once we've navigated (or are about to). Mostly useful for tests
   *  + storybook — production callers don't typically need to read this. */
  ready: boolean;
}

export function useDeferredNavToResults(
  pendingNav: PendingNavigation | null,
): UseDeferredNavToResultsResult {
  const navigate = useNavigate();

  const { session } = useCarouselSession(pendingNav?.carouselSessionId);

  const liveImages = useMemo<ProductImage[]>(() => {
    const fromSession = liveImagesFromSession(session);
    if (fromSession.length > 0) return fromSession;
    if (pendingNav?.occasion) {
      const occasionImages = occasionSampleImages(pendingNav.occasion);
      if (occasionImages.length > 0) return occasionImages;
    }
    return SAMPLE_AMBIENT_IMAGES;
  }, [session, pendingNav]);

  // ONLY sample URLs to preload once the session is COMPLETED. Sampling
  // mid-stream preloads products that get replaced during curation; the
  // user lands on results and sees a flash of the streaming set before
  // the curated set paints.
  const firstThreeUrls = useMemo(
    () => (session?.status === 'COMPLETED' ? firstCarouselImageUrls(session, 3) : []),
    [session],
  );
  const imagesReady = useImagesPreloaded(firstThreeUrls, {
    firstN: 3,
    timeoutMs: DEFERRED_NAV_MAX_WAIT_MS,
  });

  // Top-level safety net: if the BE never delivers a COMPLETED status at
  // all (so `firstThreeUrls` stays empty and `useImagesPreloaded`'s own
  // timer never starts), navigate anyway after MAX_WAIT_MS so the user
  // isn't stranded on the loading screen forever.
  const [maxWaitFired, setMaxWaitFired] = useState(false);
  useEffect(() => {
    if (!pendingNav || maxWaitFired) return;
    const t = setTimeout(() => setMaxWaitFired(true), DEFERRED_NAV_MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [pendingNav, maxWaitFired]);

  // Minimum-visible floor: even when imagesReady flips true near-instantly
  // (warm cache / playground stubs), hold the loading screen for at least
  // MIN_VISIBLE_MS so the testimonial + typewriter actually have a chance
  // to register with the user.
  const [minVisibleElapsed, setMinVisibleElapsed] = useState(false);
  useEffect(() => {
    if (!pendingNav) {
      setMinVisibleElapsed(false);
      return;
    }
    const t = setTimeout(() => setMinVisibleElapsed(true), DEFERRED_NAV_MIN_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [pendingNav]);

  const ready =
    Boolean(pendingNav) && (imagesReady || maxWaitFired) && minVisibleElapsed;

  useEffect(() => {
    if (!pendingNav) return;
    if (!imagesReady && !maxWaitFired) return;
    if (!minVisibleElapsed) return;
    navigate(`/quiz/results/${pendingNav.recipientId}/${pendingNav.recommendationId}`);
  }, [pendingNav, imagesReady, maxWaitFired, minVisibleElapsed, navigate]);

  return { liveImages, ready };
}
