import React from 'react';
import { SavePromptSheet, SavePromptStep } from './SavePromptSheet';
import { Button } from '../../ui/Button';

export default {
  title: 'Landing/Results/SavePromptSheet',
  component: SavePromptSheet,
};

export const StepPrompt = {
  render: () => (
    <SavePromptSheet open onClose={() => {}} step="prompt" />
  ),
};

export const StepNameBirthday = {
  render: () => (
    <SavePromptSheet
      open
      onClose={() => {}}
      step="name-birthday"
      name="Mom"
      birthMonth={6}
      birthDay={14}
    />
  ),
};

export const StepAuth = {
  render: () => (
    <SavePromptSheet
      open
      onClose={() => {}}
      step="auth"
      email="user@example.com"
    />
  ),
};

export const StepConfirm = {
  render: () => <SavePromptSheet open onClose={() => {}} step="confirm" />,
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [step, setStep] = React.useState<SavePromptStep>('prompt');
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    return (
      <div style={{ padding: 32 }}>
        <Button
          label="Open save prompt"
          onClick={() => {
            setStep('prompt');
            setOpen(true);
          }}
        />
        <SavePromptSheet
          open={open}
          onClose={() => setOpen(false)}
          step={step}
          name={name}
          onNameChange={setName}
          email={email}
          onEmailChange={setEmail}
          onContinue={() => setStep('name-birthday')}
          onSkip={() => setOpen(false)}
          onSubmitNameBirthday={() => setStep('auth')}
          onSubmitAuth={() => setStep('confirm')}
        />
      </div>
    );
  },
};
