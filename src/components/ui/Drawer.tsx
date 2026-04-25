import React, { useEffect } from 'react';
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

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 15, 0.45);
  z-index: 100;
  animation: ${fadeIn} 200ms ease-out;
`;

const rightCss = css<{ $width: string }>`
  top: 0;
  right: 0;
  bottom: 0;
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

  if (!open) return null;

  const widthValue = typeof width === 'number' ? `${width}px` : width;
  const maxHeightValue = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  return (
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
    </>
  );
};
