import { DashboardPerson, FriendPreviewLoader, ME_TILE_ID } from './types';

export const SAMPLE_DASHBOARD_PEOPLE: DashboardPerson[] = [
  { id: ME_TILE_ID, name: 'Me', emoji: '🪩' },
  { id: 'brother-1', name: 'Brother', emoji: '✨', relationship: 'Brother' },
  { id: 'mom-1', name: 'Mom', emoji: '🌷', relationship: 'Mom' },
  { id: 'sister-1', name: 'Sister', emoji: '👯', relationship: 'Sister' },
];

const PHOTO_HOST = 'https://images.unsplash.com';

/**
 * Fixture preview URLs used in stories. Real surface pulls these from the
 * `users/{uid}/people/{personId}/likes` Firestore subcollection. Pulling
 * Unsplash here keeps stories deterministic without server fixtures.
 */
export const SAMPLE_PREVIEW_IMAGES: Record<string, string[]> = {
  [ME_TILE_ID]: [
    `${PHOTO_HOST}/photo-1503602642458-232111445657?w=300`,
    `${PHOTO_HOST}/photo-1542291026-7eec264c27ff?w=300`,
    `${PHOTO_HOST}/photo-1556909114-f6e7ad7d3136?w=300`,
    `${PHOTO_HOST}/photo-1542293787938-c9e299b88010?w=300`,
  ],
  'brother-1': [
    `${PHOTO_HOST}/photo-1542291026-7eec264c27ff?w=300`,
    `${PHOTO_HOST}/photo-1518770660439-4636190af475?w=300`,
  ],
  'mom-1': [
    `${PHOTO_HOST}/photo-1490481651871-ab68de25d43d?w=300`,
    `${PHOTO_HOST}/photo-1521572163474-6864f9cf17ab?w=300`,
    `${PHOTO_HOST}/photo-1485518882345-15568b007407?w=300`,
    `${PHOTO_HOST}/photo-1490481651871-ab68de25d43d?w=300`,
  ],
  'sister-1': [],
};

/** Loader that immediately resolves with the fixture images. Used in Live containers. */
export const instantMockPreviewLoader: FriendPreviewLoader = {
  subscribe: (personId, cb) => {
    cb(SAMPLE_PREVIEW_IMAGES[personId] ?? []);
    return () => {};
  },
};

/** Loader that resolves after `delayMs`. Demonstrates the skeleton-to-collage transition. */
export function makeDelayedMockPreviewLoader(delayMs: number): FriendPreviewLoader {
  return {
    subscribe: (personId, cb) => {
      const t = setTimeout(() => cb(SAMPLE_PREVIEW_IMAGES[personId] ?? []), delayMs);
      return () => clearTimeout(t);
    },
  };
}
