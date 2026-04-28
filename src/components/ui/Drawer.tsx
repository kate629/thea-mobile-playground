import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import { fadeIn, slideInFromBottom, slideInFromRight } from '../../animations';

export type DrawerSide = 'right' | 'bottom';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  closeOnBackdropClick?: boolean;
  ariaLabel: string;
  /** Width of the right-side drawer. Defaults to 420px. Ignored for bottom. */
  width?: number | string;
  /** Max-height of the bottom drawer. Defaults to 90vh. Ignored for right. */
  maxHeight?: number | string;
  children: React.ReactNode;
}

/* Stacking layer for the drawer.
   - Sticky page headers in this app sit at z-index 40 (ResultsHeader) /
     dropdowns at 50/60. Modal backdrop sits at 120.
   - Drawer must sit ABOVE the page header (so its own header isn't clipped)
     and the panel must sit ABOVE the scrim (so the scrim doesn't cover the
     panel content). 200/210 leaves room without colliding with Modal. */
const SCRIM_Z = 200;
const PANEL_Z = 210;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 15, 0.45);
  z-index: ${SCRIM_Z};
  animation: ${fadeIn} 200ms ease-out;
`;

const rightCss = css<{ $width: string }>`
  top: 0;
  right: 0;
  bottom: 0;
  /* Defensive: never let a sibling rule leak left:0 onto the right-anchored
     panel — without this, a transformed ancestor or stray rule could pull
     the panel to the left edge. */
  left: auto;
  width: ${({ $width }) => $width};
  max-width: 100%;
  animation: ${slideInFromRight} 280ms cubic-bezier(0.32, 0.72, 0, 1);
`;

const bottomCss = css<{ $maxHeight: string }>`
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-height: ${({ $maxHeight }) => $maxHeight};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  animation: ${slideInFromBottom} 280ms cubic-bezier(0.32, 0.72, 0, 1);
`;

const Panel = styled.div<{
  $side: DrawerSide;
  $width: string;
  $maxHeight: string;
}>`
  position: fixed;
  background: hsl(var(--background));
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* Panel sits above the scrim AND above any sticky page header. */
  z-index: ${PANEL_Z};
  /* Keep wheel/touch scroll inside the drawer body — don't chain to the
     underlying page when the user reaches the top/bottom of the drawer. */
  overscroll-behavior: contain;
  ${({ $side }) => ($side === 'right' ? rightCss : bottomCss)}
`;

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  side = 'right',
  closeOnBackdropClick = true,
  ariaLabel,
  width = 420,
  maxHeight = '90vh',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* Lock body scroll while the drawer is open so wheel/touch events that
     escape the drawer body don't scroll the underlying page. Restore the
     prior overflow value on close (so we don't trample anyone else's lock). */
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const widthValue = typeof width === 'number' ? `${width}px` : width;
  const maxHeightValue = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  /* Render via a portal to document.body so the drawer escapes any ancestor
     stacking / positioning / transform context (e.g. a transformed parent
     would otherwise re-anchor `position: fixed` and could push a
     right-anchored panel off-screen or align it to the wrong edge). */
  return createPortal(
    <>
      <Backdrop onClick={() => closeOnBackdropClick && onClose()} />
      <Panel
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        $side={side}
        $width={widthValue}
        $maxHeight={maxHeightValue}
      >
        {children}
      </Panel>
    </>,
    document.body,
  );
};
