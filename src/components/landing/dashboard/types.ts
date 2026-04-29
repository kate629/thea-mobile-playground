/**
 * Types for the auth'd "Browse my friends" dashboard surface.
 *
 * Source parity:
 *   sovrn `src/components/YourPeopleSection.tsx` for `Person` shape.
 *   sovrn `src/components/LoggedInSearchBar.tsx` for the WHO/WHAT/LIKES pill.
 *   sovrn `src/hooks/useAuthUser.ts` for the auth state shape.
 *
 * Hooks accept injected adapters (auth + preview loader) so Storybook can
 * drive every state without pulling Firebase into the design system.
 */

export interface DashboardPerson {
  id: string;
  name: string;
  /** Single emoji glyph used as the tile identity. */
  emoji: string;
  /** Optional readable relationship label (e.g. "Brother"). */
  relationship?: string;
  /**
   * The recipient's currently-active recommendation id (if any). Powers the
   * Friend tile preview waterfall: top 4 images come from the linked
   * carouselSession's products when present, falling back to SAVED/
   * PURCHASED giftActivities, then the emoji (sheet bug #61).
   */
  currentRecommendationId?: string;
}

export const ME_TILE_ID = 'me';

/** Three-state lifecycle. The hook resolves once and the View branches on this. */
export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out'; onRequestSignIn: () => void }
  | { status: 'signed-in'; user: { uid: string; displayName?: string; initial: string } };

export interface AuthAdapter {
  /** Returns an unsubscribe function. Calls cb with the current state, then on every change. */
  subscribe: (cb: (state: AuthState) => void) => () => void;
  requestSignIn: () => void;
}

export interface FriendPreviewLoader {
  /**
   * Returns an unsubscribe function. Calls cb whenever the preview list
   * changes. The waterfall (carousel → SAVED → PURCHASED → empty) lives
   * inside the Firestore loader; story/test loaders return a single static
   * list.
   *
   * `currentRecommendationId` (when supplied) lets the Firestore loader
   * read top-4 images from `carouselSessions/{uid}_{recommendationId}`.
   * If undefined, the loader skips the carousel layer and falls through
   * to gift-activity sources.
   */
  subscribe: (
    personId: string,
    currentRecommendationId: string | undefined,
    cb: (urls: string[]) => void,
  ) => () => void;
}

export type QuestPillSegmentKey = 'who' | 'what' | 'likes';

export interface QuestPillSegment {
  key: QuestPillSegmentKey;
  /** "WHO" | "WHAT" | "LIKES" — uppercase label rendered above the value. */
  label: string;
  /** Resolved value (e.g. "Mom, 60s") or placeholder ("Relationship, age"). */
  value: string;
  /** True when the segment has a real value; the pill renders an X to clear and styles the value bolder. */
  filled: boolean;
}

export type QuestPillSegments = readonly [QuestPillSegment, QuestPillSegment, QuestPillSegment];
