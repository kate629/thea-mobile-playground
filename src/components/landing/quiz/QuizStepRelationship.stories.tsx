import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepRelationship } from './QuizStepRelationship';

export default {
  title: 'Surfaces/Quiz/StepRelationship',
  component: QuizStepRelationship,
};

const wrap = (node: React.ReactNode) => (
  <QuizCard progressPercent={(1 / 4) * 100}>{node}</QuizCard>
);

export const Empty = {
  render: () => wrap(<QuizStepRelationship selected="" onSelect={() => {}} />),
};

export const SisterSelected = {
  render: () => wrap(<QuizStepRelationship selected="Sister" onSelect={() => {}} />),
};

export const PartnerSelected = {
  name: 'Partner selected (will trigger gender step)',
  render: () => wrap(<QuizStepRelationship selected="Partner" onSelect={() => {}} />),
};

export const MomSelected = {
  name: 'Mom selected (gender inferred — skips gender step)',
  render: () => wrap(<QuizStepRelationship selected="Mom" onSelect={() => {}} />),
};

export const FriendSelected = {
  name: 'Friend selected (will trigger gender step)',
  render: () => wrap(<QuizStepRelationship selected="Friend" onSelect={() => {}} />),
};

export const MeSelected = {
  name: 'Me! selected (self-shopping; will trigger gender step)',
  render: () => wrap(<QuizStepRelationship selected="Me!" onSelect={() => {}} />),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => wrap(<QuizStepRelationship selected="" onSelect={() => {}} />),
};
