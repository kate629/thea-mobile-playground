import React from 'react';
import styled, { css } from 'styled-components';

export type ButtonVariant = 'primary' | 'ghost';
export type ButtonSize = 'lg' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const sizeCss = ($size: ButtonSize) =>
  $size === 'lg'
    ? css`padding: 16px 40px; font-size: 18px;`
    : css`padding: 12px 24px; font-size: 16px;`;

const primaryCss = css`
  color: hsl(var(--primary-foreground));
  background: ${({ theme }) => theme.gradient.cta};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-weight: 500;
  box-shadow: none;
  &:hover:not(:disabled) {
    transform: scale(1.03);
    box-shadow: ${({ theme }) => theme.shadow.xl};
  }
  &:active:not(:disabled) {
    transform: scale(0.99);
  }
`;

const ghostCss = css`
  color: ${({ theme }) => theme.color.clay};
  background: transparent;
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 500;
  padding: 8px 12px;
  font-size: 16px;
  &:hover:not(:disabled) {
    opacity: 0.8;
  }
`;

const StyledButton = styled.button<{ $variant: ButtonVariant; $size: ButtonSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-family: inherit;
  line-height: 1.2;
  transition: transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  ${({ $variant, $size }) =>
    $variant === 'ghost' ? ghostCss : css`${sizeCss($size)} ${primaryCss}`}
`;

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'lg',
  type = 'button',
  ...rest
}) => (
  <StyledButton type={type} $variant={variant} $size={size} {...rest}>
    {label}
  </StyledButton>
);
