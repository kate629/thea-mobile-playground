import React from 'react';
import { LandingPage, FrozenHeroSlot } from './LandingPage';

export default {
  title: 'Surfaces/Marketing/LandingPageFrozen',
  component: LandingPage,
};

/** Full-page Happo target. Hero is frozen on scenario 2 ("Grandson who loves
 *  art and trucks") which matches the live preview screenshot used as the
 *  visual reference. */
export const Default = {
  render: () => <LandingPage heroSlot={<FrozenHeroSlot scenarioIndex={2} />} />,
};

export const ScenarioBookishTea = {
  render: () => <LandingPage heroSlot={<FrozenHeroSlot scenarioIndex={0} />} />,
};

export const ScenarioFirstHome = {
  render: () => <LandingPage heroSlot={<FrozenHeroSlot scenarioIndex={5} />} />,
};

/* Note: a `SignedIn` LandingPageFrozen story would crash today — the
   signed-in branch renders <BrowseMyFriendsSection>, which subscribes to
   `useFriendsList(uid)` against the storybook stub `db = {}`. To cover
   the homepage signed-in visual we'd need to plumb peopleOverride /
   loaderOverride props through LandingPage to BrowseMyFriendsSection.
   That's its own follow-up PR. The signed-in sticky-CTA gating from
   sheet bug #59 is still covered:
   - LandingPage.test.tsx — page-level integration tests
   - StickyPrimaryCta.stories `WithSignInSlot` — component-level visual
   - OccasionPage.stories `BirthdaySignedIn` — the other page surface,
     which doesn't render BrowseMyFriendsSection and renders cleanly. */
