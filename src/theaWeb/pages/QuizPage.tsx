import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import { QuizCardAnimated } from '../../components/landing/quiz/QuizCardAnimated';
import { SiteHeader } from '../../components/landing/SiteHeader';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { SAMPLE_AMBIENT_IMAGES } from '../../components/landing/quiz/sampleAmbientImages';
import { useSubmitGiftFlow } from '../hooks/useSubmitGiftFlow';
import { useLeaveWarning } from '../hooks/useLeaveWarning';
import { useBackButtonGuard } from '../hooks/useBackButtonGuard';
import { useAuthGate } from '../auth/AuthGateContext';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';

// Route container. Owns auth + the BE round-trip; the underlying
// `QuizCardAnimated` stays presentational so its stories work unchanged.
//
// Header: the shared `SiteHeader` mounts at the top so the wordmark + sign-in
// pill match the homepage / occasion pages (bug #40). The wordmark click
// is intercepted to pop the leave-warning instead of navigating directly.
//
// Leave-warning (bugs #7 + #12): mid-quiz nav-aways are gated by an
// AlertDialog so users don't accidentally lose their answers. The same
// `useLeaveWarning` instance powers both the wordmark click and the browser
// back-button.
//
// Loading state: `QuizCardAnimated` already swaps to `<QuizLoadingAnimated>`
// when the user clicks "Show me my gifts". We feed the ambient ring with a
// fixed sample set for now; switching to live "products the algo is currently
// scoring" is tracked as a follow-up.
const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, submit } = useSubmitGiftFlow();
  const { requestSignIn } = useAuthGate();
  const leaveWarning = useLeaveWarning('/');

  // Browser back-button (bug #12): pop the same warning. If the user
  // confirms "Leave," `confirmLeave` calls `navigate('/')` and the hook's
  // unmount cleanup pops the sentinel if it's still on top of the stack.
  useBackButtonGuard(true, leaveWarning.requestLeave);

  const handleSubmit = useCallback(
    async (answers: QuizAnswers) => {
      try {
        const { recipientId, recommendationId } = await submit(answers);
        navigate(`/quiz/results/${recipientId}/${recommendationId}`);
      } catch {
        // Error surfaced via `state.status === 'error'` below.
      }
    },
    [submit, navigate],
  );

  const handleSignInClick = useCallback(
    () => requestSignIn({ mode: 'signin' }),
    [requestSignIn],
  );

  // Intercept the wordmark click — without preventDefault the <a href="/">
  // would still navigate even after the modal opens. The modal then drives
  // the actual navigation through `confirmLeave`.
  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      leaveWarning.requestLeave();
    },
    [leaveWarning],
  );

  return (
    <>
      <SiteHeader onSignInClick={handleSignInClick} onLogoClick={handleLogoClick} />
      {state.status === 'error' && (
        <Alert variant="danger" className="mt-3">
          We couldn't submit your answers: {state.error.message}
        </Alert>
      )}
      <QuizCardAnimated onSubmit={handleSubmit} loadingImages={SAMPLE_AMBIENT_IMAGES} />
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
