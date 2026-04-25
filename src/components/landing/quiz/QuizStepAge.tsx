import React from 'react';
import styled from 'styled-components';
import { AgeChip } from './constants';
import { QuizNextButton } from './QuizNextButton';

export interface QuizStepAgeProps {
  /** Pre-resolved title (e.g. "How old is she?") */
  title: string;
  chips: AgeChip[];
  selectedAge: number;
  onSelectAge: (value: number) => void;
  onNext: () => void;
}

const Title = styled.h2`
  margin: 0 0 16px 0;
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
  width: 100%;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const ChipTile = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ $selected }) => ($selected ? 'hsl(var(--primary) / 0.1)' : 'transparent')};
  border: 1px solid ${({ $selected }) => ($selected ? 'hsl(var(--primary))' : 'hsl(var(--border))')};
  box-shadow: ${({ $selected }) => ($selected ? '0 0 0 1px hsl(var(--primary) / 0.3)' : 'none')};
  cursor: pointer;
  font-family: inherit;
  color: hsl(var(--foreground));
  transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
  &:hover {
    border-color: ${({ $selected }) => ($selected ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)')};
    background: ${({ $selected }) => ($selected ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.6)')};
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const ChipEmoji = styled.span`
  font-size: 24px;
  line-height: 1;
`;

const ChipLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  line-height: 1.15;
`;

const Footer = styled.div`
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const QuizStepAge: React.FC<QuizStepAgeProps> = ({
  title,
  chips,
  selectedAge,
  onSelectAge,
  onNext,
}) => (
  <>
    <Title>{title}</Title>
    <Center>
      <Grid>
        {chips.map((chip) => (
          <ChipTile
            key={chip.value}
            type="button"
            $selected={selectedAge === chip.value}
            onClick={() => onSelectAge(chip.value)}
            aria-pressed={selectedAge === chip.value}
          >
            <ChipEmoji aria-hidden="true">{chip.emoji}</ChipEmoji>
            <ChipLabel>{chip.label}</ChipLabel>
          </ChipTile>
        ))}
      </Grid>
    </Center>
    <Footer>
      <QuizNextButton label="Next" disabled={!selectedAge} onClick={onNext} />
    </Footer>
  </>
);
