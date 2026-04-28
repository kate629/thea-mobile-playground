import { useEffect, useState } from 'react';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';

/**
 * Resolves whether the live Firebase user is authenticated as a permanent
 * (non-anonymous) account. Originally inlined in `LandingPage.tsx`; lifted
 * out so the same auth-state read can drive the `<StickyPrimaryCta>`'s
 * sign-in slot on both the homepage and occasion pages (sheet bug #59 —
 * "sign-in" CTA still showing after login).
 *
 * Anon Firebase users are surfaced as `signedIn: false` — same as fully
 * signed-out users. Only permanent accounts return `signedIn: true`.
 *
 * `ready` flips from `false` to `true` once the first auth-state event
 * lands; consumers can use it to delay rendering decisions that would
 * otherwise flash the wrong state during the bootstrap.
 *
 * `authInstance` is required and must be supplied by the caller (via
 * `useAuth()` from FirebaseContext, or a stub in stories/tests). Importing
 * `auth` from `firebaseConfig` here would trigger module-level Firebase
 * init, which crashes Storybook/Happo CI (no `.env.local` → undefined
 * config → `initializeApp` throws). See handbook gotcha #12.
 */
export type AuthOverride = 'signed-in' | 'signed-out' | 'loading' | undefined;

export interface IsSignedInResult {
  ready: boolean;
  signedIn: boolean;
}

export function useIsSignedIn(
  authOverride: AuthOverride,
  authInstance: Auth,
): IsSignedInResult {
  const [user, setUser] = useState<User | null>(
    authOverride ? null : authInstance.currentUser,
  );
  const [ready, setReady] = useState<boolean>(
    authOverride ? true : !!authInstance.currentUser,
  );

  useEffect(() => {
    if (authOverride) return;
    const unsub = onAuthStateChanged(authInstance, (next) => {
      setUser(next);
      setReady(true);
    });
    return () => unsub();
  }, [authInstance, authOverride]);

  if (authOverride === 'signed-in') return { ready: true, signedIn: true };
  if (authOverride === 'signed-out') return { ready: true, signedIn: false };
  if (authOverride === 'loading') return { ready: false, signedIn: false };
  return { ready, signedIn: !!user && !user.isAnonymous };
}
