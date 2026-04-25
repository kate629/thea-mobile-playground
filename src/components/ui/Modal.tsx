import React, { useEffect } from 'react';
import styled from 'styled-components';
import { fadeIn, scaleIn } from '../../animations';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Tap backdrop to close. Default true. */
  closeOnBackdropClick?: boolean;
  /** Disable Escape-to-close. Default false. */
  disableEscapeClose?: boolean;
  /** Accessible label. Falls back to ariaLabelledBy. */
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Max width of the centered surface. Default 480px. */
  maxWidth?: number | string;
  children: React.ReactNode;
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 15, 0.45);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: ${fadeIn} 200ms ease-out;
`;

const Surface = styled.div<{ $maxWidth: string }>`
  background: hsl(var(--background));
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: ${({ $maxWidth }) => $maxWidth};
  max-height: calc(100vh - 48px);
  overflow: auto;
  animation: ${scaleIn} 200ms ease-out;
`;

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  closeOnBackdropClick = true,
  disableEscapeClose = false,
  ariaLabel,
  ariaLabelledBy,
  maxWidth = 480,
  children,
}) => {
  useEffect(() => {
    if (!open || disableEscapeClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, disableEscapeClose, onClose]);

  if (!open) return null;

  const widthValue = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;

  return (
    <Backdrop
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && closeOnBackdropClick) onClose();
      }}
    >
      <Surface
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        $maxWidth={widthValue}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </Surface>
    </Backdrop>
  );
};
