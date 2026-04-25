import React from 'react';
import styled from 'styled-components';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { MONTHS, daysInMonth } from './constants';

export type SavePromptStep = 'prompt' | 'name-birthday' | 'auth' | 'confirm';

export interface SavePromptSheetProps {
  open: boolean;
  onClose: () => void;
  step: SavePromptStep;
  /** Header copy varies per trigger context. */
  title?: string;
  subtitle?: string;
  /** Step-1 actions: primary continues to name-birthday; secondary skips. */
  onContinue?: () => void;
  onSkip?: () => void;
  /** Step-2 form. */
  name?: string;
  onNameChange?: (value: string) => void;
  birthMonth?: number;
  onBirthMonthChange?: (value: number | undefined) => void;
  birthDay?: number;
  onBirthDayChange?: (value: number | undefined) => void;
  onSubmitNameBirthday?: () => void;
  /** Step-3 auth. */
  email?: string;
  onEmailChange?: (value: string) => void;
  onSubmitAuth?: () => void;
  /** Step-4 confirm. */
  onClose4?: () => void;
}

const Body = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 24px 32px;
  gap: 16px;
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.25;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 15px;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--foreground));
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const ConfirmIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  background: ${({ theme }) => theme.color.cream};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  margin-top: 8px;
`;

const CheckGlyph: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: '#B56B58' }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const SavePromptSheet: React.FC<SavePromptSheetProps> = ({
  open,
  onClose,
  step,
  title,
  subtitle,
  onContinue,
  onSkip,
  name = '',
  onNameChange,
  birthMonth,
  onBirthMonthChange,
  birthDay,
  onBirthDayChange,
  onSubmitNameBirthday,
  email = '',
  onEmailChange,
  onSubmitAuth,
}) => {
  const maxDay = daysInMonth(birthMonth ?? 0);

  return (
    <Drawer open={open} onClose={onClose} side="bottom" ariaLabel="Save your picks" maxHeight="85vh">
      <Body>
        {step === 'prompt' && (
          <>
            <Title>{title ?? 'Save these picks before you go?'}</Title>
            <Subtitle>
              {subtitle ?? "We'll keep this person and their gift list so you can pick up later."}
            </Subtitle>
            <Actions>
              <Button label="Save my picks" onClick={onContinue} size="md" />
              <Button label="Not now" variant="ghost" size="md" onClick={onSkip} />
            </Actions>
          </>
        )}
        {step === 'name-birthday' && (
          <>
            <Title>Who are these for?</Title>
            <Subtitle>A name and birthday are all we need.</Subtitle>
            <Field>
              <FieldLabel htmlFor="save-name">Name</FieldLabel>
              <Input
                id="save-name"
                value={name}
                onChange={(e) => onNameChange?.(e.target.value)}
                placeholder="Mom"
                fullWidth
              />
            </Field>
            <Field>
              <FieldLabel>Birthday (optional)</FieldLabel>
              <TwoCol>
                <Select
                  value={birthMonth ? String(birthMonth) : ''}
                  onChange={(e) => onBirthMonthChange?.(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Month"
                  options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                />
                <Select
                  value={birthDay ? String(birthDay) : ''}
                  onChange={(e) => onBirthDayChange?.(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Day"
                  disabled={!birthMonth}
                  options={Array.from({ length: maxDay }, (_, i) => ({
                    value: String(i + 1),
                    label: String(i + 1),
                  }))}
                />
              </TwoCol>
            </Field>
            <Actions>
              <Button
                label="Continue"
                onClick={onSubmitNameBirthday}
                disabled={!name.trim()}
                size="md"
              />
            </Actions>
          </>
        )}
        {step === 'auth' && (
          <>
            <Title>One last thing — your email.</Title>
            <Subtitle>
              We'll send you a magic link so you can come back to this list anytime.
            </Subtitle>
            <Field>
              <FieldLabel htmlFor="save-email">Email</FieldLabel>
              <Input
                id="save-email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange?.(e.target.value)}
                placeholder="you@example.com"
                fullWidth
              />
            </Field>
            <Actions>
              <Button
                label="Send link"
                onClick={onSubmitAuth}
                disabled={!email.trim()}
                size="md"
              />
            </Actions>
          </>
        )}
        {step === 'confirm' && (
          <>
            <ConfirmIcon>
              <CheckGlyph />
            </ConfirmIcon>
            <Title style={{ textAlign: 'center' }}>You're all set.</Title>
            <Subtitle style={{ textAlign: 'center' }}>
              Check your inbox for a link to come back to your picks anytime.
            </Subtitle>
            <Actions>
              <Button label="Keep browsing" onClick={onClose} size="md" />
            </Actions>
          </>
        )}
      </Body>
    </Drawer>
  );
};
