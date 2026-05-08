// PLAYGROUND STUB — composes the fake FirebaseProvider value + the
// MockAuthGateProvider into a single wrapper App.js can use to replace the
// real provider stack.

import React, { useMemo, type ReactNode } from 'react';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseProvider } from '../theaWeb/firebase/FirebaseContext';
import { MergeStateProvider } from '../theaWeb/auth/MergeStateContext';
import { MockAuthGateProvider } from './MockAuthGateProvider';
// Importing the registry triggers its self-seed on module load — Mom +
// a couple of other recipients populate before the People page renders.
import './mockData/recipientRegistry';
import {
  getAuthState,
  MOCK_UID_ANON,
  MOCK_UID_SIGNED_IN,
} from './mockData/playgroundConfig';

function buildFakeUser(): User {
  const auth = getAuthState();
  return {
    uid: auth === 'signedin' ? MOCK_UID_SIGNED_IN : MOCK_UID_ANON,
    isAnonymous: auth !== 'signedin',
    email: auth === 'signedin' ? 'playground@givethea.com' : null,
    displayName: auth === 'signedin' ? 'Playground User' : null,
    photoURL: null,
    emailVerified: auth === 'signedin',
    providerId: 'firebase',
    providerData: auth === 'signedin' ? [{ providerId: 'password' } as User['providerData'][number]] : [],
    metadata: {},
    refreshToken: '',
    tenantId: null,
    delete: async () => undefined,
    getIdToken: async () => 'playground-id-token',
    getIdTokenResult: async () => ({}) as never,
    reload: async () => undefined,
    toJSON: () => ({}),
  } as unknown as User;
}

function buildFakeAuth(): Auth {
  const user = buildFakeUser();
  return {
    currentUser: user,
    authStateReady: () => Promise.resolve(),
    // Fire once asynchronously so consumers see the user, then a no-op
    // unsubscribe. Mirrors the storybook firebaseDecorator pattern.
    onAuthStateChanged: (cb: (u: User | null) => void) => {
      Promise.resolve().then(() => cb(user));
      return () => {};
    },
    onIdTokenChanged: (cb: (u: User | null) => void) => {
      Promise.resolve().then(() => cb(user));
      return () => {};
    },
    signOut: async () => undefined,
  } as unknown as Auth;
}

export const MockProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useMemo(() => buildFakeAuth(), []);
  const db = useMemo(() => ({}) as Firestore, []);
  const ensureAuth = useMemo(
    () => async () => auth.currentUser?.uid ?? MOCK_UID_ANON,
    [auth],
  );

  return (
    <FirebaseProvider value={{ auth, db, ensureAuth }}>
      <MergeStateProvider>
        <MockAuthGateProvider>{children}</MockAuthGateProvider>
      </MergeStateProvider>
    </FirebaseProvider>
  );
};
