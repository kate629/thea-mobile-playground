import React, { forwardRef } from 'react';
import styled from 'styled-components';
import type { ResultsProductCardItem } from '../../components/landing/results/types';

// Thumbnail size — kept in sync with THUMB_SIZE_PX in useFlightAnimation so
// the flying clone lands at the right scale.
const THUMB_SIZE = 112;

const Panel = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  border-top: 1px solid hsl(var(--border));
  padding: 14px 14px 18px;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.06);
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
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
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const Thumb = styled.button`
  flex: 0 0 auto;
  width: ${THUMB_SIZE}px;
  height: ${THUMB_SIZE}px;
  border-radius: 14px;
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
  border-radius: 14px;
  border: 1.5px dashed hsl(var(--border));
  background: transparent;
`;

interface BoardSavedPanelProps {
  recipientName: string;
  items: ResultsProductCardItem[];
  onItemClick?: (item: ResultsProductCardItem) => void;
}

export const BoardSavedPanel = forwardRef<HTMLDivElement, BoardSavedPanelProps>(
  ({ recipientName, items, onItemClick }, ref) => (
    <Panel ref={ref} data-saved-panel>
      <Header>
        <Label>{recipientName} · saved</Label>
        <Count>{items.length}</Count>
      </Header>
      <Row>
        {items.length === 0
          ? Array.from({ length: 4 }).map((_, i) => <EmptySlot key={i} />)
          : items.map((item) => (
              <Thumb
                key={item.id}
                type="button"
                aria-label={`Open ${item.title}`}
                onClick={() => onItemClick?.(item)}
                data-saved-thumb-id={item.id}
              >
                <img src={item.imageUrl} alt={item.title} loading="lazy" />
              </Thumb>
            ))}
      </Row>
    </Panel>
  ),
);
BoardSavedPanel.displayName = 'BoardSavedPanel';
