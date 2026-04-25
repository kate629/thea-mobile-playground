import React, { useId } from 'react';
import styled from 'styled-components';
import { Label } from './Label';

export interface FormFieldProps {
  label?: React.ReactNode;
  /** Helper text shown below the control. Hidden when an error message is present. */
  helperText?: React.ReactNode;
  /** Error message (overrides helperText). When set, the rendered control should also receive `invalid`. */
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** The control. Receives the `id` and aria-describedby/invalid. */
  children: (renderProps: {
    id: string;
    invalid: boolean;
    'aria-describedby'?: string;
  }) => React.ReactNode;
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const Helper = styled.p<{ $error: boolean }>`
  margin: 0;
  font-size: 12px;
  color: ${({ $error }) => ($error ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))')};
  line-height: 1.4;
`;

export const FormField: React.FC<FormFieldProps> = ({
  label,
  helperText,
  error,
  required,
  disabled,
  children,
}) => {
  const id = useId();
  const helperId = `${id}-helper`;
  const invalid = Boolean(error);
  const describedBy = error || helperText ? helperId : undefined;

  return (
    <Root>
      {label && (
        <Label htmlFor={id} required={required} aria-disabled={disabled || undefined}>
          {label}
        </Label>
      )}
      {children({ id, invalid, 'aria-describedby': describedBy })}
      {(error || helperText) && (
        <Helper id={helperId} $error={invalid}>
          {error || helperText}
        </Helper>
      )}
    </Root>
  );
};
