import React from 'react';
import styled from 'styled-components';
import { LifeStage } from './constants';
import { HCard } from './HCard';

export interface QuizStepLifeStageProps {
  /** Same headline as the age step ("How old is she?" / "How old is he?"
   *  / "How old are they?") — the lifeStage step is the first half of a
   *  two-pass narrowing of the same question. */
  title: string;
  selected: LifeStage | null;
  onSelect: (value: LifeStage) => void;
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
`;

export const QuizStepLifeStage: React.FC<QuizStepLifeStageProps> = ({
  title,
  selected,
  onSelect,
}) => (
  <>
    <Title>{title}</Title>
    <Grid>
      <HCard
        emoji="🧑"
        label="Adult"
        selected={selected === 'adult'}
        tall
        onClick={() => onSelect('adult')}
      />
      <HCard
        emoji="🧒"
        label="Child"
        selected={selected === 'child'}
        tall
        onClick={() => onSelect('child')}
      />
    </Grid>
  </>
);
