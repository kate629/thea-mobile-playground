import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepRelationship } from './QuizStepRelationship';

export default {
  title: 'Landing/Quiz/StepRelationship',
  component: QuizStepRelationship,
};

const wrap = (node: React.ReactNode) => <QuizCard>{node}</QuizCard>;

export const Empty = {
  render: () => wrap(
    <QuizStepRelationship selected="" onSelect={() => {}} onNext={() => {}} />,
  ),
};

export const SisterSelected = {
  render: () => wrap(
    <QuizStepRelationship selected="Sister" onSelect={() => {}} onNext={() => {}} />,
  ),
};

export const PartnerSelected = {
  render: () => wrap(
    <QuizStepRelationship selected="Partner" onSelect={() => {}} onNext={() => {}} />,
  ),
};
