import React from 'react';
import { ResultsHeader } from './ResultsHeader';
import { Button } from '../../ui/Button';
import { ResultsTabKey } from './types';

export default {
  title: 'Landing/Results/ResultsHeader',
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
