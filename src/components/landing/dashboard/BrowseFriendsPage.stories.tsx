import React, { useMemo, useRef } from 'react';
import { BrowseFriendsPage } from './BrowseFriendsPage';
import { BrowseFriendsPageAnimated } from './BrowseFriendsPageAnimated';
import { MockAuthAdapter } from './mockAuth';
import { instantMockPreviewLoader } from './sampleDashboardData';
import { PLACEHOLDER_SEGMENTS, makeFilledSegment } from './constants';
import { ME_TILE_ID, AuthState } from './types';
import { SAMPLE_DASHBOARD_PEOPLE, SAMPLE_PREVIEW_IMAGES } from './sampleDashboardData';

export default {
  title: 'Surfaces/Dashboard/BrowseFriendsPage',
  component: BrowseFriendsPage,
  parameters: { layout: 'fullscreen' },
};

const allResolved = Object.fromEntries(SAMPLE_DASHBOARD_PEOPLE.map((p) => [p.id, true]));

const RESOLVED_SEGMENTS = [
  makeFilledSegment('who', 'Brother, 30s'),
  makeFilledSegment('what', 'Birthday'),
  makeFilledSegment('likes', 'Cooking, Travel'),
] as const;

const SignedInUser: AuthState = {
  status: 'signed-in',
  user: { uid: 'demo', displayName: 'Manuel Martinez', initial: 'M' },
};
const SignedOut: AuthState = {
  status: 'signed-out',
  onRequestSignIn: () => {},
};
const Loading: AuthState = { status: 'loading' };

const BasePill = {
  segments: PLACEHOLDER_SEGMENTS,
  onSegmentClick: () => {},
  onSparkleClick: () => {},
  canSearch: false,
};

export const SignedInOnePerson = {
  render: () => (
    <BrowseFriendsPage
      authState={SignedInUser}
      stickyPill={false}
      pill={{ ...BasePill, segments: PLACEHOLDER_SEGMENTS }}
      grid={{
        people: SAMPLE_DASHBOARD_PEOPLE.slice(0, 2),
        previews: SAMPLE_PREVIEW_IMAGES,
        resolved: allResolved,
        meId: ME_TILE_ID,
        onPersonClick: () => {},
        onAddSomeoneClick: () => {},
      }}
    />
  ),
};

export const SignedInMultiplePeople = {
  render: () => (
    <BrowseFriendsPage
      authState={SignedInUser}
      stickyPill={false}
      pill={{ ...BasePill, segments: RESOLVED_SEGMENTS as never, canSearch: true }}
      grid={{
        people: SAMPLE_DASHBOARD_PEOPLE,
        previews: SAMPLE_PREVIEW_IMAGES,
        resolved: allResolved,
        meId: ME_TILE_ID,
        onPersonClick: () => {},
        onAddSomeoneClick: () => {},
      }}
    />
  ),
};

export const SignedInWithLoadingCollages = {
  render: () => (
    <BrowseFriendsPage
      authState={SignedInUser}
      stickyPill={false}
      pill={{ ...BasePill, segments: PLACEHOLDER_SEGMENTS }}
      grid={{
        people: SAMPLE_DASHBOARD_PEOPLE,
        previews: {},
        resolved: {},
        meId: ME_TILE_ID,
        onPersonClick: () => {},
        onAddSomeoneClick: () => {},
      }}
    />
  ),
};

export const SignedOutVariant = {
  render: () => (
    <BrowseFriendsPage
      authState={SignedOut}
      stickyPill={false}
      pill={{ ...BasePill, segments: PLACEHOLDER_SEGMENTS }}
      grid={{
        people: [],
        previews: {},
        resolved: {},
        meId: ME_TILE_ID,
      }}
    />
  ),
};

export const LoadingVariant = {
  render: () => (
    <BrowseFriendsPage
      authState={Loading}
      stickyPill={false}
      pill={{ ...BasePill, segments: PLACEHOLDER_SEGMENTS }}
      grid={{
        people: [],
        previews: {},
        resolved: {},
        meId: ME_TILE_ID,
      }}
    />
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <BrowseFriendsPage
      authState={SignedInUser}
      stickyPill={false}
      pill={{ ...BasePill, segments: PLACEHOLDER_SEGMENTS, compact: true }}
      grid={{
        people: SAMPLE_DASHBOARD_PEOPLE,
        previews: SAMPLE_PREVIEW_IMAGES,
        resolved: allResolved,
        meId: ME_TILE_ID,
        onPersonClick: () => {},
        onAddSomeoneClick: () => {},
      }}
    />
  ),
};

export const MobileSignedOut = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <BrowseFriendsPage
      authState={SignedOut}
      stickyPill={false}
      pill={{ ...BasePill, segments: PLACEHOLDER_SEGMENTS, compact: true }}
      grid={{ people: [], previews: {}, resolved: {}, meId: ME_TILE_ID }}
    />
  ),
};

/**
 * Fully assembled, interactive version. Same surface, but pill segments
 * open dropdowns, fill, and clear; tile clicks fire alerts. Mounted here
 * so reviewers don't have to drill into the Animated module to see the
 * stitched experience.
 */
export const SignedInInteractive = {
  parameters: { happo: false },
  render: () => {
    const adapter = useRef(
      new MockAuthAdapter({
        status: 'signed-in',
        user: { uid: 'demo', displayName: 'Manuel', initial: 'M' },
      }),
    ).current;
    const loader = useMemo(() => instantMockPreviewLoader, []);
    return (
      <BrowseFriendsPageAnimated
        authAdapter={adapter}
        previewLoader={loader}
        people={SAMPLE_DASHBOARD_PEOPLE}
        onPersonClick={(p) => alert(`Open ${p.name}`)}
        onAddSomeoneClick={() => alert('Add someone')}
        onSparkle={() => alert('Search!')}
      />
    );
  },
};
