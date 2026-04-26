import React from 'react';
import styled from 'styled-components';

/**
 * Horizontal selectable card used by every single-select quiz step
 * (relationship, gender, age, occasion). Mirrors sovrn's `HCard`
 * (Quiz.tsx:363-377): emoji on the left, label on the right, full-width.
 */
export interface HCardProps {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  /** Use a slightly taller variant for the relationship step. */
  tall?: boolean;
}

const Button = styled.button<{ $selected: boolean; $tall: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${({ $tall }) => ($tall ? '16px 16px' : '12px 16px')};
  border-radius: 12px;
  border: 1px solid
    ${({ $selected }) => ($selected ? 'hsl(var(--primary))' : 'hsl(var(--border))')};
  background: ${({ $selected }) =>
    $selected ? 'hsl(var(--primary) / 0.10)' : 'transparent'};
  box-shadow: ${({ $selected }) =>
    $selected ? '0 0 0 1px hsl(var(--primary) / 0.30)' : 'none'};
  cursor: pointer;
  font-family: inherit;
  text-align: left;
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

  @media (min-width: 768px) {
    padding: ${({ $tall }) => ($tall ? '12px 16px' : '12px 16px')};
  }
`;

const Emoji = styled.span`
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
`;

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

export const HCard: React.FC<HCardProps> = ({ emoji, label, selected, onClick, tall = false }) => (
  <Button type="button" $selected={selected} $tall={tall} onClick={onClick} aria-pressed={selected}>
    <Emoji aria-hidden>{emoji}</Emoji>
    <Label>{label}</Label>
  </Button>
);
