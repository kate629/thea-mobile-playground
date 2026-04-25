import React from 'react';
import styled from 'styled-components';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
}

const Row = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  user-select: none;
`;

const Native = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
`;

const Box = styled.span<{ $checked: boolean; $invalid: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid ${({ $checked, $invalid }) => {
    if ($invalid) return 'hsl(var(--destructive))';
    return $checked ? 'hsl(var(--primary))' : 'hsl(var(--input))';
  }};
  background: ${({ $checked }) => ($checked ? 'hsl(var(--primary))' : 'hsl(var(--background))')};
  transition: background 120ms ease, border-color 120ms ease;
  flex-shrink: 0;

  ${Native}:focus-visible + & {
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const Tick = styled.svg`
  width: 12px;
  height: 12px;
  fill: none;
  stroke: hsl(var(--primary-foreground));
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const LabelText = styled.span`
  font-size: 14px;
  color: hsl(var(--foreground));
  line-height: 1.4;
`;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, disabled, ...rest }, ref) => {
    const invalid = Boolean(rest['aria-invalid']);
    return (
      <Row $disabled={Boolean(disabled)}>
        <Native
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          {...rest}
        />
        <Box $checked={Boolean(checked)} $invalid={invalid}>
          {checked && (
            <Tick viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></Tick>
          )}
        </Box>
        {label && <LabelText>{label}</LabelText>}
      </Row>
    );
  },
);

Checkbox.displayName = 'Checkbox';
