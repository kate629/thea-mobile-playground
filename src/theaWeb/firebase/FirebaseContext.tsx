import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

import {
  auth as defaultAuth,
  db as defaultDb,
  getAuthInstance,
  getDbInstance,
  ensureAuth as defaultEnsureAuth,
} from '../../firebaseConfig';

// Prefer the explicit accessor (prod path); fall back to the back-compat
// export when accessors aren't available (tests that mock `firebaseConfig`
// with `{ auth, db, ensureAuth }` only). Both paths route through the same
// underlying instance in prod via lazy Proxies in `firebaseConfig.js`.
function resolveAuth(): Auth {
  return typeof getAuthInstance === 'function' ? getAuthInstance() : (defaultAuth as Auth);
}
function resolveDb(): Firestore {
  return typeof getDbInstance === 'function' ? getDbInstance() : (defaultDb as Firestore);
}

export interface FirebaseValue {
  auth: Auth;
  db: Firestore;
  /** Awaits authStateReady, signs in anonymously if needed, returns uid. */
  ensureAuth: () => Promise<string>;
}

const FirebaseContext = createContext<FirebaseValue | null>(null);

export interface FirebaseProviderProps {
  /** Override for tests/Storybook. Omit in prod to use real lazy SDK accessors. */
  value?: Partial<FirebaseValue>;
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ value, children }) => {
  const merged = useMemo<FirebaseValue>(
    () => ({
      auth: value?.auth ?? resolveAuth(),
      db: value?.db ?? resolveDb(),
      ensureAuth: value?.ensureAuth ?? defaultEnsureAuth,
    }),
    [value]
  );

  return <FirebaseContext.Provider value={merged}>{children}</FirebaseContext.Provider>;
};

/**
 * Returns the FirebaseValue from the nearest provider, or falls back to the
 * lazy SDK accessors when no provider is mounted. The fallback covers tests
 * that mount components without setting up a provider — those tests already
 * mock `firebaseConfig`, and the lazy accessors route through that mock.
 * Production code wraps the app with `<FirebaseProvider>`, so the fallback
 * never runs there.
 */
export function useFirebase(): FirebaseValue {
  const ctx = useContext(FirebaseContext);
  if (ctx) return ctx;
  return {
    auth: resolveAuth(),
    db: resolveDb(),
    ensureAuth: defaultEnsureAuth,
  };
}

export function useAuth(): Auth {
  return useFirebase().auth;
}

export function useDb(): Firestore {
  return useFirebase().db;
}

export function useEnsureAuth(): () => Promise<string> {
  return useFirebase().ensureAuth;
}
