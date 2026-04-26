import { useCallback, useRef, useState } from 'react';
import { ensureAuth } from '../../firebaseConfig';
import { submitGiftFlow } from '../callables';
import { quizAnswersToRequest } from '../lib/quizAnswersToRequest';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';
import type { TheaWebSubmitGiftFlowResponse } from '../schemas';

export type SubmitGiftFlowState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'ready'; result: TheaWebSubmitGiftFlowResponse }
  | { status: 'error'; error: Error };

interface UseSubmitGiftFlow {
  state: SubmitGiftFlowState;
  submit: (answers: QuizAnswers) => Promise<TheaWebSubmitGiftFlowResponse>;
  reset: () => void;
}

// Owns the round-trip from quiz submission to receipt of recipient/recommendation IDs.
// Does NOT subscribe to the recommendation doc — the results page owns that.
export function useSubmitGiftFlow(): UseSubmitGiftFlow {
  const [state, setState] = useState<SubmitGiftFlowState>({ status: 'idle' });
  // Guards against callers double-firing during the in-flight window.
  const inFlightRef = useRef(false);

  const submit = useCallback(async (answers: QuizAnswers) => {
    if (inFlightRef.current) {
      throw new Error('Submission already in flight');
    }
    inFlightRef.current = true;
    setState({ status: 'submitting' });
    try {
      await ensureAuth();
      const payload = quizAnswersToRequest(answers);
      const { data } = await submitGiftFlow(payload);
      setState({ status: 'ready', result: data });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ status: 'error', error });
      throw error;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, submit, reset };
}
