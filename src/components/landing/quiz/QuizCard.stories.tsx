import React from 'react';
import { QuizCard } from './QuizCard';

export default {
  title: 'Surfaces/Quiz/QuizCard',
  component: QuizCard,
};

const Filler = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Quiz step heading</h2>
    <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))' }}>
      Inner step body content goes here.
    </p>
  </div>
);

export const Empty = {
  render: () => (
    <QuizCard>
      <Filler />
    </QuizCard>
  ),
};

export const WithBackButton = {
  render: () => (
    <QuizCard onBack={() => {}}>
      <Filler />
    </QuizCard>
  ),
};

export const WithDotsCurrentFirst = {
  render: () => (
    <QuizCard
      onBack={() => {}}
      dots={[
        { key: 'relationship', state: 'current' },
        { key: 'gender', state: 'upcoming' },
        { key: 'age', state: 'upcoming' },
        { key: 'occasion', state: 'upcoming' },
        { key: 'interests', state: 'upcoming' },
      ]}
    >
      <Filler />
    </QuizCard>
  ),
};

export const WithDotsMidFlow = {
  render: () => (
    <QuizCard
      onBack={() => {}}
      dots={[
        { key: 'relationship', state: 'completed' },
        { key: 'gender', state: 'completed' },
        { key: 'age', state: 'current' },
        { key: 'occasion', state: 'upcoming' },
        { key: 'interests', state: 'upcoming' },
      ]}
    >
      <Filler />
    </QuizCard>
  ),
};

export const WithProgressBar = {
  name: 'With progress bar (sovrn-style)',
  render: () => (
    <QuizCard onBack={() => {}} progressPercent={50}>
      <Filler />
    </QuizCard>
  ),
};
