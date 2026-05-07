import React from 'react';
import styled from 'styled-components';

/**
 * Confirms a back-to-home navigation when the user is anon AND has saves
 * on the current board. Sign-in is offered as the primary path so the
 * user doesn't lose their work; "Start over anyway" is the muted escape
 * hatch.
 *
 * The actual sign-in + anon→permanent migration is stubbed in the
 * playground — the parent's `onSignIn` handler just navigates home with
 * a console.log. Real implementation would open the sign-in modal,
 * complete auth, run mergeGiftFlow, then navigate home.
 */

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: backdropFadeIn 180ms ease-out;
  @keyframes backdropFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-width: 360px;
  padding: 22px 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 18px;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const Body = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  line-height: 1.45;
  color: hsl(var(--muted-foreground));
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
`;

const PrimaryButton = styled.button`
  height: 44px;
  border-radius: 9999px;
  border: none;
  background: ${({ theme }) => theme.gradient.cta};
  color: #ffffff;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
  &:hover { box-shadow: ${({ theme }) => theme.shadow.lg}; }
  &:active { transform: scale(0.98); }
`;

const MutedButton = styled.button`
  height: 40px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover { color: hsl(var(--foreground)); }
`;

const CancelButton = styled(MutedButton)`
  font-weight: 600;
`;

interface BackToHomeModalProps {
  open: boolean;
  recipientName: string;
  onSignIn: () => void;
  onConfirmLeave: () => void;
  onCancel: () => void;
}

export const BackToHomeModal: React.FC<BackToHomeModalProps> = ({
  open,
  recipientName,
  onSignIn,
  onConfirmLeave,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <Backdrop role="dialog" aria-modal="true" aria-labelledby="back-modal-title" onClick={onCancel}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Title id="back-modal-title">Save {recipientName}'s board first?</Title>
        <Body>
          {recipientName} is just on this device right now. Sign in and we'll
          keep {recipientName === "Me!" ? 'it' : 'her'} safe across visits — every device.
        </Body>
        <Actions>
          <PrimaryButton type="button" onClick={onSignIn}>
            Sign in to save {recipientName}
          </PrimaryButton>
          <MutedButton type="button" onClick={onConfirmLeave}>
            Start over anyway
          </MutedButton>
          <CancelButton type="button" onClick={onCancel}>
            Cancel
          </CancelButton>
        </Actions>
      </Card>
    </Backdrop>
  );
};
