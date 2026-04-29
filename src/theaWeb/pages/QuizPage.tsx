import React, { useCallback, useState } from 'react';
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

const QuizPage: React.FC = () => {
  const { state, submit } = useSubmitGiftFlow();
  const { requestSignIn } = useAuthGate();
  const leaveWarning = useLeaveWarning('/');

  // Browser back-button (bug #12): pop the same warning. If the user
  // confirms "Leave," `confirmLeave` calls `navigate('/')` and the hook's
  // unmount cleanup pops the sentinel if it's still on top of the stack.
  useBackButtonGuard(true, leaveWarning.requestLeave);

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
        primaryAction={{ label: 'Leave', onClick: leaveWarning.confirmLeave, variant: 'primary' }}
        secondaryAction={{ label: 'Stay', onClick: leaveWarning.cancelLeave, variant: 'ghost' }}
      />
    </>
  );
};

export default QuizPage;
