import { useEffect, useState } from 'react';
import {
  getUserLikedCount,
  subscribeMockActivity,
} from '../mockData/giftActivityStore';

/**
 * Reactive total of user-liked items across every recipient. Excludes
 * seeded entries (Maya/Dad/Sis collages) so a fresh playground load
 * starts at 0 and the "save your boards" alert dot fires only once a
 * real user actually likes 3+ things.
 */
export function useTotalLikedCount(): number {
  const [count, setCount] = useState(() => getUserLikedCount());
  useEffect(
    () =>
      subscribeMockActivity(() => setCount(getUserLikedCount())),
    [],
  );
  return count;
}
