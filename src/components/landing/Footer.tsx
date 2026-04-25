import React from 'react';
import styled from 'styled-components';

export interface FooterProps {
  copyright?: string;
  privacyHref?: string;
  termsHref?: string;
}

const Root = styled.footer`
  width: 100%;
  padding: 32px 0;
  border-top: 1px solid hsl(var(--border) / 0.4);
`;

const Inner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  @media (min-width: 1024px) { padding: 0 32px; }
`;

const FooterLink = styled.a`
  padding: 8px 0;
  color: inherit;
  text-decoration: none;
  transition: color 200ms ease;
  &:hover {
    color: hsl(var(--foreground));
  }
`;

const Dot = styled.span`
  user-select: none;
`;

export const Footer: React.FC<FooterProps> = ({
  copyright = '© 2026 Thea',
  privacyHref = '/privacy',
  termsHref = '/terms',
}) => (
  <Root>
    <Inner>
      <span>{copyright}</span>
      <Dot>·</Dot>
      <FooterLink href={privacyHref}>Privacy Policy</FooterLink>
      <Dot>·</Dot>
      <FooterLink href={termsHref}>Terms of Use</FooterLink>
    </Inner>
  </Root>
);
