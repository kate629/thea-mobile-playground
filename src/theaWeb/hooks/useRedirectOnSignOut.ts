import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../firebase/FirebaseContext';

/**
 * Watches auth state and navigates to `to` when the user transitions OUT of
 * a permanent (non-anonymous) session — i.e. signs out, or signOut() restarts
 * them as a fresh anon. The post-merge anon→permanent transition does NOT
 * fire this (going from anon to permanent is the opposite direction).
 *
 * Used by RecommendationResultsPage so the user isn't left staring at the
 * results of a session their new auth context can't read.
 */
export function useRedirectOnSignOut(to: string = '/'): void {
  const auth = useAuth();
  const navigate = useNavigate();
  const wasPermanentRef = useRef<boolean>(
    auth.currentUser !== null && auth.currentUser.isAnonymous === false,
  );

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      const isPermanent = user !== null && user.isAnonymous === false;
      // Trigger only on the falling edge (permanent → not-permanent). Anon
      // first-load and anon→permanent are both non-events.
      if (wasPermanentRef.current && !isPermanent) {
        navigate(to, { replace: true });
      }
      wasPermanentRef.current = isPermanent;
    });
  }, [auth, navigate, to]);
}
