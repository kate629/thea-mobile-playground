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
  /* Generous hit area so the handle is easy to grab even at the top of a
     long viewport. Padding doubles as visual breathing room above the chip
     tabs. */
  padding: 14px 0 12px;
  cursor: grab;
  touch-action: none; /* let pointer events handle the drag, not native scroll */
  user-select: none;
  &:active { cursor: grabbing; }
`;

const HandleBar = styled.span`
  width: 48px;
  height: 5px;
  border-radius: 999px;
  /* A touch darker than --border so it reads as interactive rather than as
     a divider. Tap or drag both work via useBottomSheet. */
  background: hsl(var(--muted-foreground) / 0.45);
  display: block;
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

interface BoardBottomSheetProps {
  /** Sheet body contents — the saved tray in the new flipped layout. */
  children: React.ReactNode;
  ariaLabel?: string;
}

export const BoardBottomSheet: React.FC<BoardBottomSheetProps> = ({
  children,
  ariaLabel = 'Saved tray',
}) => {
  const sheet = useBottomSheet('default');

  return (
    <Sheet
      $isDragging={sheet.isDragging}
      style={sheet.topPx !== undefined ? { top: `${sheet.topPx}px` } : undefined}
      aria-label={ariaLabel}
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
      <Body>{children}</Body>
    </Sheet>
  );
};
