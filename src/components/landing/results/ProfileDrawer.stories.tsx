import React from 'react';
import { ProfileDrawer } from './ProfileDrawer';
import { ProfileDrawerControlled } from './ProfileDrawerControlled';
import { ProfileDraft } from './types';
import { Button } from '../../ui/Button';
import { getInterestPills, getPlaceholderText } from '../quiz/ageBasedContent';

export default {
  title: 'Landing/Results/ProfileDrawer',
  component: ProfileDrawer,
};

const draftEmpty: ProfileDraft = {
  emoji: '🌷',
  name: '',
  priceMin: 0,
  priceMax: 100,
  interests: [],
  vibes: [],
  moreAbout: '',
};

const draftFilled: ProfileDraft = {
  emoji: '🌷',
  name: 'Mom',
  birthMonth: 6,
  birthDay: 14,
  gender: 'female',
  relationship: 'Mom',
  age: 65,
  occasion: 'Birthday',
  priceMin: 0,
  priceMax: 150,
  interests: ['Cooking', 'Travel', 'Books'],
  vibes: ['Sentimental', 'Practical', 'Cozy'],
  moreAbout: "She's been getting into pottery lately and loves a good cup of tea.",
};

const interestPills = getInterestPills(65, 'female');
const placeholder = getPlaceholderText('female', 65);

export const EmptyDraft = {
  render: () => (
    <ProfileDrawer
      open
      onClose={() => {}}
      draft={draftEmpty}
      interestPills={interestPills}
      freeformPlaceholder={placeholder}
      onChange={() => {}}
      onUpdatePicks={() => {}}
      onRemove={() => {}}
    />
  ),
};

export const Filled = {
  render: () => (
    <ProfileDrawer
      open
      onClose={() => {}}
      draft={draftFilled}
      interestPills={interestPills}
      freeformPlaceholder={placeholder}
      onChange={() => {}}
      onUpdatePicks={() => {}}
      onRemove={() => {}}
    />
  ),
};

export const MeMode = {
  render: () => (
    <ProfileDrawer
      open
      onClose={() => {}}
      isMe
      draft={{ ...draftFilled, name: 'Me', emoji: '🪩' }}
      interestPills={interestPills}
      freeformPlaceholder={placeholder}
      onChange={() => {}}
      onUpdatePicks={() => {}}
    />
  ),
};

export const WithSavedHints = {
  render: () => (
    <ProfileDrawer
      open
      onClose={() => {}}
      draft={draftFilled}
      savedHints={{ name: true, interests: true }}
      interestPills={interestPills}
      freeformPlaceholder={placeholder}
      onChange={() => {}}
      onUpdatePicks={() => {}}
      onRemove={() => {}}
    />
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [signal, setSignal] = React.useState(0);
    return (
      <div style={{ padding: 32 }}>
        <Button label="Open profile drawer" onClick={() => setSignal((s) => s + 1)} />
        <ProfileDrawerControlled
          initial={draftFilled}
          interestPills={interestPills}
          freeformPlaceholder={placeholder}
          externalOpenSignal={signal}
          onCommit={(next) => {
            // eslint-disable-next-line no-console
            console.log('Update picks:', next);
          }}
          onRemove={() => alert('Removed')}
        />
      </div>
    );
  },
};
