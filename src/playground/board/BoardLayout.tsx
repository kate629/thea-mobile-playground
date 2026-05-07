import React, { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import { BoardBottomSheet } from './BoardBottomSheet';
import { BoardChipTabs, type ChipTab } from './BoardChipTabs';
import { BoardFeed } from './BoardFeed';
import { BoardHeader } from './BoardHeader';
import { BoardSavedPanel } from './BoardSavedPanel';
import type { BoardSearchPillInitialValues } from './BoardSearchPill';
import { useFlightAnimation } from './useFlightAnimation';

// Airbnb-style mobile shell:
//   ┌──────────────────────────┐  StickyTop (header + search pill)
//   │   thea          Sign in  │
//   │  [WHO|WHAT|LIKES   ✨]   │
//   ├──────────────────────────┤  SavedArea (replaces Airbnb's map)
//   │  Saved for Mom           │
//   │  [thumb] [thumb] [thumb] │
//   ├──────────────────────────┤  BottomSheet — fixed, draggable
//   │  ────                     │   handle
//   │  Decor · Cooking · Beauty│   sticky chip tabs
//   │  ┌──────────────┐         │
//   │  │ product card │         │   scrollable feed
//   │  └──────────────┘         │
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

const SavedArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* Bottom padding clears the bottom sheet at its tallest snap point — the
     sheet itself is fixed-position so it just sits on top of this area. */
`;

export interface BoardChipSection {
  key: string;
  label: string;
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
    () => chipSections.map((s) => ({ key: s.key, label: s.label })),
    [chipSections],
  );

  const activeProducts = useMemo(
    () => chipSections.find((s) => s.key === activeKey)?.products ?? [],
    [chipSections, activeKey],
  );

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
      <SavedArea>
        <BoardSavedPanel
          ref={savedPanelRef}
          recipientName={recipientName}
          items={savedItems}
          onItemClick={onSavedItemClick}
        />
      </SavedArea>
      <BoardBottomSheet
        tabsSlot={
          <BoardChipTabs tabs={tabs} activeKey={activeKey} onChange={setActiveKey} />
        }
        feedSlot={
          <BoardFeed
            products={activeProducts}
            isLiked={isLiked}
            departingIds={departingIds}
            onSaveClick={handleSaveWithFlight}
            onProductClick={onProductClick}
            onMarkPurchased={onMarkPurchased}
          />
        }
      />
      {flight.portal}
    </Page>
  );
};
