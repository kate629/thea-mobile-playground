import React from 'react';
import styled from 'styled-components';
import { HeaderAccountMenu } from '../../theaWeb/auth/HeaderAccountMenu';

export interface SiteHeaderProps {
  /**
   * Right-side actions slot. Defaults to <HeaderAccountMenu />, which renders
   * the Sign-in pill for anonymous users and an avatar + Log out dropdown for
   * permanent users. Pass `null` to render nothing.
   */
  actions?: React.ReactNode;
  /**
   * Legacy prop kept for backward compatibility with callers that haven't
   * migrated to AuthGateProvider yet. Ignored when `actions` is provided and
   * has no effect on the default <HeaderAccountMenu />, which uses the
   * AuthGateContext directly.
   */
  onSignInClick?: () => void;
  /** Click handler for the wordmark. Receives the native click event so
   *  callers can `preventDefault()` (the wordmark is an <a href={logoHref}>,
   *  so without preventDefault the browser navigates immediately and any
   *  `requestLeave`-style modal is bypassed). */
  onLogoClick?: React.MouseEventHandler<HTMLAnchorElement>;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API compatibility; see prop docs above.
  onSignInClick,
  onLogoClick,
  logoHref = '/',
}) => {
  const renderedActions = actions === undefined ? <HeaderAccountMenu /> : actions;

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
