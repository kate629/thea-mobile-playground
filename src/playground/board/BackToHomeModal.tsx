import React from 'react';
import styled from 'styled-components';

/**
 * Confirms a back-to-home navigation when the user is anon AND has saves
 * on the current board. Sign-in is offered as the primary path so the
 * user doesn't lose their picks; "Start over" is the muted escape hatch.
 *
 * Cancel is implicit — the user can tap the X in the corner OR click
 * outside the modal to dismiss without leaving.
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
  position: relative;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-width: 360px;
  padding: 22px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease, color 150ms ease;
  &:hover {
    background: ${({ theme }) => theme.color.cream};
    color: hsl(var(--foreground));
  }
`;

const Title = styled.h2`
  margin: 0;
  /* Reserve right-side space for the X close button so the title doesn't
     run under it. */
  padding-right: 36px;
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

const XIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

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
        <CloseButton type="button" aria-label="Close" onClick={onCancel}>
          <XIcon />
        </CloseButton>
        <Title id="back-modal-title">Save {recipientName}'s board first?</Title>
        <Body>
          Starting over loses all your picks for {recipientName}. Sign in to keep them.
        </Body>
        <Actions>
          <PrimaryButton type="button" onClick={onSignIn}>
            Sign in to save {recipientName}
          </PrimaryButton>
          <MutedButton type="button" onClick={onConfirmLeave}>
            Start over
          </MutedButton>
        </Actions>
      </Card>
    </Backdrop>
  );
};
