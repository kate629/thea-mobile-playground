import React from 'react';
import styled from 'styled-components';

export interface QuizNextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const Button = styled.button`
  width: 220px;
  height: 44px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.gradient.cta};
  color: hsl(var(--primary-foreground));
  box-shadow: none;
  transition: transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease;
  &:hover:not(:disabled) {
    transform: scale(1.03);
    box-shadow: ${({ theme }) => theme.shadow.xl};
  }
  &:active:not(:disabled) {
    transform: scale(0.99);
  }
  &:disabled {
    background: #f0eeeb;
    color: #b5b0a8;
    cursor: not-allowed;
    box-shadow: none;
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.4);
  }
`;

const Wrap = styled.div`
  display: flex;
  justify-content: center;
`;

export const QuizNextButton: React.FC<QuizNextButtonProps> = ({ label, type = 'button', ...rest }) => (
  <Wrap>
    <Button type={type} {...rest}>{label}</Button>
  </Wrap>
);
