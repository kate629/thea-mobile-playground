// PLAYGROUND STUB — returns a fixture CarouselSession driven by the
// `?session=processing|completed` URL param. Real version at
// upstream:src/theaWeb/hooks/useCarouselSession.ts. Never port this back.

import { useMemo } from 'react';
import { buildMockCarouselSession } from '../../playground/mockData/carouselSession';
import type { CarouselSession } from '../schemas';

interface UseCarouselSessionResult {
  session: CarouselSession | null;
  loading: boolean;
  error: Error | null;
}

export function useCarouselSession(
  carouselSessionId: string | undefined,
): UseCarouselSessionResult {
  const session = useMemo<CarouselSession | null>(() => {
    if (!carouselSessionId) return null;
    return buildMockCarouselSession();
  }, [carouselSessionId]);

  return { session, loading: false, error: null };
}
