import React from 'react';
import styled from 'styled-components';
import { useBottomSheet } from './useBottomSheet';

const Sheet = styled.div<{ $isDragging: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  background: #ffffff;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: ${({ $isDragging }) =>
    $isDragging ? 'none' : 'top 320ms cubic-bezier(0.22, 1, 0.36, 1)'};
  /* Don't accept pointer events on the sheet root during drag — only the
     handle initiates drags. (The Body has pointer-events: auto.) */
`;

const HandleArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 4px;
  cursor: grab;
  touch-action: none; /* let pointer events handle the drag, not native scroll */
  user-select: none;
  &:active { cursor: grabbing; }
`;

const HandleBar = styled.span`
  width: 44px;
  height: 5px;
  border-radius: 999px;
  background: hsl(var(--border));
  display: block;
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const FeedScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* Internal scroll surface for the recommended-product feed. The chip tabs
     sit above this and never move with the feed scroll. */
`;

interface BoardBottomSheetProps {
  /** Sticky chip-tabs strip rendered at the top of the sheet body. */
  tabsSlot: React.ReactNode;
  /** Scrollable feed rendered below the tabs. */
  feedSlot: React.ReactNode;
}

export const BoardBottomSheet: React.FC<BoardBottomSheetProps> = ({
  tabsSlot,
  feedSlot,
}) => {
  const sheet = useBottomSheet('default');

  return (
    <Sheet
      $isDragging={sheet.isDragging}
      style={sheet.topPx !== undefined ? { top: `${sheet.topPx}px` } : undefined}
      aria-label="Recommendations sheet"
    >
      <HandleArea
        role="button"
        aria-label="Drag to resize sheet"
        onPointerDown={sheet.handlePointerDown}
        onPointerMove={sheet.handlePointerMove}
        onPointerUp={sheet.handlePointerUp}
        onPointerCancel={sheet.handlePointerUp}
      >
        <HandleBar />
      </HandleArea>
      <Body>
        {tabsSlot}
        <FeedScroll>{feedSlot}</FeedScroll>
      </Body>
    </Sheet>
  );
};
