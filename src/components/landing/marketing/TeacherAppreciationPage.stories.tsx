import React from 'react';
import type { User } from 'firebase/auth';
import { TeacherAppreciationPage } from './TeacherAppreciationPage';
import { SAMPLE_TEACHER_APPRECIATION_PRODUCTS } from './sampleTeacherAppreciationProducts';
import { HeaderAccountMenu } from '../../../theaWeb/auth/HeaderAccountMenu';
import { AuthGateContext } from '../../../theaWeb/auth/AuthGateContext';

export default {
  title: 'Surfaces/Marketing/TeacherAppreciationPage',
  component: TeacherAppreciationPage,
};

export const Default = {
  args: {
    title: 'Teacher Appreciation Gifts',
    products: SAMPLE_TEACHER_APPRECIATION_PRODUCTS,
    occasion: 'teacher_appreciation',
  },
};

const mockSignedInUser: User = {
  uid: 'story-permanent-uid',
  isAnonymous: false,
  displayName: null,
  email: 'teacher@example.com',
  photoURL: null,
} as unknown as User;

const noopAuthGate = {
  requestSignIn: () => undefined,
  redirectFailed: false,
  dismissRedirectFailed: () => undefined,
};

const SignedInHeaderActions = (
  <AuthGateContext.Provider value={noopAuthGate}>
    <HeaderAccountMenu userOverride={mockSignedInUser} />
  </AuthGateContext.Provider>
);

export const SignedIn = {
  args: {
    title: 'Teacher Appreciation Gifts',
    products: SAMPLE_TEACHER_APPRECIATION_PRODUCTS,
    occasion: 'teacher_appreciation',
    authOverride: 'signed-in' as const,
    onSignInClick: () => undefined,
    headerActions: SignedInHeaderActions,
  },
};

export const SignedOut = {
  args: {
    title: 'Teacher Appreciation Gifts',
    products: SAMPLE_TEACHER_APPRECIATION_PRODUCTS,
    occasion: 'teacher_appreciation',
    authOverride: 'signed-out' as const,
    onSignInClick: () => undefined,
  },
};
