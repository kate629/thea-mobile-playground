import React from 'react';
import styled from 'styled-components';

export type AgeCategory = 'kid' | 'adult';

export interface QuizStepKidOrAdultProps {
  onPick: (category: AgeCategory) => void;
}

const Title = styled.h2`
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: hsl(var(--foreground));
`;

const Center = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const PairGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
`;

const PickTile = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  border-radius: 16px;
  border: 2px solid hsl(var(--border));
  background: transparent;
  font-family: inherit;
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease;
  &:hover {
    border-color: hsl(var(--primary) / 0.4);
    background: hsl(var(--primary) / 0.05);
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const Emoji = styled.span`
  font-size: 48px;
  line-height: 1;
`;

const PrimaryLabel = styled.span`
  font-size: 18px;
  font-weight: 600;
`;

const Sub = styled.span`
  font-size: 14px;
  color: hsl(var(--muted-foreground));
`;

export const QuizStepKidOrAdult: React.FC<QuizStepKidOrAdultProps> = ({ onPick }) => (
  <>
    <Title>Are you shopping for a kid or an adult?</Title>
    <Center>
      <PairGrid>
        <PickTile type="button" onClick={() => onPick('kid')}>
          <Emoji aria-hidden="true">👶</Emoji>
          <PrimaryLabel>Kid</PrimaryLabel>
          <Sub>(under 18)</Sub>
        </PickTile>
        <PickTile type="button" onClick={() => onPick('adult')}>
          <Emoji aria-hidden="true">🧑</Emoji>
          <PrimaryLabel>Adult</PrimaryLabel>
          <Sub>(18+)</Sub>
        </PickTile>
      </PairGrid>
    </Center>
  </>
);
