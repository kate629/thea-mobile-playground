import { useEffect, useState } from 'react';
import { AuthAdapter, AuthState } from './types';

/**
 * Subscribes to an injected `AuthAdapter` and surfaces the latest `AuthState`.
 * Production callers pass a `FirebaseAuthAdapter` (out of scope here);
 * stories pass a `MockAuthAdapter` from `mockAuth.ts`.
 *
 * The adapter is responsible for emitting `loading` synchronously on
 * `subscribe` so the View doesn't flicker through an undefined first paint.
 */
export function useAuthState(adapter: AuthAdapter): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  useEffect(() => {
    const unsub = adapter.subscribe(setState);
    return unsub;
  }, [adapter]);
  return state;
}
