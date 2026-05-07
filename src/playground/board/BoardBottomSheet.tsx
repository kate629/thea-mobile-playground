import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import type { SheetSnap } from './useBottomSheet';

const PAPER_GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.65 0 0 0 0 0.5 0 0 0 0 0.4 0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const Sheet = styled.div<{ $accentSoft: string }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 15;
  /* Page accent flowing in: page background already gradients from cream
     to a faint accent tint at the bottom; the sheet picks up the same
     accent tint at its top edge so the two surfaces feel connected. */
  --accent-tint: ${({ $accentSoft }) =>
    $accentSoft.replace('hsl(', 'hsla(').replace(')', ', 0.18)')};
  background:
    ${PAPER_GRAIN},
    linear-gradient(180deg,
      var(--accent-tint) 0%,
      ${({ theme }) => theme.color.creamLight} 35%,
      ${({ theme }) => theme.color.cream} 100%);
  background-blend-mode: multiply, normal;
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  box-shadow:
    0 -1px 0 rgba(180, 110, 90, 0.08),
    0 -8px 28px rgba(180, 110, 90, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: top 320ms cubic-bezier(0.22, 1, 0.36, 1);
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-top: 18px;
`;

// Toggle icon is portal-rendered to document.body so it can use a
// z-index above the sticky header. Inside the sheet's own stacking
// context (z-index 15), it would be hidden behind the sticky header
// (z-index 20) when the sheet is expanded.
const ToggleButton = styled.button<{ $top: number }>`
  position: fixed;
  top: ${({ $top }) => `${$top + 12}px`};
  right: 14px;
  z-index: 25;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid hsl(var(--border));
  cursor: pointer;
  color: hsl(var(--foreground));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: top 320ms cubic-bezier(0.22, 1, 0.36, 1),
              background 150ms ease,
              transform 150ms ease;
  &:hover { background: #ffffff; }
  &:active { transform: scale(0.94); }
`;

const ChevronUp: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ChevronDown: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

interface BoardBottomSheetProps {
  children: React.ReactNode;
  ariaLabel?: string;
  /** Sheet state from the parent's useBottomSheet instance. */
  topPx: number | undefined;
  currentSnap: SheetSnap;
  toggle: () => void;
  /** Sheet's accent color (recipient-derived) for the gradient bridge. */
  accentSoft: string;
}

export const BoardBottomSheet: React.FC<BoardBottomSheetProps> = ({
  children,
  ariaLabel = 'Saved tray',
  topPx,
  currentSnap,
  toggle,
  accentSoft,
}) => {
  const isExpanded = currentSnap === 'expanded';
  return (
    <>
      <Sheet
        $accentSoft={accentSoft}
        style={topPx !== undefined ? { top: `${topPx}px` } : undefined}
        aria-label={ariaLabel}
      >
        <Body>{children}</Body>
      </Sheet>
      {topPx !== undefined &&
        typeof document !== 'undefined' &&
        createPortal(
          <ToggleButton
            type="button"
            aria-label={isExpanded ? 'Collapse saved tray' : 'Expand saved tray'}
            $top={topPx}
            onClick={toggle}
          >
            {isExpanded ? <ChevronDown /> : <ChevronUp />}
          </ToggleButton>,
          document.body,
        )}
    </>
  );
};
