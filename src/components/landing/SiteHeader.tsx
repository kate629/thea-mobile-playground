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
  /** Click handler for the wordmark. SiteHeader internally calls
   *  `preventDefault()` before invoking this — callers don't need to handle
   *  the click event. The wordmark is an <a href={logoHref}>, and without
   *  preventDefault the browser would navigate immediately and bypass any
   *  `requestLeave`-style confirmation modal the handler opens. Centralizing
   *  preventDefault here means every caller is safe by default (bug #62). */
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API compatibility; see prop docs above.
  onSignInClick,
  onLogoClick,
  logoHref = '/',
}) => {
  const renderedActions = actions === undefined ? <HeaderAccountMenu /> : actions;

  // Wrap so the anchor's default navigation doesn't race ahead of the
  // handler — see prop docs. When no handler is provided, fall through to
  // the natural <a href={logoHref}> behavior.
  const handleClick = onLogoClick
    ? (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onLogoClick();
      }
    : undefined;

  return (
    <Header>
      <Inner>
        <Wordmark href={logoHref} onClick={handleClick}>
          thea
        </Wordmark>
        <Actions>{renderedActions}</Actions>
      </Inner>
    </Header>
  );
};
