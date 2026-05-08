// PLAYGROUND STUB — returns the fixture Recommendation. Real version at
// upstream:src/theaWeb/hooks/useRecommendationDoc.ts. Never port this back.

import { useEffect, useMemo, useState } from 'react';
import { buildMockRecommendation } from '../../playground/mockData/recommendation';
import { subscribeRecipients } from '../../playground/mockData/recipientRegistry';
import type { Recommendation } from '../schemas';

interface UseRecommendationDocResult {
  doc: Recommendation | null;
  loading: boolean;
  error: Error | null;
}

export function useRecommendationDoc(
  recipientId: string | undefined,
  recommendationId: string | undefined,
): UseRecommendationDocResult {
  // Bump on any registry change (e.g. rename) so the recipientSnapshot
  // baked into the returned doc reflects the latest name/emoji everywhere
  // it flows: header anchor, sheet title, People tile.
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeRecipients(() => setTick((t) => t + 1)), []);

  const doc = useMemo<Recommendation | null>(() => {
    if (!recipientId || !recommendationId) return null;
    return buildMockRecommendation(recipientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId, recommendationId, tick]);

  return { doc, loading: false, error: null };
}
