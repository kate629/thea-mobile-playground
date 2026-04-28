import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { BrowseMyFriendsSection } from './BrowseMyFriendsSection';
import {
  SAMPLE_DASHBOARD_PEOPLE,
  instantMockPreviewLoader,
} from '../dashboard/sampleDashboardData';
import type { AuthState, DashboardPerson } from '../dashboard/types';

const SIGNED_IN: AuthState = {
  status: 'signed-in',
  user: { uid: 'u1', initial: 'A' },
};

const FRIENDS: DashboardPerson[] = SAMPLE_DASHBOARD_PEOPLE.filter(
  (p) => p.id !== 'me',
);

export default {
  title: 'Surfaces/Marketing/BrowseMyFriendsSection',
  component: BrowseMyFriendsSection,
  decorators: [
    (Story: React.ComponentType) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    happo: {
      targets: ['chrome-large', 'chrome-small'],
    },
  },
};

export const SignedInThreeFriends = {
  args: {
    authOverride: SIGNED_IN,
    peopleOverride: FRIENDS,
    loaderOverride: instantMockPreviewLoader,
  },
};

export const SignedInEmptyState = {
  args: {
    authOverride: SIGNED_IN,
    peopleOverride: [],
    loaderOverride: instantMockPreviewLoader,
  },
};

export const SignedInFourFriendsDesktopRow = {
  args: {
    authOverride: SIGNED_IN,
    peopleOverride: [
      ...FRIENDS,
      { id: 'friend-1', name: 'Alex', emoji: '🌟' },
    ] as DashboardPerson[],
    loaderOverride: instantMockPreviewLoader,
  },
};

/* Anonymous / signed-out — section renders nothing. Included for snapshot
   coverage so a regression that flips the visibility check would diff. */
export const SignedOutRendersNothing = {
  args: {
    authOverride: { status: 'signed-out', onRequestSignIn: () => {} } as AuthState,
    peopleOverride: FRIENDS,
    loaderOverride: instantMockPreviewLoader,
  },
};
