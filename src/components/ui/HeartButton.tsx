import React from 'react';
import styled, { css } from 'styled-components';

export type HeartButtonVariant = 'pill' | 'icon';
export type HeartButtonSize = 'sm' | 'md';

export interface HeartButtonProps {
  liked: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: HeartButtonVariant;
  size?: HeartButtonSize;
  ariaLabel?: string;
}

const sizeCss = ($size: HeartButtonSize) =>
  $size === 'sm'
    ? css`width: 28px; height: 28px;`
    : css`width: 36px; height: 36px;`;

const Root = styled.button<{ $size: HeartButtonSize; $variant: HeartButtonVariant }>`
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  box-shadow: ${({ theme }) => theme.shadow.card};
  transition: transform 150ms ease, background 150ms ease;
  ${({ $size }) => sizeCss($size)}
  &:hover {
    transform: scale(1.06);
    background: rgba(255, 255, 255, 1);
  }
  &:active {
    transform: scale(0.96);
  }
`;

const Svg = styled.svg<{ $liked: boolean }>`
  width: 18px;
  height: 18px;
  fill: ${({ $liked }) => ($liked ? 'hsl(var(--liked))' : 'none')};
  stroke: ${({ $liked }) => ($liked ? 'hsl(var(--liked))' : 'hsl(var(--foreground) / 0.7)')};
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: fill 150ms ease, stroke 150ms ease;
`;

export const HeartButton: React.FC<HeartButtonProps> = ({
  liked,
  onClick,
  size = 'md',
  variant = 'pill',
  ariaLabel,
}) => (
  <Root
    type="button"
    onClick={onClick}
    $size={size}
    $variant={variant}
    aria-label={ariaLabel ?? (liked ? 'Unsave' : 'Save')}
    aria-pressed={liked}
  >
    <Svg viewBox="0 0 24 24" $liked={liked}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  </Root>
);
