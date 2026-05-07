import React from 'react';
import styled from 'styled-components';
import { useBottomSheet } from './useBottomSheet';

// Subtle paper-grain noise generated inline as an SVG data URL. ~3-4%
// opacity warm noise — barely perceptible on most screens, but adds the
// faintest texture that keeps the sheet from feeling flat-clinical.
const PAPER_GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.65 0 0 0 0 0.5 0 0 0 0 0.4 0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const Sheet = styled.div<{ $isDragging: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  /* Warm cream → softer cream gradient with a paper-grain noise overlay.
     The two layers stack — gradient first, grain on top. */
  background:
    ${PAPER_GRAIN},
    linear-gradient(180deg, ${({ theme }) => theme.color.creamLight} 0%, ${({ theme }) => theme.color.cream} 60%, ${({ theme }) => theme.color.cream} 100%);
  background-blend-mode: multiply, normal;
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  /* Soft warm shadow + a subtle hairline at the top edge for that "drawer
     opening" feel. */
  box-shadow:
    0 -1px 0 rgba(180, 110, 90, 0.08),
    0 -8px 28px rgba(180, 110, 90, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: ${({ $isDragging }) =>
    $isDragging ? 'none' : 'top 320ms cubic-bezier(0.22, 1, 0.36, 1)'};
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
