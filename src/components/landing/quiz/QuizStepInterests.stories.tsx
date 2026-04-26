import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepInterests } from './QuizStepInterests';
import { getInterestEmoji, getInterestPills, getPlaceholderText } from './ageBasedContent';
import { Gender } from './constants';

export default {
  title: 'Surfaces/Quiz/StepInterests',
  component: QuizStepInterests,
};

/**
 * Age affects interests. The `getInterestPills(age, gender)` helper returns
 * one of 10 age-bucketed pill sets — these stories cover every bucket plus
 * the male-pill flip ("Beauty" → "Grooming") so reviewers can sanity-check
 * the personalization without running the whole flow.
 *
 * Source: `ageBasedContent.ts:24–141` (10 AGE_GROUPS).
 */

interface BuildArgs {
  age: number;
  gender: Gender;
  title: string;
  selectedInterests?: string[];
  textareaValue?: string;
}

const buildPills = (age: number, gender: Gender) =>
  getInterestPills(age, gender).map((label) => ({ label, emoji: getInterestEmoji(label, gender) }));

const Variant: React.FC<BuildArgs> = ({
  age,
  gender,
  title,
  selectedInterests = [],
  textareaValue = '',
}) => (
  <QuizCard onBack={() => {}} progressPercent={100}>
    <QuizStepInterests
      title={title}
      pills={buildPills(age, gender)}
      selectedInterests={selectedInterests}
      onToggleInterest={() => {}}
      textareaValue={textareaValue}
      textareaPlaceholder={getPlaceholderText(gender, age)}
      onTextareaChange={() => {}}
      onSubmit={() => {}}
      canSubmit={selectedInterests.length >= 2}
    />
  </QuizCard>
);

/* ============================================================
   Adult variants (kept as primary set for parity)
   ============================================================ */
export const AdultFemaleEmpty = {
  name: 'Adult / Female (35) — empty',
  render: () => <Variant age={35} gender="female" title="What does she like?" />,
};

export const AdultFemaleFilled = {
  name: 'Adult / Female (35) — with selections',
  render: () => (
    <Variant
      age={35}
      gender="female"
      title="What does she like?"
      selectedInterests={['Books', 'Cooking', 'Travel']}
      textareaValue="She just moved to NYC and loves trying new restaurants."
    />
  ),
};

/**
 * Male-pill flip: "Beauty" becomes "Grooming". Same age bucket as
 * AdultFemaleFilled so reviewers can diff the pill set directly.
 */
export const AdultMaleFilled = {
  name: 'Adult / Male (35) — Beauty→Grooming flip',
  render: () => (
    <Variant
      age={35}
      gender="male"
      title="What does he like?"
      selectedInterests={['Books', 'Sports', 'Outdoors']}
      textareaValue="He's into trail running and just got into espresso."
    />
  ),
};

export const AdultOther = {
  name: 'Adult / Other (35) — gender-neutral copy',
  render: () => <Variant age={35} gender="other" title="What do they like?" />,
};

/* ============================================================
   Kid age buckets — each shows a noticeably different pill set
   ============================================================ */
export const BabyGirl = {
  name: 'Baby / Female (~6mo)',
  render: () => <Variant age={0.5} gender="female" title="What kind of gift are you looking for?" />,
};

export const ToddlerNeutral = {
  name: 'Toddler / Other (~1.5y)',
  render: () => <Variant age={1.5} gender="other" title="What do they like?" />,
};

export const PreschoolBoy = {
  name: 'Preschool / Male (~4y)',
  render: () => (
    <Variant
      age={4}
      gender="male"
      title="What does he like?"
      selectedInterests={['Vehicles', 'Dinosaurs']}
    />
  ),
};

export const KidGirl = {
  name: 'Kid / Female (~8y)',
  render: () => (
    <Variant
      age={8}
      gender="female"
      title="What does she like?"
      selectedInterests={['Arts & crafts', 'Dance']}
    />
  ),
};

export const TweenBoy = {
  name: 'Tween / Male (~12y)',
  render: () => (
    <Variant
      age={12}
      gender="male"
      title="What does he like?"
      selectedInterests={['Games', 'Sports', 'Music']}
    />
  ),
};

export const TeenFemale = {
  name: 'Teen / Female (~16y)',
  render: () => (
    <Variant
      age={16}
      gender="female"
      title="What does she like?"
      selectedInterests={['Clothes', 'Music', 'Outdoors']}
      textareaValue="She just started painting in oils and listens to a lot of indie."
    />
  ),
};

/* ============================================================
   Adult age buckets (25+ shares a pill set, so we pick representative ages)
   ============================================================ */
export const YoungAdultFemale = {
  name: 'Young Adult / Female (~22y)',
  render: () => (
    <Variant
      age={22}
      gender="female"
      title="What does she like?"
      selectedInterests={['Coffee', 'Plants', 'Travel']}
    />
  ),
};

export const SixtiesFemale = {
  name: '60s / Female (Mom)',
  render: () => (
    <Variant
      age={65}
      gender="female"
      title="What does she like?"
      selectedInterests={['Cooking', 'Books', 'Hosting']}
      textareaValue="She loves entertaining and just got into pottery."
    />
  ),
};

/* ============================================================
   Heavy-selection state — exercises the "many" interest case to
   verify wrapping + chip count don't break the layout.
   ============================================================ */
export const ManyInterestsSelected = {
  name: 'Many interests selected (8+)',
  render: () => (
    <Variant
      age={35}
      gender="other"
      title="What do they like?"
      selectedInterests={[
        'Books',
        'Games',
        'Cooking',
        'Music',
        'Travel',
        'Outdoors',
        'Crafts',
        'Plants',
        'Hosting',
      ]}
      textareaValue="They're a generalist — into a bit of everything. Curious about new hobbies."
    />
  ),
};

/* ============================================================
   Mobile viewport (375×667) — confirm wrap behavior on narrow screens
   ============================================================ */
export const MobileKid = {
  name: 'Mobile / Kid Female (~8y)',
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <Variant
      age={8}
      gender="female"
      title="What does she like?"
      selectedInterests={['Arts & crafts']}
    />
  ),
};

export const MobileAdult = {
  name: 'Mobile / Adult Female (35)',
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <Variant age={35} gender="female" title="What does she like?" selectedInterests={['Cooking']} />
  ),
};
