import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepInterests } from './QuizStepInterests';
import { getInterestEmoji, getInterestPills, getPlaceholderText } from './ageBasedContent';

export default {
  title: 'Landing/Quiz/StepInterests',
  component: QuizStepInterests,
};

const adultFemalePills = getInterestPills(35, 'female').map((label) => ({
  label,
  emoji: getInterestEmoji(label, 'female'),
}));
const kidPills = getInterestPills(8).map((label) => ({
  label,
  emoji: getInterestEmoji(label),
}));

const dots = [
  { key: 'kidOrAdult' as const, state: 'completed' as const },
  { key: 'age' as const, state: 'completed' as const },
  { key: 'interests' as const, state: 'current' as const },
];

export const AdultEmpty = {
  render: () => (
    <QuizCard onBack={() => {}} dots={dots.slice(1)}>
      <QuizStepInterests
        title="What does she like?"
        pills={adultFemalePills}
        selectedInterests={[]}
        onToggleInterest={() => {}}
        textareaValue=""
        textareaPlaceholder={getPlaceholderText('female', 35)}
        onTextareaChange={() => {}}
        onSubmit={() => {}}
        canSubmit={false}
      />
    </QuizCard>
  ),
};

export const AdultWithSelections = {
  render: () => (
    <QuizCard onBack={() => {}} dots={dots.slice(1)}>
      <QuizStepInterests
        title="What does she like?"
        pills={adultFemalePills}
        selectedInterests={['Books', 'Cooking', 'Travel']}
        onToggleInterest={() => {}}
        textareaValue="She just moved to NYC and loves trying new restaurants."
        textareaPlaceholder={getPlaceholderText('female', 35)}
        onTextareaChange={() => {}}
        onSubmit={() => {}}
        canSubmit
      />
    </QuizCard>
  ),
};

export const KidWithSelections = {
  render: () => (
    <QuizCard onBack={() => {}} dots={dots}>
      <QuizStepInterests
        title="What does he like?"
        pills={kidPills}
        selectedInterests={['Sports', 'Space']}
        onToggleInterest={() => {}}
        textareaValue=""
        textareaPlaceholder={getPlaceholderText('male', 8)}
        onTextareaChange={() => {}}
        onSubmit={() => {}}
        canSubmit
      />
    </QuizCard>
  ),
};
