import React from 'react';
import styled, { css } from 'styled-components';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean;
  fullWidth?: boolean;
}

const baseInput = css<{ $invalid: boolean }>`
  display: block;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  border: 1px solid ${({ $invalid }) => ($invalid ? 'hsl(var(--destructive))' : 'hsl(var(--input))')};
  border-radius: ${({ theme }) => theme.radius.md};
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }

  &:focus-visible {
    border-color: ${({ $invalid }) => ($invalid ? 'hsl(var(--destructive))' : 'hsl(var(--ring))')};
    box-shadow: 0 0 0 2px ${({ $invalid }) => ($invalid ? 'hsl(var(--destructive) / 0.25)' : 'hsl(var(--ring) / 0.3)')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background: hsl(var(--muted));
  }
`;

const Wrap = styled.div<{ $fullWidth: boolean }>`
  display: ${({ $fullWidth }) => ($fullWidth ? 'block' : 'inline-block')};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
`;

const StyledInput = styled.input<{ $invalid: boolean }>`
  ${baseInput}
`;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, fullWidth = true, type = 'text', ...rest }, ref) => (
    <Wrap $fullWidth={fullWidth}>
      <StyledInput ref={ref} type={type} $invalid={invalid} aria-invalid={invalid || undefined} {...rest} />
    </Wrap>
  ),
);

Input.displayName = 'Input';
