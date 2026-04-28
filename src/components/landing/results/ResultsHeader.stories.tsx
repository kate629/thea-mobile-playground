import React from 'react';
import { ResultsHeader } from './ResultsHeader';
import { Button } from '../../ui/Button';
import { ResultsTabKey } from './types';

export default {
  title: 'Surfaces/Results/ResultsHeader',
  component: ResultsHeader,
};

const baseArgs = {
  personEmoji: '🌷',
  personName: 'Mom',
  interestsLabel: 'Cooking, Travel +2',
  onProfilePillClick: () => {},
  onTabChange: () => {},
  rightActions: <Button label="Account" variant="ghost" size="md" />,
};

export const Default = {
  render: () => (
    <div style={{ background: '#fff', minHeight: 240 }}>
      <ResultsHeader
        {...baseArgs}
        activeTab="recommended"
        likedCount={0}
        purchasedCount={0}
      />
    </div>
  ),
};

export const WithLikedBadge = {
  render: () => (
    <div style={{ background: '#fff', minHeight: 240 }}>
      <ResultsHeader
        {...baseArgs}
        activeTab="recommended"
        likedCount={3}
        purchasedCount={0}
      />
    </div>
  ),
};

export const BothBadges = {
  render: () => (
    <div style={{ background: '#fff', minHeight: 240 }}>
      <ResultsHeader
        {...baseArgs}
        activeTab="recommended"
        likedCount={3}
        purchasedCount={2}
      />
    </div>
  ),
};

export const ActivePurchased = {
  render: () => (
    <div style={{ background: '#fff', minHeight: 240 }}>
      <ResultsHeader
        {...baseArgs}
        activeTab="purchased"
        likedCount={3}
        purchasedCount={2}
      />
    </div>
  ),
};

/**
 * Mobile-only layout — pinned to the small viewport so Happo baselines the
 * mobile composition of the embedded SiteHeader + profile pill explicitly.
 */
export const Mobile = {
  parameters: { happo: { targets: ['chrome-small'] } },
  render: () => (
    <div style={{ background: '#fff', minHeight: 240 }}>
      <ResultsHeader
        {...baseArgs}
        activeTab="recommended"
        likedCount={0}
        purchasedCount={0}
      />
    </div>
  ),
};

// Scrolled-state story for sheet bug #41: shows the header pinned to the top
// while page content scrolls underneath. The fixed-height scroll container
// makes the sticky behavior visible at story time and gives Happo a stable
// pixel snapshot to diff against.
export const Scrolled = {
  render: () => (
    <div
      style={{
        background: '#fff',
        height: 480,
        overflowY: 'scroll',
      }}
      ref={(el) => {
        // Pre-scroll so the sticky bar is visibly pinned in the snapshot.
        if (el) el.scrollTop = 200;
      }}
    >
      <ResultsHeader
        {...baseArgs}
        activeTab="recommended"
        likedCount={2}
        purchasedCount={0}
      />
      <div style={{ padding: 24, height: 800 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <p key={i} style={{ margin: '0 0 24px' }}>
            Sample scrollable content row {i + 1}. The sticky header should
            remain pinned to the top while this text scrolls beneath it.
          </p>
        ))}
      </div>
    </div>
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [tab, setTab] = React.useState<ResultsTabKey>('recommended');
    const [likedCount, setLikedCount] = React.useState(0);
    const [pulse, setPulse] = React.useState(0);
    return (
      <div style={{ background: '#fff', minHeight: 320 }}>
        <ResultsHeader
          {...baseArgs}
          activeTab={tab}
          onTabChange={setTab}
          likedCount={likedCount}
          purchasedCount={0}
          likedBadgePulseKey={pulse}
        />
        <div style={{ padding: 24 }}>
          <Button
            label="Add a like"
            onClick={() => {
              setLikedCount((c) => c + 1);
              setPulse((p) => p + 1);
            }}
          />
        </div>
      </div>
    );
  },
};
