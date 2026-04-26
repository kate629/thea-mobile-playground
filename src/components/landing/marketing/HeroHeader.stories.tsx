import React from 'react';
import { HeroHeader, HeroHeaderProps } from './HeroHeader';
import { SCENARIO_CARDS } from './scenarios';

export default {
  title: 'Surfaces/Marketing/HeroHeader',
  component: HeroHeader,
};

const fullyTypedFor = (i: number): HeroHeaderProps => {
  const s = SCENARIO_CARDS[i];
  return {
    phrase: s.scenario,
    typedCount: s.scenario.length,
    cursorVisible: false,
    productCard: {
      image: s.productImage,
      name: s.productName,
      brand: s.brand,
      rotation: s.rotation,
    },
    peekImages: s.peekImages,
    cardVisible: true,
  };
};

export const Default = {
  args: fullyTypedFor(0),
};

export const MidTyping = {
  args: {
    ...fullyTypedFor(2),
    typedCount: 12,
    cursorVisible: true,
  },
};

export const Swapping = {
  args: {
    ...fullyTypedFor(4),
    cardVisible: false,
  },
};

export const WithPeekImages = {
  args: fullyTypedFor(0),
};

export const ScenarioGrandma = {
  args: fullyTypedFor(1),
};

export const ScenarioRedSox = {
  args: fullyTypedFor(3),
};
