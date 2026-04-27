import React from 'react';
import type { User } from 'firebase/auth';
import { HeaderAccountMenu } from './HeaderAccountMenu';
import { AuthGateContext } from './AuthGateContext';

export default {
  title: 'Surfaces/Auth/HeaderAccountMenu',
  component: HeaderAccountMenu,
};

const noopGate = { requestSignIn: () => {} };

const userInitial: User = {
  uid: 'permanent-uid',
  isAnonymous: false,
  displayName: null,
  email: 'mom@example.com',
  photoURL: null,
} as unknown as User;

const userPhoto: User = {
  uid: 'permanent-uid',
  isAnonymous: false,
  displayName: 'Mom Tester',
  email: 'mom@example.com',
  photoURL: 'https://i.pravatar.cc/64?img=5',
} as unknown as User;

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGateContext.Provider value={noopGate}>
    <div
      style={{
        background: '#FAF7F2',
        padding: 24,
        display: 'flex',
        justifyContent: 'flex-end',
        minHeight: 200,
      }}
    >
      {children}
    </div>
  </AuthGateContext.Provider>
);

export const Anon = {
  render: () => (
    <Frame>
      <HeaderAccountMenu userOverride={null} />
    </Frame>
  ),
};

export const SignedInInitial = {
  render: () => (
    <Frame>
      <HeaderAccountMenu userOverride={userInitial} />
    </Frame>
  ),
};

export const SignedInPhoto = {
  render: () => (
    <Frame>
      <HeaderAccountMenu userOverride={userPhoto} />
    </Frame>
  ),
};

export const DropdownOpen = {
  render: () => (
    <Frame>
      <HeaderAccountMenu userOverride={userPhoto} defaultMenuOpen />
    </Frame>
  ),
};
