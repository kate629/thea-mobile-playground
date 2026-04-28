import React from 'react';
import { ValuePropsCard } from './ValuePropsCard';

export default {
  title: 'Surfaces/Marketing/ValuePropsCard',
  component: ValuePropsCard,
};

const ITEMS = [
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
];

/**
 * Default — heading rendered on two lines, mirroring the live `LandingPage`
 * default. Pre-2026-04-27 the heading rendered as a single line; Kate QA
 * asked for "Let it show." to drop to its own line below "You love them."
 */
export const Default = {
  render: () => (
    <ValuePropsCard
      heading={
        <>
          You love them.
          <br />
          Let it show.
        </>
      }
      items={ITEMS}
    />
  ),
};

/**
 * Single-line heading retained as a regression check that the prop still
 * accepts a plain string (`heading: React.ReactNode` is a strict superset
 * of `string`). Useful for any caller that wants the old layout.
 */
export const SingleLineHeading = {
  args: {
    heading: 'You love them. Let it show.',
    items: ITEMS,
  },
};
