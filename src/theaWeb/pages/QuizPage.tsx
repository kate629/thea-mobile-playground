import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import { QuizCardAnimated } from '../../components/landing/quiz/QuizCardAnimated';
import { SiteHeader } from '../../components/landing/SiteHeader';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { SAMPLE_AMBIENT_IMAGES } from '../../components/landing/quiz/sampleAmbientImages';
import type { ProductImage } from '../../components/landing/quiz/AmbientProductScroll';
import { useSubmitGiftFlow } from '../hooks/useSubmitGiftFlow';
import { useLeaveWarning } from '../hooks/useLeaveWarning';
import { useBackButtonGuard } from '../hooks/useBackButtonGuard';
import { useCarouselSession } from '../hooks/useCarouselSession';
import { useImagesPreloaded } from '../hooks/useImagesPreloaded';
import { useAuthGate } from '../auth/AuthGateContext';
import {
  firstCarouselImageUrls,
  liveImagesFromSession,
  occasionSampleImages,
  quizDisplayOccasionToEnum,
} from '../lib/loadingAmbientImages';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';

// Bug #50 + #57 — continuous loading state.
//
// Before: `submit()` resolved → navigate immediately → results page showed
// 3 shimmer rows for ~0.5-2s, then real carousels with grey image-shaped
// voids for another 1-2s while CDN images decoded. Two awkward intermediate
// states stacked between the polished quiz loading state and the real
// results paint. Plus the ambient ring on the loading state showed
// hardcoded sample products instead of products from THIS user's quiz.
//
// After: `submit()` resolves → we stay in the quiz loading state and
// subscribe to the live carouselSession. The ambient ring shows curated
// per-occasion sample products from the existing `SAMPLE_*_SECTIONS`
// pools (e.g. Mother's Day quiz → Mother's Day curated guide products),
// so users see thumbnails relevant to THEIR quiz instead of an unrelated
// hardcoded sample set (bug #57). As real products from the carousel
// session arrive, they replace the curated samples in the queue. Once
// the first carousel's first 3 images are decoded into the browser
// cache, navigate. Results page paints instantly because images are
// already cached (bug #50).
//
// Why curated per-occasion samples instead of a global hardcoded set:
// the global SAMPLE_AMBIENT_IMAGES is occasion-agnostic — a Mother's Day
// fitness/books quiz would show birthday-cake thumbnails. Kate's
// requirement (2026-04-28): items shown should at least be products the
// algo would consider for the user's occasion, even if they're not the
// final scored recommendations.
//
// Safety net: top-level 30s timeout fires regardless of state. If the BE
// is unresponsive entirely we navigate anyway — results page handles
// whatever state the session lands in.
//
// Deep-link / refresh case (user lands at /quiz/results/... without going
// through the quiz) is handled on the results page (out of scope here).

const MAX_WAIT_MS = 30000;

