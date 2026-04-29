import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import { QuizCardAnimated } from '../../components/landing/quiz/QuizCardAnimated';
import { SiteHeader } from '../../components/landing/SiteHeader';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { useSubmitGiftFlow } from '../hooks/useSubmitGiftFlow';
import { useLeaveWarning } from '../hooks/useLeaveWarning';
import { useBackButtonGuard } from '../hooks/useBackButtonGuard';
import {
  useDeferredNavToResults,
  type PendingNavigation,
} from '../hooks/useDeferredNavToResults';
import { useAuthGate } from '../auth/AuthGateContext';
import { gaQuizStart, type QuizEntryPoint } from '../lib/gaPixel';
import { quizDisplayOccasionToEnum } from '../lib/loadingAmbientImages';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';

// Bug #50 + #57 — continuous loading state.
//
// `submit()` resolves → we stay in the quiz loading state and subscribe
// to the live carouselSession. The ambient ring shows curated per-occasion
// sample products while the session is still empty, then real products as
// they arrive. Once the first carousel's first 3 images are decoded into
// the browser cache, navigate. Results page paints instantly because the
// images are already cached.
//
// Gate logic, image preload, and safety-net timeout live in
// `useDeferredNavToResults` so all pre-results entry points (this page +
// the homepage SearchPill, post bug #74) share the same gate. See the
// hook for the full why.

interface QuizLocationState {
  /** Path to return to when the user confirms "Leave" on the warning modal.
   *  Set by entrypoints (homepage hero CTA, occasion guide sticky/banner CTAs)
   *  via `navigate('/quiz', { state: { from: location.pathname } })`. Falls
   *  back to '/' for direct/bookmarked visits where no entrypoint passed it. */
  from?: string;
  /** Surface that initiated quiz entry — drives the `quiz_start` event's
   *  entry_point param. Set by the same entrypoints that set `from`. */
  entry_point?: QuizEntryPoint;
}

/**
 * Derive an entry_point when the caller didn't pass one explicitly. Mostly a
 * fallback for any direct-URL hits to /quiz; all in-app entry points should
 * set state.entry_point at the navigate() call site.
 */
function deriveEntryPoint(state: QuizLocationState | null): QuizEntryPoint {
  if (state?.entry_point) return state.entry_point;
  if (!state?.from) return 'direct';
  if (state.from.startsWith('/occasion/')) return 'sticky_occasion';
  if (state.from === '/') return 'homepage_hero';
  return 'direct';
}

const QuizPage: React.FC = () => {
  const location = useLocation();
  const { state, submit } = useSubmitGiftFlow();
  const { requestSignIn } = useAuthGate();
  const locationState = location.state as QuizLocationState | null;
  const cameFromInApp = Boolean(locationState?.from);
  const leaveDestination = locationState?.from ?? '/';
  const entryPoint = deriveEntryPoint(locationState);

  // Fire quiz_start exactly once on mount. Re-renders + StrictMode's
  // mount → unmount → mount in dev shouldn't double-fire.
  const quizStartFiredRef = useRef(false);
  useEffect(() => {
    if (quizStartFiredRef.current) return;
    quizStartFiredRef.current = true;
    // Occasion is unknown at this point (the user hasn't picked it yet); the
    // /quiz route mount is just "user entered the funnel."
    gaQuizStart({ entry_point: entryPoint });
  }, [entryPoint]);

  // useLeaveWarning's destination is the FALLBACK only — it's used when the
  // user came from outside the app (no `from` state) and we can't pop the
  // history stack. The hook's modal state machine (open/cancel/isSignedIn) is
  // still used; its `confirmLeave` is bypassed by the back-button-guard
  // release path below for in-app entries.
  const leaveWarning = useLeaveWarning(leaveDestination);

  const { release } = useBackButtonGuard(true, leaveWarning.requestLeave);
  // Destructure stable refs (the hook returns a fresh object literal each
  // render; the inner functions are useCallback'd and stable). This keeps
  // `handleConfirmLeave` properly memoized.
  const { cancelLeave: leaveWarningCancel, confirmLeave: leaveWarningConfirm } = leaveWarning;

  /* Confirmed-leave handler.
   *
   * If the user came from inside the app (entry-point set `state.from`), we
   * pop the history stack via `release(1)` — that pops the sentinel + the
   * /quiz entry, landing on the entry-point with the browser's native
   * scroll restoration (which only fires on popstate-driven nav, not on
   * `navigate(to)` pushes).
   *
   * If the user landed on /quiz directly (typed URL, bookmark, external
   * link), there's no in-app entry to pop back to — fall back to
   * `leaveWarning.confirmLeave()` which navigates to '/'. We don't blindly
   * pop because the previous browser entry could be a different site.
   */
  const handleConfirmLeave = useCallback(() => {
    if (cameFromInApp) {
      leaveWarningCancel();
      release(1);
    } else {
      leaveWarningConfirm();
    }
  }, [cameFromInApp, release, leaveWarningCancel, leaveWarningConfirm]);

  // Set after `submit()` resolves; cleared only by unmount or by the
  // navigation-ready effect inside the hook (which navigates and unmounts
  // this page).
  const [pendingNav, setPendingNav] = useState<PendingNavigation | null>(null);

  const { liveImages } = useDeferredNavToResults(pendingNav);

  const handleSubmit = useCallback(
    async (answers: QuizAnswers) => {
      try {
        // Mark T0 for time-to-first-result (spec §14). Cleared first so
        // prior submissions can't bleed into the next computation.
        try {
          if (typeof performance !== 'undefined') {
            performance.clearMarks('thea-submit-click');
            performance.clearMarks('thea-submit-callable-resolve');
            performance.mark('thea-submit-click');
          }
        } catch {
          /* ignore */
        }
        // Convert the user's occasion pick to its wire enum for the
        // ambient-ring sample lookup. `quizAnswersToRequest` runs the same
        // conversion for the actual BE call inside `submit()`.
        const occasion = quizDisplayOccasionToEnum(answers.occasion);
        // Thread entry_point through to quiz_search_submitted so the funnel
        // start (quiz_start) and completion (quiz_search_submitted) carry
        // the same surface attribution.
        const result = await submit(answers, { entry_point: entryPoint });
        setPendingNav({
          recipientId: result.recipientId,
          recommendationId: result.recommendationId,
          carouselSessionId: result.carouselSessionId,
          occasion,
        });
        // Navigation is deferred by `useDeferredNavToResults`. Until then,
        // `QuizCardAnimated` keeps showing `<QuizLoadingAnimated>` because
        // `flow.step === 'loading'` is sticky after submit.
      } catch {
        // Error surfaced via `state.status === 'error'` below.
      }
    },
    [submit, entryPoint],
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
        primaryAction={{ label: 'Leave', onClick: handleConfirmLeave, variant: 'primary' }}
        secondaryAction={{ label: 'Stay', onClick: leaveWarning.cancelLeave, variant: 'ghost' }}
      />
    </>
  );
};

export default QuizPage;
