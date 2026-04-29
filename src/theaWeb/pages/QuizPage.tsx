import React, { useCallback, useState } from 'react';
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
}

const QuizPage: React.FC = () => {
  const location = useLocation();
  const { state, submit } = useSubmitGiftFlow();
  const { requestSignIn } = useAuthGate();
  const cameFromInApp = Boolean((location.state as QuizLocationState | null)?.from);
  const leaveDestination = (location.state as QuizLocationState | null)?.from ?? '/';

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
        // Convert the user's occasion pick to its wire enum for the
        // ambient-ring sample lookup. `quizAnswersToRequest` runs the same
        // conversion for the actual BE call inside `submit()`.
        const occasion = quizDisplayOccasionToEnum(answers.occasion);
        const result = await submit(answers);
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
        primaryAction={{ label: 'Leave', onClick: handleConfirmLeave, variant: 'primary' }}
        secondaryAction={{ label: 'Stay', onClick: leaveWarning.cancelLeave, variant: 'ghost' }}
      />
    </>
  );
};

export default QuizPage;
