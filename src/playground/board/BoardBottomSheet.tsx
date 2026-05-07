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
  position: relative;
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

// Close X — only rendered when the sheet is expanded so the user has an
// obvious way to collapse back to default. Tap-to-cycle on the handle bar
// works too but isn't discoverable.
const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid hsl(var(--border));
  cursor: pointer;
  color: hsl(var(--foreground));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: background 150ms ease, transform 150ms ease;
  &:hover { background: #ffffff; }
  &:active { transform: scale(0.94); }
`;

const XIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

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
        {currentSnap === 'expanded' && (
          <CloseButton
            type="button"
            aria-label="Collapse sheet"
            onClick={(e) => {
              e.stopPropagation();
              snapTo('default');
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <XIcon />
          </CloseButton>
        )}
      </HandleArea>
      <Body $tappable={bodyTappable} onClick={handleBodyClick}>
        {children}
      </Body>
    </Sheet>
  );
};
