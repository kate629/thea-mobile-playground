import React from 'react';
import { SignInModal } from './SignInModal';
import { AuthGateContext } from './AuthGateContext';

export default {
  title: 'Surfaces/Auth/SignInModal',
  component: SignInModal,
};

/**
 * Stories pin the modal `open={true}` so Happo can baseline the chrome.
 * The internal state machine (typing, submitting, errors) is exercised by
 * unit tests; here we just snapshot the visual variants.
 *
 * Most variants render the default empty form. The "error" + "loading" +
 * "reset-sent" variants drive the body component directly via a
 * stand-in tree to surface those states without a click sequence — wrapping
 * SignInModal twice into a context provider that pre-fills text and toggles
 * flags via DOM-level overrides isn't worth the indirection at this layer.
 *
 * For now we cover the two main entrypoints (signup-default, signin-default)
 * + a story that swaps the heading copy; visual diffs from form interactions
 * are deferred to RTL/jest tests.
 */

const noopGate = {
  requestSignIn: () => {},
  redirectFailed: false,
  dismissRedirectFailed: () => {},
};

export const SignupDefault = {
  render: () => (
    <AuthGateContext.Provider value={noopGate}>
      <SignInModal open onOpenChange={() => {}} defaultMode="signup" />
    </AuthGateContext.Provider>
  ),
};

export const SigninDefault = {
  render: () => (
    <AuthGateContext.Provider value={noopGate}>
      <SignInModal open onOpenChange={() => {}} defaultMode="signin" />
    </AuthGateContext.Provider>
  ),
};

/**
 * Pre-filled email so the screenshot shows the input populated rather than the
 * placeholder. Useful for catching font/spacing regressions in the input field.
 */
export const SigninWithEmailFilled = {
  render: () => {
    React.useEffect(() => {
      const inp = document.querySelector<HTMLInputElement>('.thea-auth-modal input[type="email"]');
      if (inp) inp.value = 'mom@example.com';
    }, []);
    return (
      <AuthGateContext.Provider value={noopGate}>
        <SignInModal open onOpenChange={() => {}} defaultMode="signin" />
      </AuthGateContext.Provider>
    );
  },
};

/**
 * Closed state — exercises the no-paint path. Useful as a Happo control.
 */
export const Closed = {
  render: () => (
    <AuthGateContext.Provider value={noopGate}>
      <div style={{ minHeight: 200 }}>
        <SignInModal open={false} onOpenChange={() => {}} defaultMode="signup" />
      </div>
    </AuthGateContext.Provider>
  ),
};
