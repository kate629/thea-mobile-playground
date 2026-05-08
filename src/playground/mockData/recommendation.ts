import { Timestamp } from 'firebase/firestore';
import type { Recommendation } from '../../theaWeb/schemas';
import {
  MOCK_CAROUSEL_SESSION_ID,
  MOCK_RECOMMENDATION_ID,
} from './playgroundConfig';
import { readRecipients } from './recipientRegistry';

// Lightweight per-recipient defaults so non-Mom seeded boards render with
// plausible relationship/age/gender. Falls back to MOM/FEMALE/62 (existing
// behavior) for the active recipient or anyone unknown. `as const` preserves
// the string-literal types required by the Recommendation schema enums.
const RECIPIENT_DEFAULTS = {
  'mock-recipient-maya': {
    relationship: 'DAUGHTER',
    gender: 'FEMALE',
    age: 8,
    freeform: 'Bug-and-flower phase, will read anything with a strong main character.',
  },
  'mock-recipient-dad': {
    relationship: 'DAD',
    gender: 'MALE',
    age: 67,
    freeform: 'Golf, woodworking, and refuses to throw out a single hat.',
  },
  'mock-recipient-sis': {
    relationship: 'SISTER',
    gender: 'FEMALE',
    age: 38,
    freeform: 'New apartment, slowly furnishing — into ceramics and stovetop espresso.',
  },
} as const;

export function buildMockRecommendation(recipientId?: string): Recommendation {
  const now = Timestamp.now();
  const registered = recipientId
    ? readRecipients().find((r) => r.id === recipientId)
    : undefined;
  const name = registered?.name ?? 'Mom';
  const emoji = registered?.emoji ?? '🌷';
  const FALLBACK_DEFAULTS = {
    relationship: 'MOM',
    gender: 'FEMALE',
    age: 62,
    freeform: 'Loves slow mornings, a really good book, and small touches around the house.',
  } as const;
  const defaults =
    (recipientId &&
      RECIPIENT_DEFAULTS[recipientId as keyof typeof RECIPIENT_DEFAULTS]) ||
    FALLBACK_DEFAULTS;
  return {
    recommendationId: MOCK_RECOMMENDATION_ID,
    isActive: true,
    displayName: `For ${name}`,
    input: {
      occasion: 'MOTHERS_DAY',
      occasionLabel: undefined,
      interests: ['decor', 'cooking', 'beauty', 'books'],
      freeform: defaults.freeform,
    },
    recipientSnapshot: {
      name,
      emoji,
      relationship: defaults.relationship,
      gender: defaults.gender,
      age: defaults.age,
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
