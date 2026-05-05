import React from 'react';
import type { User } from 'firebase/auth';
import { SiteHeader } from './SiteHeader';
import { AuthGateContext } from '../../theaWeb/auth/AuthGateContext';
import { HeaderAccountMenu } from '../../theaWeb/auth/HeaderAccountMenu';

export default {
  title: 'Surfaces/SiteHeader',
  component: SiteHeader,
};

const noopGate = {
  requestSignIn: () => {},
  redirectFailed: false,
  dismissRedirectFailed: () => {},
};

const userInitial: User = {
  uid: 'permanent-uid',
  isAnonymous: false,
  displayName: 'Kate',
  email: 'kate@example.com',
  photoURL: null,
} as unknown as User;

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGateContext.Provider value={noopGate}>{children}</AuthGateContext.Provider>
);

export const Unauthed = {
  render: () => (
    <Frame>
      <SiteHeader actions={<HeaderAccountMenu userOverride={null} />} />
    </Frame>
  ),
};

export const SignedIn = {
  render: () => (
    <Frame>
      <SiteHeader actions={<HeaderAccountMenu userOverride={userInitial} />} />
    </Frame>
  ),
};

export const NoActions = {
  args: {
    actions: null,
  },
};
