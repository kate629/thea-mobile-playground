import React from 'react';
import styled from 'styled-components';

const Bar = styled.header`
  /* Sticky positioning is owned by the parent StickyTop in BoardLayout — it
     pins the header + chip-tab row to the top of the viewport as one block. */
  background: ${({ theme }) => theme.color.creamLight};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 6px;
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

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  color: hsl(var(--foreground));
  cursor: pointer;
  max-width: 65%;
  overflow: hidden;
`;

const Name = styled.span`
  font-weight: 600;
  margin-right: 4px;
`;

const Interests = styled.span`
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Pencil: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

interface BoardHeaderProps {
  recipientName: string;
  recipientEmoji: string;
  interestsLabel: string;
  rightActions?: React.ReactNode;
  onLogoClick?: () => void;
  onPillClick?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  recipientName,
  recipientEmoji,
  interestsLabel,
  rightActions,
  onLogoClick,
  onPillClick,
}) => (
  <Bar>
    <Logo onClick={onLogoClick}>thea</Logo>
    <Pill type="button" onClick={onPillClick} aria-label="Edit recipient">
      <span>{recipientEmoji}</span>
      <Name>{recipientName}</Name>
      <Interests>{interestsLabel}</Interests>
      <Pencil />
    </Pill>
    {rightActions}
  </Bar>
);
