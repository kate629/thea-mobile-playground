import React from 'react';
import styled from 'styled-components';
import { ResultsHeader } from './ResultsHeader';
import { ResultsTabKey } from './types';

export interface ResultsPageProps {
  /** Header props — passed through. */
  rightActions?: React.ReactNode;
  onLogoClick?: () => void;
  personEmoji: string;
  personName: string;
  interestsLabel: string;
  onProfilePillClick: () => void;
  activeTab: ResultsTabKey;
  onTabChange: (tab: ResultsTabKey) => void;
  likedCount: number;
  purchasedCount: number;
  likedBadgePulseKey?: string | number;
  purchasedBadgePulseKey?: string | number;
  /** Tab body — caller renders the appropriate Tab View based on activeTab. */
  children: React.ReactNode;
  /** Slots for the always-mounted overlays. Caller composes the drawers and dialogs. */
  drawers?: React.ReactNode;
}

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.color.creamLight};
  color: hsl(var(--foreground));
  font-family: ${({ theme }) => theme.font.sans};
  display: flex;
  flex-direction: column;
`;

const Main = styled.div`
  flex: 1;
  padding: 12px 8px 0;
  @media (min-width: 1024px) { padding: 12px 16px 0; }
`;

const RoomCard = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 1400px;
  background: #ffffff;
  padding: 16px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  min-height: 80vh;
`;

export const ResultsPage: React.FC<ResultsPageProps> = ({
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
  children,
  drawers,
}) => (
  <Page>
    <ResultsHeader
      rightActions={rightActions}
      onLogoClick={onLogoClick}
      personEmoji={personEmoji}
      personName={personName}
      interestsLabel={interestsLabel}
      onProfilePillClick={onProfilePillClick}
      activeTab={activeTab}
      onTabChange={onTabChange}
      likedCount={likedCount}
      purchasedCount={purchasedCount}
      likedBadgePulseKey={likedBadgePulseKey}
      purchasedBadgePulseKey={purchasedBadgePulseKey}
    />
    <Main>
      <RoomCard>{children}</RoomCard>
    </Main>
    {drawers}
  </Page>
);
