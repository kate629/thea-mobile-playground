// PLAYGROUND STUB — replaces the real AuthGateProvider with a no-firebase
// version. Mirrors the AuthGateContext shape so consumer components keep
// working unchanged.

import React, { useCallback, useState, type ReactNode } from 'react';
import { AuthGateContext, type SignInOptions } from '../theaWeb/auth/AuthGateContext';

export const MockAuthGateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [redirectFailed, setRedirectFailed] = useState(false);

  const requestSignIn = useCallback((options?: SignInOptions) => {
    // Save is no longer gated behind sign-in: fire onAuthed instantly, no
    // modal. The "Sign in" button in the header still uses this when you
    // explicitly tap it (no onAuthed → no-op here, button drives its own UI).
    const onAuthed = options?.onAuthed;
    if (!onAuthed) {
      // eslint-disable-next-line no-console
      console.log('[playground] requestSignIn (no onAuthed — sign-in button)', {
        mode: options?.mode,
      });
      return;
    }
    Promise.resolve(onAuthed()).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[playground] onAuthed callback failed:', err);
    });
  }, []);

  const dismissRedirectFailed = useCallback(() => setRedirectFailed(false), []);

  return (
    <AuthGateContext.Provider
      value={{ requestSignIn, redirectFailed, dismissRedirectFailed }}
    >
      {children}
    </AuthGateContext.Provider>
  );
};
