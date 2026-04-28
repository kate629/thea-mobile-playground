import React, { useEffect, useState } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import styled, { createGlobalStyle, css } from 'styled-components';

import {
  consumeGoogleRedirectResult,
  isValidEmail,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from './accountAuth';
import { useSetMergeStatus } from './MergeStateContext';

export type AuthMode = 'signin' | 'signup';

export interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which view to open to. The user can still toggle between them. */
  defaultMode?: AuthMode;
  /**
   * Fires once after a successful sign-in/sign-up. Used by AuthGate to commit
   * a "save-intent" action (e.g. the heart click that opened the modal).
   * Awaited before the modal closes.
   */
  onAuthed?: () => void | Promise<void>;
}

const RESET_COOLDOWN_MS = 30_000;

/**
 * react-bootstrap's `<Modal>` provides the dialog primitive but its default
 * chrome (header bar, body padding, close X) clashes with the sovrn layout we
 * want. We override `Modal.Dialog` styles via a portal-targeted global rule
 * because the dialog renders outside the React tree at runtime.
 *
 * On small viewports we drop the modal to a bottom sheet (sovrn uses Radix
 * Sheet for this; we approximate with media-query positioning).
 */
const ModalGlobalStyles = createGlobalStyle`
  .thea-auth-modal .modal-dialog {
    max-width: 400px;
    margin: 1.75rem auto;
  }
  .thea-auth-modal .modal-content {
    border: 0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  }
  @media (max-width: 640px) {
    .thea-auth-modal .modal-dialog {
      margin: 0;
      align-items: flex-end;
      min-height: 100vh;
      display: flex;
      max-width: none;
    }
    .thea-auth-modal .modal-content {
      width: 100%;
      border-radius: 12px 12px 0 0;
      max-height: 85vh;
    }
  }
`;

const ModalChrome = styled.div`
  position: relative;
  padding: 24px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: ${({ theme }) => theme.color.mutedText};
  cursor: pointer;
  transition: background-color 150ms ease;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const Wordmark = styled.div`
  text-align: center;
  margin-bottom: 6px;
  padding-right: 24px;
  span {
    font-family: ${({ theme }) => theme.font.serif};
    font-style: italic;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.color.clay};
    font-size: 26px;
    line-height: 1;
  }
`;

const Heading = styled.h2`
  font-family: ${({ theme }) => theme.font.serif};
  text-align: center;
  font-size: 22px;
  color: #1a1a1a;
  line-height: 1.2;
  padding-right: 24px;
  margin: 0;
`;

const Spacer = styled.div<{ $h: number }>`
  height: ${({ $h }) => $h}px;
`;

const baseControl = css`
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 15px;
  font-family: ${({ theme }) => theme.font.sans};
  transition: opacity 150ms ease;
`;

const ProviderButton = styled.button`
  ${baseControl}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  background: #ffffff;
  color: #1a1a1a;
  font-weight: 500;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  span {
    font-family: ${({ theme }) => theme.font.sans};
    font-size: 13px;
    color: ${({ theme }) => theme.color.mutedText};
  }
  hr {
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.color.warmBorder};
    border: 0;
    margin: 0;
  }
`;

const Input = styled.input<{ $error?: boolean }>`
  ${baseControl}
  padding: 0 14px;
  border: 1px solid
    ${({ theme, $error }) => ($error ? theme.color.errorRed : theme.color.warmBorder)};
  background: #ffffff;
  color: #1a1a1a;
  &:focus {
    outline: 2px solid ${({ theme }) => theme.color.clay};
    outline-offset: 2px;
  }
`;

const PasswordWrap = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  color: ${({ theme }) => theme.color.mutedText};
  cursor: pointer;
`;

const ErrorText = styled.p`
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  color: ${({ theme }) => theme.color.errorRed};
  margin: 6px 0 0;
`;

