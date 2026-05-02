import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { consumeAuthRedirectResult } from './accountAuth';
import { SignInModal, type AuthMode } from './SignInModal';

export type { AuthMode } from './SignInModal';

export interface SignInOptions {
  /** "signin" or "signup" — controls which view the modal opens to. */
  mode?: AuthMode;
  /** Fires once after a successful sign-in/sign-up, before the modal closes. */
  onAuthed?: () => void | Promise<void>;
}

export interface AuthGateValue {
  /**
   * Open the auth modal. If the user successfully authenticates, `onAuthed`
   * fires once and is then cleared. Use this for save-intent preservation:
   * the heart button passes the "commit this heart to Firestore" closure so
   * it runs the moment the user is signed in.
   */
  requestSignIn: (options?: SignInOptions) => void;
}

/**
 * Exported so consumers on shared UI surfaces can read this context safely
 * with `useContext(AuthGateContext)` and treat `null` as "no gate mounted on
 * this host" — without `useAuthGate` throwing.
 */
export const AuthGateContext = createContext<AuthGateValue | null>(null);

export const AuthGateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signup');
  const onAuthedRef = useRef<SignInOptions['onAuthed']>(undefined);

  // Mobile Google/Apple sign-in returns via full-page redirect, landing on a
  // fresh app load with the modal closed. Firebase requires `getRedirectResult`
  // to finalize the link/sign-in — without it, `linkWithRedirect` never commits
  // and `currentUser` stays anonymous. Consume here at the root so the result
  // lands regardless of which page the user returns to. This works in tandem
  // with same-origin `authDomain` (configured in `.env`) so the credential
  // the auth handler stored is in the same origin's IndexedDB and isn't
  // partitioned away by the browser.
  useEffect(() => {
    consumeAuthRedirectResult().catch((err) => {
      console.error('[AuthGate] consumeAuthRedirectResult failed:', err);
    });
  }, []);

  const requestSignIn = useCallback((options?: SignInOptions) => {
    setMode(options?.mode ?? 'signup');
    onAuthedRef.current = options?.onAuthed;
    setOpen(true);
  }, []);

  const handleAuthed = useCallback(async () => {
    const cb = onAuthedRef.current;
    onAuthedRef.current = undefined;
    if (cb) {
      try {
        await cb();
      } catch (err) {
        console.error('[AuthGate] onAuthed callback failed:', err);
      }
    }
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) onAuthedRef.current = undefined;
  }, []);

  return (
    <AuthGateContext.Provider value={{ requestSignIn }}>
      {children}
      <SignInModal
        open={open}
        onOpenChange={handleOpenChange}
        defaultMode={mode}
        onAuthed={handleAuthed}
      />
    </AuthGateContext.Provider>
  );
};

export function useAuthGate(): AuthGateValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
  return ctx;
}
