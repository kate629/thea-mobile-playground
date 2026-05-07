import React from 'react';
import styled from 'styled-components';
import type { SheetSnap } from './useBottomSheet';

const PAPER_GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.65 0 0 0 0 0.5 0 0 0 0 0.4 0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const Sheet = styled.div<{ $isDragging: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  background:
    ${PAPER_GRAIN},
    linear-gradient(180deg, ${({ theme }) => theme.color.creamLight} 0%, ${({ theme }) => theme.color.cream} 60%, ${({ theme }) => theme.color.cream} 100%);
  background-blend-mode: multiply, normal;
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
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
  padding: 14px 0 12px;
  cursor: grab;
  touch-action: none;
  user-select: none;
  &:active { cursor: grabbing; }
`;

const HandleBar = styled.span`
  width: 48px;
  height: 5px;
  border-radius: 999px;
  background: hsl(var(--muted-foreground) / 0.45);
  display: block;
`;

const Body = styled.div<{ $tappable: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  ${({ $tappable }) => $tappable && 'cursor: pointer;'}
`;

interface BoardBottomSheetProps {
  children: React.ReactNode;
  ariaLabel?: string;
  /** Sheet drag-state from the parent's useBottomSheet instance — lifted
   *  up so the parent can also derive `currentSnap` and switch its body
   *  layout (row vs grid) accordingly. */
  topPx: number | undefined;
  currentSnap: SheetSnap;
  isDragging: boolean;
  handlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  snapTo: (snap: SheetSnap) => void;
}

export const BoardBottomSheet: React.FC<BoardBottomSheetProps> = ({
  children,
  ariaLabel = 'Saved tray',
  topPx,
  currentSnap,
  isDragging,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  snapTo,
}) => {
  // Tapping the sheet body (not the handle) when not expanded → expand.
  // Once expanded, taps fall through to children (so users can still
  // interact with saved items).
  const bodyTappable = currentSnap !== 'expanded';
  const handleBodyClick = (e: React.MouseEvent) => {
    if (!bodyTappable) return;
    // Only expand when the user clicked the body itself, not a button or
    // interactive descendant. e.target === e.currentTarget is too strict
    // (children include text nodes etc.); instead, walk up and bail if
    // any ancestor up to currentTarget is a button/link/input.
    const path = e.nativeEvent.composedPath();
    for (const node of path) {
      if (node === e.currentTarget) break;
      if (node instanceof HTMLElement) {
        const tag = node.tagName;
        if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA') {
          return;
        }
      }
    }
    snapTo('expanded');
  };

  return (
    <Sheet
      $isDragging={isDragging}
      style={topPx !== undefined ? { top: `${topPx}px` } : undefined}
      aria-label={ariaLabel}
    >
      <HandleArea
        role="button"
        aria-label="Drag to resize sheet"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <HandleBar />
      </HandleArea>
      <Body $tappable={bodyTappable} onClick={handleBodyClick}>
        {children}
      </Body>
    </Sheet>
  );
};