const PrimaryButton = styled.button`
  ${baseControl}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: ${({ theme }) => theme.color.clay};
  color: #ffffff;
  border: 0;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ForgotRow = styled.div`
  text-align: center;
  margin-top: 8px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  button {
    background: transparent;
    border: 0;
    color: ${({ theme }) => theme.color.clay};
    cursor: pointer;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
  p {
    color: ${({ theme }) => theme.color.mutedText};
    margin: 0;
  }
`;

const ToggleRow = styled.p`
  text-align: center;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  color: ${({ theme }) => theme.color.mutedText};
  margin: 16px 0 0;
  button {
    background: transparent;
    border: 0;
    color: ${({ theme }) => theme.color.clay};
    font-weight: 500;
    cursor: pointer;
  }
`;

export const SignInModal: React.FC<SignInModalProps> = ({
  open,
  onOpenChange,
  defaultMode = 'signup',
  onAuthed,
}) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  // Reset to caller's defaultMode each time the modal is opened.
  useEffect(() => {
    if (open) setMode(defaultMode);
  }, [open, defaultMode]);

  const fireAuthed = async () => {
    try {
      await onAuthed?.();
    } catch (err) {
      console.error('[SignInModal] onAuthed callback failed:', err);
    }
  };

  return (
    <>
      <ModalGlobalStyles />
      <Modal
        show={open}
        onHide={() => onOpenChange(false)}
        centered
        backdrop="static"
        keyboard
        dialogClassName="thea-auth-modal"
        aria-labelledby="thea-auth-heading"
      >
        <ModalChrome>
          <CloseButton type="button" onClick={() => onOpenChange(false)} aria-label="Close">
            <CloseGlyph />
          </CloseButton>
          <AuthBody
            mode={mode}
            onModeChange={setMode}
            onSuccess={async () => {
              await fireAuthed();
              onOpenChange(false);
            }}
          />
        </ModalChrome>
      </Modal>
    </>
  );
};

interface AuthBodyProps {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  onSuccess: () => Promise<void> | void;
}

const AuthBody: React.FC<AuthBodyProps> = ({ mode, onModeChange, onSuccess }) => {
  const setMergeStatus = useSetMergeStatus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [resetSent, setResetSent] = useState(false);
  const [resetCooldownUntil, setResetCooldownUntil] = useState(0);
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    if (resetCooldownUntil <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [resetCooldownUntil]);

  const switchMode = (next: AuthMode) => {
    setEmailError('');
    setPasswordError('');
    setResetSent(false);
    onModeChange(next);
  };

  // Mobile-redirect Google flow: when modal opens, pick up any pending result.
  useEffect(() => {
    let cancelled = false;
    consumeGoogleRedirectResult(undefined, setMergeStatus)
      .then(async (user) => {
        if (cancelled || !user) return;
        await onSuccess();
      })
      .catch(() => {
        // No pending result — silent.
      });
    return () => {
      cancelled = true;
    };
    // Run once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogle = async () => {
    setEmailError('');
    setPasswordError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle(undefined, setMergeStatus);
      if (result?.user) {
        await onSuccess();
      }
      // On mobile redirect, page reloads — no further work here.
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User cancelled — silent.
      } else {
        console.error('[SignInModal] Google sign-in failed:', err);
        setPasswordError('Sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(trimmedEmail, password, undefined, setMergeStatus);
      } else {
        await signInWithEmail(trimmedEmail, password, undefined, setMergeStatus);
      }
      await onSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (mode === 'signup' && code === 'auth/email-already-in-use') {
        setEmailError('That email already has an account — sign in below.');
        setPassword('');
        onModeChange('signin');
      } else if (code === 'auth/invalid-email') {
        setEmailError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setPasswordError('Password must be at least 8 characters.');
      } else if (
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential'
      ) {
        setPasswordError("Email or password doesn't match.");
      } else if (code === 'auth/too-many-requests') {
        setPasswordError('Too many attempts — try again in a few minutes.');
      } else {
        console.error('[SignInModal] Email auth failed:', err);
        setPasswordError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (Date.now() < resetCooldownUntil) return;
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Enter your email above first, then tap Forgot password.');
      return;
    }
    setEmailError('');
    setResetCooldownUntil(Date.now() + RESET_COOLDOWN_MS);
    try {
      await sendPasswordReset(trimmedEmail);
    } catch (err) {
      // Firebase intentionally returns success-ish even for unknown emails to
      // prevent enumeration; mirror that by showing the same confirmation.
    }
    setResetSent(true);
  };

  const heading = mode === 'signup' ? 'Create your account' : 'Welcome back';
  const primaryLabel = mode === 'signup' ? 'Create account' : 'Sign in';
  const passwordPlaceholder = mode === 'signup' ? 'Create a password' : 'Password';
  const cooldownRemaining = Math.max(0, Math.ceil((resetCooldownUntil - Date.now()) / 1000));

  return (
    <div>
      <Wordmark>
        <span>thea</span>
      </Wordmark>
      <Heading id="thea-auth-heading">{heading}</Heading>

      <Spacer $h={24} />

      <ProviderButton type="button" onClick={handleGoogle} disabled={googleLoading || submitting}>
        {googleLoading ? <Spinner animation="border" size="sm" /> : <GoogleIcon />}
        <span>{googleLoading ? 'Signing in…' : 'Continue with Google'}</span>
      </ProviderButton>

      <Divider>
        <hr />
        <span>or</span>
        <hr />
      </Divider>

      <form onSubmit={handleSubmit} noValidate>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
          $error={!!emailError}
        />
        {emailError && <ErrorText id="email-error">{emailError}</ErrorText>}

        <Spacer $h={8} />

        <PasswordWrap>
          <Input
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passwordPlaceholder}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
            $error={!!passwordError}
            style={{ paddingRight: 44 }}
          />
          <PasswordToggle
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffGlyph /> : <EyeGlyph />}
          </PasswordToggle>
        </PasswordWrap>
        {passwordError && <ErrorText id="password-error">{passwordError}</ErrorText>}

        <Spacer $h={16} />

        <PrimaryButton type="submit" disabled={submitting || googleLoading}>
          {submitting && <Spinner animation="border" size="sm" />}
          {submitting ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : primaryLabel}
        </PrimaryButton>
      </form>

      {mode === 'signin' && (
        <ForgotRow>
          {resetSent ? (
            <p>Reset link sent — check your email.</p>
          ) : (
            <button type="button" onClick={handleForgot} disabled={cooldownRemaining > 0}>
              {cooldownRemaining > 0 ? `Forgot password? (${cooldownRemaining}s)` : 'Forgot password?'}
            </button>
          )}
        </ForgotRow>
      )}

      <ToggleRow>
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => switchMode('signin')}>
              Sign in
            </button>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <button type="button" onClick={() => switchMode('signup')}>
              Create one
            </button>
          </>
        )}
      </ToggleRow>
    </div>
  );
};

const CloseGlyph: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeGlyph: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffGlyph: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
    />
  </svg>
);
