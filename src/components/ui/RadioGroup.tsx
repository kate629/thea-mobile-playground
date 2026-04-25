import React from 'react';
import styled from 'styled-components';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  invalid?: boolean;
}

const Group = styled.div<{ $orientation: 'vertical' | 'horizontal' }>`
  display: flex;
  flex-direction: ${({ $orientation }) => ($orientation === 'horizontal' ? 'row' : 'column')};
  gap: ${({ $orientation }) => ($orientation === 'horizontal' ? '16px' : '8px')};
  flex-wrap: wrap;
`;

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

const Dot = styled.span<{ $checked: boolean; $invalid: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid ${({ $checked, $invalid }) => {
    if ($invalid) return 'hsl(var(--destructive))';
    return $checked ? 'hsl(var(--primary))' : 'hsl(var(--input))';
  }};
  background: hsl(var(--background));
  transition: border-color 120ms ease;
  flex-shrink: 0;

  ${Native}:focus-visible + & {
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }

  &::after {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: hsl(var(--primary));
    transform: scale(${({ $checked }) => ($checked ? 1 : 0)});
    transition: transform 120ms ease;
  }
`;

const LabelText = styled.span`
  font-size: 14px;
  color: hsl(var(--foreground));
  line-height: 1.4;
`;

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  orientation = 'vertical',
  disabled = false,
  invalid = false,
}) => (
  <Group role="radiogroup" $orientation={orientation} aria-invalid={invalid || undefined}>
    {options.map((opt) => {
      const checked = value === opt.value;
      const isDisabled = disabled || Boolean(opt.disabled);
      return (
        <Row key={opt.value} $disabled={isDisabled}>
          <Native
            type="radio"
            name={name}
            value={opt.value}
            checked={checked}
            disabled={isDisabled}
            onChange={(e) => onChange?.(e.target.value)}
          />
          <Dot $checked={checked} $invalid={invalid} />
          <LabelText>{opt.label}</LabelText>
        </Row>
      );
    })}
  </Group>
);
