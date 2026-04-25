import React from 'react';
import styled from 'styled-components';
import { Button } from '../ui/Button';

export interface SiteHeaderProps {
  /** Right-side actions slot. Defaults to a Sign-in ghost button. Pass `null` to render nothing. */
  actions?: React.ReactNode;
  /** Click handler for the default Sign-in button. Ignored if `actions` is provided. */
  onSignInClick?: () => void;
  /** Click handler for the wordmark. */
  onLogoClick?: () => void;
  /** href for the wordmark link. Defaults to "/". */
  logoHref?: string;
}

const Header = styled.header`
  position: relative;
  width: 100%;
  background: hsl(var(--background));
  padding: 16px 0;
`;

const Inner = styled.div`
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  @media (min-width: 640px) {
    padding: 0 32px;
  }
  @media (min-width: 1024px) {
    padding: 0 64px;
  }
`;

const Wordmark = styled.a`
  font-family: ${({ theme }) => theme.font.serif};
  font-style: italic;
  letter-spacing: 0.025em;
  color: hsl(var(--primary));
  font-size: 28px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 200ms ease;
  &:hover {
    opacity: 0.8;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  actions,
  onSignInClick,
  onLogoClick,
  logoHref = '/',
}) => {
  const renderedActions =
    actions === undefined ? (
      <Button label="Sign in" variant="ghost" onClick={onSignInClick} />
    ) : (
      actions
    );

  return (
    <Header>
      <Inner>
        <Wordmark href={logoHref} onClick={onLogoClick}>
          thea
        </Wordmark>
        <Actions>{renderedActions}</Actions>
      </Inner>
    </Header>
  );
};
