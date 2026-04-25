import React from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { Button } from './Button';

export interface AlertDialogAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
}

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  primaryAction: AlertDialogAction;
  /** Optional secondary (cancel) action. When omitted renders a one-button dialog. */
  secondaryAction?: AlertDialogAction;
  /** Default true: tapping the backdrop closes. Set false for must-acknowledge dialogs. */
  closeOnBackdropClick?: boolean;
}

const Body = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const Description = styled.div`
  margin: 0;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  line-height: 1.5;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
`;

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onClose,
  title,
  description,
  primaryAction,
  secondaryAction,
  closeOnBackdropClick = true,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    closeOnBackdropClick={closeOnBackdropClick}
    ariaLabel={title}
    maxWidth={420}
  >
    <Body>
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      <Footer>
        {secondaryAction && (
          <Button
            label={secondaryAction.label}
            variant={secondaryAction.variant ?? 'ghost'}
            onClick={secondaryAction.onClick}
          />
        )}
        <Button
          label={primaryAction.label}
          variant={primaryAction.variant ?? 'primary'}
          size="md"
          onClick={primaryAction.onClick}
        />
      </Footer>
    </Body>
  </Modal>
);
