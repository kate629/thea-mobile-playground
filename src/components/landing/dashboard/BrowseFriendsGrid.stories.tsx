import React from 'react';
import { BrowseFriendsGrid } from './BrowseFriendsGrid';
import { ME_TILE_ID } from './types';
import { SAMPLE_DASHBOARD_PEOPLE, SAMPLE_PREVIEW_IMAGES } from './sampleDashboardData';

export default {
  title: 'Surfaces/Dashboard/BrowseFriendsGrid',
  component: BrowseFriendsGrid,
};

const allResolved: Record<string, boolean> = Object.fromEntries(
  SAMPLE_DASHBOARD_PEOPLE.map((p) => [p.id, true]),
);

export const OneFriend = {
  render: () => (
    <BrowseFriendsGrid
      people={SAMPLE_DASHBOARD_PEOPLE.slice(0, 2)}
      previews={SAMPLE_PREVIEW_IMAGES}
      resolved={allResolved}
      meId={ME_TILE_ID}
    />
  ),
};

export const MultipleFriends = {
  render: () => (
    <BrowseFriendsGrid
      people={SAMPLE_DASHBOARD_PEOPLE}
      previews={SAMPLE_PREVIEW_IMAGES}
      resolved={allResolved}
      meId={ME_TILE_ID}
    />
  ),
};

export const LoadingFriends = {
  render: () => (
    <BrowseFriendsGrid
      people={[]}
      previews={{}}
      resolved={{}}
      loading
      meId={ME_TILE_ID}
    />
  ),
};

export const SomeTilesStillResolving = {
  render: () => (
    <BrowseFriendsGrid
      people={SAMPLE_DASHBOARD_PEOPLE}
      previews={{
        [ME_TILE_ID]: SAMPLE_PREVIEW_IMAGES[ME_TILE_ID],
        'mom-1': SAMPLE_PREVIEW_IMAGES['mom-1'],
      }}
      resolved={{ [ME_TILE_ID]: true, 'mom-1': true }}
      meId={ME_TILE_ID}
    />
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <BrowseFriendsGrid
      people={SAMPLE_DASHBOARD_PEOPLE}
      previews={SAMPLE_PREVIEW_IMAGES}
      resolved={allResolved}
      meId={ME_TILE_ID}
    />
  ),
};
