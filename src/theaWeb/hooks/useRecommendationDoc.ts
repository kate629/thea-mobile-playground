// PLAYGROUND STUB — returns the fixture Recommendation. Real version at
// upstream:src/theaWeb/hooks/useRecommendationDoc.ts. Never port this back.

import { useMemo } from 'react';
import { buildMockRecommendation } from '../../playground/mockData/recommendation';
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
  const doc = useMemo<Recommendation | null>(() => {
    if (!recipientId || !recommendationId) return null;
    return buildMockRecommendation();
  }, [recipientId, recommendationId]);

  return { doc, loading: false, error: null };
}
