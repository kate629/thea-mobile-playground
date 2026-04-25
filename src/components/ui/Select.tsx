import React from 'react';
import styled from 'styled-components';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  invalid?: boolean;
  placeholder?: string;
}

const Wrap = styled.div`
  position: relative;
  display: block;
  width: 100%;
`;

const StyledSelect = styled.select<{ $invalid: boolean }>`
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 32px 0 12px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  border: 1px solid ${({ $invalid }) => ($invalid ? 'hsl(var(--destructive))' : 'hsl(var(--input))')};
  border-radius: ${({ theme }) => theme.radius.md};
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;

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

const Chevron = styled.svg`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  fill: none;
  stroke: hsl(var(--muted-foreground));
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
`;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, invalid = false, placeholder, value, ...rest }, ref) => (
    <Wrap>
      <StyledSelect
        ref={ref}
        $invalid={invalid}
        aria-invalid={invalid || undefined}
        value={value ?? ''}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </StyledSelect>
      <Chevron viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></Chevron>
    </Wrap>
  ),
);

Select.displayName = 'Select';
