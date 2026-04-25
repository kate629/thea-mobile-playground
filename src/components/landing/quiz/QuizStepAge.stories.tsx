import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepAge } from './QuizStepAge';
import { ADULT_AGE_CHIPS, KID_AGE_CHIPS } from './constants';

export default {
  title: 'Landing/Quiz/StepAge',
  component: QuizStepAge,
};

export const AdultUnselected = {
  render: () => (
    <QuizCard
      onBack={() => {}}
      dots={[
        { key: 'age', state: 'current' },
        { key: 'interests', state: 'upcoming' },
      ]}
    >
      <QuizStepAge
        title="How old is she?"
        chips={ADULT_AGE_CHIPS}
        selectedAge={0}
        onSelectAge={() => {}}
        onNext={() => {}}
      />
    </QuizCard>
  ),
};

export const Adult30sSelected = {
  render: () => (
    <QuizCard
      onBack={() => {}}
      dots={[
        { key: 'age', state: 'current' },
        { key: 'interests', state: 'upcoming' },
      ]}
    >
      <QuizStepAge
        title="How old is she?"
        chips={ADULT_AGE_CHIPS}
        selectedAge={35}
        onSelectAge={() => {}}
        onNext={() => {}}
      />
    </QuizCard>
  ),
};

export const Kid6To10Selected = {
  render: () => (
    <QuizCard
      onBack={() => {}}
      dots={[
        { key: 'kidOrAdult', state: 'completed' },
        { key: 'age', state: 'current' },
        { key: 'interests', state: 'upcoming' },
      ]}
    >
      <QuizStepAge
        title="How old is he?"
        chips={KID_AGE_CHIPS}
        selectedAge={8}
        onSelectAge={() => {}}
        onNext={() => {}}
      />
    </QuizCard>
  ),
};
