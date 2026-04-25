import React from 'react';
import { AlertDialog } from './AlertDialog';
import { Button } from './Button';

export default {
  title: 'UI/AlertDialog',
  component: AlertDialog,
};

export const BackGuard = {
  render: () => (
    <AlertDialog
      open
      onClose={() => {}}
      title="Leave your gift picks?"
      description="You haven't saved any of these picks yet. They'll be lost when you leave."
      primaryAction={{ label: 'Discard & go back', onClick: () => {} }}
      secondaryAction={{ label: 'Stay here', onClick: () => {} }}
    />
  ),
};

export const RemovePerson = {
  render: () => (
    <AlertDialog
      open
      onClose={() => {}}
      title="Remove Mom and all her picks?"
      description="This deletes her saved gifts, purchase history, and quiz answers. Can't be undone."
      primaryAction={{ label: 'Remove', onClick: () => {} }}
      secondaryAction={{ label: 'Cancel', onClick: () => {} }}
    />
  ),
};

export const RateLimit = {
  render: () => (
    <AlertDialog
      open
      onClose={() => {}}
      title="Too many quizzes today"
      description="You've hit your daily quiz limit. Try again tomorrow."
      primaryAction={{ label: 'Got it', onClick: () => {} }}
    />
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <div style={{ padding: 32 }}>
        <Button label="Open dialog" onClick={() => setOpen(true)} />
        <AlertDialog
          open={open}
          onClose={() => setOpen(false)}
          title="Are you sure?"
          description="This is a destructive action."
          primaryAction={{ label: 'Yes', onClick: () => setOpen(false) }}
          secondaryAction={{ label: 'No', onClick: () => setOpen(false) }}
        />
      </div>
    );
  },
};
