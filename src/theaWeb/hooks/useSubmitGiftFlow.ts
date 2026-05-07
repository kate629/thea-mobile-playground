// PLAYGROUND STUB — resolves to mock IDs after a tiny delay. Real version
// at upstream:src/theaWeb/hooks/useSubmitGiftFlow.ts. Never port this back.

import { useCallback, useState } from 'react';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';
import type { QuizEntryPoint } from '../lib/gaPixel';
import type { TheaWebSubmitGiftFlowResponse } from '../schemas';
import {
  MOCK_CAROUSEL_SESSION_ID,
  MOCK_RECIPIENT_ID,
  MOCK_RECOMMENDATION_ID,
} from '../../playground/mockData/playgroundConfig';

export type SubmitGiftFlowState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'ready'; result: TheaWebSubmitGiftFlowResponse }
  | { status: 'error'; error: Error };

export interface SubmitOptions {
  entry_point?: QuizEntryPoint;
}

interface UseSubmitGiftFlow {
  state: SubmitGiftFlowState;
  submit: (
    answers: QuizAnswers,
    options?: SubmitOptions,
  ) => Promise<TheaWebSubmitGiftFlowResponse>;
  reset: () => void;
}

export function useSubmitGiftFlow(): UseSubmitGiftFlow {
  const [state, setState] = useState<SubmitGiftFlowState>({ status: 'idle' });

  const submit = useCallback(
    async (_answers: QuizAnswers, _options?: SubmitOptions) => {
      setState({ status: 'submitting' });
      await new Promise((r) => setTimeout(r, 250));
      const result: TheaWebSubmitGiftFlowResponse = {
        recipientId: MOCK_RECIPIENT_ID,
        recommendationId: MOCK_RECOMMENDATION_ID,
        carouselSessionId: MOCK_CAROUSEL_SESSION_ID,
        status: 'PROCESSING',
      };
      setState({ status: 'ready', result });
      return result;
    },
    [],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, submit, reset };
}
