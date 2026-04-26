import React from 'react';
import { ProfileDrawer } from './ProfileDrawer';
import { ProfileDrawerControlled } from './ProfileDrawerControlled';
import { ProfileDraft } from './types';
import { Button } from '../../ui/Button';
import { getInterestPills, getPlaceholderText } from '../quiz/ageBasedContent';

export default {
  title: 'Surfaces/Results/ProfileDrawer',
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

/* ============================================================
   Variation: max interests selected — exercises Chip wrap behavior
   plus the "many active vibes" combo to verify spacing under load.
   ============================================================ */
export const MaxInterests = {
  render: () => (
    <ProfileDrawer
      open
      onClose={() => {}}
      draft={{
        ...draftFilled,
        interests: interestPills.slice(0, 8),
        vibes: ['Sentimental', 'Practical', 'Cozy', 'Whimsical', 'Sleek', 'Bold'],
      }}
      interestPills={interestPills}
      freeformPlaceholder={placeholder}
      onChange={() => {}}
      onUpdatePicks={() => {}}
      onRemove={() => {}}
    />
  ),
};

/* ============================================================
   Variation: dad (alwaysAdult relationship) — exercises male pill
   flip ("Beauty" → "Grooming") and the "What does he like?"
   placeholder copy.
   ============================================================ */
const dadInterestPills = getInterestPills(70, 'male');
const dadPlaceholder = getPlaceholderText('male', 70);

export const FilledDad = {
  render: () => (
    <ProfileDrawer
      open
      onClose={() => {}}
      draft={{
        emoji: '⛳',
        name: 'Dad',
        birthMonth: 9,
        birthDay: 3,
        gender: 'male',
        relationship: 'Dad',
        age: 70,
        occasion: 'Father’s Day',
        priceMin: 25,
        priceMax: 200,
        interests: ['Books', 'Outdoors', 'Cooking', 'Sports'],
        vibes: ['Practical', 'Classic'],
        moreAbout: 'He just retired and is getting into woodworking.',
      }}
      interestPills={dadInterestPills}
      freeformPlaceholder={dadPlaceholder}
      onChange={() => {}}
      onUpdatePicks={() => {}}
      onRemove={() => {}}
    />
  ),
};

/* ============================================================
   Variation: kid mode — different relationship + age bucket changes
   the interest pill list dramatically.
   ============================================================ */
const sonInterestPills = getInterestPills(8, 'male');
const sonPlaceholder = getPlaceholderText('male', 8);

export const FilledKid = {
  render: () => (
    <ProfileDrawer
      open
      onClose={() => {}}
      draft={{
        emoji: '⭐',
        name: 'Son',
        birthMonth: 3,
        birthDay: 18,
        gender: 'male',
        relationship: 'Son',
        age: 8,
        occasion: 'Birthday',
        priceMin: 0,
        priceMax: 60,
        interests: ['Sports', 'Games', 'Space'],
        vibes: ['Playful'],
        moreAbout: 'He just started playing little league and loves astronaut books.',
      }}
      interestPills={sonInterestPills}
      freeformPlaceholder={sonPlaceholder}
      onChange={() => {}}
      onUpdatePicks={() => {}}
      onRemove={() => {}}
    />
  ),
};

/* ============================================================
   Mobile viewport — verifies the drawer's responsive width.
   ============================================================ */
export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
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
