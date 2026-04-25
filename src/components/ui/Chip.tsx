import React from 'react';
import styled, { css, keyframes } from 'styled-components';

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  selected?: boolean;
  /** Optional leading emoji or icon node. */
  leading?: React.ReactNode;
}

/* Mirror of the source's "chip-pop" keyframe (tailwind.config.ts:128-132). */
const chipPop = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.08); }
  100% { transform: scale(1); }
`;

const Root = styled.button<{ $selected: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  user-select: none;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
  ${({ $selected }) =>
    $selected
      ? css`
          background: #2d2d2d;
          color: #ffffff;
          border-color: #2d2d2d;
          animation: ${chipPop} 0.25s ease-out;
        `
      : css`
          background: #f0eeeb;
          color: hsl(var(--foreground));
          &:hover {
            background: #e6e3df;
          }
        `}

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const Chip: React.FC<ChipProps> = ({ selected = false, leading, children, ...rest }) => (
  <Root type="button" $selected={selected} aria-pressed={selected} {...rest}>
    {leading}
    {children}
  </Root>
);
