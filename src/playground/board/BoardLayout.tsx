import React, { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import { BoardChipTabs, type ChipTab } from './BoardChipTabs';
import { BoardFeed } from './BoardFeed';
import { BoardHeader } from './BoardHeader';
import { BoardSavedPanel } from './BoardSavedPanel';
import { useFlightAnimation } from './useFlightAnimation';

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.color.creamLight};
  display: flex;
  flex-direction: column;
`;

// Pins the header AND the chip-tab row to the top of the viewport together
// so they scroll-stick as one block. Each child setting its own `top: 0`
// would make them overlap.
const StickyTop = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${({ theme }) => theme.color.creamLight};
`;

const Main = styled.div`
  flex: 1;
  padding: 0 8px;
`;

export interface BoardChipSection {
  key: string;
  label: string;
  products: ResultsProductCardItem[];
}

export interface BoardLayoutProps {
  recipientName: string;
  recipientEmoji: string;
  /** Compact label for the LIKES segment of the search pill, e.g. "Cozy +2". */
  interestsLabel: string;
  /** Display label for the WHAT segment, e.g. "Mother's Day". */
  occasionLabel: string;
  rightActions?: React.ReactNode;
  onLogoClick?: () => void;
  onPillClick?: () => void;

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
  interestsLabel,
  occasionLabel,
  rightActions,
  onLogoClick,
  onPillClick,
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
          recipientName={recipientName}
          recipientEmoji={recipientEmoji}
          whatText={occasionLabel}
          likesText={interestsLabel}
          rightActions={rightActions}
          onLogoClick={onLogoClick}
          onPillClick={onPillClick}
        />
        <BoardChipTabs tabs={tabs} activeKey={activeKey} onChange={setActiveKey} />
      </StickyTop>
      <Main>
        <BoardFeed
          products={activeProducts}
          isLiked={isLiked}
          departingIds={departingIds}
          onSaveClick={handleSaveWithFlight}
          onProductClick={onProductClick}
          onMarkPurchased={onMarkPurchased}
        />
      </Main>
      <BoardSavedPanel
        ref={savedPanelRef}
        recipientName={recipientName}
        items={savedItems}
        onItemClick={onSavedItemClick}
      />
      {flight.portal}
    </Page>
  );
};
