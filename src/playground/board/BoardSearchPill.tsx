import React from 'react';
import styled from 'styled-components';

/**
 * Visual mimic of `src/components/landing/marketing/SearchPill.tsx` (the
 * logged-in homepage searchbar) for the board surface.
 *
 * Three segments — WHO / WHAT / LIKES — show the recipient's frozen values
 * from the recommendation. Tapping any segment OR the sparkles button opens
 * the existing ProfileDrawer for editing. The visual styling is copied from
 * SearchPill so the two surfaces feel identical.
 */

const Wrap = styled.div`
  width: 100%;
`;

const Pill = styled.div`
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  box-shadow: ${({ theme }) => theme.shadow.card};
  padding: 4px;
  gap: 0;
  width: 100%;
`;

const SegmentButton = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  position: relative;
  transition: background 150ms ease;
  min-width: 0; /* allow flex items to shrink below content width for ellipsis */

  &:hover {
    background: ${({ theme }) => theme.color.cream};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.3);
  }

  & + & {
    border-left: 1px solid ${({ theme }) => theme.color.warmBorder};
  }
`;

const SegmentLabel = styled.span`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  line-height: 1;
`;

const SegmentValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: hsl(var(--foreground));
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const SparklesButton = styled.button`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  border: none;
  margin: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  background: ${({ theme }) => theme.gradient.cta};
  transition: transform 150ms ease, box-shadow 150ms ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadow.lg};
  }
  &:active { transform: scale(0.97); }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.4);
  }
`;

const SparklesIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4L12 3z" />
    <path d="M19 14l.7 1.8L21.5 16l-1.8.7L19 18.5l-.7-1.8L16.5 16l1.8-.7L19 14z" />
    <path d="M5 16l.5 1.3L6.7 18l-1.3.5L5 19.7l-.5-1.3L3.3 18l1.3-.5L5 16z" />
  </svg>
);

export interface BoardSearchPillProps {
  whoEmoji?: string;
  whoText: string;
  whatText: string;
  likesText: string;
  onSegmentClick?: () => void;
  onSparklesClick?: () => void;
}

export const BoardSearchPill: React.FC<BoardSearchPillProps> = ({
  whoEmoji,
  whoText,
  whatText,
  likesText,
  onSegmentClick,
  onSparklesClick,
}) => (
  <Wrap>
    <Pill>
      <SegmentButton
        type="button"
        aria-label={`Edit who: ${whoText}`}
        onClick={onSegmentClick}
      >
        <SegmentLabel>Who</SegmentLabel>
        <SegmentValue>
          {whoEmoji && <span aria-hidden="true">{whoEmoji}</span>}
          <span>{whoText}</span>
        </SegmentValue>
      </SegmentButton>
      <SegmentButton
        type="button"
        aria-label={`Edit occasion: ${whatText}`}
        onClick={onSegmentClick}
      >
        <SegmentLabel>What</SegmentLabel>
        <SegmentValue>{whatText || 'Occasion'}</SegmentValue>
      </SegmentButton>
      <SegmentButton
        type="button"
        aria-label={`Edit likes: ${likesText}`}
        onClick={onSegmentClick}
      >
        <SegmentLabel>Likes</SegmentLabel>
        <SegmentValue>{likesText || 'Interests'}</SegmentValue>
      </SegmentButton>
      <SparklesButton
        type="button"
        aria-label="Refresh picks"
        onClick={onSparklesClick}
      >
        <SparklesIcon />
      </SparklesButton>
    </Pill>
  </Wrap>
);
