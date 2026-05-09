// PLAYGROUND STUB — calls the playground submitGiftFlow callable so a
// fresh recipient is registered with each submission. Real version at
// upstream:src/theaWeb/hooks/useSubmitGiftFlow.ts. Never port this back.

import { useCallback, useState } from 'react';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';
import type { QuizEntryPoint } from '../lib/gaPixel';
import type {
  TheaWebGenderEnum,
  TheaWebOccasionEnum,
  TheaWebRelationshipEnum,
  TheaWebRecommendationModeEnum,
  TheaWebSubmitGiftFlowRequest,
  TheaWebSubmitGiftFlowResponse,
} from '../schemas';
import { submitGiftFlow } from '../callables';

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

// Best-effort coercion of free-form quiz strings into the wire enums
// the BE expects. The playground doesn't strictly validate these.
function quizToRequest(answers: QuizAnswers): TheaWebSubmitGiftFlowRequest {
  return {
    recipient: {
      name: answers.relationship,
      relationship: answers.relationship.toUpperCase() as TheaWebRelationshipEnum,
      gender: answers.gender as TheaWebGenderEnum,
      age: answers.age,
    },
    input: {
      occasion: (answers.occasion || 'JUST_BECAUSE') as TheaWebOccasionEnum,
      interests: answers.interests,
      freeform: answers.moreAbout ?? '',
    },
    mode: 'THOUGHTFUL' as TheaWebRecommendationModeEnum,
  };
}

export function useSubmitGiftFlow(): UseSubmitGiftFlow {
  const [state, setState] = useState<SubmitGiftFlowState>({ status: 'idle' });

  const submit = useCallback(
    async (answers: QuizAnswers, _options?: SubmitOptions) => {
      setState({ status: 'submitting' });
      const { data: result } = await submitGiftFlow(quizToRequest(answers));
      setState({ status: 'ready', result });
      return result;
    },
    [],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, submit, reset };
}
