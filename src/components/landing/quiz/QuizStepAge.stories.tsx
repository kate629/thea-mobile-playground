import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepAge } from './QuizStepAge';
import { ADULT_AGE_CHIPS, KID_AGE_CHIPS } from './constants';

export default {
  title: 'Surfaces/Quiz/StepAge',
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

export const KidBabySelected = {
  name: 'Kid / Baby (0–12mo) selected',
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
        title="How old are they?"
        chips={KID_AGE_CHIPS}
        selectedAge={0.5}
        onSelectAge={() => {}}
        onNext={() => {}}
      />
    </QuizCard>
  ),
};

export const KidTeenSelected = {
  name: 'Kid / Teen (14–17) selected',
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
        title="How old is she?"
        chips={KID_AGE_CHIPS}
        selectedAge={16}
        onSelectAge={() => {}}
        onNext={() => {}}
      />
    </QuizCard>
  ),
};

export const Adult60sSelected = {
  name: 'Adult / 60s selected (Mom — alwaysAdult, no kid/adult dot)',
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
        selectedAge={65}
        onSelectAge={() => {}}
        onNext={() => {}}
      />
    </QuizCard>
  ),
};

export const Adult20sSelf = {
  name: 'Adult / 20s — Me! variant',
  render: () => (
    <QuizCard
      onBack={() => {}}
      dots={[
        { key: 'age', state: 'current' },
        { key: 'interests', state: 'upcoming' },
      ]}
    >
      <QuizStepAge
        title="How old are you?"
        chips={ADULT_AGE_CHIPS}
        selectedAge={25}
        onSelectAge={() => {}}
        onNext={() => {}}
      />
    </QuizCard>
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
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
        selectedAge={45}
        onSelectAge={() => {}}
        onNext={() => {}}
      />
    </QuizCard>
  ),
};
