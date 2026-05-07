import React, { forwardRef } from 'react';
import styled from 'styled-components';
import type { ResultsProductCardItem } from '../../components/landing/results/types';

// Thumbnail size — kept in sync with THUMB_SIZE_PX in useFlightAnimation so
// the flying clone lands at the right scale.
const THUMB_SIZE = 132;

const Panel = styled.div`
  /* Lives in the upper "hero" area of the board (above the bottom sheet),
     no longer fixed at the bottom. The bottom sheet is the new fixed
     element below this. */
  background: transparent;
  padding: 14px 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const Label = styled.span`
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  letter-spacing: 0.02em;
`;

const Count = styled.span`
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  color: hsl(var(--muted-foreground));
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
  /* Add a tiny inset so thumbs aren't flush with the panel edge. */
  padding: 2px 2px 8px;
`;

const Thumb = styled.button`
  flex: 0 0 auto;
  width: ${THUMB_SIZE}px;
  height: ${THUMB_SIZE}px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted));
  padding: 0;
  cursor: pointer;
  transition: transform 150ms ease;
  &:active { transform: scale(0.96); }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const EmptySlot = styled.div`
  flex: 0 0 auto;
  width: ${THUMB_SIZE}px;
  height: ${THUMB_SIZE}px;
  border-radius: 16px;
  border: 1.5px dashed hsl(var(--border));
  background: transparent;
`;

const EmptyHint = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  flex: 1;
  min-width: 0;
`;

interface BoardSavedPanelProps {
  recipientName: string;
  /** Items in newest-first order. */
  items: ResultsProductCardItem[];
  onItemClick?: (item: ResultsProductCardItem) => void;
}

export const BoardSavedPanel = forwardRef<HTMLDivElement, BoardSavedPanelProps>(
  ({ recipientName, items, onItemClick }, ref) => (
    <Panel ref={ref} data-saved-panel>
      <Header>
        <Label>Saved for {recipientName}</Label>
        {items.length > 0 && <Count>{items.length}</Count>}
      </Header>
      <Row>
        {items.length === 0 ? (
          <>
            <EmptySlot />
            <EmptyHint>Save items below to start {recipientName}'s board</EmptyHint>
          </>
        ) : (
          items.map((item) => (
            <Thumb
              key={item.id}
              type="button"
              aria-label={`Open ${item.title}`}
              onClick={() => onItemClick?.(item)}
              data-saved-thumb-id={item.id}
            >
              <img src={item.imageUrl} alt={item.title} loading="lazy" />
            </Thumb>
          ))
        )}
      </Row>
    </Panel>
  ),
);
BoardSavedPanel.displayName = 'BoardSavedPanel';
