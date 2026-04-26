import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import { QuizCardAnimated } from '../../components/landing/quiz/QuizCardAnimated';
import { useSubmitGiftFlow } from '../hooks/useSubmitGiftFlow';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';

// Route container. Owns auth + the BE round-trip; the underlying
// `QuizCardAnimated` stays presentational so its stories work unchanged.
const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, submit } = useSubmitGiftFlow();

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

  return (
    <>
      {state.status === 'error' && (
        <Alert variant="danger" className="mt-3">
          We couldn't submit your answers: {state.error.message}
        </Alert>
      )}
      <QuizCardAnimated onSubmit={handleSubmit} />
    </>
  );
};

export default QuizPage;
