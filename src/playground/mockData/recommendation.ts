import { Timestamp } from 'firebase/firestore';
import type { Recommendation } from '../../theaWeb/schemas';
import {
  MOCK_CAROUSEL_SESSION_ID,
  MOCK_RECOMMENDATION_ID,
} from './playgroundConfig';

export function buildMockRecommendation(): Recommendation {
  const now = Timestamp.now();
  return {
    recommendationId: MOCK_RECOMMENDATION_ID,
    isActive: true,
    displayName: 'For Mom',
    input: {
      occasion: 'MOTHERS_DAY',
      occasionLabel: undefined,
      interests: ['cozy', 'kitchen', 'beauty', 'books'],
      freeform: 'Loves slow mornings, a really good book, and small touches around the house.',
    },
    recipientSnapshot: {
      name: 'Mom',
      emoji: '🌷',
      relationship: 'MOM',
      gender: 'FEMALE',
      age: 62,
      isMe: false,
    },
    status: 'COMPLETED',
    mode: 'THOUGHTFUL',
    carouselSessionId: MOCK_CAROUSEL_SESSION_ID,
    pipelineTimingMs: 12_400,
    _schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
  };
}