interface PendingNavigation {
  recipientId: string;
  recommendationId: string;
  carouselSessionId: string;
  occasion?: import('../schemas').TheaWebOccasionEnum;
}

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, submit } = useSubmitGiftFlow();
  const { requestSignIn } = useAuthGate();
  const leaveWarning = useLeaveWarning('/');

  // Browser back-button (bug #12): pop the same warning. If the user
  // confirms "Leave," `confirmLeave` calls `navigate('/')` and the hook's
  // unmount cleanup pops the sentinel if it's still on top of the stack.
  useBackButtonGuard(true, leaveWarning.requestLeave);

  // Set after `submit()` resolves; cleared only by unmount or by the
  // navigation-ready effect (which navigates and unmounts this page).
  const [pendingNav, setPendingNav] = useState<PendingNavigation | null>(null);

  // Live carousel session — subscribed only once we have a sessionId.
  // Passes `undefined` until then; `useCarouselSession` handles that gracefully.
  const { session } = useCarouselSession(pendingNav?.carouselSessionId);

  // Live ambient images. Three states:
  //   1. Pre-submit (`pendingNav === null`): show the global sample set
  //      (only matters in storybook — the quiz steps don't render the
  //      ring on the actual page).
  //   2. Post-submit, no real products from the carousel session yet:
  //      show the curated sample-carousel set for THIS user's occasion
  //      (e.g. SAMPLE_MOTHERS_DAY_SECTIONS for MOTHERS_DAY). Visually
  //      relevant to the quiz; better than birthday-cake placeholders
  //      regardless of what was searched (bug #57). Falls back to the
  //      global sample set when the occasion has no curated guide
  //      (JUST_BECAUSE / CHRISTMAS / OTHER / etc.).
  //   3. Real products from the carousel session arrived: show them.
  const liveImages = useMemo<ProductImage[]>(() => {
    const fromSession = liveImagesFromSession(session);
    if (fromSession.length > 0) return fromSession;
    if (pendingNav?.occasion) {
      const occasionImages = occasionSampleImages(pendingNav.occasion);
      if (occasionImages.length > 0) return occasionImages;
    }
    return SAMPLE_AMBIENT_IMAGES;
  }, [session, pendingNav]);

  // Preload gate: first 3 images of the first carousel.
  //
  // Critical: ONLY sample the URLs once `session.status === 'COMPLETED'`.
  // The carousel agent runs in two phases — search/streaming, then
  // curation. During streaming it `.extend()`s products into the session
  // as it discovers them; during curation it REPLACES the products list
  // with the final curated picks (carousel_agent.py:443). If we sample
  // mid-stream, the FE preloads images for products that get replaced
  // moments later — when the user lands on the results page, they see a
  // flash of the streaming set, then the page "refreshes" to the curated
  // set. Gating on COMPLETED ensures the URLs we preload are the same
  // products the user will actually see.
  const firstThreeUrls = useMemo(
    () => (session?.status === 'COMPLETED' ? firstCarouselImageUrls(session, 3) : []),
    [session],
  );
  const imagesReady = useImagesPreloaded(firstThreeUrls, {
    firstN: 3,
    timeoutMs: MAX_WAIT_MS,
  });

  // Top-level safety net: if the BE never delivers products + images at
  // all, navigate after MAX_WAIT_MS so we don't strand the user on the
  // loading screen forever. The useImagesPreloaded timeout only fires
  // when there ARE urls to wait for — this catches the "no urls ever"
  // case.
  const [maxWaitFired, setMaxWaitFired] = useState(false);
  useEffect(() => {
    if (!pendingNav || maxWaitFired) return;
    const t = setTimeout(() => setMaxWaitFired(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [pendingNav, maxWaitFired]);

  // Fire the deferred navigation once everything is ready. Guarded by
  // `pendingNav` so the gate only fires after a successful submit.
  useEffect(() => {
    if (!pendingNav) return;
    if (!imagesReady && !maxWaitFired) return;
    navigate(`/quiz/results/${pendingNav.recipientId}/${pendingNav.recommendationId}`);
  }, [pendingNav, imagesReady, maxWaitFired, navigate]);

  const handleSubmit = useCallback(
    async (answers: QuizAnswers) => {
      try {
        // Read the occasion straight off the answers (display string like
        // "Mother's Day") and convert to enum locally. We deliberately do
        // NOT route through `quizAnswersToRequest` — that adapter hardcodes
        // `JUST_BECAUSE` for the BE call regardless of what the user picked
        // (separate bug). For the ambient-ring path here we want the actual
        // user-selected occasion so the curated samples line up.
        const occasion = quizDisplayOccasionToEnum(answers.occasion);
        const result = await submit(answers);
        setPendingNav({
          recipientId: result.recipientId,
          recommendationId: result.recommendationId,
          carouselSessionId: result.carouselSessionId,
          occasion,
        });
        // Navigation is deferred until `imagesReady` flips true (or 30s
        // timeout). Until then, `QuizCardAnimated` keeps showing
        // `<QuizLoadingAnimated>` because `flow.step === 'loading'` is
        // sticky after submit.
      } catch {
        // Error surfaced via `state.status === 'error'` below.
      }
    },
    [submit],
  );

  const handleSignInClick = useCallback(
    () => requestSignIn({ mode: 'signin' }),
    [requestSignIn],
  );

  return (
    <>
      <SiteHeader onSignInClick={handleSignInClick} onLogoClick={leaveWarning.requestLeave} />
      {state.status === 'error' && (
        <Alert variant="danger" className="mt-3">
          We couldn't submit your answers: {state.error.message}
        </Alert>
      )}
      <QuizCardAnimated onSubmit={handleSubmit} loadingImages={liveImages} />
      <AlertDialog
        open={leaveWarning.open}
        onClose={leaveWarning.cancelLeave}
        title="Leave the quiz?"
        description="If you leave now, your answers won't be saved."
        primaryAction={{ label: 'Leave', onClick: leaveWarning.confirmLeave, variant: 'primary' }}
        secondaryAction={{ label: 'Stay', onClick: leaveWarning.cancelLeave, variant: 'ghost' }}
      />
    </>
  );
};

export default QuizPage;
