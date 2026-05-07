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
  interestsLabel: string;
  rightActions?: React.ReactNode;
  onLogoClick?: () => void;
  onPillClick?: () => void;

  chipSections: BoardChipSection[];
  savedItems: ResultsProductCardItem[];

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
  rightActions,
  onLogoClick,
  onPillClick,
  chipSections,
  savedItems,
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
      <BoardHeader
        recipientName={recipientName}
        recipientEmoji={recipientEmoji}
        interestsLabel={interestsLabel}
        rightActions={rightActions}
        onLogoClick={onLogoClick}
        onPillClick={onPillClick}
      />
      <BoardChipTabs tabs={tabs} activeKey={activeKey} onChange={setActiveKey} />
      <Main>
        <BoardFeed
          products={activeProducts}
          isLiked={isLiked}
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
