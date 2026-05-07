import React, { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import { BoardBottomSheet } from './BoardBottomSheet';
import { BoardChipTabs, type ChipTab } from './BoardChipTabs';
import { BoardFeed } from './BoardFeed';
import { BoardHeader } from './BoardHeader';
import { BoardSavedPanel } from './BoardSavedPanel';
import type { BoardSearchPillInitialValues } from './BoardSearchPill';
import { accentForEmoji } from './recipientAccent';
import { useBottomSheet } from './useBottomSheet';
import { useFlightAnimation } from './useFlightAnimation';

// Mobile shell (Mom's board):
//   ┌──────────────────────────┐  StickyTop (header)
//   │  ←   🌷 Mom    Sign in   │
//   │  [WHAT │ LIKES]          │
//   ├──────────────────────────┤  MainContent (recommendations)
//   │  Decor · Cooking · ...   │   chip tabs (interest categories)
//   │  ┌──────────────┐         │
//   │  │ product card │         │   scrollable feed of recs
//   │  └──────────────┘         │
//   ├──────────────────────────┤  BottomSheet — fixed, draggable
//   │  ────                     │   handle
//   │  Saved for Mom · 7        │   saved tray (label + thumbs)
//   │  [thumb] [thumb] [...]    │
//   └──────────────────────────┘

const Page = styled.div`
  height: 100dvh;
  background: ${({ theme }) => theme.color.creamLight};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const StickyTop = styled.div`
  flex: 0 0 auto;
  position: relative;
  /* Higher than BoardBottomSheet (z-index: 15) so the search pill's WHO/
     WHAT/LIKES dropdowns paint OVER the sheet. Without this, dropdowns
     opening downward from the pill get clipped behind the sheet and the
     user can't read or tap them. */
  z-index: 20;
  background: ${({ theme }) => theme.color.creamLight};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const FeedScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 8px;
`;

export interface BoardChipSection {
  key: string;
  label: string;
  /** Optional decorative emoji shown alongside the tab label. */
  emoji?: string;
  products: ResultsProductCardItem[];
}

export interface BoardLayoutProps {
  recipientName: string;
  recipientEmoji: string;
  pillInitialValues: BoardSearchPillInitialValues;
  rightActions?: React.ReactNode;
  onBackClick?: () => void;
  onSparklesClick?: () => void;

  chipSections: BoardChipSection[];
  savedItems: ResultsProductCardItem[];
  /** Item IDs currently animating to the saved panel — rendered with a
   *  fade-out so the card and the flying clone visually merge. */
  departingIds?: Set<string>;

  isLiked: (id: string) => boolean;
  onSaveClick: (item: ResultsProductCardItem) => void;
  onProductClick: (item: ResultsProductCardItem) => void;
  onMarkPurchased?: (item: ResultsProductCardItem) => void;
  onSavedItemClick?: (item: ResultsProductCardItem) => void;
}

export const BoardLayout: React.FC<BoardLayoutProps> = ({
  recipientName,
  recipientEmoji,
  pillInitialValues,
  rightActions,
  onBackClick,
  onSparklesClick,
  chipSections,
  savedItems,
  departingIds,
  isLiked,
  onSaveClick,
  onProductClick,
  onMarkPurchased,
  onSavedItemClick,
}) => {
  const initialKey = chipSections[0]?.key ?? '';
  const [activeKey, setActiveKey] = useState(initialKey);
  const savedPanelRef = useRef<HTMLDivElement | null>(null);

  const tabs: ChipTab[] = useMemo(
    () => chipSections.map((s) => ({ key: s.key, label: s.label, emoji: s.emoji })),
    [chipSections],
  );

  const activeProducts = useMemo(
    () => chipSections.find((s) => s.key === activeKey)?.products ?? [],
    [chipSections, activeKey],
  );

  const accent = useMemo(() => accentForEmoji(recipientEmoji), [recipientEmoji]);

  const sheet = useBottomSheet('default');
  const flight = useFlightAnimation();

  const handleSaveWithFlight = (
    item: ResultsProductCardItem,
    sourceEl: HTMLElement | null,
  ) => {
    const sourceRect = sourceEl?.getBoundingClientRect() ?? null;
    const destRect = savedPanelRef.current?.getBoundingClientRect() ?? null;
    flight.trigger({ imageUrl: item.imageUrl, sourceRect, destRect });
    onSaveClick(item);
  };

  return (
    <Page>
      <StickyTop>
        <BoardHeader
          recipientEmoji={recipientEmoji}
          recipientName={recipientName}
          pillInitialValues={pillInitialValues}
          rightActions={rightActions}
          onBackClick={onBackClick}
          onSparklesClick={onSparklesClick}
        />
      </StickyTop>
      <MainContent>
        <BoardChipTabs tabs={tabs} activeKey={activeKey} onChange={setActiveKey} />
        <FeedScroll>
          <BoardFeed
            products={activeProducts}
            isLiked={isLiked}
            departingIds={departingIds}
            onSaveClick={handleSaveWithFlight}
            onProductClick={onProductClick}
            onMarkPurchased={onMarkPurchased}
          />
        </FeedScroll>
      </MainContent>
      <BoardBottomSheet
        ariaLabel={`Saved tray for ${recipientName}`}
        topPx={sheet.topPx}
        currentSnap={sheet.currentSnap}
        isDragging={sheet.isDragging}
        handlePointerDown={sheet.handlePointerDown}
        handlePointerMove={sheet.handlePointerMove}
        handlePointerUp={sheet.handlePointerUp}
        snapTo={sheet.snapTo}
      >
        <BoardSavedPanel
          ref={savedPanelRef}
          recipientName={recipientName}
          items={savedItems}
          accent={accent}
          layout={sheet.currentSnap === 'expanded' ? 'grid' : 'row'}
          onItemClick={onSavedItemClick}
        />
      </BoardBottomSheet>
      {flight.portal}
    </Page>
  );
};
