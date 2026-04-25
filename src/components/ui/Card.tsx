import React from 'react';
import styled from 'styled-components';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bg?: string;
  radius?: string;
  padding?: string;
  paddingMobile?: string;
}

const Root = styled.div<{
  $bg: string;
  $radius: string;
  $padding: string;
  $paddingMobile: string;
}>`
  background: ${({ $bg }) => $bg};
  border-radius: ${({ $radius }) => $radius};
  padding: ${({ $paddingMobile }) => $paddingMobile};
  @media (min-width: 768px) {
    padding: ${({ $padding }) => $padding};
  }
`;

export const Card: React.FC<CardProps> = ({
  bg = 'hsl(var(--card))',
  radius = '24px',
  padding = '96px 80px',
  paddingMobile = '48px 32px',
  children,
  ...rest
}) => (
  <Root
    $bg={bg}
    $radius={radius}
    $padding={padding}
    $paddingMobile={paddingMobile}
    {...rest}
  >
    {children}
  </Root>
);
