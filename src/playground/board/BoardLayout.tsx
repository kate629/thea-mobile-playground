import React, { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import { BoardBottomSheet } from './BoardBottomSheet';
import { BoardChipTabs, type ChipTab } from './BoardChipTabs';
import { BoardFeed } from './BoardFeed';
import { BoardHeader } from './BoardHeader';
import { BoardSavedPanel } from './BoardSavedPanel';
import type { BoardSearchPillInitialValues } from './BoardSearchPill';
import { BoardEditChipsPanel } from './BoardEditChipsPanel';
import { getChipMeta } from './canonicalChips';
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

// Wraps the chip-tab strip so the BoardEditChipsPanel can position itself
// absolutely below it.
const ChipStripWrap = styled.div`
  position: relative;
  flex: 0 0 auto;
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

  // Which chip keys render as tabs in the strip. Initialized from the
  // chips the recipient already has products for; mutated via the
  // "+ More" edit panel. Adding a chip not in the original session shows
  // an empty tab — real implementation would refetch products for that
  // category.
  const [selectedChipKeys, setSelectedChipKeys] = useState<Set<string>>(
    () => new Set(chipSections.map((s) => s.key)),
  );
  const [editPanelOpen, setEditPanelOpen] = useState(false);

  // Keep selectedChipKeys in sync with the initial section list when it
  // first loads (the page may render with empty chipSections briefly
  // while the session resolves).
  React.useEffect(() => {
    if (selectedChipKeys.size === 0 && chipSections.length > 0) {
      setSelectedChipKeys(new Set(chipSections.map((s) => s.key)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipSections]);

  // Build the visible sections from selectedChipKeys, falling back to
  // synthetic empty sections (label + emoji from canonicalChips) for
  // selected chips that don't have products yet.
  const visibleSections = useMemo(() => {
    const byKey = new Map(chipSections.map((s) => [s.key, s]));
    const ordered: BoardChipSection[] = [];
    // Preserve session order for known sections, then append newly-added
    // chips in alpha order at the end.
    chipSections.forEach((s) => {
      if (selectedChipKeys.has(s.key)) ordered.push(s);
    });
    const added = Array.from(selectedChipKeys)
      .filter((k) => !byKey.has(k))
      .sort();
    added.forEach((k) => {
      const meta = getChipMeta(k);
      ordered.push({
        key: k,
        label: meta?.label ?? k,
        emoji: meta?.emoji,
        products: [],
      });
    });
    return ordered;
  }, [chipSections, selectedChipKeys]);

  // If the activeKey was removed from selection, fall back to the first
  // visible section.
  React.useEffect(() => {
    if (visibleSections.length === 0) return;
    if (!visibleSections.find((s) => s.key === activeKey)) {
      setActiveKey(visibleSections[0].key);
    }
  }, [visibleSections, activeKey]);

  const tabs: ChipTab[] = useMemo(
    () => visibleSections.map((s) => ({ key: s.key, label: s.label, emoji: s.emoji })),
    [visibleSections],
  );

  const activeProducts = useMemo(
    () => visibleSections.find((s) => s.key === activeKey)?.products ?? [],
    [visibleSections, activeKey],
  );

  const handleToggleChip = (key: string) => {
    setSelectedChipKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
        <ChipStripWrap>
          <BoardChipTabs
            tabs={tabs}
            activeKey={activeKey}
            onChange={setActiveKey}
            trailingLabel="More"
            onTrailingClick={() => setEditPanelOpen(true)}
          />
          <BoardEditChipsPanel
            open={editPanelOpen}
            selectedKeys={selectedChipKeys}
            onToggle={handleToggleChip}
            onClose={() => setEditPanelOpen(false)}
          />
        </ChipStripWrap>
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
