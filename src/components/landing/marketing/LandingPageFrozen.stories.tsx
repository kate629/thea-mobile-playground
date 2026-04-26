import React from 'react';
import { LandingPage, FrozenHeroSlot } from './LandingPage';

export default {
  title: 'Landing/Marketing/LandingPageFrozen',
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
