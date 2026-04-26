import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepKidOrAdult } from './QuizStepKidOrAdult';

export default {
  title: 'Surfaces/Quiz/StepKidOrAdult',
  component: QuizStepKidOrAdult,
};

export const Default = {
  render: () => (
    <QuizCard
      onBack={() => {}}
      dots={[
        { key: 'kidOrAdult', state: 'current' },
        { key: 'age', state: 'upcoming' },
        { key: 'interests', state: 'upcoming' },
      ]}
    >
      <QuizStepKidOrAdult onPick={() => {}} />
    </QuizCard>
  ),
};
