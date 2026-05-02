import { useCallback, useRef, useState } from 'react';
import { useEnsureAuth } from '../firebase/FirebaseContext';
import { getCarouselFeed, getFastCarouselFeed } from '../../firebaseFunctions';
import { submitGiftFlow } from '../callables';
import { relationshipToAgentValue } from '../lib/relationshipToAgentValue';
import type {
  Recommendation,
  TheaWebSubmitGiftFlowRequest,
  TheaWebSubmitGiftFlowResponse,
} from '../schemas';

export type RegenerateState =
  | { status: 'idle' }
  | { status: 'regenerating' }
  | { status: 'ready'; result: TheaWebSubmitGiftFlowResponse }
  | { status: 'error'; error: Error };

// Generic preference primitives the carousel callable consumes. Sourced from
// the recipient's prior `giftActivity` on the FE; the BE never sees the
// underlying recipient/uid scoping — it only sees these resolved fields.
export interface PreferenceSignals {
  likedProductTitles: string[];
  dismissedProductTitles: string[];
  excludedProductIds: string[];
}

interface UseRegenerate {
  state: RegenerateState;
  // Re-fires submitGiftFlow with the same recipient + quiz input snapshot the
  // existing recommendation was generated from. Returns the new
  // {recipientId, recommendationId} so the caller can navigate after the
  // page-level "refreshing" affordance has run.
  //
  // Pass `requestOverride` to re-run with an edited payload (e.g. user
  // changed gender/age/interests/freeform/relationship/occasion/vibes in the
  // profile drawer — bug #51). When set, the override fully replaces the
  // snapshot replay; build it via `profileDraftToRegenerateRequest`.
  regenerate: (args: {
    recipientId: string;
    recommendation: Recommendation;
    requestOverride?: TheaWebSubmitGiftFlowRequest;
    // Optional. When supplied, threads the recipient's prior likes/dismisses
    // into the carousel callable so follow-up runs can adapt to user signal.
    preferenceSignals?: PreferenceSignals;
  }) => Promise<TheaWebSubmitGiftFlowResponse>;
  reset: () => void;
}

// Mirrors the kick-off helper inside useSubmitGiftFlow — the pipeline writes
// progressive output to carouselSessions/{sessionId} and the results page
// subscribes there. We don't await it here for the same reason: blocking on
// the full agent run (~10-30s) would defeat the smooth-refresh UX.
function kickOffPipeline(
  payload: TheaWebSubmitGiftFlowRequest,
  carouselSessionId: string,
  preferenceSignals?: PreferenceSignals,
) {
  const callable = payload.mode === 'FAST' ? getFastCarouselFeed : getCarouselFeed;
  const args: Record<string, unknown> = {
    selected_chips: payload.input.interests,
    recipient_gender: payload.recipient.gender ?? '',
    recipient_age: payload.recipient.age ?? 0,
    recipient_relationship: relationshipToAgentValue(payload.recipient.relationship),
    freeform_text: payload.input.freeform,
    session_id: carouselSessionId,
    // See useSubmitGiftFlow for context — occasion drives event_context
    // on the BE side so the agent can score + filter by it.
    occasion: payload.input.occasion,
  };
  if (preferenceSignals) {
    if (preferenceSignals.likedProductTitles.length > 0) {
      args.liked_product_titles = preferenceSignals.likedProductTitles;
    }
    if (preferenceSignals.dismissedProductTitles.length > 0) {
      args.dismissed_product_titles = preferenceSignals.dismissedProductTitles;
    }
    if (preferenceSignals.excludedProductIds.length > 0) {
      args.excluded_product_ids = preferenceSignals.excludedProductIds;
    }
  }
  callable(args).catch((err) => {
    console.error('Carousel pipeline kick-off (regenerate) failed:', err);
  });
}

// Builds a TheaWebSubmitGiftFlowRequest by replaying the snapshot baked into
// the previous recommendation. The BE's submitGiftFlow handler treats a
// payload that includes recipientId as an "update + new recommendation"
// (flips the prior isActive=false, mints a new ULID for the next rec).
function buildRegenerateRequest(
  recipientId: string,
  recommendation: Recommendation,
): TheaWebSubmitGiftFlowRequest {
  const snap = recommendation.recipientSnapshot;
  const input = recommendation.input;
  return {
    recipient: {
      recipientId,
      name: snap.name,
      emoji: snap.emoji,
      relationship: snap.relationship,
      gender: snap.gender,
      age: snap.age,
      isMe: snap.isMe,
    },
    input: {
      occasion: input.occasion,
      occasionLabel: input.occasionLabel,
      interests: input.interests,
      freeform: input.freeform,
    },
    mode: recommendation.mode,
  };
}

// Owns the regenerate round-trip from "user clicked Refresh" → new
// recipient/recommendation IDs in hand. Caller uses the returned ids to
// navigate to the new results URL once it's ready to make the visual swap.
export function useRegenerate(): UseRegenerate {
  const ensureAuth = useEnsureAuth();
  const [state, setState] = useState<RegenerateState>({ status: 'idle' });
  // Guards against double-fire — Refresh button can re-render with the same
  // handler attached, and a second click during in-flight should no-op rather
  // than mint a third recommendation.
  const inFlightRef = useRef(false);

  const regenerate = useCallback(
    async (args: {
      recipientId: string;
      recommendation: Recommendation;
      requestOverride?: TheaWebSubmitGiftFlowRequest;
      preferenceSignals?: PreferenceSignals;
    }) => {
      if (inFlightRef.current) {
        throw new Error('Regenerate already in flight');
      }
      inFlightRef.current = true;
      setState({ status: 'regenerating' });
      try {
        await ensureAuth();
        const payload =
          args.requestOverride ?? buildRegenerateRequest(args.recipientId, args.recommendation);
        const { data } = await submitGiftFlow(payload);
        kickOffPipeline(payload, data.carouselSessionId, args.preferenceSignals);
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
    [ensureAuth],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, regenerate, reset };
}
