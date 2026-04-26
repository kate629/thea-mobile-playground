import React from 'react';
import styled from 'styled-components';
import { HCard } from './HCard';
import { Gender } from './constants';

export interface QuizGenderOption {
  value: Gender;
  label: string;
  emoji: string;
}

export const QUIZ_GENDER_OPTIONS: QuizGenderOption[] = [
  { value: 'female', label: 'Female', emoji: '♀️' },
  { value: 'male', label: 'Male', emoji: '♂️' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

export interface QuizStepGenderProps {
  /** Pre-resolved title (e.g. "What's their gender?" or "What's your gender?"). */
  title: string;
  selected: Gender | null;
  onSelect: (gender: Gender) => void;
}

const Title = styled.h2`
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: hsl(var(--foreground));
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const QuizStepGender: React.FC<QuizStepGenderProps> = ({ title, selected, onSelect }) => (
  <>
    <Title>{title}</Title>
    <Grid>
      {QUIZ_GENDER_OPTIONS.map((g) => (
        <HCard
          key={g.value}
          emoji={g.emoji}
          label={g.label}
          selected={selected === g.value}
          onClick={() => onSelect(g.value)}
        />
      ))}
    </Grid>
  </>
);
