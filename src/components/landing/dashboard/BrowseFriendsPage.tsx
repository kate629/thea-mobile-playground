import React from 'react';
import styled, { keyframes } from 'styled-components';
import { SiteHeader } from '../SiteHeader';
import { Button } from '../../ui/Button';
import { QuestSummaryPill, QuestSummaryPillProps } from './QuestSummaryPill';
import { BrowseFriendsGrid, BrowseFriendsGridProps } from './BrowseFriendsGrid';
import { AuthState } from './types';

export interface BrowseFriendsPageProps {
  authState: AuthState;
  pill: QuestSummaryPillProps;
  grid: Omit<BrowseFriendsGridProps, 'loading'>;
  /**
   * Replaces the default sticky behavior on the pill. v1: pill is sticky on
   * desktop only. Set to `false` to render it inline (useful in stories that
   * stack pieces inside the iframe).
   */
  stickyPill?: boolean;
}

const Page = styled.div`
  min-height: 100vh;
  background: hsl(var(--background));
`;

interface StickyWrapProps {
  $sticky: boolean;
}
const StickyWrap = styled.div<StickyWrapProps>`
  ${({ $sticky }) =>
    $sticky
      ? `
    position: sticky;
    top: 0;
    z-index: 30;
    background: hsl(var(--background));
  `
      : ''}
`;

const SignedOutCardWrap = styled.section`
  max-width: 720px;
  margin: 64px auto 96px;
  padding: 48px 24px;
`;

const SignedOutCard = styled.div`
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 24px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: var(--shadow-soft);
`;

const SignedOutTitle = styled.h2`
  margin: 0 0 12px;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  @media (min-width: 768px) {
    font-size: 36px;
  }
`;

const SignedOutBody = styled.p`
  margin: 0 0 24px;
  font-size: 15px;
  color: hsl(var(--muted-foreground));
  line-height: 1.5;
`;

const SignedOutActions = styled.div`
  display: flex;
  justify-content: center;
`;

const skeletonShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBlock = styled.div`
  height: 56px;
  max-width: 700px;
  margin: 32px auto;
  border-radius: 9999px;
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: ${skeletonShimmer} 1400ms ease-in-out infinite;
`;

const AvatarChip = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  font-size: 14px;
  font-weight: 600;
`;

const AvatarShimmer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.6) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: ${skeletonShimmer} 1400ms ease-in-out infinite;
`;

function renderHeaderActions(authState: AuthState): React.ReactNode {
  switch (authState.status) {
    case 'loading':
      return <AvatarShimmer aria-hidden />;
    case 'signed-out':
      return <Button label="Sign in" variant="ghost" onClick={authState.onRequestSignIn} />;
    case 'signed-in':
      return <AvatarChip aria-label={authState.user.displayName ?? 'Account'}>{authState.user.initial}</AvatarChip>;
  }
}

export const BrowseFriendsPage: React.FC<BrowseFriendsPageProps> = ({
  authState,
  pill,
  grid,
  stickyPill = true,
}) => {
  const headerActions = renderHeaderActions(authState);

  return (
    <Page>
      <SiteHeader actions={headerActions} />

      <StickyWrap $sticky={stickyPill}>
        <QuestSummaryPill {...pill} />
      </StickyWrap>

      {authState.status === 'loading' && (
        <>
          <SkeletonBlock aria-hidden />
          <BrowseFriendsGrid
            people={[]}
            previews={{}}
            resolved={{}}
            loading
            meId={grid.meId}
            onAddSomeoneClick={grid.onAddSomeoneClick}
          />
        </>
      )}

      {authState.status === 'signed-out' && (
        <SignedOutCardWrap>
          <SignedOutCard>
            <SignedOutTitle>Sign in to see your people</SignedOutTitle>
            <SignedOutBody>
              Save your gift picks, track who you've shopped for, and pick up where you left off.
            </SignedOutBody>
            <SignedOutActions>
              <Button label="Sign in" variant="primary" size="md" onClick={authState.onRequestSignIn} />
            </SignedOutActions>
          </SignedOutCard>
        </SignedOutCardWrap>
      )}

      {authState.status === 'signed-in' && <BrowseFriendsGrid {...grid} />}
    </Page>
  );
};
