import { QuestPillSegment, QuestPillSegments } from './types';

export const WHO_LABEL = 'WHO';
export const WHAT_LABEL = 'WHAT';
export const LIKES_LABEL = 'LIKES';

export const WHO_PLACEHOLDER = 'Relationship, age';
export const WHAT_PLACEHOLDER = 'Occasion';
export const LIKES_PLACEHOLDER = 'Interests';

export const PLACEHOLDER_SEGMENTS: QuestPillSegments = [
  { key: 'who', label: WHO_LABEL, value: WHO_PLACEHOLDER, filled: false },
  { key: 'what', label: WHAT_LABEL, value: WHAT_PLACEHOLDER, filled: false },
  { key: 'likes', label: LIKES_LABEL, value: LIKES_PLACEHOLDER, filled: false },
];

/** Default emoji shown on the "Me" tile when a user hasn't picked one. Source: YourPeopleSection.tsx:111. */
export const ME_DEFAULT_EMOJI = '🪩';
/** Default emoji used on a friend tile when the person has none set. Source: YourPeopleSection.tsx:111. */
export const FRIEND_DEFAULT_EMOJI = '✨';

export function makeFilledSegment<K extends QuestPillSegment['key']>(
  key: K,
  value: string,
): QuestPillSegment {
  const labelMap = { who: WHO_LABEL, what: WHAT_LABEL, likes: LIKES_LABEL } as const;
  return { key, label: labelMap[key], value, filled: true };
}
