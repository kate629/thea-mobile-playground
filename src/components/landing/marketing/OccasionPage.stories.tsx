import React from 'react';
import type { User } from 'firebase/auth';
import { OccasionPage } from './OccasionPage';
import { SAMPLE_BIRTHDAY_SECTIONS } from './sampleBirthdayCarousels';
import { HeaderAccountMenu } from '../../../theaWeb/auth/HeaderAccountMenu';
import { AuthGateContext } from '../../../theaWeb/auth/AuthGateContext';

export default {
  title: 'Surfaces/Marketing/OccasionPage',
  component: OccasionPage,
};

export const Birthday = {
  args: {
    title: 'Birthday Gifts',
    sections: SAMPLE_BIRTHDAY_SECTIONS,
  },
};

/* Mock signed-in Firebase user — same shape used in HeaderAccountMenu's own
   signed-in stories. Drives the avatar pill in the header so signed-in
   stories below capture both surfaces (header + sticky) in a consistent
   auth state. */
const mockSignedInUser: User = {
  uid: 'story-permanent-uid',
  isAnonymous: false,
  displayName: null,
  email: 'mom@example.com',
  photoURL: null,
} as unknown as User;

const noopAuthGate = { requestSignIn: () => undefined };

const SignedInHeaderActions = (
  <AuthGateContext.Provider value={noopAuthGate}>
    <HeaderAccountMenu userOverride={mockSignedInUser} />
  </AuthGateContext.Provider>
);

/* Visual baseline for sheet bug #59: signed-in users should NOT see the
   "Sign in" ghost button in the sticky CTA *and* should see the avatar
   (not a Sign-in pill) in the SiteHeader. The `headerActions` override
   forces the header into a faithful signed-in state — without it the
   storybook fakeAuth (currentUser=null) leaves HeaderAccountMenu rendering
   Sign-in, capturing a state that never co-occurs in production. */
export const BirthdaySignedIn = {
  args: {
    title: 'Birthday Gifts',
    sections: SAMPLE_BIRTHDAY_SECTIONS,
    authOverride: 'signed-in' as const,
    onSignInClick: () => undefined,
    headerActions: SignedInHeaderActions,
  },
};

/* Signed-out pair: header keeps the default Sign-in pill (storybook
   fakeAuth's currentUser=null is faithful here) and the sticky shows
   the secondary "Sign in" CTA. */
export const BirthdaySignedOut = {
  args: {
    title: 'Birthday Gifts',
    sections: SAMPLE_BIRTHDAY_SECTIONS,
    authOverride: 'signed-out' as const,
    onSignInClick: () => undefined,
  },
};
