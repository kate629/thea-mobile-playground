import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export default {
  title: 'UI/Modal',
  component: Modal,
};

export const OpenWithText = {
  render: () => (
    <Modal open onClose={() => {}} ariaLabel="Demo modal">
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Hello, modal</h2>
        <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))' }}>
          A bare backdrop + centered surface. Wrap your own content inside.
        </p>
      </div>
    </Modal>
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <div style={{ padding: 32 }}>
        <Button label="Open modal" onClick={() => setOpen(true)} />
        <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Demo modal">
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>It works</h2>
            <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))' }}>
              Backdrop click and Escape both close.
            </p>
            <Button label="Close" variant="ghost" onClick={() => setOpen(false)} />
          </div>
        </Modal>
      </div>
    );
  },
};
