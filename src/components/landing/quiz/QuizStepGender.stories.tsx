import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepGender } from './QuizStepGender';

export default {
  title: 'Surfaces/Quiz/StepGender',
  component: QuizStepGender,
};

const wrap = (node: React.ReactNode) => (
  <QuizCard onBack={() => {}} progressPercent={(1.5 / 4) * 100}>{node}</QuizCard>
);

export const Empty = {
  render: () => wrap(
    <QuizStepGender title="What's their gender?" selected={null} onSelect={() => {}} />,
  ),
};

export const FemaleSelected = {
  render: () => wrap(
    <QuizStepGender title="What's their gender?" selected="female" onSelect={() => {}} />,
  ),
};

export const MaleSelected = {
  render: () => wrap(
    <QuizStepGender title="What's their gender?" selected="male" onSelect={() => {}} />,
  ),
};

export const OtherSelected = {
  render: () => wrap(
    <QuizStepGender title="What's their gender?" selected="other" onSelect={() => {}} />,
  ),
};

export const SelfTitle = {
  name: 'Me! variant — "What\'s your gender?"',
  render: () => wrap(
    <QuizStepGender title="What's your gender?" selected={null} onSelect={() => {}} />,
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => wrap(
    <QuizStepGender title="What's their gender?" selected={null} onSelect={() => {}} />,
  ),
};
