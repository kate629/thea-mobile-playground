import { useCallback, useRef, useState } from 'react';
import { useEnsureAuth } from '../firebase/FirebaseContext';
import { getCarouselFeed, getFastCarouselFeed } from '../../firebaseFunctions';
import { submitGiftFlow } from '../callables';
import { gaQuizSearchSubmitted } from '../lib/gaPixel';
import { ageBucket, metaQuizSearchSubmitted } from '../lib/metaPixel';
import { quizAnswersToRequest } from '../lib/quizAnswersToRequest';
import { relationshipToAgentValue } from '../lib/relationshipToAgentValue';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';
import type { TheaWebSubmitGiftFlowRequest, TheaWebSubmitGiftFlowResponse } from '../schemas';

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

// Fires getCarouselFeed/getFastCarouselFeed but doesn't await — the agent
// streams progressive writes to carouselSessions/{sessionId}, and the results
// page subscribes to that doc directly. Awaiting here would block submit()
// for the full pipeline duration (~10-30s).
function kickOffPipeline(
  payload: TheaWebSubmitGiftFlowRequest,
  carouselSessionId: string,
) {
  const callable = payload.mode === 'FAST' ? getFastCarouselFeed : getCarouselFeed;
  const args = {
    selected_chips: payload.input.interests,
    recipient_gender: payload.recipient.gender ?? '',
    recipient_age: payload.recipient.age ?? 0,
    recipient_relationship: relationshipToAgentValue(payload.recipient.relationship),
    freeform_text: payload.input.freeform,
    session_id: carouselSessionId,
    // Send the user's selected occasion to the carousel pipeline so the
    // agent can factor it into scoring + Typesense filtering. The BE
    // ignores it when it's JUST_BECAUSE / OTHER (no occasion-specific
    // tagging applies). See get_carousel_feed.py event_context handling.
    occasion: payload.input.occasion,
  };
  callable(args).catch((err) => {
    // Failure here doesn't block the user — the results page surfaces the
    // pipeline state from carouselSessions. Log so we can correlate later.
    console.error('Carousel pipeline kick-off failed:', err);
  });
}

// Owns the round-trip from quiz submission to receipt of recipient/recommendation IDs,
// then fires the carousel pipeline in the background. Does NOT subscribe to the
// recommendation doc or carousel session — the results page owns both.
export function useSubmitGiftFlow(): UseSubmitGiftFlow {
  const ensureAuth = useEnsureAuth();
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
      kickOffPipeline(payload, data.carouselSessionId);
      // Fire Meta + GA4 pixels after the callable resolves successfully —
      // anonymized funnel params only (no name / uid / recipientId).
      const funnelParams = {
        occasion: payload.input.occasion,
        relationship: payload.recipient.relationship,
        age_bucket: ageBucket(payload.recipient.age ?? undefined),
        interest_count: payload.input.interests?.length ?? 0,
      };
      metaQuizSearchSubmitted(funnelParams);
      gaQuizSearchSubmitted(funnelParams);
      setState({ status: 'ready', result: data });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ status: 'error', error });
      throw error;
    } finally {
      inFlightRef.current = false;
    }
  }, [ensureAuth]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, submit, reset };
}
