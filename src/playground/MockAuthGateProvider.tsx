// PLAYGROUND STUB — replaces the real AuthGateProvider with a no-firebase
// version. Mirrors the AuthGateContext shape so consumer components keep
// working unchanged.

import React, { useCallback, useState, type ReactNode } from 'react';
import { AuthGateContext, type SignInOptions } from '../theaWeb/auth/AuthGateContext';
import { getAuthState } from './mockData/playgroundConfig';

export const MockAuthGateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [redirectFailed, setRedirectFailed] = useState(false);

  const requestSignIn = useCallback((options?: SignInOptions) => {
    const onAuthed = options?.onAuthed;
    const delay = getAuthState() === 'signedin' ? 0 : 400;
    // eslint-disable-next-line no-console
    console.log('[playground] requestSignIn (modal would open)', {
      mode: options?.mode,
      delay,
    });
    setTimeout(() => {
      if (onAuthed) {
        Promise.resolve(onAuthed()).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[playground] onAuthed callback failed:', err);
        });
      }
    }, delay);
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
