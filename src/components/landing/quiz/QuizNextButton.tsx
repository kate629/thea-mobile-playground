import React from 'react';
import styled from 'styled-components';

export interface QuizNextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const Button = styled.button`
  width: 220px;
  height: 44px;
  border: none;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f1a805;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: background-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
  &:hover:not(:disabled) {
    background: #d9940a;
    transform: scale(1.02);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
