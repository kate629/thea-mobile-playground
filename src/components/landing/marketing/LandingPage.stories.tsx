import React from 'react';
import { LandingPage } from './LandingPage';

export default {
  title: 'Landing/Marketing/LandingPage',
  component: LandingPage,
  /* Live hero animation — non-deterministic. The frozen variant in
     LandingPageFrozen.stories is the deterministic Happo target. */
  parameters: { happo: false },
};

export const Live = {
  args: {},
};
