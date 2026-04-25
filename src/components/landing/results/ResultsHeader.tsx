import React from 'react';
import styled from 'styled-components';
import { TabBar } from '../../ui/TabBar';
import { badgePop } from '../../../animations';
import { ResultsTabKey } from './types';

export interface ResultsHeaderProps {
  /** Right-side action area (md+ only). Stories pass a stand-in account button. */
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

const Sticky = styled.div`
  position: sticky;
  top: 0;
  z-index: 40;
  background: ${({ theme }) => theme.color.creamLight};
  isolation: isolate;
`;

const PillRow = styled.div`
  background: ${({ theme }) => theme.color.creamLight};
  padding: 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  @media (min-width: 768px) {
    padding: 24px 40px 20px;
  }
  @media (min-width: 1024px) {
    padding-left: 40px;
    padding-right: 40px;
  }
`;

const Wordmark = styled.button`
  display: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: ${({ theme }) => theme.font.serif};
  font-style: italic;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.color.clay};
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
  @media (min-width: 768px) {
    display: inline-block;
  }
`;

const PillCenter = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
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
  max-width: 280px;
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

const RightSlot = styled.div`
  display: none;
  flex-shrink: 0;
  @media (min-width: 768px) {
    display: block;
  }
`;

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
    <Sticky>
      <PillRow>
        <Wordmark type="button" onClick={onLogoClick} aria-label="Home">
          thea
        </Wordmark>
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
        <RightSlot>{rightActions}</RightSlot>
      </PillRow>
      <TabsRow>
        <TabBar tabs={tabs} value={activeTab} onChange={onTabChange} />
      </TabsRow>
    </Sticky>
  );
};
