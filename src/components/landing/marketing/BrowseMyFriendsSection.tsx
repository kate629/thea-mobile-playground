import React, { useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';

import { useAuth } from '../../../theaWeb/firebase/FirebaseContext';
import { PersonTile } from '../dashboard/PersonTile';
import {
  useFriendPreviews,
  useFirestoreFriendPreviewLoader,
} from '../dashboard/useFriendPreviews';
import { useFriendsList } from '../dashboard/useFriendsList';
import type { AuthState, DashboardPerson, FriendPreviewLoader } from '../dashboard/types';

export interface BrowseMyFriendsSectionProps {
  /** Test/story override: skip the live listener and render this list. */
  peopleOverride?: DashboardPerson[];
  /** Test/story override: bypass Firestore and use this loader. */
  loaderOverride?: FriendPreviewLoader;
  /** Test/story override: simulate auth-resolution loading vs ready. */
  authOverride?: AuthState;
  /** Override the auth instance for tests. Defaults to the FirebaseProvider's auth. */
  authInstance?: Auth;
  /**
   * Called instead of `navigate('/board/:rid')` when a tile is clicked.
   * The route is owned by another in-flight PR; this prop lets stories
   * and tests assert without depending on the route existing.
   */
  onPersonClick?: (person: DashboardPerson) => void;
  /** Override heading copy. */
  heading?: string;
}

const HeadingWrap = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 16px 8px;
  @media (min-width: 640px) {
    padding-left: 32px;
    padding-right: 32px;
  }
  @media (min-width: 1024px) {
    padding-left: 64px;
    padding-right: 64px;
  }
`;

const Heading = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  @media (min-width: 768px) {
    font-size: 52px;
  }
`;

const Section = styled.section`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  @media (min-width: 640px) {
    padding-left: 32px;
    padding-right: 32px;
  }
  @media (min-width: 1024px) {
    padding: 32px 64px 64px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px;
  }
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const skeletonShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonTile = styled.div`
  display: flex;
  flex-direction: column;
`;

const SkeletonFrame = styled.div`
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: ${skeletonShimmer} 1400ms ease-in-out infinite;
`;

const SkeletonLabel = styled.div`
  height: 16px;
  width: 96px;
  margin: 12px auto 0;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: ${skeletonShimmer} 1400ms ease-in-out infinite;
`;

const EmptyState = styled.p`
  text-align: center;
  color: hsl(var(--muted-foreground));
  font-size: 15px;
  margin: 32px auto;
`;

/**
 * Resolve a Firebase `User` to the `AuthState` shape `useFriendPreviews`
 * expects. Anonymous users are surfaced as `signed-out` so the hook
 * skips Firestore work — anon users have no permanent recipient subtree
 * worth subscribing to from the marketing page.
 */
function userToAuthState(user: User | null, authReady: boolean): AuthState {
  if (!authReady) return { status: 'loading' };
  if (!user || user.isAnonymous) {
    return { status: 'signed-out', onRequestSignIn: () => {} };
  }
  const initialSrc = user.displayName ?? user.email ?? '';
  const initial = (initialSrc.trim().charAt(0) || 'A').toUpperCase();
  return {
    status: 'signed-in',
    user: {
      uid: user.uid,
      displayName: user.displayName ?? undefined,
      initial,
    },
  };
}

/**
 * "Browse my friends" — the signed-in landing-page section. Subscribes
 * to the user's recipient subtree, lays them out 4-up on desktop / 2-up
 * on mobile, and shows a 2x2 collage of saved-item images per tile.
 *
 * No "Add someone" tile per Kate's V2 spec.
 */
export const BrowseMyFriendsSection: React.FC<BrowseMyFriendsSectionProps> = ({
  peopleOverride,
  loaderOverride,
  authOverride,
  authInstance: authInstanceProp,
  onPersonClick,
  heading = 'Browse my friends',
}) => {
  const ctxAuth = useAuth();
  const authInstance = authInstanceProp ?? ctxAuth;
  const navigate = useNavigate();

  // Subscribe to Firebase auth so we can branch on signed-in vs anon.
  const [user, setUser] = useState<User | null>(
    authOverride !== undefined ? null : authInstance.currentUser,
  );
  const [authReady, setAuthReady] = useState<boolean>(
    authOverride !== undefined ? true : !!authInstance.currentUser,
  );

  useEffect(() => {
    if (authOverride !== undefined) return;
    const unsub = onAuthStateChanged(authInstance, (next) => {
      setUser(next);
      setAuthReady(true);
    });
    return () => unsub();
  }, [authInstance, authOverride]);

  const authState: AuthState =
    authOverride ?? userToAuthState(user, authReady);

  const uid =
    authState.status === 'signed-in' ? authState.user.uid : null;

  // Real Firestore wiring (skipped if the caller provides overrides).
  const liveFriends = useFriendsList(peopleOverride ? null : uid);
  const liveLoader = useFirestoreFriendPreviewLoader(loaderOverride ? null : uid);

  const people: DashboardPerson[] = peopleOverride ?? liveFriends.friends;
  const friendsHydrated = peopleOverride ? true : liveFriends.hydrated;

  const personIds = useMemo(() => people.map((p) => p.id), [people]);

  // useFriendPreviews requires a non-null loader. Provide a no-op when
  // there is no uid yet — the hook ignores it when `authState !== signed-in`.
  const noopLoader: FriendPreviewLoader = useMemo(
    () => ({ subscribe: () => () => {} }),
    [],
  );
  const loader: FriendPreviewLoader =
    loaderOverride ?? liveLoader ?? noopLoader;

  const { previews, resolved } = useFriendPreviews(authState, personIds, loader);

  // Don't render the section at all on the anon homepage. The signed-in
  // homepage is the only consumer; anon path renders the marketing hero.
  if (authState.status !== 'signed-in') return null;

  const handleClick = (person: DashboardPerson) => {
    if (onPersonClick) {
      onPersonClick(person);
      return;
    }
    navigate(`/board/${person.id}`);
  };

  return (
    <>
      <HeadingWrap>
        <Heading>{heading}</Heading>
      </HeadingWrap>
      <Section aria-label="Browse my friends">
        {!friendsHydrated && people.length === 0 ? (
          <Grid>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonTile key={i}>
                <SkeletonFrame />
                <SkeletonLabel />
              </SkeletonTile>
            ))}
          </Grid>
        ) : people.length === 0 ? (
          <EmptyState>No one yet — find a gift to get started.</EmptyState>
        ) : (
          <Grid>
            {people.map((person) => (
              <PersonTile
                key={person.id}
                id={person.id}
                name={person.name}
                emoji={person.emoji}
                previewImages={previews[person.id] ?? []}
                loading={!resolved[person.id]}
                onClick={() => handleClick(person)}
              />
            ))}
          </Grid>
        )}
      </Section>
    </>
  );
};
