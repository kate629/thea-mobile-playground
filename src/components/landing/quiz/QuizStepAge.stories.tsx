import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepAge } from './QuizStepAge';
import { ADULT_AGE_CHIPS } from './constants';

export default {
  title: 'Surfaces/Quiz/StepAge',
  component: QuizStepAge,
};

const wrap = (node: React.ReactNode) => (
  <QuizCard onBack={() => {}} progressPercent={(2 / 4) * 100}>{node}</QuizCard>
);

export const Unselected = {
  render: () => wrap(
    <QuizStepAge
      title="How old is she?"
      chips={ADULT_AGE_CHIPS}
      selectedAge={0}
      onSelectAge={() => {}}
    />,
  ),
};

export const Twenties = {
  name: '20s selected (Me! variant)',
  render: () => wrap(
    <QuizStepAge
      title="How old are you?"
      chips={ADULT_AGE_CHIPS}
      selectedAge={25}
      onSelectAge={() => {}}
    />,
  ),
};

export const Thirties = {
  render: () => wrap(
    <QuizStepAge
      title="How old is she?"
      chips={ADULT_AGE_CHIPS}
      selectedAge={35}
      onSelectAge={() => {}}
    />,
  ),
};

export const Forties = {
  render: () => wrap(
    <QuizStepAge
      title="How old is he?"
      chips={ADULT_AGE_CHIPS}
      selectedAge={45}
      onSelectAge={() => {}}
    />,
  ),
};

export const Sixties = {
  name: '60s selected (Mom variant)',
  render: () => wrap(
    <QuizStepAge
      title="How old is she?"
      chips={ADULT_AGE_CHIPS}
      selectedAge={65}
      onSelectAge={() => {}}
    />,
  ),
};

export const NeutralTitle = {
  name: 'Neutral title (Other / Friend with `other` gender)',
  render: () => wrap(
    <QuizStepAge
      title="How old are they?"
      chips={ADULT_AGE_CHIPS}
      selectedAge={0}
      onSelectAge={() => {}}
    />,
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => wrap(
    <QuizStepAge
      title="How old is she?"
      chips={ADULT_AGE_CHIPS}
      selectedAge={45}
      onSelectAge={() => {}}
    />,
  ),
};
