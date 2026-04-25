import React from 'react';
import styled from 'styled-components';
import { RELATIONSHIPS } from './constants';
import { QuizNextButton } from './QuizNextButton';

export interface QuizStepRelationshipProps {
  selected: string;
  onSelect: (value: string) => void;
  onNext: () => void;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(5, 1fr);
  }
`;

const Tile = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
  background: ${({ $selected }) => ($selected ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.4)')};
  border: 1px solid ${({ $selected }) => ($selected ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.6)')};
  box-shadow: ${({ $selected }) => ($selected ? '0 0 0 1px hsl(var(--primary) / 0.3)' : 'none')};
  color: hsl(var(--foreground));
  &:hover {
    border-color: ${({ $selected }) => ($selected ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)')};
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const TileEmoji = styled.span`
  font-size: 24px;
  line-height: 1;
`;

const TileLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.15;
  text-align: center;
`;

const NextWrap = styled.div`
  margin-top: auto;
  padding-top: 16px;
`;

export const QuizStepRelationship: React.FC<QuizStepRelationshipProps> = ({ selected, onSelect, onNext }) => (
  <>
    <Title>Who's on your list?</Title>
    <Grid>
      {RELATIONSHIPS.map((rel) => (
        <Tile
          key={rel.value}
          type="button"
          $selected={selected === rel.value}
          onClick={() => onSelect(rel.value)}
          aria-pressed={selected === rel.value}
        >
          <TileEmoji aria-hidden="true">{rel.emoji}</TileEmoji>
          <TileLabel>{rel.value}</TileLabel>
        </Tile>
      ))}
    </Grid>
    <NextWrap>
      <QuizNextButton label="Next" disabled={!selected} onClick={onNext} />
    </NextWrap>
  </>
);
