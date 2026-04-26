import React from 'react';
import styled from 'styled-components';
import { AgeChip } from './constants';
import { HCard } from './HCard';

export interface QuizStepAgeProps {
  /** Pre-resolved title (e.g. "How old is she?") */
  title: string;
  chips: AgeChip[];
  selectedAge: number;
  onSelectAge: (value: number) => void;
  /**
   * Kept for backwards compatibility with previous QuizCardAnimated
   * wiring. Sovrn auto-advances on click, so this is unused — the
   * container drives the step transition instead.
   */
  onNext?: () => void;
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
  gap: 8px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const QuizStepAge: React.FC<QuizStepAgeProps> = ({ title, chips, selectedAge, onSelectAge }) => (
  <>
    <Title>{title}</Title>
    <Grid>
      {chips.map((chip) => (
        <HCard
          key={chip.value}
          emoji={chip.emoji}
          label={chip.label}
          selected={selectedAge === chip.value}
          onClick={() => onSelectAge(chip.value)}
        />
      ))}
    </Grid>
  </>
);
