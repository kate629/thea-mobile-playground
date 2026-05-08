import React, { useState } from 'react';
import styled from 'styled-components';
import { BoardPriceFilter } from './BoardPriceFilter';
import {
  BoardSearchPill,
  type BoardSearchPillInitialValues,
} from './BoardSearchPill';

const Wrap = styled.header<{ $accentSoft: string }>`
  /* Sticky positioning is owned by the parent StickyTop in BoardLayout.
     Background is a gentle gradient: accent-tinted cream at the very top
     (where the Mom anchor sits) fading to plain cream at the bottom of
     the header. The bottom sheet has the same accent tint at its top —
     together the two tinted bookends frame the feed and visually link
     the Mom header to the Saved tray. */
  background: linear-gradient(
    180deg,
    ${({ $accentSoft }) =>
        $accentSoft.replace('hsl(', 'hsla(').replace(')', ', 0.18)')} 0%,
    ${({ theme }) => theme.color.creamLight} 100%
  );
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 8px;
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
`;

const BackButton = styled.button`
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
  justify-self: start;
  transition: background 150ms ease, transform 150ms ease;
  &:hover { background: ${({ theme }) => theme.color.cream}; }
  &:active { transform: scale(0.96); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
`;

const RecipientAnchor = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 22px;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
  letter-spacing: -0.01em;
`;

const RightActions = styled.div`
  justify-self: end;
  display: inline-flex;
`;

// Pill row: search pill + $ price filter button. Position: relative so the
// price filter dropdown can absolute-position itself below the row.
const PillRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  /* On desktop the header is on a wide column; the search pill at full
     width feels cavernous. Cap it at ~2/3 of the column on large
     viewports — still spacious, but no longer dwarfs the pill content
     and leaves the price filter button comfortably anchored. */
  @media (min-width: 1024px) {
    max-width: 66%;
  }
`;

const PillFill = styled.div`
  flex: 1;
  min-width: 0;
`;

const PriceButton = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  background: ${({ $active, theme }) => ($active ? theme.color.cream : '#ffffff')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: hsl(var(--foreground));
  /* Big bold $ — reads as a filter affordance, not an emoji. */
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  transition: background 150ms ease, transform 150ms ease;
  &:hover { background: ${({ theme }) => theme.color.cream}; }
  &:active { transform: scale(0.96); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }
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
  /** Soft accent color (HSL) used for the header's gentle gradient. */
  accentSoft: string;
  pillInitialValues: BoardSearchPillInitialValues;
  rightActions?: React.ReactNode;
  onBackClick?: () => void;
  onSparklesClick?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  recipientEmoji,
  recipientName,
  accentSoft,
  pillInitialValues,
  rightActions,
  onBackClick,
  onSparklesClick,
}) => {
  // Price filter state — local to the header for v1. Real implementation
  // would lift this up so the agent can use it as a search constraint.
  // Default range matches ProfileDrawer's defaults (0–200).
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  // Active when the user has narrowed the range away from full (0–200).
  const priceActive = priceOpen || priceRange[0] > 0 || priceRange[1] < 200;

  return (
    <Wrap $accentSoft={accentSoft}>
      <TopRow>
        <BackButton
          type="button"
          aria-label="Start a new search"
          onClick={onBackClick}
        >
          <ArrowLeftIcon />
        </BackButton>
        <RecipientAnchor>
          <span aria-hidden="true">{recipientEmoji}</span>
          <span>{recipientName}</span>
        </RecipientAnchor>
        <RightActions>{rightActions}</RightActions>
      </TopRow>
      <PillRow>
        <PillFill>
          <BoardSearchPill
            initialValues={pillInitialValues}
            onSparklesClick={onSparklesClick}
          />
        </PillFill>
        <PriceButton
          type="button"
          aria-label="Price range"
          $active={priceActive}
          onClick={() => setPriceOpen((o) => !o)}
        >
          <span aria-hidden="true">$</span>
        </PriceButton>
        <BoardPriceFilter
          open={priceOpen}
          value={priceRange}
          onChange={setPriceRange}
          onClose={() => setPriceOpen(false)}
        />
      </PillRow>
    </Wrap>
  );
};
