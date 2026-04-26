import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepRelationship } from './QuizStepRelationship';

export default {
  title: 'Surfaces/Quiz/StepRelationship',
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

export const MomSelected = {
  name: 'Mom selected (alwaysAdult — skips kid/adult step)',
  render: () => wrap(
    <QuizStepRelationship selected="Mom" onSelect={() => {}} onNext={() => {}} />,
  ),
};

export const FriendSelected = {
  name: 'Friend selected (gender-neutral)',
  render: () => wrap(
    <QuizStepRelationship selected="Friend" onSelect={() => {}} onNext={() => {}} />,
  ),
};

export const MeSelected = {
  name: 'Me! selected (alwaysAdult, self-shopping)',
  render: () => wrap(
    <QuizStepRelationship selected="Me!" onSelect={() => {}} onNext={() => {}} />,
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => wrap(
    <QuizStepRelationship selected="" onSelect={() => {}} onNext={() => {}} />,
  ),
};
