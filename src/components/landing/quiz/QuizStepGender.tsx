import React from 'react';
import styled from 'styled-components';
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
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

/**
 * Step-specific vertical card for the gender step. The other quiz steps use
 * the shared `HCard` (emoji-left + label-right), but for gender we want the
 * symbol to sit centered directly above its label so the ♀ / ♂ glyphs read
 * cleanly. Built locally here rather than touching the shared HCard primitive.
 */
const GenderButton = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 12px;
  border: 1px solid
    ${({ $selected }) => ($selected ? 'hsl(var(--primary))' : 'hsl(var(--border))')};
  background: ${({ $selected }) =>
    $selected ? 'hsl(var(--primary) / 0.10)' : 'transparent'};
  box-shadow: ${({ $selected }) =>
    $selected ? '0 0 0 1px hsl(var(--primary) / 0.30)' : 'none'};
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  color: hsl(var(--foreground));
  transition: background 150ms ease, border-color 150ms ease;
  &:hover {
    background: ${({ $selected }) =>
      $selected ? 'hsl(var(--primary) / 0.10)' : 'hsl(var(--muted) / 0.30)'};
  }
  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const Emoji = styled.span`
  display: block;
  font-size: 28px;
  line-height: 1;
  text-align: center;
  /* Glyphs like ♀ / ♂ aren't centered within their em-box, so a tiny
     translate keeps them visually aligned over the label below. */
  font-variant-emoji: text;
`;

const Label = styled.span`
  display: block;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
`;

export const QuizStepGender: React.FC<QuizStepGenderProps> = ({ title, selected, onSelect }) => (
  <>
    <Title>{title}</Title>
    <Grid>
      {QUIZ_GENDER_OPTIONS.map((g) => (
        <GenderButton
          key={g.value}
          type="button"
          $selected={selected === g.value}
          onClick={() => onSelect(g.value)}
          aria-pressed={selected === g.value}
        >
          <Emoji aria-hidden>{g.emoji}</Emoji>
          <Label>{g.label}</Label>
        </GenderButton>
      ))}
    </Grid>
  </>
);
