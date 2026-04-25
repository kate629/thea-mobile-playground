import React from 'react';
import { HeroHeaderAnimated } from './HeroHeaderAnimated';

export default {
  title: 'Landing/HeroHeaderAnimated',
  component: HeroHeaderAnimated,
  /* Live animation — non-deterministic. Excluded from Happo. Use the frozen
     Landing/HeroHeader stories for visual regression. */
  parameters: { happo: false },
};

export const Live = {
  args: {},
};
