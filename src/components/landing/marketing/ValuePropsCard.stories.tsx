import React from 'react';
import { ValuePropsCard } from './ValuePropsCard';

export default {
  title: 'Landing/Marketing/ValuePropsCard',
  component: ValuePropsCard,
};

export const Default = {
  args: {
    heading: 'You love them. Let it show.',
    items: [
      {
        emoji: '💡',
        title: 'Tell us about them',
        body: "Share the little details that make them, them. We'll remember all of it.",
      },
      {
        emoji: '✨',
        title: 'Discover the magic',
        body: "We'll show you curated finds you'd never think to search for.",
      },
      {
        emoji: '🎉',
        title: 'Save now, send anytime',
        body: "Save your favorites. We'll remind you when it's time.",
      },
    ],
  },
};
