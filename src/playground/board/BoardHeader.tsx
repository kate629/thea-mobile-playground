import React from 'react';
import styled from 'styled-components';
import {
  BoardSearchPill,
  type BoardSearchPillInitialValues,
} from './BoardSearchPill';

const Wrap = styled.header`
  /* Sticky positioning is owned by the parent StickyTop in BoardLayout. */
  background: ${({ theme }) => theme.color.creamLight};
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 12px 8px;
`;

// Three-cell top row: thea logo (left), recipient anchor (center), sign-in
// or avatar menu (right). The recipient anchor is the visual anchor for
// "this is Mom's board" — it sits ABOVE the search pill, separating
// recipient identity from the WHAT/LIKES refinement controls.
const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
`;

const Logo = styled.button`
  font-family: ${({ theme }) => theme.font.serif ?? 'Georgia, serif'};
  font-size: 20px;
  font-style: italic;
  color: ${({ theme }) => theme.color.clay};
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  justify-self: start;
`;

const RecipientAnchor = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
`;

const RightActions = styled.div`
  justify-self: end;
  display: inline-flex;
`;

// Pill row: back arrow (left, exact Airbnb pattern) + search pill.
const PillRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BackButton = styled.button`
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: hsl(var(--foreground));
  transition: background 150ms ease, transform 150ms ease;
  &:hover { background: ${({ theme }) => theme.color.cream}; }
  &:active { transform: scale(0.96); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const PillFill = styled.div`
  flex: 1;
  min-width: 0;
`;

const ArrowLeftIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

interface BoardHeaderProps {
  recipientEmoji: string;
  recipientName: string;
  pillInitialValues: BoardSearchPillInitialValues;
  rightActions?: React.ReactNode;
  onLogoClick?: () => void;
  onBackClick?: () => void;
  onSparklesClick?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  recipientEmoji,
  recipientName,
  pillInitialValues,
  rightActions,
  onLogoClick,
  onBackClick,
  onSparklesClick,
}) => (
  <Wrap>
    <TopRow>
      <Logo onClick={onLogoClick}>thea</Logo>
      <RecipientAnchor>
        <span aria-hidden="true">{recipientEmoji}</span>
        <span>{recipientName}</span>
      </RecipientAnchor>
      <RightActions>{rightActions}</RightActions>
    </TopRow>
    <PillRow>
      <BackButton
        type="button"
        aria-label="Start a new search"
        onClick={onBackClick}
      >
        <ArrowLeftIcon />
      </BackButton>
      <PillFill>
        <BoardSearchPill
          initialValues={pillInitialValues}
          onSparklesClick={onSparklesClick}
        />
      </PillFill>
    </PillRow>
  </Wrap>
);
