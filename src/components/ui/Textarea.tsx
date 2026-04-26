import React from 'react';
import styled from 'styled-components';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const StyledTextarea = styled.textarea<{ $invalid: boolean }>`
  display: block;
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  border: 1px solid ${({ $invalid }) => ($invalid ? 'hsl(var(--destructive))' : 'hsl(var(--input))')};
  border-radius: ${({ theme }) => theme.radius.md};
  outline: none;
  resize: vertical;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder {
    color: hsl(var(--muted-foreground));
    font-style: italic;
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

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid = false, ...rest }, ref) => (
    <StyledTextarea ref={ref} $invalid={invalid} aria-invalid={invalid || undefined} {...rest} />
  ),
);

Textarea.displayName = 'Textarea';
