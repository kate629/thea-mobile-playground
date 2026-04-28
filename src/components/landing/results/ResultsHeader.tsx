import React from 'react';
import styled from 'styled-components';
import { TabBar } from '../../ui/TabBar';
import { badgePop } from '../../../animations';
import { SiteHeader } from '../SiteHeader';
import { ResultsTabKey } from './types';

export interface ResultsHeaderProps {
  /** Right-side actions slot for the SiteHeader. Caller passes the
   *  HeaderAccountMenu (signed-in) or leaves undefined for the default Sign-in
   *  ghost button. Replaces the previous md+-only `rightActions` slot — the
   *  SiteHeader now renders this at every viewport, matching homepage UX. */
  rightActions?: React.ReactNode;
  onLogoClick?: () => void;
  /** Profile pill content. */
  personEmoji: string;
  personName: string;
  /** Pre-resolved interests label, e.g. "Books, Cooking +2". */
  interestsLabel: string;
  onProfilePillClick: () => void;
  /** Tab bar. */
  activeTab: ResultsTabKey;
  onTabChange: (tab: ResultsTabKey) => void;
  likedCount: number;
  purchasedCount: number;
  /** Bumped externally when count grows; the badge re-keys to retrigger badgePop. */
  likedBadgePulseKey?: string | number;
  purchasedBadgePulseKey?: string | number;
}

// Sticky wrapper for the results header. Holds the search/profile pill row
// and the tab bar — both stay pinned to the top of the viewport on scroll.
//
// Breakpoint behavior:
// - Mobile (<768px): the wordmark + RightSlot inside PillRow are display:none,
//   so visually only the search pill + tabs stick. This matches sheet bug #41
//   ("on mobile, just the search-pill bar should be sticky").
// - Desktop (>=768px): the full header — wordmark, search pill, sign-in/avatar
//   in RightSlot, plus the tab bar — all sit inside this single sticky bar
//   (matches the live preview at preview.givethea.com).
//
// z-index 40 sits below the profile drawer (z-index 210) and its scrim
// (z-index 200) so the drawer overlays the sticky header cleanly.
//
// `isolation: isolate` creates a new stacking context so descendant z-index
// values don't accidentally escape and overlay the drawer scrim.
const Sticky = styled.div`
  position: sticky;
  top: 0;
  z-index: 40;
  background: ${({ theme }) => theme.color.creamLight};
  isolation: isolate;
  /* Subtle separator so scrolled-under content doesn't bleed into the bar. */
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
`;

/* SiteHeader renders its own background (`hsl(var(--background))`). Wrap it
   so the results-page sticky chrome reads as one cohesive cream stripe. */
const HeaderShell = styled.div`
  background: ${({ theme }) => theme.color.creamLight};
  /* The SiteHeader's <Header> sets its own background — override here so the
     wordmark/sign-in row inherits the cream surface that matches the pill
     row + tabs row beneath it. */
  & > header {
    background: transparent;
  }
`;

const PillRow = styled.div`
  background: ${({ theme }) => theme.color.creamLight};
  padding: 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  /* Guard against horizontal overflow from long pill content on narrow
     viewports — without these, flex children default to min-width: auto and
     can push the row wider than the mobile viewport, which mobile browsers
     compensate for by zooming the whole page out (sheet bug #34). */
  min-width: 0;
  max-width: 100%;
  @media (min-width: 768px) {
    padding: 8px 40px 20px;
  }
  @media (min-width: 1024px) {
    padding-left: 40px;
    padding-right: 40px;
  }
`;

const PillCenter = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  /* Allow the inner pill to shrink below its intrinsic (nowrap) content
     width on narrow viewports so the interests label can truncate instead
     of pushing the layout wider than the screen. */
  min-width: 0;
