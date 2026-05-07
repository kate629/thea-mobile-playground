// PLAYGROUND STUB — resolves to mock IDs after a tiny delay. Real version
// at upstream:src/theaWeb/hooks/useRegenerate.ts. Never port this back.

import { useCallback, useState } from 'react';
import type {
  Recommendation,
  TheaWebSubmitGiftFlowRequest,
  TheaWebSubmitGiftFlowResponse,
} from '../schemas';
import {
  MOCK_CAROUSEL_SESSION_ID,
  MOCK_RECIPIENT_ID,
  MOCK_RECOMMENDATION_ID,
} from '../../playground/mockData/playgroundConfig';

export type RegenerateState =
  | { status: 'idle' }
  | { status: 'regenerating' }
  | { status: 'ready'; result: TheaWebSubmitGiftFlowResponse }
  | { status: 'error'; error: Error };

export interface PreferenceSignals {
  likedProductTitles: string[];
  dismissedProductTitles: string[];
  excludedProductIds: string[];
}

interface UseRegenerate {
  state: RegenerateState;
  regenerate: (args: {
    recipientId: string;
    recommendation: Recommendation;
    requestOverride?: TheaWebSubmitGiftFlowRequest;
    preferenceSignals?: PreferenceSignals;
  }) => Promise<TheaWebSubmitGiftFlowResponse>;
  reset: () => void;
}

export function useRegenerate(): UseRegenerate {
  const [state, setState] = useState<RegenerateState>({ status: 'idle' });

  const regenerate = useCallback(async () => {
    setState({ status: 'regenerating' });
    await new Promise((r) => setTimeout(r, 250));
    const result: TheaWebSubmitGiftFlowResponse = {
      recipientId: MOCK_RECIPIENT_ID,
      recommendationId: MOCK_RECOMMENDATION_ID,
      carouselSessionId: MOCK_CAROUSEL_SESSION_ID,
      status: 'PROCESSING',
    };
    setState({ status: 'ready', result });
    return result;
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, regenerate, reset };
}
