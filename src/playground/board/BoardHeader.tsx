import React from 'react';
import styled from 'styled-components';
import { BoardSearchPill } from './BoardSearchPill';

const Wrap = styled.header`
  /* Sticky positioning is owned by the parent StickyTop in BoardLayout. */
  background: ${({ theme }) => theme.color.creamLight};
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 8px;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.button`
  font-family: ${({ theme }) => theme.font.serif ?? 'Georgia, serif'};
  font-size: 22px;
  font-style: italic;
  color: ${({ theme }) => theme.color.clay};
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
`;

interface BoardHeaderProps {
  recipientName: string;
  recipientEmoji: string;
  whatText: string;
  likesText: string;
  rightActions?: React.ReactNode;
  onLogoClick?: () => void;
  onPillClick?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  recipientName,
  recipientEmoji,
  whatText,
  likesText,
  rightActions,
  onLogoClick,
  onPillClick,
}) => (
  <Wrap>
    <TopRow>
      <Logo onClick={onLogoClick}>thea</Logo>
      {rightActions}
    </TopRow>
    <BoardSearchPill
      whoEmoji={recipientEmoji}
      whoText={recipientName}
      whatText={whatText}
      likesText={likesText}
      onSegmentClick={onPillClick}
      onSparklesClick={onPillClick}
    />
  </Wrap>
);
