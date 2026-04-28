import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

import { FirebaseProvider, type FirebaseValue } from '../firebase/FirebaseContext';

const stubAuth = {
  currentUser: null,
  authStateReady: () => Promise.resolve(),
  onAuthStateChanged: () => () => {},
  onIdTokenChanged: () => () => {},
} as unknown as Auth;

const stubDb = {} as Firestore;

const stubEnsureAuth = async () => 'test-uid';

interface RenderWithFirebaseOptions extends RenderOptions {
  firebase?: Partial<FirebaseValue>;
}

/**
 * Wraps `render` with a `FirebaseProvider` carrying stub auth/db/ensureAuth.
 * Pass `{ firebase: { auth, db, ensureAuth } }` to override individual fields.
 *
 * Use this for tests that mount components calling `useAuth()` / `useDb()` /
 * `useEnsureAuth()`. Tests that rely on the legacy `jest.mock('firebaseConfig')`
 * pattern continue to work without this helper because the context hooks fall
 * back to the lazy accessors when no provider is mounted.
 */
export function renderWithFirebase(
  ui: React.ReactElement,
  options: RenderWithFirebaseOptions = {}
): RenderResult {
  const { firebase, ...renderOptions } = options;
  const value: FirebaseValue = {
    auth: firebase?.auth ?? stubAuth,
    db: firebase?.db ?? stubDb,
    ensureAuth: firebase?.ensureAuth ?? stubEnsureAuth,
  };
  return render(<FirebaseProvider value={value}>{ui}</FirebaseProvider>, renderOptions);
}
