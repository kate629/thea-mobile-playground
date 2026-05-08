import React from 'react';
import styled from 'styled-components';
import { RELATIONSHIPS } from './constants';
import { HCard } from './HCard';

export interface QuizStepRelationshipProps {
  selected: string;
  onSelect: (value: string) => void;
  /**
   * Kept for backwards compatibility with previous QuizCardAnimated
   * wiring. Sovrn auto-advances on click, so this is now unused — the
   * container drives the step transition instead. Safe to omit.
   */
  onNext?: () => void;
  title?: string;
}

const Title = styled.h2`
  margin: 0 0 6px 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: hsl(var(--foreground));
`;

const Subheader = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const QuizStepRelationship: React.FC<QuizStepRelationshipProps> = ({
  selected,
  onSelect,
  title = "Who's on your list?",
}) => (
  <>
    <Title>{title}</Title>
    <Subheader>Each person gets their own board to save ideas to.</Subheader>
    <Grid>
      {RELATIONSHIPS.map((rel) => (
        <HCard
          key={rel.value}
          emoji={rel.emoji}
          label={rel.value}
          selected={selected === rel.value}
          tall
          onClick={() => onSelect(rel.value)}
        />
      ))}
    </Grid>
  </>
);
