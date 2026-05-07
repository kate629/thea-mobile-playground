// PLAYGROUND STUB — reads from in-memory giftActivityStore singleton, no
// Firestore. Real version at upstream:src/theaWeb/hooks/useGiftActivities.ts.
// Never port this back.

import { useEffect, useState } from 'react';
import {
  readMockActivity,
  subscribeMockActivity,
} from '../../playground/mockData/giftActivityStore';

export interface GiftActivityDetail {
  id: string;
  title: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  productUrl?: string;
}

interface UseGiftActivitiesResult {
  liked: Set<string>;
  dismissed: Set<string>;
  purchased: Set<string>;
  likedDetails: GiftActivityDetail[];
  dismissedDetails: GiftActivityDetail[];
  purchasedDetails: GiftActivityDetail[];
  hydrated: boolean;
  error: Error | null;
}

export function useGiftActivities(
  recipientId: string | undefined,
): UseGiftActivitiesResult {
  const [snapshot, setSnapshot] = useState(() => readMockActivity());

  useEffect(() => {
    if (!recipientId) return;
    return subscribeMockActivity(() => setSnapshot(readMockActivity()));
  }, [recipientId]);

  return {
    ...snapshot,
    hydrated: Boolean(recipientId),
    error: null,
  };
}
