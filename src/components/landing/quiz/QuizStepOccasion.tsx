import React from 'react';
import styled from 'styled-components';
import { HCard } from './HCard';

export interface QuizOccasionItem {
  value: string;
  label: string;
  emoji: string;
}

export interface QuizStepOccasionProps {
  options: QuizOccasionItem[];
  selected: string;
  onSelect: (value: string) => void;
  title?: string;
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

export const QuizStepOccasion: React.FC<QuizStepOccasionProps> = ({
  options,
  selected,
  onSelect,
  title = "What's the occasion?",
}) => (
  <>
    <Title>{title}</Title>
    <Grid>
      {options.map((o) => (
        <HCard
          key={o.value}
          emoji={o.emoji}
          label={o.label}
          selected={selected === o.value}
          onClick={() => onSelect(o.value)}
        />
      ))}
    </Grid>
  </>
);