`;

const ProfilePill = styled.button`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #ffffff;
  border: 1.5px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  font-family: inherit;
  width: 100%;
  /* Cap to parent so a long interests label can never push the pill wider
     than the viewport (sheet bug #34). */
  max-width: 100%;
  min-width: 0;
  padding: 14px 20px;
  transition: background-color 150ms ease, transform 150ms ease;
  &:hover { background: #faf7f2; }
  &:active { transform: scale(0.99); }
  @media (min-width: 768px) {
    width: auto;
    padding: 20px 32px;
  }
`;

const PillEmoji = styled.span`
  font-size: 16px;
  line-height: 1;
  @media (min-width: 768px) { font-size: 18px; }
`;

const PillName = styled.span`
  font-weight: 600;
  line-height: 1;
  font-size: 16px;
  color: hsl(var(--foreground));
  white-space: nowrap;
  flex-shrink: 0;
  @media (min-width: 768px) { font-size: 18px; }
`;

const PillDot = styled.span`
  font-size: 14px;
  line-height: 1;
  color: hsl(var(--muted-foreground));
  @media (min-width: 768px) { font-size: 16px; }
`;

const PillInterests = styled.span`
  font-size: 14px;
  line-height: 1;
  color: hsl(var(--muted-foreground));
  /* Take whatever room is left in the pill and truncate. The previous
     fixed max-width: 280px meant a long interests string + emoji + name +
     pencil could be wider than a 320–375px mobile viewport, which forced
     the page to zoom out so the user couldn't see the top chrome (sheet
     bug #34). flex: 1 1 auto + min-width: 0 lets the ellipsis kick in. */
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (min-width: 768px) { font-size: 16px; }
`;

const PencilIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const TabsRow = styled.div`
  background: ${({ theme }) => theme.color.creamLight};
  padding: 0 16px;
  @media (min-width: 1024px) { padding: 0 40px; }
`;

const HeartBadge = styled.span<{ $pulseKey: string | number | undefined }>`
  display: inline-flex;
  width: 14px;
  height: 14px;
  align-items: center;
  justify-content: center;
  animation: ${badgePop} 250ms ease-out;
`;

const NumericBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 9999px;
  background: ${({ theme, $active }) => ($active ? theme.color.clay : 'hsl(var(--muted-foreground))')};
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  animation: ${badgePop} 250ms ease-out;
`;

const HeartGlyph: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: '#B56B58' }}>
    <path d="M12 21s-7-4.35-9.6-9.05a5.6 5.6 0 0 1 9.6-5.78 5.6 5.6 0 0 1 9.6 5.78C19 16.65 12 21 12 21Z" />
  </svg>
);

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  rightActions,
  onLogoClick,
  personEmoji,
  personName,
  interestsLabel,
  onProfilePillClick,
  activeTab,
  onTabChange,
  likedCount,
  purchasedCount,
  likedBadgePulseKey,
  purchasedBadgePulseKey,
}) => {
  const tabs = [
    { key: 'recommended' as const, label: 'Discover' },
    {
      key: 'liked' as const,
      label: 'Saved',
      badge:
        likedCount > 0 ? (
          <HeartBadge key={`liked-${likedBadgePulseKey ?? likedCount}`} $pulseKey={likedBadgePulseKey} aria-label={`${likedCount} saved`}>
            <HeartGlyph />
          </HeartBadge>
        ) : undefined,
    },
    {
      key: 'purchased' as const,
      label: 'Purchased',
      badge:
        purchasedCount > 0 ? (
          <NumericBadge
            key={`purchased-${purchasedBadgePulseKey ?? purchasedCount}`}
            $active={activeTab === 'purchased'}
          >
            {purchasedCount}
          </NumericBadge>
        ) : undefined,
    },
  ];

  return (
    <Sticky data-testid="results-sticky-header">
      <HeaderShell>
        <SiteHeader actions={rightActions} onLogoClick={onLogoClick} />
      </HeaderShell>
      <PillRow>
        <PillCenter>
          <ProfilePill type="button" onClick={onProfilePillClick} aria-label="Edit profile">
            <PillEmoji aria-hidden="true">{personEmoji}</PillEmoji>
            <PillName>{personName}</PillName>
            <PillDot aria-hidden="true">·</PillDot>
            <PillInterests>{interestsLabel}</PillInterests>
            <PillDot aria-hidden="true">·</PillDot>
            <PencilIcon />
          </ProfilePill>
        </PillCenter>
      </PillRow>
      <TabsRow>
        <TabBar tabs={tabs} value={activeTab} onChange={onTabChange} />
      </TabsRow>
    </Sticky>
  );
};
