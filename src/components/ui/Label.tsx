import React from 'react';
import styled from 'styled-components';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Root = styled.label<{ $disabled: boolean }>`
  display: inline-block;
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
  line-height: 1.4;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'default')};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const RequiredMark = styled.span`
  color: hsl(var(--destructive));
  margin-left: 2px;
`;

export const Label: React.FC<LabelProps> = ({ children, required, ...rest }) => (
  <Root $disabled={Boolean(rest['aria-disabled'])} {...rest}>
    {children}
    {required && <RequiredMark aria-hidden="true">*</RequiredMark>}
  </Root>
);
