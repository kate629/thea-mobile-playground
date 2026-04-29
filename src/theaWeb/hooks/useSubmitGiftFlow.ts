import { useCallback, useRef, useState } from 'react';
import { useAuth, useEnsureAuth } from '../firebase/FirebaseContext';
import { getCarouselFeed, getFastCarouselFeed } from '../../firebaseFunctions';
import { submitGiftFlow } from '../callables';
import { gaQuizSearchSubmitted, gaQuizStart, type QuizEntryPoint } from '../lib/gaPixel';
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

export interface SubmitOptions {
  /**
   * Where the user originated this submission. Passed through to GA4 as
   * `entry_point` on both `quiz_start` (when applicable) and
   * `quiz_search_submitted` so the dashboard can split funnel completion
   * rates per surface (homepage hero / sticky / search-pill / banner).
   *
   * SearchPill on the signed-in homepage bypasses /quiz entirely, so the
   * caller is responsible for firing `quiz_start` here. /quiz route entries
   * fire `quiz_start` on QuizPage mount and pass the same value through.
   */
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
  const auth = useAuth();
  const [state, setState] = useState<SubmitGiftFlowState>({ status: 'idle' });
  // Guards against callers double-firing during the in-flight window.
  const inFlightRef = useRef(false);

  const submit = useCallback(
    async (answers: QuizAnswers, options?: SubmitOptions) => {
      if (inFlightRef.current) {
        throw new Error('Submission already in flight');
      }
      inFlightRef.current = true;
      setState({ status: 'submitting' });
      try {
        await ensureAuth();
        const payload = quizAnswersToRequest(answers);
        const { data } = await submitGiftFlow(payload);
        // Mark the moment the BE submit callable resolves. Paired with the
        // `thea-submit-click` mark (placed by App.js / QuizPage at the
        // start of the submission), this lets the results page compute
        // `submit_callable_ms` for the time-to-first-result event (§14).
        // Wrapped in try/catch — performance.mark is technically optional
        // and analytics must never fail submit.
        try {
          if (typeof performance !== 'undefined') {
            performance.clearMarks('thea-submit-callable-resolve');
            performance.mark('thea-submit-callable-resolve');
          }
        } catch {
          // ignore
        }
        kickOffPipeline(payload, data.carouselSessionId);

        // Anon users are submitting their first set; signed-in users are
        // adding a NEW recipient under their UID. Read auth state AFTER
        // ensureAuth so the value reflects the user we just authenticated.
        const isAnon = auth.currentUser?.isAnonymous !== false;
        const flowType = isAnon ? 'first_time' : 'new_recipient';

        // SearchPill on the signed-in homepage bypasses /quiz, so QuizPage
        // never mounts to fire quiz_start. Fire it here in that case so
        // the funnel still has a `quiz_start → quiz_search_submitted` pair.
        if (options?.entry_point === 'search_pill') {
          gaQuizStart({ entry_point: 'search_pill', occasion: payload.input.occasion });
        }

        // Fire Meta + GA4 pixels after the callable resolves successfully.
        // GA4 carries the full v6 param shape; Meta keeps a slimmer
        // anonymized funnel set.
        const metaParams = {
          occasion: payload.input.occasion,
          relationship: payload.recipient.relationship,
          age_range: ageBucket(payload.recipient.age ?? undefined),
          interest_count: payload.input.interests?.length ?? 0,
          gender: payload.recipient.gender,
          has_freeform: Boolean(payload.input.freeform?.trim()),
        };
        metaQuizSearchSubmitted(metaParams);
        gaQuizSearchSubmitted({
          ...metaParams,
          carousel_session_id: data.carouselSessionId,
          flow_type: flowType,
          entry_point: options?.entry_point,
        });
        setState({ status: 'ready', result: data });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ status: 'error', error });
        throw error;
      } finally {
        inFlightRef.current = false;
      }
    },
    [ensureAuth, auth],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, submit, reset };
}
